import express from "express";
import http from "node:http";
import cors from "cors";
import { Server } from "socket.io";
import { toNodeHandler } from "better-auth/node";
import type { ClientToServerEvents, ServerToClientEvents } from "./config/types.ts";
import { auth } from "./config/auth.ts";
import { setupSocketEventHandlers } from "./socketIO.ts";
import { setupApiRoutes } from "./api.ts";
const PORT = process.env.PORT ?? "3001";

const app = express();
app.use(
    cors({
        origin: "http://localhost:5173",
        credentials: true,
    })
);
app.all("/api/auth/{*any}", toNodeHandler(auth));

const server = http.createServer(app);

const io = new Server<ClientToServerEvents, ServerToClientEvents>(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"],
    },
});

setupApiRoutes(app);
setupSocketEventHandlers(io);

server.listen(PORT, () => {
    console.log(`LISTENING ON PORT: ${PORT}`);
});
