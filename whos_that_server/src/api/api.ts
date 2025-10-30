import { db, s3, cloudFront, S3_BUCKET_NAME, USE_CLOUDFRONT } from "../config/connections.ts";
import type { Express } from "express";
import { PutObjectCommand, DeleteObjectsCommand, CopyObjectCommand } from "@aws-sdk/client-s3";
import * as schema from "../db/schema.ts";
import * as authSchema from "../db/auth-schema.ts";
import { eq, and, sql, not } from "drizzle-orm";
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
import { CreateInvalidationCommand } from "@aws-sdk/client-cloudfront";
import env from "../config/zod/zodEnvSchema.ts";
import { createGameRequestSchema, nanoId21Schema } from "../config/zod/zodSchema.ts";
import z from "zod";
import { auth } from "../config/auth.ts";
import { fromNodeHeaders } from "better-auth/node";

const constructImageUrl = (isPublic: boolean, gameId: string, gameItemId: string): string => {
    if (USE_CLOUDFRONT) {
        return `https://${env.AWS_CF_DOMAIN}/` + constructS3ImageKey(isPublic, gameId, gameItemId);
    } else {
        return (
            `https://${S3_BUCKET_NAME}.s3.${env.AWS_BUCKET_REGION}.amazonaws.com/` +
            constructS3ImageKey(isPublic, gameId, gameItemId)
        );
    }
};

const constructS3ImageKey = (isPublic: boolean, gameId: string, gameItemId: string): string => {
    const privacyStr = isPublic ? "public" : "private";
    return `premadeGames/${privacyStr}/${gameId}/${gameItemId}`;
};

const cardDataIdToUrl = (
    cardDataIdList: CardDataIdType[],
    isPublic: boolean,
    gameId: string
): CardDataUrlType[] => {
    return cardDataIdList.map(({ name, orderIndex, gameItemId }) => {
        return {
            name,
            orderIndex,
            imageUrl: constructImageUrl(isPublic, gameId, gameItemId),
        };
    });
};

export function setupApiRoutes(app: Express) {
    app.post("/api/createNewGame", async (req, res) => {
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
                return res.status(500).json({ message: "Error creating new game." });
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
                return res.status(500).json({ message: "Error creating new game." });
            }
        } else {
            console.error("Error creating new game:\n" + z.prettifyError(validRequest.error));
            return res.status(422).json({
                message: "Invalid create game request.",
            });
        }
    });

    app.get("/api/gameData/:presetId", async (req, res) => {
        const {
            params: { presetId },
        } = req;
        const validGameId = nanoId21Schema.safeParse(presetId);
        if (!validGameId.success) return res.status(422).json({ message: "Invalid game id." });
        const gameId = validGameId.data;

        try {
            const gameTitleAndPrivacy = await db
                .select({ title: schema.games.title, isPublic: schema.games.isPublic })
                .from(schema.games)
                .where(eq(schema.games.id, gameId)); //REDO THIS LATER

            if (gameTitleAndPrivacy.length === 0)
                return res.status(404).json({ message: `Game id: ${gameId} does not exist` });

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
            console.error("Error:", error);
            return res.status(500).json({ message: `Failed to get game: ${gameId}` });
        }
    });

    app.get("/api/getAllPremadeGames", async (req, res) => {
        try {
            const premadeGamesInfo = await db
                .select({
                    id: schema.games.id,
                    title: schema.games.title,
                    author: authSchema.user.displayUsername,
                    coverImageId: schema.gameItems.id,
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
                .where(eq(schema.games.isPublic, true));

            const premadeGamesInfoUrl: PresetInfo = premadeGamesInfo
                .filter(({ coverImageId }) => coverImageId !== null)
                .map(({ id, title, author, coverImageId }) => {
                    return {
                        id,
                        title,
                        author,
                        isPublic: true,
                        imageUrl: constructImageUrl(true, id, coverImageId ?? ""),
                    };
                });

            return res.status(200).send(premadeGamesInfoUrl);
        } catch (error) {
            console.error("Get premade games error:", error);
            return res.status(500).json({ message: "Failed to fetch premade games." });
        }
    });

    app.get("/api/getMyGames", async (req, res) => {
        const { headers } = req;

        try {
            const session = await auth.api.getSession({
                headers: fromNodeHeaders(headers),
            });

            if (!session) return res.status(401).json({ message: "Unauthorized." });

            const gameInfoList = await db
                .select({
                    id: schema.games.id,
                    title: schema.games.title,
                    isPublic: schema.games.isPublic,
                    coverImageId: schema.gameItems.id,
                })
                .from(schema.games)
                .leftJoin(
                    schema.gameItems,
                    and(
                        eq(schema.gameItems.gameId, schema.games.id),
                        eq(schema.gameItems.orderIndex, 0)
                    )
                )
                .where(eq(schema.games.userId, session.user.id));

            const getMyGamesRes: PresetInfo = gameInfoList
                .filter(({ coverImageId }) => coverImageId !== null)
                .map(({ id, title, isPublic, coverImageId }) => {
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
                        imageUrl:
                            isPublic || !USE_CLOUDFRONT
                                ? imageUrl
                                : getSignedCFUrl(signedUrlParams),
                    };
                });

            res.status(200).send(getMyGamesRes);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Failed to fetch user's premade games " });
        }
    });

    app.put("/api/switchPrivacy/:gameId", async (req, res) => {
        const {
            params: { gameId: paramGameId },
            headers,
        } = req;
        const validGameId = nanoId21Schema.safeParse(paramGameId);
        if (!validGameId.success) return res.status(422).json({ message: "Invalid game id." });
        const gameId = validGameId.data;

        try {
            const session = await auth.api.getSession({
                headers: fromNodeHeaders(headers),
            });
            if (!session) return res.status(401).json({ message: "Unauthorized." });

            const gameWithItems = await db
                .select({
                    isPublic: schema.games.isPublic,
                    imageIds: sql<string[]>`array_agg(${schema.gameItems.id})`,
                })
                .from(schema.games)
                .leftJoin(schema.gameItems, eq(schema.gameItems.gameId, schema.games.id))
                .where(eq(schema.games.id, gameId))
                .groupBy(schema.games.id);

            const dbUpdate = await db
                .update(schema.games)
                .set({
                    isPublic: not(schema.games.isPublic),
                })
                .where(and(eq(schema.games.id, gameId), eq(schema.games.userId, session.user.id)));

            if (gameWithItems.length > 0 && dbUpdate.rowCount !== null && dbUpdate.rowCount >= 1) {
                const [{ isPublic, imageIds }] = gameWithItems;
                const newIsPublic = !isPublic;

                if (imageIds.length > 0 && imageIds[0]) {
                    const s3ImageCopyingPromises = imageIds.map((imageId) => {
                        const oldKey = constructS3ImageKey(isPublic, gameId, imageId);
                        const newKey = constructS3ImageKey(newIsPublic, gameId, imageId);
                        return s3.send(
                            new CopyObjectCommand({
                                Bucket: S3_BUCKET_NAME,
                                CopySource: `${S3_BUCKET_NAME}/${oldKey}`,
                                Key: newKey,
                            })
                        );
                    });
                    const copyResults = await Promise.allSettled(s3ImageCopyingPromises);
                    if (copyResults.some((p) => p.status === "rejected")) {
                        await s3.send(
                            new DeleteObjectsCommand({
                                Bucket: S3_BUCKET_NAME,
                                Delete: {
                                    Objects: imageIds.map((id) => ({
                                        Key: constructS3ImageKey(newIsPublic, gameId, id),
                                    })),
                                },
                            })
                        );
                        await db
                            .update(schema.games)
                            .set({
                                isPublic: not(schema.games.isPublic),
                            })
                            .where(
                                and(
                                    eq(schema.games.id, gameId),
                                    eq(schema.games.userId, session.user.id)
                                )
                            );
                        throw new Error(
                            "Not all copy operations succeeded, rollback was attempted."
                        );
                    }

                    const s3DelObjsCommand = new DeleteObjectsCommand({
                        Bucket: S3_BUCKET_NAME,
                        Delete: {
                            Objects: imageIds.map((id) => ({
                                Key: constructS3ImageKey(isPublic, gameId, id),
                            })),
                        },
                    });
                    const s3DeleteResult = await s3.send(s3DelObjsCommand);
                    if (s3DeleteResult.Errors) {
                        console.error(
                            "S3 batch delete for switching privacy settings had errors! There are likely orphaned items in S3 bucket:\n",
                            s3DeleteResult.Errors
                        );
                    }

                    if (USE_CLOUDFRONT) {
                        const cFCacheInvalidationCommand = new CreateInvalidationCommand({
                            DistributionId: env.AWS_CF_DISTRIBUTION_ID,
                            InvalidationBatch: {
                                CallerReference: nanoid(),
                                Paths: {
                                    Quantity: 1,
                                    Items: [
                                        `/premadeGames/${isPublic ? "public" : "private"}/${gameId}/*`,
                                    ],
                                },
                            },
                        });
                        try {
                            await cloudFront.send(cFCacheInvalidationCommand);
                        } catch (cfError) {
                            console.error(
                                "CloudFront cache invalidation failed while swapping privacy settings:",
                                cfError
                            );
                        }
                    }
                }

                console.log("Switched privacy setting of game:", gameId);
                return res.status(200).send();
            } else {
                return res.status(404).json({
                    message: `Either game ${gameId} does not exist or user ${session.user.id} does not have permission to edit it.`,
                });
            }
        } catch (error) {
            console.error(
                `Error while attempting to switch privacy setting of game: ${gameId}:\n`,
                error
            );
            return res.status(500).json({
                message: `Error while attempting to switch privacy setting of game: ${gameId}.`,
            });
        }
    });

    app.delete("/api/deleteGame/:gameId", async (req, res) => {
        const {
            params: { gameId: paramGameId },
            headers,
        } = req;
        const validGameId = nanoId21Schema.safeParse(paramGameId);
        if (!validGameId.success) return res.status(422).json({ message: "Invalid game id." });
        const gameId = validGameId.data;

        try {
            const session = await auth.api.getSession({
                headers: fromNodeHeaders(headers),
            });
            if (!session) return res.status(401).json({ message: "Unauthorized." });

            const gameWithItems = await db
                .select({
                    isPublic: schema.games.isPublic,
                    imageIds: sql<string[]>`array_agg(${schema.gameItems.id})`,
                })
                .from(schema.games)
                .leftJoin(schema.gameItems, eq(schema.gameItems.gameId, schema.games.id))
                .where(eq(schema.games.id, gameId))
                .groupBy(schema.games.id);

            const dbDelRes = await db
                .delete(schema.games)
                .where(and(eq(schema.games.id, gameId), eq(schema.games.userId, session.user.id)));

            if (gameWithItems.length > 0 && dbDelRes.rowCount !== null && dbDelRes.rowCount >= 1) {
                console.log("Deleted Game:", gameId);
                const [{ isPublic, imageIds }] = gameWithItems;

                if (imageIds.length > 0 && imageIds[0]) {
                    const delS3ObjsCommand = new DeleteObjectsCommand({
                        Bucket: S3_BUCKET_NAME,
                        Delete: {
                            Objects: imageIds.map((id) => ({
                                Key: constructS3ImageKey(isPublic, gameId, id),
                            })),
                        },
                    });
                    const s3DeleteResult = await s3.send(delS3ObjsCommand);
                    if (s3DeleteResult.Errors) {
                        console.error(
                            "S3 batch delete had errors! There are likely orphaned items in S3 bucket:\n",
                            s3DeleteResult.Errors
                        );
                    }

                    if (USE_CLOUDFRONT) {
                        const cFCacheInvalidationCommand = new CreateInvalidationCommand({
                            DistributionId: env.AWS_CF_DISTRIBUTION_ID,
                            InvalidationBatch: {
                                CallerReference: nanoid(),
                                Paths: {
                                    Quantity: 1,
                                    Items: [
                                        `/premadeGames/${isPublic ? "public" : "private"}/${gameId}/*`,
                                    ],
                                },
                            },
                        });
                        try {
                            await cloudFront.send(cFCacheInvalidationCommand);
                        } catch (cfError) {
                            console.error("CloudFront cache invalidation failed:", cfError);
                        }
                    }
                }

                res.status(200).json({ message: `Deleted game: ${gameId}` });
            } else {
                console.warn(
                    `Either game ${gameId} does not exist or user ${session.user.id} does not have permission to delete it.`
                );
                return res.status(404).json({
                    message: `Either this game does not exist or you do not have permission to delete it.`,
                });
            }
        } catch (error) {
            console.error(`Error while attempting to delete game: ${gameId}:\n`, error);
            return res
                .status(500)
                .json({ message: `Error while attempting to delete game: ${gameId}` });
        }
    });
}
