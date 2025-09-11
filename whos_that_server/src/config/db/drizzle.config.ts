import { defineConfig } from "drizzle-kit";
export default defineConfig({
    out: "./drizzle",
    schema: ["schema.ts", "auth-schema.ts"],
    dialect: "postgresql",
    dbCredentials: {
        host: "whos-that-db.cj4ok4k808ak.ca-central-1.rds.amazonaws.com",
        port: 5432,
        user: "postgres",
        password: "s0TOj2UG380T60xlsU7t",
        database: "postgres",
        ssl: "require",
    },
    strict: true,
    verbose: true,
});
