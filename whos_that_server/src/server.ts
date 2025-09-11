import express from "express";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";
import { toNodeHandler } from "better-auth/node";
import type { ClientToServerEvents, ServerToClientEvents } from "./config/types.ts";
import { auth } from "./config/auth.ts";
import { setupSocketEventHandlers } from "./socketIO.ts";
import { setupApiRoutes } from "./api.ts";
const PORT = process.env.PORT ?? 3001;

const app = express();

app.all("/api/auth/{*any}", toNodeHandler(auth));

app.use(
    cors({
        origin: "*",
    })
);

const server = http.createServer(app);

const io = new Server<ClientToServerEvents, ServerToClientEvents>(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"],
    },
});

setupSocketEventHandlers(io);
setupApiRoutes(app);

server.listen(PORT, () => {
    console.log(`LISTENING ON PORT: ${PORT}`);
});
