import { drizzle } from "drizzle-orm/neon-http";
import { S3Client } from "@aws-sdk/client-s3";
import { fromEnv } from "@aws-sdk/credential-providers";
import * as schema from "./db/schema.ts";
import { CloudFrontClient } from "@aws-sdk/client-cloudfront";
import env from "./zod/zodEnvSchema.ts";
import { neon } from "@neondatabase/serverless";

// const pool = new Pool({
//     connectionString: env.AWS_RDS_URL,
//     ssl: {
//         rejectUnauthorized: false, // TODO: improve for production
//     },
//     max: 20,
//     idleTimeoutMillis: 30_000,
//     connectionTimeoutMillis: 2000,
// });

const sql = neon(env.NODE_ENV === "production" ? env.DATABASE_URL : env.DEV_DATABASE_URL);

export const db = drizzle({ client: sql, schema: schema });

export const S3_BUCKET_NAME =
    env.NODE_ENV === "production" ? env.AWS_BUCKET_NAME : env.DEV_AWS_BUCKET_NAME;

export const USE_CLOUDFRONT = env.NODE_ENV === "production";

export const s3 = new S3Client({
    credentials: fromEnv(),
    region: env.AWS_BUCKET_REGION,
});

export const cloudFront = new CloudFrontClient({
    credentials: fromEnv(),
    region: "us-east-1",
});
