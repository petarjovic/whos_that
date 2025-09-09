import multer from "multer";
import { db, s3 } from "./config/awsConections.ts";
import { app } from "./server.ts";
import { PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import * as schema from "./config/db/schema";

const upload = multer({ storage: multer.memoryStorage() });

app.post("/api/uploadImage", upload.single("image-upload"), async (req, res) => {
    //ERROR HANDLINHG
    console.log(req);

    const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Region: process.env.AWS_BUCKET_REGION,
        Key: req.file?.originalname,
        Body: req.file?.buffer,
        ContentType: req.file?.mimetype,
    };

    const uploadCommand = new PutObjectCommand(params);

    await s3.send(uploadCommand);

    res.send({ success: true, fileId: 1, url: "whatevertf" });
});

app.get("/api/preMadeGame", async (req, res) => {
    //ERROR HANDLINHG
    const imageAndName = await db.select({ assets: schema.games.assets }).from(schema.games);

    const nameAndImage = imageAndName[0]["assets"] as object;
    const nameAndUrl: object = {};

    for await (const [caption, fileName] of Object.entries(nameAndImage)) {
        //REDO TO BE CONCURRENT!!SDFSDJHGLK:!!!!
        const getObjectParams = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: "premadeGames/presidents/" + fileName,
        };
        const command = new GetObjectCommand(getObjectParams);
        const url = await getSignedUrl(s3, command, { expiresIn: 120 });
        nameAndUrl[caption] = url;
    }

    res.send(nameAndUrl);
});
