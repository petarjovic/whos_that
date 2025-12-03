import express from "express";
import http from "node:http";
import cors from "cors";
import { Server } from "socket.io";
import { toNodeHandler } from "better-auth/node";
import type { ClientToServerEvents, ServerToClientEvents } from "./config/types.ts";
import { auth } from "./config/auth.ts";
import { setupSocketEventHandlers } from "./api/socketIO.ts";
import { setupApiRoutes } from "./api/api.ts";
import env from "./config/zod/zodEnvSchema.ts";
import { setupAdminRoutes } from "./api/apiAdmin.ts";

//Set up express app + CORs
const app = express();
app.use(
    cors({
        origin: env.NODE_ENV === "production" ? env.PROD_CLIENT_URL : env.DEV_CLIENT_URL,
        credentials: true,
    })
);
app.use(express.json());

//BetterAuth auth routing
app.all("/api/auth/{*any}", toNodeHandler(auth));

//Http server
const server = http.createServer(app);

//Set up SocketIO + CORs for SocketIO
const io = new Server<ClientToServerEvents, ServerToClientEvents>(server, {
    cors: {
        origin: env.NODE_ENV === "production" ? env.PROD_CLIENT_URL : env.DEV_CLIENT_URL,
        methods: ["GET", "POST"],
    },
    pingTimeout: 60000,
});

//Set up all api routes and event handlers
setupApiRoutes(app);
setupSocketEventHandlers(io);
setupAdminRoutes(app);

//Start server
server.listen(env.PORT, () => {
    console.log(`WHOS-THAT-SERVER LISTENING ON PORT: ${env.PORT.toString()}`);
});
