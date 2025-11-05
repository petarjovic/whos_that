import { db, s3, S3_BUCKET_NAME, USE_CLOUDFRONT } from "../config/connections.ts";
import type { Express, Request, Response } from "express";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import * as schema from "../db/schema.ts";
import * as authSchema from "../db/auth-schema.ts";
import { eq, and, not, count, desc, sql } from "drizzle-orm";
import type {
    CardDataIdType,
    CardDataUrlType,
    CreateGameRequest,
    CreateGameResponse,
    PresetInfo,
} from "../config/types.ts";
import { nanoid } from "nanoid";
import { getSignedUrl as getSignedS3Url } from "@aws-sdk/s3-request-presigner";
import { getSignedUrl as getSignedCFUrl } from "@aws-sdk/cloudfront-signer";
import env from "../config/zod/zodEnvSchema.ts";
import { createGameRequestSchema } from "../config/zod/zodSchema.ts";
import z from "zod";
import { auth } from "../config/auth.ts";
import { fromNodeHeaders } from "better-auth/node";
import {
    constructS3ImageKey,
    cardDataIdToUrl,
    constructImageUrl,
    switchPrivacySettings,
    deleteImagesFromBucketAndCF,
    getGameWithItems,
} from "./apiHelpers.ts";
import { checkGameExists, validateGameId } from "../middleware/validatorMw.ts";

export function setupApiRoutes(app: Express) {
    app.post("/api/createNewGame", async (req: Request, res: Response) => {
        const validRequest = createGameRequestSchema.safeParse(req.body);

        if (validRequest.success) {
            const gameId = nanoid();
            const body: CreateGameRequest = validRequest.data;
            const response: CreateGameResponse = { gameId: gameId, gameItems: {} };

            try {
                const S3PresignedUrlPromises = body.namesAndFileTypes.map(
                    async ({ type, name }) => {
                        const itemId = nanoid();
                        const command = new PutObjectCommand({
                            Bucket: S3_BUCKET_NAME,
                            Key: constructS3ImageKey(body.privacy === "public", gameId, itemId),
                            ContentType: type,
                        });

                        const signedUrl = await getSignedS3Url(s3, command, { expiresIn: 120 });
                        return { name, itemId, signedUrl };
                    }
                );

                const S3PresignedUrls = await Promise.all(S3PresignedUrlPromises);

                for (const { name, itemId, signedUrl } of S3PresignedUrls) {
                    response.gameItems[name] = { signedUrl, itemId };
                }
            } catch (error) {
                console.error(
                    "Error generating presigned s3 upload urls during game creation:\n",
                    error
                );
                return res.status(500).json({
                    message:
                        "Internal Server Error while creating new game, please try again later.",
                });
            }

            try {
                const session = await auth.api.getSession({
                    headers: fromNodeHeaders(req.headers),
                });

                if (!session) return res.status(401).json({ message: "Unauthorized." });

                await db.batch([
                    db.insert(schema.games).values({
                        id: gameId,
                        title: body.title,
                        description: "",
                        isPublic: body.privacy === "public",
                        userId: session.user.id,
                    }),

                    db.insert(schema.gameItems).values(
                        Object.entries(response.gameItems).map(([name, { itemId }], i) => ({
                            id: itemId,
                            gameId: gameId,
                            name: name,
                            orderIndex: i,
                        }))
                    ),
                ]);

                return res.status(200).json(response);
            } catch (error) {
                console.error("Error while creating new game:\n", error);
                return res.status(500).json({
                    message:
                        "Internal Server Error while creating new game, please try again later.",
                });
            }
        } else {
            console.error("Error creating new game:\n" + z.prettifyError(validRequest.error));
            return res.status(422).json({
                message: "Invalid create game request.",
            });
        }
    });

    app.get("/api/getAllPremadeGames", async (req, res) => {
        try {
            const session = await auth.api.getSession({
                headers: fromNodeHeaders(req.headers),
            });

            const premadeGamesInfo = await db
                .select({
                    id: schema.games.id,
                    title: schema.games.title,
                    author: authSchema.user.displayUsername,
                    coverImageId: schema.gameItems.id,
                    numLikes: count(schema.gameLikes.id),
                    userHasLiked: session
                        ? sql<boolean>`BOOL_OR(${schema.gameLikes.userId} = ${session.user.id})`
                        : sql<boolean>`FALSE`,
                })
                .from(schema.games)
                .leftJoin(authSchema.user, eq(authSchema.user.id, schema.games.userId))
                .leftJoin(
                    schema.gameItems,
                    and(
                        eq(schema.gameItems.gameId, schema.games.id),
                        eq(schema.gameItems.orderIndex, 0)
                    )
                )
                .leftJoin(schema.gameLikes, eq(schema.gameLikes.gameId, schema.games.id))
                .where(eq(schema.games.isPublic, true))
                .groupBy(schema.games.id, authSchema.user.displayUsername, schema.gameItems.id)
                .orderBy(desc(count(schema.gameLikes.id)));

            const premadeGamesInfoUrl: PresetInfo = premadeGamesInfo
                .filter(({ coverImageId }) => coverImageId !== null)
                .map(({ id, title, author, numLikes, coverImageId, userHasLiked }) => {
                    return {
                        id,
                        title,
                        author,
                        isPublic: true,
                        numLikes,
                        userHasLiked,
                        imageUrl: constructImageUrl(true, id, coverImageId ?? ""),
                    };
                });

            return res.status(200).send(premadeGamesInfoUrl);
        } catch (error) {
            console.error("Error while attempting to retrieve public games:\n", error);
            return res
                .status(500)
                .json({ message: "Internal Server Error. Failed to fetch public games." });
        }
    });

    app.get("/api/getMyGames", async (req, res) => {
        try {
            const session = await auth.api.getSession({
                headers: fromNodeHeaders(req.headers),
            });

            if (!session) return res.status(401).json({ message: "Unauthorized." });

            const gameInfoList = await db
                .select({
                    id: schema.games.id,
                    title: schema.games.title,
                    isPublic: schema.games.isPublic,
                    coverImageId: schema.gameItems.id,
                    numLikes: count(schema.gameLikes.id),
                })
                .from(schema.games)
                .leftJoin(
                    schema.gameItems,
                    and(
                        eq(schema.gameItems.gameId, schema.games.id),
                        eq(schema.gameItems.orderIndex, 0)
                    )
                )
                .leftJoin(schema.gameLikes, eq(schema.gameLikes.gameId, schema.games.id))
                .where(eq(schema.games.userId, session.user.id))
                .groupBy(schema.games.id, schema.gameItems.id);

            const getMyGamesRes: PresetInfo = gameInfoList
                .filter(({ coverImageId }) => coverImageId !== null)
                .map(({ id, title, isPublic, numLikes, coverImageId }) => {
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    const imageUrl = constructImageUrl(isPublic, id, coverImageId!);
                    const signedUrlParams = {
                        url: imageUrl,
                        dateLessThan: new Date(Date.now() + 1000 * 60 * 60 * 24),
                        privateKey: env.AWS_CF_PRIV_KEY,
                        keyPairId: env.AWS_CF_KEY_PAIR_ID,
                    };
                    return {
                        id,
                        title,
                        author: session.user.id,
                        isPublic,
                        numLikes,
                        userHasLiked: null,
                        imageUrl:
                            isPublic || !USE_CLOUDFRONT
                                ? imageUrl
                                : getSignedCFUrl(signedUrlParams),
                    };
                });

            return res.status(200).send(getMyGamesRes);
        } catch (error) {
            console.error("Error while attempting to get user's games: \n", error);
            return res
                .status(500)
                .json({ message: "Internal Server Error. Failed to fetch user's games." });
        }
    });

    app.get("/api/gameData/:gameId", validateGameId, checkGameExists, async (req, res) => {
        const gameId = req.params.gameId;

        try {
            const gameTitleAndPrivacy = await db
                .select({ title: schema.games.title, isPublic: schema.games.isPublic })
                .from(schema.games)
                .where(eq(schema.games.id, gameId)); //REDO THIS LATER

            const [{ isPublic, title }] = gameTitleAndPrivacy;

            const cardDataIdList: CardDataIdType[] = await db
                .select({
                    gameItemId: schema.gameItems.id,
                    name: schema.gameItems.name,
                    orderIndex: schema.gameItems.orderIndex,
                })
                .from(schema.gameItems)
                .where(eq(schema.gameItems.gameId, gameId));

            if (isPublic || !USE_CLOUDFRONT) {
                const cardDataUrlList = cardDataIdToUrl(cardDataIdList, isPublic, gameId);
                return res.status(200).send({ title: title, cardData: cardDataUrlList });
            } else {
                const cardDataPresignedUrlList: CardDataUrlType[] = cardDataIdList.map(
                    (cardData) => {
                        const signedUrlParams = {
                            url: constructImageUrl(false, gameId, cardData.gameItemId),
                            dateLessThan: new Date(Date.now() + 1000 * 60 * 60 * 24),
                            privateKey: env.AWS_CF_PRIV_KEY,
                            keyPairId: env.AWS_CF_KEY_PAIR_ID,
                        };
                        return {
                            name: cardData.name,
                            imageUrl: getSignedCFUrl(signedUrlParams),
                            orderIndex: cardData.orderIndex,
                        };
                    }
                );
                return res.status(200).send({ title: title, cardData: cardDataPresignedUrlList });
            }
        } catch (error) {
            console.error("Error while attempting to retrieve game data:\n", error);
            return res.status(500).json({ message: "Internal Server Error. Failed to get game." });
        }
    });

    app.put("/api/likeGame/:gameId", validateGameId, checkGameExists, async (req, res) => {
        const {
            params: { gameId },
            headers,
        } = req;
        try {
            const session = await auth.api.getSession({
                headers: fromNodeHeaders(headers),
            });
            if (!session) return res.status(401).json({ message: "Unauthorized." });

            const [gameAuthorandLikeStatus] = await db
                .select({
                    authorId: schema.games.userId,
                    likeId: schema.gameLikes.id,
                })
                .from(schema.games)
                .leftJoin(
                    schema.gameLikes,
                    and(
                        eq(schema.gameLikes.gameId, gameId),
                        eq(schema.gameLikes.userId, session.user.id)
                    )
                )
                .where(eq(schema.games.id, gameId));

            if (gameAuthorandLikeStatus.authorId === session.user.id) {
                return res.status(400).json({ message: "Cannot like your own game." });
            }

            if (gameAuthorandLikeStatus.likeId === null) {
                await db.insert(schema.gameLikes).values({
                    gameId: req.params.gameId,
                    userId: session.user.id,
                });
                return res.status(200).json({ message: "Liked game." });
            } else {
                await db
                    .delete(schema.gameLikes)
                    .where(
                        and(
                            eq(schema.gameLikes.gameId, gameId),
                            eq(schema.gameLikes.userId, session.user.id)
                        )
                    );

                return res.status(200).json({ message: "Unliked game." });
            }
        } catch (error) {
            console.error("Error while attempting to like game: \n", error);
            return res
                .status(500)
                .json({ message: "Internal Server Error. Failed to like or unlike game." });
        }
    });

    app.put("/api/switchPrivacy/:gameId", validateGameId, checkGameExists, async (req, res) => {
        const {
            params: { gameId },
            headers,
        } = req;

        try {
            const session = await auth.api.getSession({
                headers: fromNodeHeaders(headers),
            });
            if (!session) return res.status(401).json({ message: "Unauthorized." });

            const gameWithItems = await getGameWithItems(gameId);

            const dbUpdate = await db
                .update(schema.games)
                .set({
                    isPublic: not(schema.games.isPublic),
                })
                .where(and(eq(schema.games.id, gameId), eq(schema.games.userId, session.user.id)));

            if (dbUpdate.rowCount !== null && dbUpdate.rowCount >= 1) {
                const [{ isPublic, imageIds }] = gameWithItems;
                const newIsPublic = !isPublic;

                if (imageIds.length > 0 && imageIds[0]) {
                    void switchPrivacySettings(gameId, isPublic, newIsPublic, imageIds);
                }

                console.log("Switched privacy setting of game:", gameId);
                return res.status(200).send();
            } else {
                return res.status(403).json({ message: "Fordbideen" });
            }
        } catch (error) {
            console.error(
                `Error while attempting to switch privacy setting of game: ${gameId}:\n`,
                error
            );
            return res.status(500).json({ message: "Interal Server Error." });
        }
    });

    app.delete("/api/deleteGame/:gameId", validateGameId, checkGameExists, async (req, res) => {
        const {
            params: { gameId },
            headers,
        } = req;

        try {
            const session = await auth.api.getSession({
                headers: fromNodeHeaders(headers),
            });
            if (!session) return res.status(401).json({ message: "Unauthorized." });

            const gameWithItems = await getGameWithItems(gameId);

            const dbDelRes = await db
                .delete(schema.games)
                .where(and(eq(schema.games.id, gameId), eq(schema.games.userId, session.user.id)));

            if (dbDelRes.rowCount !== null && dbDelRes.rowCount >= 1) {
                console.log(`User: ${session.user.id} deleted game:`, gameId);
                const [{ isPublic, imageIds }] = gameWithItems;

                void deleteImagesFromBucketAndCF(gameId, isPublic, imageIds);

                return res.status(200).json({
                    message: `User: ${session.user.id} deleted game: ${gameId}`,
                });
            } else {
                console.warn(
                    `User: ${session.user.id} requested to delete game: ${gameId} but is not the owner of that game.`
                );
                return res.status(403).json({
                    message: "Forbidden.",
                });
            }
        } catch (error) {
            console.error(`Error while attempting to delete game: ${gameId}:\n`, error);
            return res.status(500).json({ message: "Internal Server Error" });
        }
    });
}
