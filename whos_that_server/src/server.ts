import express from "express";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";
import type { ClientToServerEvents, ServerToClientEvents } from "./config/types.ts";
const PORT = process.env.PORT ?? 3001;

export const app = express();

app.use(
    cors({
        origin: "*",
    })
);

const server = http.createServer(app);

export const io = new Server<ClientToServerEvents, ServerToClientEvents>(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"],
    },
});

server.listen(PORT, () => {
    console.log(`LISTENING ON PORT: ${PORT}`);
});
