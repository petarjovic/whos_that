import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { username } from "better-auth/plugins";
import { db } from "./awsConections.ts"; // your drizzle instance
import * as authSchema from "./db/auth-schema.ts";
import * as appSchema from "./db/schema.ts";
const schema = {
    ...authSchema,
    ...appSchema,
};

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg",
        schema: schema,
    }),
    appName: "whos-that",
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: false,
        minPasswordLength: 8,
        maxPasswordLength: 128,
        passwordStrengthCheck: true,
    },
    session: {
        cookieCache: {
            enabled: true,
            maxAge: 5 * 60, // Cache duration in seconds
        },
    },
    trustedOrigins: ["http://localhost:5173"],
    discord: {
        clientId: process.env.DISCORD_CLIENT_ID as string,
        clientSecret: process.env.DISCORD_CLIENT_SECRET as string,
    },
    plugins: [username()],
});
