import { db, s3, S3_BUCKET_NAME, USE_CLOUDFRONT } from "../config/connections.ts";
import type { Express, Request, Response } from "express";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import * as schema from "../db/schema.ts";
import * as authSchema from "../db/auth-schema.ts";
import { eq, and, not, count, desc, ilike, sql } from "drizzle-orm";
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
import { createGameRequestSchema, searchQuerySchema } from "../config/zod/zodSchema.ts";
import z from "zod";
import { auth } from "../config/auth.ts";
import { fromNodeHeaders } from "better-auth/node";
import {
    constructS3ImageKey,
    cardDataIdToUrl,
    constructImageUrl,
    switchPrivacySettings,
    deleteImagesFromBucketAndCF,
    getPrivacySettingAndImageIds,
} from "./apiHelpers.ts";
import { checkGameExists, validateGameId } from "../middleware/validatorMw.ts";

/**
 * Sets up all API routes for the Express application
 * @param app - Express application instance
 */
export function setupApiRoutes(app: Express) {
    /**
     * Generates game in database and sends clients presigned URLS for uploading images
     * @route POST /api/createNewGame
     * @returns Game ID and presigned URLs for each image upload
     */
    app.post("/api/createNewGame", async (req: Request, res: Response) => {
        const validRequest = createGameRequestSchema.safeParse(req.body);

        if (validRequest.success) {
            const gameId = nanoid();
            const body: CreateGameRequest = validRequest.data;
            const response: CreateGameResponse = { gameId: gameId, gameItems: {} };

            try {
                // Generate short-lived presigned upload URLS
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

                // Populate response object with URLs
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
                // Verify user is authenticated
                const session = await auth.api.getSession({
                    headers: fromNodeHeaders(req.headers),
                });

                if (!session) return res.status(401).json({ message: "Unauthorized." });

                // Insert game data in database then send response
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

                //Error handling ↓
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

    app.get("/api/featuredGames", async (req, res) => {
        try {
            const session = await auth.api.getSession({
                headers: fromNodeHeaders(req.headers),
            });

            const top3MostLikedGames = await db
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
                .orderBy(desc(count(schema.gameLikes.id)), desc(schema.games.createdAt))
                .limit(3);

            const top3MostRecentGames = await db
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
                .orderBy(desc(schema.games.createdAt))
                .limit(3);

            //Merge lists and convert db information to image URLs
            const featuredGamesInfoUrl: PresetInfo = [...top3MostLikedGames, ...top3MostRecentGames]
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

            res.status(200).send(featuredGamesInfoUrl);
        } catch (error) {
            console.error("Error while attempting to retrieve featured games:\n", error);
            return res
                .status(500)
                .json({ message: "Internal Server Error. Failed to fetch featured games." });
        }
    });

    /**
     * Retrieves public games according to query and with metadata
     * @route GET /api/getAllPremadeGames
     * @returns List of public games with cover images and like counts
     */
    app.get("/api/search", async (req, res) => {
        try {
            //Validate query params
            console.log(req.query);
            const validQuery = searchQuerySchema.safeParse(req.query);
            if (!validQuery.success) {
                console.log(z.prettifyError(validQuery.error));
                return res.status(400).json({ message: "Invalid query parameters." });
            }
            const { page, limit, q, sort } = validQuery.data;

            // Check if user is logged in to determine "liked" statuses
            const session = await auth.api.getSession({
                headers: fromNodeHeaders(req.headers),
            });

            const whereConditions = and(
                eq(schema.games.isPublic, true),
                q ? ilike(schema.games.title, `%${q}%`) : undefined
            );

            // Query public games with author, cover image, and like data according to search params
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
                .where(whereConditions)
                .groupBy(schema.games.id, authSchema.user.displayUsername, schema.gameItems.id)
                .orderBy(
                    ...(sort === "likes"
                        ? [desc(count(schema.gameLikes.id)), desc(schema.games.createdAt)]
                        : [desc(schema.games.createdAt)])
                )
                .limit(limit)
                .offset((page - 1) * limit);

            const totalCountResult = await db
                .select({ count: count() })
                .from(schema.games)
                .where(whereConditions);

            const totalCount = totalCountResult[0].count;
            const totalPages = Math.ceil(totalCount / limit);

            // Convert db info to image url, populate and send response object
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

            return res.status(200).json({
                games: premadeGamesInfoUrl,
                pagination: {
                    page,
                    limit,
                    totalCount,
                    totalPages,
                },
            });
            //Error handling ↓
        } catch (error) {
            console.error("Error while attempting to retrieve public games:\n", error);
            return res
                .status(500)
                .json({ message: "Internal Server Error. Failed to fetch public games." });
        }
    });

    /**
     * Retrieves all games created by the authenticated user
     * @route GET /api/getMyGames
     * @returns List of user's games with signed URLs for cover images
     */
    app.get("/api/getMyGames", async (req, res) => {
        try {
            const session = await auth.api.getSession({
                headers: fromNodeHeaders(req.headers),
            });

            if (!session) return res.status(401).json({ message: "Unauthorized." });

            // Query user's games (metadata)
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

            // For each cover image get Cloudfront signed URl
            const getMyGamesRes: PresetInfo = gameInfoList
                .filter(({ coverImageId }) => coverImageId !== null)
                .map(({ id, title, isPublic, numLikes, coverImageId }) => {
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
            //Error handling ↓
        } catch (error) {
            console.error("Error while attempting to get user's games: \n", error);
            return res
                .status(500)
                .json({ message: "Internal Server Error. Failed to fetch user's games." });
        }
    });

    app.get("/api/userHasLiked/:gameId", validateGameId, checkGameExists, async (req, res) => {
        const gameId = req.params.gameId;
        try {
            const session = await auth.api.getSession({
                headers: fromNodeHeaders(req.headers),
            });
            if (!session) return res.status(401).json({ message: "Unauthorized." });

            const [likeStatus] = await db
                .select({ likeId: schema.gameLikes.id })
                .from(schema.gameLikes)
                .where(
                    and(
                        eq(schema.gameLikes.gameId, gameId),
                        eq(schema.gameLikes.userId, session.user.id)
                    )
                );

            return res.status(200).json({ userHasLiked: Boolean(likeStatus) });
        } catch (error) {
            console.error("Error while attempting to retrieve if user has liked game:\n", error);
            return res
                .status(500)
                .json({ message: "Internal Server Error. Failed to check liked status." });
        }
    });

    /**
     * Retrieves complete game data including all character cards
     * @route GET /api/gameData/:gameId
     * @returns Game title and array of card data with image URLs
     */
    app.get("/api/gameData/:gameId", validateGameId, checkGameExists, async (req, res) => {
        const gameId = req.params.gameId;

        try {
            // Get game metadata
            const gameTitleAndPrivacy = await db
                .select({ title: schema.games.title, isPublic: schema.games.isPublic })
                .from(schema.games)
                .where(eq(schema.games.id, gameId)); //REDO THIS LATER

            const [{ isPublic, title }] = gameTitleAndPrivacy;

            // Get game items (images)
            const cardDataIdList: CardDataIdType[] = await db
                .select({
                    gameItemId: schema.gameItems.id,
                    name: schema.gameItems.name,
                    orderIndex: schema.gameItems.orderIndex,
                })
                .from(schema.gameItems)
                .where(eq(schema.gameItems.gameId, gameId));

            if (isPublic || !USE_CLOUDFRONT) {
                //send direct image urls for public games
                const cardDataUrlList = cardDataIdToUrl(gameId, isPublic, cardDataIdList);
                return res.status(200).send({ title: title, cardData: cardDataUrlList });
            } else {
                //send presigned image urls for private games
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

    /**
     * Toggles like status in db for a game (like if not liked, unlike if already liked)
     * @route PUT /api/likeGame/:gameId
     * @returns Success message
     */
    app.put("/api/likeGame/:gameId", validateGameId, checkGameExists, async (req, res) => {
        const {
            params: { gameId },
            headers,
        } = req;
        try {
            // Verify user is logged in
            const session = await auth.api.getSession({
                headers: fromNodeHeaders(headers),
            });
            if (!session) return res.status(401).json({ message: "Unauthorized." });

            // Check if user is game author and current like status
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

            // Prevent self-liking
            if (gameAuthorandLikeStatus.authorId === session.user.id) {
                return res.status(400).json({ message: "Cannot like your own game." });
            }

            if (gameAuthorandLikeStatus.likeId === null) {
                //insert like in gameLikes table if not liked
                await db.insert(schema.gameLikes).values({
                    gameId: req.params.gameId,
                    userId: session.user.id,
                });
                return res.status(200).json({ message: "Liked game." });
            } else {
                //delete like in gameLikes if already liked
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
            //Error handling ↓
        } catch (error) {
            console.error("Error while attempting to like game: \n", error);
            return res
                .status(500)
                .json({ message: "Internal Server Error. Failed to like or unlike game." });
        }
    });

    /**
     * Switches game privacy between public and private
     * @route PUT /api/switchPrivacy/:gameId
     * @returns Success status
     */
    app.put("/api/switchPrivacy/:gameId", validateGameId, checkGameExists, async (req, res) => {
        const {
            params: { gameId },
            headers,
        } = req;

        try {
            // Verify a user is logged in
            const session = await auth.api.getSession({
                headers: fromNodeHeaders(headers),
            });
            if (!session) return res.status(401).json({ message: "Unauthorized." });

            const gameWithItems = await getPrivacySettingAndImageIds(gameId);

            // Update privacy setting in db (if user owns the game)
            const dbUpdate = await db
                .update(schema.games)
                .set({
                    isPublic: not(schema.games.isPublic),
                })
                .where(and(eq(schema.games.id, gameId), eq(schema.games.userId, session.user.id)));

            //if db updated then move images in S3
            if (dbUpdate.rowCount !== null && dbUpdate.rowCount >= 1) {
                const [{ isPublic, imageIds }] = gameWithItems;
                const newIsPublic = !isPublic;

                if (imageIds.length > 0 && imageIds[0]) {
                    void switchPrivacySettings(gameId, isPublic, newIsPublic, imageIds);
                }

                console.log("Switched privacy setting of game:", gameId);
                return res.status(200).send();
            } else {
                //if user doesn't own game
                return res.status(403).json({ message: "Fordbideen" });
            }
            //Error handling ↓
        } catch (error) {
            console.error(
                `Error while attempting to switch privacy setting of game: ${gameId}:\n`,
                error
            );
            return res.status(500).json({ message: "Interal Server Error." });
        }
    });

    /**
     * Deletes a game and all associated images from S3
     * @route DELETE /api/deleteGame/:gameId
     * @returns Success message
     */
    app.delete("/api/deleteGame/:gameId", validateGameId, checkGameExists, async (req, res) => {
        const {
            params: { gameId },
            headers,
        } = req;

        try {
            // Verify a user is logged in
            const session = await auth.api.getSession({
                headers: fromNodeHeaders(headers),
            });
            if (!session) return res.status(401).json({ message: "Unauthorized." });

            const gameWithItems = await getPrivacySettingAndImageIds(gameId);

            // Delete game in db (if user owns it)
            const dbDelRes = await db
                .delete(schema.games)
                .where(and(eq(schema.games.id, gameId), eq(schema.games.userId, session.user.id)));

            // If db updated then delete images in S3 and CloudFront
            if (dbDelRes.rowCount !== null && dbDelRes.rowCount >= 1) {
                console.log(`User: ${session.user.id} deleted game:`, gameId);
                const [{ isPublic, imageIds }] = gameWithItems;

                void deleteImagesFromBucketAndCF(gameId, isPublic, imageIds);

                return res.status(200).json({
                    message: `User: ${session.user.id} deleted game: ${gameId}`,
                });
            } else {
                //if user doesn't own game
                console.warn(
                    `User: ${session.user.id} requested to delete game: ${gameId} but is not the owner of that game.`
                );
                return res.status(403).json({
                    message: "Forbidden.",
                });
            }
            //Error Handling ↓
        } catch (error) {
            console.error(`Error while attempting to delete game: ${gameId}:\n`, error);
            return res.status(500).json({ message: "Internal Server Error" });
        }
    });
}
