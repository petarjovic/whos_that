import type { Express } from "express";
import { eq } from "drizzle-orm";
// import { requireAdmin } from "../middleware/authMw.ts";
import { logger } from "../config/logger.ts";
import { db } from "../config/connections.ts";
import * as schema from "../db/schema.ts";
import env from "../config/zod/zodEnvSchema.ts";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { dailyQuestionSchema } from "../config/zod/zodSchema.ts";
import {
    getCachedDailyCharacterContext,
    getCachedDailyGame,
    setDailyCharacterContextCache,
    setDailyGameCache,
} from "./cache.ts";
import fs from "fs";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

async function getDailyCharacterContext() {
    //FOR TEST
    const data = fs.readFileSync("./src/api/Abe.txt", "utf8");
    setDailyCharacterContextCache(data);

    const today = new Date().toISOString().slice(0, 10);
    let characterContext = getCachedDailyCharacterContext();
    if (characterContext) {
        return characterContext;
    }
    try {
        [{ characterContext }] = await db
            .select({ characterContext: schema.dailies.characterContext })
            .from(schema.dailies)
            .where(eq(schema.dailies.scheduledDate, today));

        if (!characterContext) {
            //This should be unreachable since characterContext has NotNull
            throw new Error("Somehow got null from a notnull db column wtf");
        }

        setDailyCharacterContextCache(characterContext);
        return characterContext;
    } catch (error) {
        if (error instanceof Error) throw error;
        else throw new Error("Error while attempting to retrieve character context from database");
    }
}
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

    /**
     * Returns today's scheduled daily character info.
     */
    app.get("/api/daily", async (_req, res) => {
        //FOR TEST
        setDailyGameCache({ gameId: "zN7Pa8g9TbVl0LaQtldcF", orderIndex: 0 });

        const today = new Date().toISOString().slice(0, 10);
        logger.debug(`api/daily: Attempting to serve daily for ${today}.`);

        let daily = getCachedDailyGame();
        if (daily) {
            return res.status(200).send(daily);
        }

        try {
            const dailyDb = await db
                .select()
                .from(schema.dailies)
                .where(eq(schema.dailies.scheduledDate, today));

            if (dailyDb.length === 0) {
                logger.error(`api/daily: No daily returned for ${today}.`);
                return res.status(503).json({ message: "No daily game scheduled for today!" });
            }

            const [{ orderIndex }] = await db
                .select({ orderIndex: schema.gameItems.orderIndex })
                .from(schema.gameItems)
                .where(eq(schema.gameItems.id, dailyDb[0].gameItemId));

            daily = {
                gameId: dailyDb[0].gameId,
                orderIndex: orderIndex,
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
                `api/ai-mode/ask: Q: "${validRequest.data.question}" A: "${answer ?? "Undefined"}"`
            );
            return res.status(200).json({ answer });
        } catch (error) {
            logger.error({ error }, "api/ai-mode/ask: Error calling OpenRouter.");
            return res.status(500).json({ message: "Internal Server Error." });
        }
    });

    /**
     * Admin-only: schedules a daily character for a specific date.
     */
    // app.post("/api/ai-mode/schedule-daily", requireAdmin, async (req, res) => {
    //     const validRequest = aiScheduleDailyRequestSchema.safeParse(req.body);
    //     if (!validRequest.success) {
    //         logger.error(
    //             { error: validRequest.error },
    //             "api/ai-mode/schedule-daily: Invalid request."
    //         );
    //         return res.status(422).json({ message: "Invalid request." });
    //     }

    //     const { name, wikiText, gameId, scheduledDate } = validRequest.data;
    //     try {
    //         await db
    //             .insert(schema.dailies)
    //             .values({ name, wikiText, gameId, scheduledDate })
    //             .onConflictDoUpdate({
    //                 target: schema.dailies.scheduledDate,
    //                 set: { name, wikiText, gameId },
    //             });

    //         logger.info(`api/ai-mode/schedule-daily: "${name}" scheduled for ${scheduledDate}.`);
    //         return res.status(200).json({ message: `"${name}" scheduled for ${scheduledDate}.` });
    //     } catch (error) {
    //         logger.error({ error }, "api/ai-mode/schedule-daily: DB error.");
    //         return res.status(500).json({ message: "Internal Server Error." });
    //     }
    // });
}
