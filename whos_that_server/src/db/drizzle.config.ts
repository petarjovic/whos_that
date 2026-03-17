import { defineConfig } from "drizzle-kit";

export default defineConfig({
    out: "./drizzle",
    schema: ["schema.ts", "auth-schema.ts"],
    dialect: "postgresql",
    dbCredentials: {
        url: "postgresql://neondb_owner:npg_g7B2TGphKctz@ep-mute-bar-adh5n6o5-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
    },
    strict: true,
    verbose: true,
});
