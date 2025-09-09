import { defineConfig } from "drizzle-kit";
export default defineConfig({
    out: "./drizzle",
    schema: "./db/schema.ts",
    dialect: "postgresql",
    dbCredentials: {
        host: process.env.AWS_RDS_ENDPOINT!,
        port: 5432,
        user: "postgres",
        password: process.env.AWS_RDS_PASSWORD,
        database: "postgres",
        ssl: "require",
    },
    strict: true,
    verbose: true,
});
