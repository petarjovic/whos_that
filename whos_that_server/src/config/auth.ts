import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { username, admin } from "better-auth/plugins";
import { db } from "./connections.ts";
import { createAuthMiddleware } from "better-auth/api";
import * as authSchema from "../db/auth-schema.ts";
import * as appSchema from "../db/schema.ts";
import env from "./zod/zodEnvSchema.ts";
import { logger } from "./logger.ts";

//Composite schema file representing whole db
const schema = {
    ...authSchema,
    ...appSchema,
};

//BetterAuth configuration
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
    },
    account: {
        accountLinking: {
            allowDifferentEmails: false,
        },
    },
    session: {
        cookieCache: {
            enabled: true,
            maxAge: 5 * 60, //seconds
        },
    },
    trustedOrigins: [env.NODE_ENV === "production" ? env.PROD_CLIENT_URL : env.DEV_CLIENT_URL],
    socialProviders: {
        discord: {
            clientId:
                env.NODE_ENV === "production" ? env.DISCORD_CLIENT_ID : env.DEV_DISCORD_CLIENT_ID,
            clientSecret:
                env.NODE_ENV === "production"
                    ? env.DISCORD_CLIENT_SECRET
                    : env.DEV_DISCORD_CLIENT_SECRET,
            scope: ["identify"],
        },
        google: {
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET,
        },
    },
    plugins: [
        username({
            maxUsernameLength: 20,
        }),
        admin(),
    ],
    hooks: {
        // eslint-disable-next-line @typescript-eslint/require-await
        after: createAuthMiddleware(async (ctx) => {
            if (ctx.path.startsWith("/sign-up")) {
                const newSession = ctx.context.newSession;
                if (newSession) {
                    logger.info(
                        {
                            userId: newSession.user.id,
                        },
                        "New user signed up."
                    );
                }
            }
        }),
    },

    baseURL: env.NODE_ENV === "production" ? env.PROD_BETTER_AUTH_URL : env.DEV_BETTER_AUTH_URL,
});
