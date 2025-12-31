import express from "express";
import http from "node:http";
import cors from "cors";
import { Server } from "socket.io";
import { toNodeHandler } from "better-auth/node";
import type { ClientToServerEvents, ServerToClientEvents } from "./config/types.ts";
import { auth } from "./config/auth.ts";
import { cleanupSocketRooms, setupSocketEventHandlers } from "./api/socketIO.ts";
import { setupApiRoutes } from "./api/api.ts";
import env from "./config/zod/zodEnvSchema.ts";
import { setupAdminRoutes } from "./api/apiAdmin.ts";
import { logger } from "./config/logger.ts";

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
    logger.info(`STARTED WHOS-THAT-SERVER. LISTENING ON PORT: ${env.PORT.toString()}.`);
});

let isShuttingDown = false;

const gracefulShutdown = async (signal: string) => {
    if (isShuttingDown) return;
    isShuttingDown = true;

    logger.info(`${signal} received. Starting graceful shutdown...`);

    // Stop accepting new connections
    server.close(() => {
        logger.info("HTTP server closed");
    });

    // Close Socket.IO connections gracefully
    await cleanupSocketRooms(io);
    await io.close(() => {
        logger.info("Socket.IO connections closed");
    });

    // Set 9s timeout for forced shutdown
    const shutdownTimeout = setTimeout(() => {
        logger.error("Forced shutdown after 9 seconds.");
        process.exit(1);
    }, 9000);

    try {
        logger.info("Cleanup completed successfully.");
        clearTimeout(shutdownTimeout);
        process.exit(0);
    } catch (error) {
        logger.error({ error }, "Error during shutdown.");
        clearTimeout(shutdownTimeout);
        process.exit(1);
    }
};

process.on("SIGTERM", () => void gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => void gracefulShutdown("SIGINT"));
