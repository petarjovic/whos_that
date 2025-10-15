import { defineConfig } from "drizzle-kit";
import env from "../zod/zodEnvSchema.ts";

export default defineConfig({
    out: "./drizzle",
    schema: ["schema.ts", "auth-schema.ts"],
    dialect: "postgresql",
    dbCredentials: {
        url: env.DATABASE_URL,
    },
    strict: true,
    verbose: true,
});
