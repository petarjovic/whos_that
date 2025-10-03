import { db, s3, cloudFront } from "./config/awsConections.ts";
import type { Express } from "express";
import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import * as schema from "./config/db/schema.ts";
import { eq, and } from "drizzle-orm";
import type {
    CardDataIdType,
    CardDataUrlType,
    CreateGameRequest,
    CreateGameResponse,
} from "./config/types.ts";
import { nanoid } from "nanoid";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getSignedUrl as getCloudfrontSignedUrl } from "@aws-sdk/cloudfront-signer";

const constructImageUrl = (isPublic: boolean, gameId: string, gameItemId: string): string => {
    if (!process.env.AWS_CLOUDFRONT_DOMAIN) {
        throw new Error("AWS_CLOUDFRONT_DOMAIN environment variable is not defined.");
    }
    return (
        `https://${process.env.AWS_CLOUDFRONT_DOMAIN}.s3.amazonaws.com/` +
        constructS3ImageKey(isPublic, gameId, gameItemId)
    );
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
        //ERROR HANDLINHG
        const body = req.body as CreateGameRequest;

        // Request Validation Redo Later
        if (!body.title || typeof body.title !== "string") {
            return res.status(400).json({ message: "Title is required." });
        } else if (!["public", "private"].includes(body.privacy)) {
            return res
                .status(400)
                .json({ message: "Privacy setting must be 'public' or 'private'." });
        } else if (!body.user || typeof body.user !== "string") {
            return res.status(400).json({ message: "User ID is required." });
        } else if (!Array.isArray(body.namesAndFileTypes)) {
            return res.status(400).json({ message: "NamesAndFileTypes must be an array." });
        } else {
            const acceptedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
            for (const { type, name } of body.namesAndFileTypes) {
                if (!type || !name) {
                    return res.status(400).json({ message: "Each file must have type and name." });
                } else if (!acceptedTypes.has(type)) {
                    return res.status(400).json({ message: `Invalid file type: ${type}` });
                } else if (typeof name !== "string" || name.trim().length === 0) {
                    return res.status(400).json({ message: "Each file must have a valid name." });
                }
            }
        }

        let gameId = "";

        try {
            [{ insertedId: gameId }] = await db //extract and asign to id
                .insert(schema.games)
                .values({
                    id: nanoid(),
                    title: body.title,
                    description: "",
                    isPublic: body.privacy === "public",
                    userId: body.user,
                })
                .returning({ insertedId: schema.games.id });
        } catch (error) {
            console.error("Error creating new game entry:", error);
            return res.status(500).json({ message: "Error creating new game entry." });
        }

        if (!gameId) return res.status(500).json({ error: "Error creating new game entry." }); //Sanity Check

        const presignedUploadUrls: CreateGameResponse = {};

        for (const { type, name } of body.namesAndFileTypes) {
            const gameItemId = nanoid();
            const command = new PutObjectCommand({
                Bucket: process.env.AWS_BUCKET_NAME,
                Key: constructS3ImageKey(body.privacy === "public", gameId, gameItemId),
                ContentType: type,
            });
            const signedUrl = await getSignedUrl(s3, command, {
                expiresIn: 120,
            });
            presignedUploadUrls[name] = { signedUrl: signedUrl, itemId: gameItemId };
        }

        //update gameItems table

        try {
            let i = 0;
            for (const [name, { itemId }] of Object.entries(presignedUploadUrls)) {
                const insertGameItems = await db.insert(schema.gameItems).values({
                    id: itemId,
                    gameId: gameId,
                    imageUrl: constructImageUrl(body.privacy === "public", gameId, itemId), //WILL BE REMOVED?
                    name: name,
                    orderIndex: i,
                });
                i++;
                console.log(insertGameItems);
            }
            console.log("Successfully updated database.");
            return res.status(200).json(presignedUploadUrls);
        } catch (error) {
            console.error("Error updating db:", error);
        }
    });

    app.get("/api/gameData", async (req, res) => {
        //ERROR HANDLINHG FOR REAL DO IT SOON OML

        const {
            query: { preset: gameId },
        } = req;
        if (!gameId || typeof gameId !== "string")
            return res.status(400).send({ message: "Preset query is missing or invalid." }); //Maybe handle better?

        try {
            const [{ isPublic, title }] = await db
                .select({ title: schema.games.title, isPublic: schema.games.isPublic })
                .from(schema.games)
                .where(eq(schema.games.id, gameId)); //REDO THIS LATER TO BE DONE VIA SOCKET.IO SO THAT PRIVATE GAMES ARE ACC PRIVATE

            const cardDataIdList: CardDataIdType[] = await db
                .select({
                    gameItemId: schema.gameItems.id,
                    name: schema.gameItems.name,
                    orderIndex: schema.gameItems.orderIndex,
                })
                .from(schema.gameItems)
                .where(eq(schema.gameItems.gameId, gameId));

            if (isPublic) {
                const cardDataUrlList = cardDataIdToUrl(cardDataIdList, isPublic, gameId);
                return res.status(200).send({ title: title, cardData: cardDataUrlList });
            } else {
                const cardDataPresignedUrlList: CardDataUrlType[] = await Promise.all(
                    cardDataIdList.map(async (cardData) => {
                        const command = new GetObjectCommand({
                            Bucket: process.env.AWS_BUCKET_NAME,
                            Key: constructS3ImageKey(false, gameId, cardData.gameItemId),
                        });
                        return {
                            name: cardData.name,
                            imageUrl: await getSignedUrl(s3, command, { expiresIn: 3600 }),
                            orderIndex: cardData.orderIndex,
                        };
                    })
                );
                return res.status(200).send({ title: title, cardData: cardDataPresignedUrlList });
            }
        } catch (error) {
            console.error("Error:", error);
            return res.status(400).json({ message: `Failed to get game: ${gameId}` });
        }

        //ERROR HANDLING
    });

    app.get("/api/getAllPremadeGames", async (req, res) => {
        const gameTitleIdImageList = await db
            .select({
                id: schema.games.id,
                title: schema.games.title,
                imageUrl: schema.gameItems.imageUrl,
            })
            .from(schema.games)
            .leftJoin(
                schema.gameItems,
                and(
                    eq(schema.gameItems.gameId, schema.games.id),
                    eq(schema.gameItems.orderIndex, 0)
                )
            )
            .where(eq(schema.games.isPublic, true));

        res.send(gameTitleIdImageList.filter(({ imageUrl }) => imageUrl !== null)); //maybe handle diff?
    });

    app.get("/api/getMyGames", async (req, res) => {
        const {
            query: { userId },
        } = req;
        if (!userId || typeof userId !== "string")
            return res.status(400).json({ message: "No user-id given." }); //EROROR DO IT RIGFHT ADF:KJDSFLKJSFHLKJFSDK:LFS
        const gameInfoList = await db
            .select({
                id: schema.games.id,
                title: schema.games.title,
                isPublic: schema.games.isPublic,
                coverImageId: schema.gameItems.id,
            })
            .from(schema.games)
            //AS STRING?
            .leftJoin(
                schema.gameItems,
                and(
                    eq(schema.gameItems.gameId, schema.games.id),
                    eq(schema.gameItems.orderIndex, 0)
                )
            )
            .where(eq(schema.games.userId, userId));

        const getMyGamesRes = gameInfoList.map(({ id, title, isPublic, coverImageId }) => {
            return {
                id,
                title,
                isPublic,
                imageUrl: constructImageUrl(isPublic, id, coverImageId ?? ""),
            };
        });

        res.send(getMyGamesRes);
    });

    app.delete("/api/deleteGame/", async (req, res) => {
        const {
            query: { gameId, userId },
        } = req;
        if (!gameId || typeof gameId !== "string")
            return res.status(400).json({ message: "No game-id given." });
        if (!userId || typeof userId !== "string")
            return res.status(400).json({ message: "No user-id given." });

        const imageIds = await db
            .select({ id: schema.gameItems.id })
            .from(schema.gameItems)
            .where(eq(schema.gameItems.gameId, gameId));

        const [{ isPublic }] = await db
            .select({ isPublic: schema.games.isPublic })
            .from(schema.games)
            .where(eq(schema.games.id, gameId));

        const delS3Objs = imageIds.map(async ({ id }) => {
            const command = new DeleteObjectCommand({
                Bucket: process.env.AWS_BUCKET_NAME,
                Key: constructS3ImageKey(isPublic, gameId, id),
            });
            return await s3.send(command);
        });

        // const cFCacheInvalidationParams = imageIds.map(async ({ id }) => {
        //     const command = new DeleteObjectCommand({
        //     DistributionId: process.env.DISTRIBUTION_ID,
        //     InvalidationBatch: {
        //         CallerReference: constructS3ImageKey(isPublic, gameId, id),
        //         Paths: {
        //             Quantity: 1
        //         }
        //     });
        //     return await s3.send(command);
        // });

        const delRes = await db
            .delete(schema.games)
            .where(and(eq(schema.games.id, gameId), eq(schema.games.userId, userId)));
        if (delRes.rowCount !== null && delRes.rowCount >= 1) {
            const msg = `Deleted game: ${gameId}`;
            await Promise.all(delS3Objs);
            //invalidate Cloudfront cache
            res.status(200).json({ message: msg });
        } else
            res.status(400).json({
                message: `Either ${gameId} does not exist or user ${userId} doesn't not have premission to delete it.`,
            });
    });
}
