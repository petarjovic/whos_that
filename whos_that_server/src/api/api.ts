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
    IdPresetInfo,
    UrlPresetInfo,
} from "../config/types.ts";
import { nanoid } from "nanoid";
import { getSignedUrl as getSignedS3Url } from "@aws-sdk/s3-request-presigner";
import { getSignedUrl as getSignedCFUrl } from "@aws-sdk/cloudfront-signer";
import env from "../config/zod/zodEnvSchema.ts";
import { createGameRequestSchema, searchQuerySchema } from "../config/zod/zodSchema.ts";
import z from "zod/v4";
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
import {
    getCachedGameData,
    setGameDataCache,
    getCachedTop3MostLiked,
    setTop3MostLikedCache,
    getCachedTop3MostRecent,
    setTop3MostRecentCache,
    invalidateInAllCaches,
    insertTop3MostRecentCache,
    delTop3MostLikedCache,
} from "./cache.ts";

/**
 * Sets up all API routes for the Express application
 * @param app - Express application instance
 */
export function setupApiRoutes(app: Express) {
    /**
     * Generates game in database and sends clients presigned URLS for uploading images
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

                //if the new game is public, add it to the recent games cache
                if (body.privacy === "public") {
                    const newGameInfo: IdPresetInfo = {
                        id: gameId,
                        title: body.title,
                        author: session.user.displayUsername ?? "",
                        isPublic: true,
                        imageId: Object.values(response.gameItems)[0].itemId,
                        numLikes: 0,
                        userHasLiked: null,
                    };
                    insertTop3MostRecentCache(newGameInfo);
                }

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
            //get top 3 most liked games, check cache first
            let top3MostLikedGames: IdPresetInfo[] | null = getCachedTop3MostLiked();
            if (!top3MostLikedGames) {
                top3MostLikedGames = await db
                    .select({
                        id: schema.games.id,
                        title: schema.games.title,
                        author: authSchema.user.displayUsername,
                        isPublic: schema.games.isPublic, //true
                        imageId: schema.gameItems.id,
                        numLikes: count(schema.gameLikes.id),
                        userHasLiked: sql<null>`NULL`,
                    })
                    .from(schema.games)
                    .leftJoin(authSchema.user, eq(authSchema.user.id, schema.games.userId))
                    .innerJoin(
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

                setTop3MostLikedCache(top3MostLikedGames);
            }

            //get the top 3 newest games, check cache first
            let top3MostRecentGames: IdPresetInfo[] | null = getCachedTop3MostRecent();
            if (!top3MostRecentGames) {
                top3MostRecentGames = await db
                    .select({
                        id: schema.games.id,
                        title: schema.games.title,
                        author: authSchema.user.displayUsername,
                        isPublic: schema.games.isPublic, //true
                        imageId: schema.gameItems.id,
                        numLikes: count(schema.gameLikes.id),
                        userHasLiked: sql<null>`NULL`,
                    })
                    .from(schema.games)
                    .leftJoin(authSchema.user, eq(authSchema.user.id, schema.games.userId))
                    .innerJoin(
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

                setTop3MostRecentCache(top3MostRecentGames);
            }

            //Merge top3s into one obj and convert image ids to image URLs
            const featuredGamesInfoUrl: UrlPresetInfo[] = [
                ...top3MostLikedGames,
                ...top3MostRecentGames,
            ].map(({ imageId, ...presetInfo }) => {
                return {
                    ...presetInfo,
                    imageUrl: constructImageUrl(true, presetInfo.id, imageId),
                };
            });

            res.status(200).send(featuredGamesInfoUrl);
            //Error handling ↓
        } catch (error) {
            console.error("Error while attempting to retrieve featured games:\n", error);
            return res
                .status(500)
                .json({ message: "Internal Server Error. Failed to fetch featured games." });
        }
    });

    /**
     * Retrieves public games according to query and with metadata
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

            //includes private games if user is an admin, otherwise only public
            const isAdmin = session?.user.role === "admin";
            const whereConditions = and(
                isAdmin ? undefined : eq(schema.games.isPublic, true),
                q ? ilike(schema.games.title, `%${q}%`) : undefined
            );

            // Query public games with author, cover image, and like data according to search params
            const premadeGamesInfo: IdPresetInfo[] = await db
                .select({
                    id: schema.games.id,
                    title: schema.games.title,
                    author: authSchema.user.displayUsername,
                    isPublic: schema.games.isPublic, //true
                    imageId: schema.gameItems.id,
                    numLikes: count(schema.gameLikes.id),
                    userHasLiked: session
                        ? sql<boolean>`BOOL_OR(${schema.gameLikes.userId} = ${session.user.id})`
                        : sql<boolean>`FALSE`,
                })
                .from(schema.games)
                .leftJoin(authSchema.user, eq(authSchema.user.id, schema.games.userId))
                .innerJoin(
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

            // Convert image id to image url
            const premadeGamesInfoUrl: UrlPresetInfo[] = premadeGamesInfo.map(
                ({ imageId, ...presetInfo }) => {
                    let imageUrl = constructImageUrl(presetInfo.isPublic, presetInfo.id, imageId);

                    if (!presetInfo.isPublic && USE_CLOUDFRONT) {
                        imageUrl = getSignedCFUrl({
                            url: imageUrl,
                            dateLessThan: new Date(Date.now() + 1000 * 60 * 60 * 24),
                            privateKey: env.AWS_CF_PRIV_KEY,
                            keyPairId: env.AWS_CF_KEY_PAIR_ID,
                        });
                    }
                    return {
                        ...presetInfo,
                        imageUrl,
                    };
                }
            );

            //send response object
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
     * @returns List of user's games with signed URLs for cover images
     */
    app.get("/api/getMyGames", async (req, res) => {
        try {
            const session = await auth.api.getSession({
                headers: fromNodeHeaders(req.headers),
            });

            if (!session) return res.status(401).json({ message: "Unauthorized." });

            // Query user's games (metadata)
            const gameInfoList: IdPresetInfo[] = await db
                .select({
                    id: schema.games.id,
                    title: schema.games.title,
                    author: schema.games.userId, //usually username, but this data is already in session
                    isPublic: schema.games.isPublic,
                    imageId: schema.gameItems.id,
                    numLikes: count(schema.gameLikes.id),
                    userHasLiked: sql<null>`NULL`,
                })
                .from(schema.games)
                .innerJoin(
                    schema.gameItems,
                    and(
                        eq(schema.gameItems.gameId, schema.games.id),
                        eq(schema.gameItems.orderIndex, 0)
                    )
                )
                .leftJoin(schema.gameLikes, eq(schema.gameLikes.gameId, schema.games.id))
                .where(eq(schema.games.userId, session.user.id))
                .groupBy(schema.games.id, schema.gameItems.id);

            // Convert image ids to image urls
            const getMyGamesRes: UrlPresetInfo[] = gameInfoList.map(
                ({ imageId, author, ...presetInfo }) => {
                    let imageUrl = constructImageUrl(presetInfo.isPublic, presetInfo.id, imageId);

                    if (!presetInfo.isPublic && USE_CLOUDFRONT) {
                        imageUrl = getSignedCFUrl({
                            url: imageUrl,
                            dateLessThan: new Date(Date.now() + 1000 * 60 * 60 * 25),
                            privateKey: env.AWS_CF_PRIV_KEY,
                            keyPairId: env.AWS_CF_KEY_PAIR_ID,
                        });
                    }
                    //set author property to displayUsername from session data
                    return {
                        ...presetInfo,
                        author: session.user.displayUsername ?? "",
                        imageUrl,
                    };
                }
            );

            return res.status(200).send(getMyGamesRes);
            //Error handling ↓
        } catch (error) {
            console.error("Error while attempting to get user's games: \n", error);
            return res
                .status(500)
                .json({ message: "Internal Server Error. Failed to fetch user's games." });
        }
    });
    /**
     * Retrieves all games liked by the authenticated user
     * @returns List of user's games with signed URLs for cover images
     */
    app.get("/api/getMyLikedGames", async (req, res) => {
        try {
            const session = await auth.api.getSession({
                headers: fromNodeHeaders(req.headers),
            });

            if (!session) return res.status(401).json({ message: "Unauthorized." });

            // Query user's liked games
            const likedGamesInfo: IdPresetInfo[] = await db
                .select({
                    id: schema.games.id,
                    title: schema.games.title,
                    author: authSchema.user.displayUsername,
                    isPublic: schema.games.isPublic,
                    imageId: schema.gameItems.id,
                    numLikes: sql<number>`CAST((SELECT COUNT(*) FROM ${schema.gameLikes} WHERE game_id = ${schema.games.id}) AS INTEGER)`,
                    userHasLiked: sql<boolean>`TRUE`,
                })
                .from(schema.games)
                .leftJoin(authSchema.user, eq(authSchema.user.id, schema.games.userId))
                .innerJoin(
                    schema.gameLikes,
                    and(
                        eq(schema.gameLikes.gameId, schema.games.id),
                        eq(schema.gameLikes.userId, session.user.id)
                    )
                )
                .innerJoin(
                    schema.gameItems,
                    and(
                        eq(schema.gameItems.gameId, schema.games.id),
                        eq(schema.gameItems.orderIndex, 0)
                    )
                )
                .groupBy(schema.games.id, schema.gameItems.id, authSchema.user.id);

            // Convert image ids to image urls
            const getMyGamesRes: UrlPresetInfo[] = likedGamesInfo.map(
                ({ imageId, ...presetInfo }) => {
                    let imageUrl = constructImageUrl(presetInfo.isPublic, presetInfo.id, imageId);

                    if (!presetInfo.isPublic && USE_CLOUDFRONT) {
                        imageUrl = getSignedCFUrl({
                            url: imageUrl,
                            dateLessThan: new Date(Date.now() + 1000 * 60 * 60 * 25),
                            privateKey: env.AWS_CF_PRIV_KEY,
                            keyPairId: env.AWS_CF_KEY_PAIR_ID,
                        });
                    }

                    return {
                        ...presetInfo,
                        imageUrl,
                    };
                }
            );

            return res.status(200).send(getMyGamesRes);
            //Error handling ↓
        } catch (error) {
            console.error("Error while attempting to get user's games: \n", error);
            return res
                .status(500)
                .json({ message: "Internal Server Error. Failed to fetch user's games." });
        }
    });

    /**
     * Checks if user has liked this game already
     * @returns { userHasLiked: Boolean }
     */
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
     * @returns Game title + array of character data including image URLs
     */
    app.get("/api/gameData/:gameId", validateGameId, checkGameExists, async (req, res) => {
        const gameId = req.params.gameId;

        //check if game is cached
        const cached = getCachedGameData(gameId);
        if (cached) {
            return res.status(200).send(cached);
        }

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
                //cache and send direct image urls for public games
                const cardDataUrlList = cardDataIdToUrl(gameId, isPublic, cardDataIdList);
                const resData = { title: title, cardData: cardDataUrlList };
                setGameDataCache(gameId, resData);

                return res.status(200).send(resData);
            } else {
                //cache and send presigned image urls for private games
                const cardDataPresignedUrlList: CardDataUrlType[] = cardDataIdList.map(
                    (cardData) => {
                        const signedUrlParams = {
                            url: constructImageUrl(false, gameId, cardData.gameItemId),
                            dateLessThan: new Date(Date.now() + 1000 * 60 * 60 * 25),
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

                const resData = { title: title, cardData: cardDataPresignedUrlList };
                setGameDataCache(gameId, resData);
                return res.status(200).send(resData);
            }
        } catch (error) {
            console.error("Error while attempting to retrieve game data:\n", error);
            return res.status(500).json({ message: "Internal Server Error. Failed to get game." });
        }
    });

    /**
     * Toggles like status in db for a game (like if not liked, unlike if already liked)
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

            //invalidate top3mostlikedgames cache if game in cache
            //this maybe needs to be redone later if scaling becomes issue
            const top3MostLiked: IdPresetInfo[] | null = getCachedTop3MostLiked();
            if (top3MostLiked?.some((game) => game.id === gameId)) {
                delTop3MostLikedCache();
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
                    await switchPrivacySettings(gameId, isPublic, newIsPublic, imageIds);
                }
                invalidateInAllCaches(gameId); //metadata changed so invalidate cache

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

            // If deleted in db then del cache data and del image files in S3 and CloudFront
            if (dbDelRes.rowCount !== null && dbDelRes.rowCount >= 1) {
                //del image files in S3 and CloudFront
                const [{ isPublic, imageIds }] = gameWithItems;
                void deleteImagesFromBucketAndCF(gameId, isPublic, imageIds);

                //invalidate any cache data that has this game
                invalidateInAllCaches(gameId);

                //response
                const resMsg = `User: ${session.user.id} deleted game: ${gameId}`;
                console.log(resMsg);
                return res.status(200).json({
                    message: resMsg,
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
