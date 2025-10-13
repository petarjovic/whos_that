import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { S3Client } from "@aws-sdk/client-s3";
import { fromEnv } from "@aws-sdk/credential-providers";
import * as schema from "./db/schema.ts";
import { CloudFrontClient } from "@aws-sdk/client-cloudfront";
import env from "./zod/zodEnvSchema.ts";

const pool = new Pool({
    connectionString: env.AWS_RDS_URL,
    ssl: {
        rejectUnauthorized: false, // TODO: improve for production
    },
    max: 20,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 2000,
});

export const db = drizzle(pool, { schema });

export const s3 = new S3Client({
    credentials: fromEnv(),
    region: env.AWS_BUCKET_REGION,
});

export const cloudFront = new CloudFrontClient({
    credentials: fromEnv(),
    region: "us-east-1",
});
