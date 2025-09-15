import multer from "multer";
import { db, s3 } from "./config/awsConections.ts";
import type { Express } from "express";
import { PutObjectCommand, GetObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import sharp from "sharp";
import * as schema from "./config/db/schema.ts";
import { eq } from "drizzle-orm";
import type { CardDataType } from "./config/types.ts";

const upload = multer({ storage: multer.memoryStorage() });

export function setupApiRoutes(app: Express) {
    app.post("/api/uploadImage", upload.single("image-upload"), async (req, res) => {
        //ERROR HANDLINHG
        console.log(req);

        const buffer = await sharp(req.file?.buffer)
            .resize({ height: 338 * 2, width: 262 * 2, fit: "cover" })
            .toBuffer();

        const params = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Region: process.env.AWS_BUCKET_REGION,
            Key: "premadeGames/presidents/" + req.file?.originalname,
            Body: buffer,
            ContentType: req.file?.mimetype,
        };

        const uploadCommand = new PutObjectCommand(params);

        await s3.send(uploadCommand);

        res.send({ success: true, fileId: 1, url: "whatevertf" });
    });

    app.get("/api/preMadeGame", async (req, res) => {
        //ERROR HANDLINHG FOR REAL DO IT SOON OML

        const {
            query: { preset },
        } = req;
        if (!preset) return res.send("ERROR"); //EROROR DO IT RIGFHT ADF:KJDSFLKJSFHLKJFSDK:LFS

        const cardDataList: CardDataType[] = await db
            .select({
                imageUrl: schema.gameItems.imageUrl,
                name: schema.gameItems.name,
                orderIndex: schema.gameItems.orderIndex,
            })
            .from(schema.gameItems)
            .where(eq(schema.gameItems.gameId, preset as string));

        res.send(cardDataList);
    });

    app.get("/api/getAllPremadeGames", async (req, res) => {
        const gameTitlesAndIds = await db
            .select({ id: schema.games.id, title: schema.games.title })
            .from(schema.games)
            .where(eq(schema.games.isPublic, true));

        res.send(gameTitlesAndIds);

        // PROLLY NOT NEEDED
        // var params = {
        //     Bucket: process.env.AWS_BUCKET_NAME,
        //     Prefix: "premadeGames/",
        //     Delimiter: "/",
        // };
        // const command = new ListObjectsV2Command(params);
        // const data = await s3.send(command);

        // const directoryNames =
        //     data.CommonPrefixes?.map((prefix) =>
        //         prefix.Prefix?.substring("premadeGames/".length).replace("/", "")
        //     ) ?? [];
    });
}
