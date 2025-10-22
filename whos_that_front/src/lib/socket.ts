import { io, Socket } from "socket.io-client";
import type { ServerToClientEvents, ClientToServerEvents } from "@server/types";
import env from "./zodEnvSchema.ts";

export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(env.VITE_SERVER_URL, {
    autoConnect: false,
});
