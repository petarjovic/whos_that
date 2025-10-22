import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import * as path from "path";

export default defineConfig({
    plugins: [
        react({
            babel: {
                plugins: ["babel-plugin-react-compiler"],
            },
        }),
        tailwindcss(),
    ],
    resolve: {
        alias: {
            "@server/types": path.resolve(__dirname, "../whos_that_server/src/config/types.ts"),
            "@server/zodSchema": path.resolve(
                __dirname,
                "../whos_that_server/src/config/zod/zodSchema.ts"
            ),
            "@client/assets": path.resolve(__dirname, "./src/assets"),
        },
    },
});

