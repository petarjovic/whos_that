import express from "express";
import http from "node:http";
import cors from "cors";
import { Server } from "socket.io";
import { toNodeHandler } from "better-auth/node";
import type { ClientToServerEvents, ServerToClientEvents } from "./config/types.ts";
import { auth } from "./config/auth.ts";
import { setupSocketEventHandlers } from "./socketIO.ts";
import { setupApiRoutes } from "./api/api.ts";
import env from "./config/zod/zodEnvSchema.ts";

const app = express();
app.use(
    cors({
        origin: env.NODE_ENV === "production" ? env.PROD_CLIENT_URL : env.DEV_CLIENT_URL,
        credentials: true,
    })
);
app.use(express.json());
app.all("/api/auth/{*any}", toNodeHandler(auth));

const server = http.createServer(app);

const io = new Server<ClientToServerEvents, ServerToClientEvents>(server, {
    cors: {
        origin: env.NODE_ENV === "production" ? env.PROD_CLIENT_URL : env.DEV_CLIENT_URL,
        methods: ["GET", "POST"],
    },
});

setupApiRoutes(app);
setupSocketEventHandlers(io);

server.listen(env.PORT, () => {
    console.log(`LISTENING ON PORT: ${env.PORT.toString()}`);
});
