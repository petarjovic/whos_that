import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { username } from "better-auth/plugins";
import { db } from "./awsConections.ts"; // your drizzle instance
import * as authSchema from "./db/auth-schema.ts";
import * as appSchema from "./db/schema.ts";
import env from "./zod/zodEnvSchema.ts";

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
    account: {
        accountLinking: {
            allowDifferentEmails: true,
        },
    },
    session: {
        cookieCache: {
            enabled: true,
            maxAge: 5 * 60, // Cache duration in seconds
        },
    },
    trustedOrigins: ["http://localhost:5173"],
    socialProviders: {
        discord: {
            //TODO: ADD DISCORD AUTHENTICATION
            clientId: env.DISCORD_CLIENT_ID,
            clientSecret: env.DISCORD_CLIENT_SECRET,
        },
    },
    plugins: [
        username({
            maxUsernameLength: 20,
        }),
    ],
    baseURL: env.BETTER_AUTH_URL,
});
