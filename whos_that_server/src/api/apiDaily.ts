import type { Express } from "express";
import { eq, and } from "drizzle-orm";
// import { requireAdmin } from "../middleware/authMw.ts";
import { logger } from "../config/logger.ts";
import { db, s3, S3_BUCKET_NAME, USE_CLOUDFRONT } from "../config/connections.ts";
import * as schema from "../db/schema.ts";
import * as authSchema from "../db/auth-schema.ts";
import env from "../config/zod/zodEnvSchema.ts";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { dailyQuestionSchema, scheduleDailySchema } from "../config/zod/zodSchema.ts";
import { getCachedDailyGame, setDailyGameCache } from "./cache.ts";
import { requireAdmin } from "../middleware/authMw.ts";
import { CopyObjectCommand } from "@aws-sdk/client-s3";
import { nanoid } from "nanoid";
import { constructS3ImageKey } from "./apiHelpers.ts";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

/**
 * Sets up AI mode API routes for the Express application
 * @param app - Express application instance
 */
export function setupAiRoutes(app: Express) {
    const askLimiter = rateLimit({
        windowMs: 60 * 1000,
        max: 20,
        keyGenerator: (req) => ipKeyGenerator(req.ip ?? "unknown"),
        message: { message: "Too many requests. Please slow down." },
        standardHeaders: true,
        legacyHeaders: false,
    });

    async function getDailyCharacterContext() {
        //Normally this function should always be using the cached data since it is only called after the cache is set
        const dailyInfo = getCachedDailyGame();
        if (dailyInfo) {
            return dailyInfo.characterContext;
        }

        const today = new Date().toISOString().slice(0, 10);
        try {
            const [{ characterContext }] = await db
                .select({ characterContext: schema.dailies.characterContext })
                .from(schema.dailies)
                .where(eq(schema.dailies.scheduledDate, today));

            if (!characterContext) {
                //This should be unreachable since characterContext has NotNull
                throw new Error("Somehow got null from a notnull db column wtf.");
            }

            return characterContext;
        } catch (error) {
            if (error instanceof Error) throw error;
            else
                throw new Error(
                    "Error while attempting to retrieve character context from database"
                );
        }
    }

    /**
     * Returns today's scheduled daily character info.
     */
    app.get("/api/daily", async (_req, res) => {
        const today = new Date().toISOString().slice(0, 10);
        logger.debug(`api/daily: Attempting to serve daily for ${today}.`);

        let daily = getCachedDailyGame();
        if (daily) {
            return res.status(200).send(daily);
        }

        try {
            const [dailyDb] = await db
                .select({
                    dailyId: schema.dailies.id,
                    ogGameId: schema.dailies.ogGameId,
                    title: schema.dailies.title,
                    characterContext: schema.dailies.characterContext,
                    displayUsername: authSchema.user.displayUsername,
                    winningIndex: schema.dailyGameItems.orderIndex,
                })
                .from(schema.dailies)
                .leftJoin(schema.games, eq(schema.dailies.ogGameId, schema.games.id))
                .leftJoin(authSchema.user, eq(schema.games.userId, authSchema.user.id))
                .leftJoin(
                    schema.dailyGameItems,
                    and(
                        eq(schema.dailies.id, schema.dailyGameItems.dailyId),
                        eq(schema.dailyGameItems.isWinner, true)
                    )
                )
                .where(eq(schema.dailies.scheduledDate, today));

            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            if (!dailyDb) {
                logger.error(`api/daily: No daily returned for ${today}.`);
                return res.status(503).json({ message: "No daily game scheduled for today!" });
            }
            if (dailyDb.winningIndex === null) {
                logger.error(
                    `api/daily: Daily game for ${Date.now().toLocaleString()} data is corrupted, it has no winning item!`
                );
                return res.status(503).json({ message: "No daily game scheduled for today!" });
            }

            // Fetch all card data
            const cardDataDb = await db
                .select({
                    id: schema.dailyGameItems.id,
                    name: schema.dailyGameItems.name,
                    orderIndex: schema.dailyGameItems.orderIndex,
                })
                .from(schema.dailyGameItems)
                .where(eq(schema.dailyGameItems.dailyId, dailyDb.dailyId))
                .orderBy(schema.dailyGameItems.orderIndex);

            // Construct image URLs
            const cardData = cardDataDb.map(({ id, name, orderIndex }) => ({
                name,
                orderIndex,
                imageUrl: USE_CLOUDFRONT
                    ? `https://${env.AWS_CF_DOMAIN}/daily/${dailyDb.dailyId}/${id}`
                    : `https://${S3_BUCKET_NAME}.s3.${env.AWS_BUCKET_REGION}.amazonaws.com/daily/${dailyDb.dailyId}/${id}`,
            }));

            daily = {
                ogGameId: dailyDb.ogGameId ?? "",
                authorUsername: dailyDb.displayUsername ?? "",
                title: dailyDb.title,
                winningIndex: dailyDb.winningIndex,
                characterContext: dailyDb.characterContext,
                cardData,
            };

            setDailyGameCache(daily);
            return res.status(200).json(daily);
        } catch (error) {
            logger.error({ error }, "api/ai-mode/daily: Error fetching daily character.");
            return res.status(500).json({ message: "Internal Server Error." });
        }
    });

    /**
     * Submits a yes/no question to the AI about today's character.
     * Fetches today's wiki text from DB on each request — negligible cost given prompt caching.
     * @returns { answer: "Yes" | "No" | "I don't know" }
     */
    app.post("/api/daily/ask", askLimiter, async (req, res) => {
        const validRequest = dailyQuestionSchema.safeParse(req.body);
        if (!validRequest.success) {
            logger.error({ error: validRequest.error }, "api/ai/ask: Invalid request.");
            return res.status(422).json({ message: "Invalid request." });
        }

        const question = validRequest.data.question;

        try {
            //Get answer from OPENROUTER API
            const characterContext = await getDailyCharacterContext();
            const response = await fetch(OPENROUTER_API_URL, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    model: "google/gemini-2.5-flash-lite",
                    max_tokens: 10,
                    messages: [
                        {
                            role: "system",
                            content: [
                                {
                                    type: "text",
                                    text: `You are the host of a Guess Who game. Answer the player's yes/no questions about the character described below. Reply with ONLY "Yes", "No", or "I don't know". Never reveal the character's name directly.\n\n${characterContext}`,
                                    cache_control: { type: "ephemeral", ttl: "1h" },
                                },
                            ],
                        },
                        {
                            role: "user",
                            content: [{ type: "text", text: question }],
                        },
                    ],
                }),
            });

            if (!response.ok) {
                const body = await response.text();
                throw new Error(`OpenRouter error ${response.status.toString()}: ${body}`);
            }

            const data = (await response.json()) as {
                choices?: { message?: { content?: string } }[];
            };
            logger.debug(data);
            const answer = data.choices?.[0]?.message?.content?.trim();

            // if (answer === "Yes" || answer === "No" || answer === "I don't know") return answer;
            // const lower = answer?.toLowerCase() ?? "";
            // if (lower.startsWith("yes")) return "Yes";
            // if (lower.startsWith("no")) return "No";
            // return "I don't know";
            logger.debug(
                `api/daily/ask: Q: "${validRequest.data.question}" A: "${answer ?? "Undefined"}"`
            );
            return res.status(200).json({ answer });
        } catch (error) {
            logger.error({ error }, "api/daily/ask: Error calling OpenRouter.");
            return res.status(500).json({ message: "Internal Server Error." });
        }
    });

    /**
     * Admin-only: schedules a daily character for a specific date.
     */
    app.post("/api/daily/schedule", requireAdmin, async (req, res) => {
        const validRequest = scheduleDailySchema.safeParse(req.body);
        if (!validRequest.success) {
            logger.error({ error: validRequest.error }, "api/daily/schedule: Invalid request.");
            return res.status(422).json({ message: "Invalid request." });
        }

        const { gameId, scheduledDate, winningIndex, characterContext } = validRequest.data;

        try {
            // Fetch original game data
            const [game] = await db
                .select({
                    title: schema.games.title,
                    description: schema.games.description,
                    userId: schema.games.userId,
                })
                .from(schema.games)
                .where(eq(schema.games.id, gameId));

            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            if (!game) {
                return res.status(404).json({ message: "Game not found." });
            }

            // Fetch game items
            const gameItemsDb = await db
                .select({
                    id: schema.gameItems.id,
                    name: schema.gameItems.name,
                    orderIndex: schema.gameItems.orderIndex,
                })
                .from(schema.gameItems)
                .where(eq(schema.gameItems.gameId, gameId))
                .orderBy(schema.gameItems.orderIndex);

            if (gameItemsDb.length === 0) {
                return res.status(400).json({ message: "Game has no items." });
            }

            if (winningIndex >= gameItemsDb.length) {
                return res.status(400).json({ message: "Invalid winning index." });
            }

            // Create daily entry
            const dailyId = nanoid();
            await db.insert(schema.dailies).values({
                id: dailyId,
                ogGameId: gameId,
                title: game.title,
                description: game.description,
                characterContext,
                scheduledDate,
            });

            // Copy game items to daily game items
            const dailyGameItemsData = gameItemsDb.map((item, idx) => ({
                id: nanoid(),
                dailyId,
                name: item.name,
                orderIndex: item.orderIndex,
                isWinner: idx === winningIndex,
            }));

            await db.insert(schema.dailyGameItems).values(dailyGameItemsData);

            // Copy images in S3
            const copyPromises = gameItemsDb.map((item, idx) => {
                const sourceKey = constructS3ImageKey(true, gameId, item.id);
                const destKey = `daily/${dailyId}/${dailyGameItemsData[idx].id}`;
                return s3.send(
                    new CopyObjectCommand({
                        Bucket: S3_BUCKET_NAME,
                        CopySource: `${S3_BUCKET_NAME}/${sourceKey}`,
                        Key: destKey,
                    })
                );
            });

            await Promise.all(copyPromises);

            logger.info(`api/daily/schedule: Scheduled daily ${dailyId} for ${scheduledDate}.`);
            return res.status(201).json({ message: "Daily scheduled successfully.", dailyId });
        } catch (error) {
            logger.error({ error }, "api/daily/schedule: Error scheduling daily.");
            return res.status(500).json({ message: "Internal Server Error." });
        }
    });
}
