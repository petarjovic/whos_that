import { defineConfig } from "drizzle-kit";
import env from "../zod/zodEnvSchema.ts";

export default defineConfig({
    out: "./drizzle",
    schema: ["schema.ts", "auth-schema.ts"],
    dialect: "postgresql",
    dbCredentials: {
        host: env.AWS_RDS_ENDPOINT,
        port: 5432,
        user: "postgres",
        password: env.AWS_RDS_PASSWORD,
        database: "postgres",
        ssl: "require",
    },
    strict: true,
    verbose: true,
});
