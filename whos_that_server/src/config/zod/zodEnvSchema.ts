//Zod validation for environment variables, this is where backend env object is exported from
import { z } from "zod/v4";

const envSchema = z.object({
    PORT: z.coerce.number().min(1000),
    AWS_BUCKET_NAME: z.string(),
    DEV_AWS_BUCKET_NAME: z.string(),
    AWS_BUCKET_REGION: z.string(),
    AWS_ACCESS_KEY_ID: z.string(),
    AWS_SECRET_ACCESS_KEY: z.string(),
    DATABASE_URL: z.url(),
    DEV_DATABASE_URL: z.url(),
    BETTER_AUTH_SECRET: z.string(),
    DEV_BETTER_AUTH_URL: z.url(),
    PROD_BETTER_AUTH_URL: z.url(),
    DISCORD_CLIENT_ID: z.string(),
    DISCORD_CLIENT_SECRET: z.string(),
    DEV_DISCORD_CLIENT_ID: z.string(),
    DEV_DISCORD_CLIENT_SECRET: z.string(),
    GOOGLE_CLIENT_ID: z.string(),
    GOOGLE_CLIENT_SECRET: z.string(),
    AWS_CF_DOMAIN: z.string(),
    AWS_CF_DISTRIBUTION_ID: z.string(),
    AWS_CF_PRIV_KEY: z.string().transform((encoded) => {
        return Buffer.from(encoded, "base64").toString("utf-8");
    }),
    AWS_CF_KEY_PAIR_ID: z.string(),
    NODE_ENV: z.enum(["development", "production"]),
    DEV_CLIENT_URL: z.url(),
    PROD_CLIENT_URL: z.url(),
});

const env = envSchema.parse(process.env);

export default env;
