import multer from "multer";
import { db, s3 } from "./config/awsConections.ts";
import type { Express } from "express";
import { PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";
import * as schema from "./config/db/schema.ts";
import { eq, and } from "drizzle-orm";
import type { CardDataType, CreateGameRequest } from "./config/types.ts";
import { nanoid } from "nanoid";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const upload = multer({ storage: multer.memoryStorage() });

//REDO THIS
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
        return url.pathname.slice(1); // Remove leading slash
    }
}

export function setupApiRoutes(app: Express) {
    app.post("/api/createNewGame", upload.array("images", 24), async (req, res) => {
        //ERROR HANDLINHG
        const body = req.body as CreateGameRequest;

        // Request Validation Redo Later
        if (!body.title || typeof body.title !== "string") {
            return res.status(400).json({ message: "Title is required." });
        } else if (!["public", "private"].includes(body.privacy)) {
            return res
                .status(400)
                .json({ message: "Privacy setting must be 'public' or 'private'." });
        } else if (!req.files || !Array.isArray(req.files)) {
            //IDK IF THIS IS THE RIGHT WAY TO HANDLE THIS
            return res.status(400).json({ message: "No files uploaded." });
        } else if (!Array.isArray(body.names)) {
            return res.status(400).json({ message: "No character names." });
        } else if (req.files.length !== body.names.length) {
            return res
                .status(400)
                .json({ message: "Number of files and number of names does not match." });
        }

        const fileUploadPromises = [];

        const gameItemUrls = [];
        const gameItemNames = [];
        let id = "";

        //Create new game entry in database
        try {
            [{ insertedId: id }] = await db //extract and asign to id
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

        if (!id) return res.status(500).json({ error: "Error creating new game entry." }); //Sanity Check

        //Create array of promises for uploading game images to S3 bucket
        for (const file of req.files) {
            const buffer = await sharp(file.buffer)
                .resize({ height: 338 * 2, width: 262 * 2, fit: "cover" })
                .toBuffer();
            const fileExt = file.originalname.split(".").pop() ?? "";
            const key = `premadeGames/${body.privacy}/${id}/` + nanoid(10) + fileExt;
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

        for (const name of body.names) {
            gameItemNames.push(name);
        }

        //Await upload promises
        try {
            const results = await Promise.all(fileUploadPromises);
            console.log(`Successfully uploaded ${results.length.toString()} files`);
        } catch (error) {
            console.error("Error uploading data:", error);
            return res.status(500).json({ message: "Failed to upload one or more files." });
        }

        //update gameItems table
        try {
            for (const [i, gameItemUrl] of gameItemUrls.entries()) {
                const insertGameItems = await db.insert(schema.gameItems).values({
                    id: nanoid(),
                    gameId: id,
                    imageUrl: gameItemUrl,
                    name: gameItemNames[i],
                    orderIndex: i,
                });
                console.log(insertGameItems);
            }
            console.log("Successfully updated database.");
            return res.status(200).json({ message: "Successfully created new game." });
        } catch (error) {
            console.error("Error updating db:", error);
        }
    });

    app.get("/api/preMadeGame", async (req, res) => {
        //ERROR HANDLINHG FOR REAL DO IT SOON OML

        const {
            query: { preset: gameId },
        } = req;
        if (!gameId || typeof gameId !== "string")
            return res.status(400).send({ message: "Preset query is missing or invalid." }); //Maybe handle better?

        try {
            const [{ isPublic }] = await db
                .select({ isPublic: schema.games.isPublic })
                .from(schema.games)
                .where(eq(schema.games.id, gameId)); //REDO THIS LATER TO BE DONE VIA SOCKET.IO SO THAT PRIVATE GAMES ARE ACC PRIVATE

            const cardDataList: CardDataType[] = await db
                .select({
                    imageUrl: schema.gameItems.imageUrl,
                    name: schema.gameItems.name,
                    orderIndex: schema.gameItems.orderIndex,
                })
                .from(schema.gameItems)
                .where(eq(schema.gameItems.gameId, gameId));

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
                return res.status(200).send(cardDataListWithPresignedUrls);
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

        res.send(gameTitleIdImageList.filter(({ imageUrl }) => imageUrl !== null));
    });

    app.get("/api/getMyGames", async (req, res) => {
        const {
            query: { userId },
        } = req;
        if (!userId || typeof userId !== "string")
            return res.status(400).json({ message: "No user-id given." }); //EROROR DO IT RIGFHT ADF:KJDSFLKJSFHLKJFSDK:LFS
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
            .where(eq(schema.games.userId, userId));

        res.send(gameTitleIdImageList.filter(({ imageUrl }) => imageUrl !== null));
    });
}
