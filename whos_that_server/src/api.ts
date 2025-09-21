import multer from "multer";
import { db, s3 } from "./config/awsConections.ts";
import type { Express } from "express";
import { PutObjectCommand, GetObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import sharp from "sharp";
import * as schema from "./config/db/schema.ts";
import { eq, and } from "drizzle-orm";
import type { CardDataType } from "./config/types.ts";
import { nanoid } from "nanoid";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const upload = multer({ storage: multer.memoryStorage() });

function extractS3KeyFromUrl(s3Url: string): string {
    // Handle both URL formats:
    // https://bucket-name.s3.region.amazonaws.com/path/to/file.jpg
    // https://s3.region.amazonaws.com/bucket-name/path/to/file.jpg

    const url = new URL(s3Url);

    if (url.hostname.startsWith("s3.")) {
        // Format: https://s3.region.amazonaws.com/bucket-name/key
        const pathParts = url.pathname.split("/").filter((part) => part.length > 0);
        return pathParts.slice(1).join("/"); // Remove bucket name, keep the rest
    } else {
        // Format: https://bucket-name.s3.region.amazonaws.com/key
        return url.pathname.substring(1); // Remove leading slash
    }
}

export function setupApiRoutes(app: Express) {
    app.post("/api/createNewGame", upload.array("images", 24), async (req, res) => {
        //ERROR HANDLINHG
        console.log(req);

        if (!req.files || !Array.isArray(req.files)) {
            //IDK IF THIS IS THE RIGHT WAY TO HANDLE THIS
            return res.status(400).json({ error: "No files uploaded" });
        }

        const fileUploadPromises = [];

        const gameItemUrls = [];
        const gameItemNames = [];
        let newGameId = "";

        //Create new game entry in database
        try {
            newGameId = (
                await db
                    .insert(schema.games)
                    .values({
                        id: nanoid(),
                        title: req.body.title,
                        description: "",
                        isPublic: req.body.privacy === "public",
                        userId: req.body.user,
                    })
                    .returning({ insertedId: schema.games.id })
            )[0].insertedId; //extract insertedId value
        } catch (error) {
            console.error("Error creating new game entry: ", error);
            return res.status(500).json({ error: "Error creating new game entry." });
        }

        if (!newGameId) return res.status(500).json({ error: "Error creating new game entry." }); //Sanity Check

        //Create array of promises for uploading game images to S3 bucket
        for (const file of req.files) {
            const buffer = await sharp(file.buffer)
                .resize({ height: 338 * 2, width: 262 * 2, fit: "cover" })
                .toBuffer();

            const key = `premadeGames/${req.body.privacy}/${newGameId}/` + file.originalname;
            const params = {
                Bucket: process.env.AWS_BUCKET_NAME,
                Region: process.env.AWS_BUCKET_REGION, //NOT NEEDED?
                Key: key,
                Body: buffer,
                ContentType: file.mimetype,
            };
            const uploadCommand = new PutObjectCommand(params);

            fileUploadPromises.push(s3.send(uploadCommand));

            gameItemUrls.push("https://whos-that.s3.amazonaws.com/" + key);
        }

        for (const name of req.body.names) {
            gameItemNames.push(name);
        }

        //Await upload promises
        try {
            const results = await Promise.all(fileUploadPromises);
            console.log(`Successfully uploaded ${results.length} files`);
        } catch (error) {
            console.error("Error uploading data: ", error);
            return res.status(500).json({ message: "Failed to upload one or more files." });
        }

        //update gameItems table
        try {
            for (let i = 0; i < gameItemUrls.length; i++) {
                const insertGameItems = await db.insert(schema.gameItems).values({
                    id: nanoid(),
                    gameId: newGameId,
                    imageUrl: gameItemUrls[i],
                    name: gameItemNames[i],
                    orderIndex: i,
                });
                console.log(insertGameItems);
            }
            console.log("Successfully updated database.");
            return res.status(200).json({ message: "Successfully updated database." });
        } catch (error) {
            console.error("Error updating db: ", error);
        }
    });

    app.get("/api/preMadeGame", async (req, res) => {
        //ERROR HANDLINHG FOR REAL DO IT SOON OML

        const {
            query: { preset: gameId },
        } = req;
        if (!gameId) return res.status(400).send({ message: "No preset query given." }); //EROROR DO IT RIGFHT ADF:KJDSFLKJSFHLKJFSDK:LFS

        try {
            const isPublic = (
                await db
                    .select({ isPublic: schema.games.isPublic })
                    .from(schema.games)
                    .where(eq(schema.games.id, gameId as string))
            )[0].isPublic; //REDO THIS LATER TO BE DONE VIA SOCKET.IO SO THAT PRIVATE GAMES ARE ACC PRIVATE

            const cardDataList: CardDataType[] = await db
                .select({
                    imageUrl: schema.gameItems.imageUrl,
                    name: schema.gameItems.name,
                    orderIndex: schema.gameItems.orderIndex,
                })
                .from(schema.gameItems)
                .where(eq(schema.gameItems.gameId, gameId as string)); //AS STRING?

            if (isPublic) {
                return res.status(200).send(cardDataList);
            } else {
                const cardDataListWithPresignedUrls = await Promise.all(
                    cardDataList.map(async (cardData) => {
                        const command = new GetObjectCommand({
                            Bucket: process.env.AWS_BUCKET_NAME,
                            Key: extractS3KeyFromUrl(cardData.imageUrl),
                        });
                        return {
                            name: cardData.name,
                            imageUrl: await getSignedUrl(s3, command, { expiresIn: 3600 }),
                            orderIndex: cardData.orderIndex,
                        };
                    })
                );
                console.log("OK THE PRESIGNED URLS ARE SENT I THINK");
                return res.status(200).send(cardDataListWithPresignedUrls);
            }
        } catch (error) {
            console.error("Error: ", error);
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

        res.send(gameTitleIdImageList.filter(({ imageUrl }) => imageUrl !== null));
    });

    app.get("/api/getMyGames", async (req, res) => {
        const {
            query: { userId },
        } = req;
        if (!userId) return res.status(400).json({ message: "No user-id given." }); //EROROR DO IT RIGFHT ADF:KJDSFLKJSFHLKJFSDK:LFS
        const gameTitleIdImageList = await db
            .select({
                id: schema.games.id,
                title: schema.games.title,
                imageUrl: schema.gameItems.imageUrl,
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
            .where(eq(schema.games.userId, userId as string));

        res.send(gameTitleIdImageList.filter(({ imageUrl }) => imageUrl !== null));
    });
}
