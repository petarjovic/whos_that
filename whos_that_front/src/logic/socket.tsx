import { io, Socket } from "socket.io-client";
import type {
    ServerToClientEvents,
    ClientToServerEvents,
} from "../../../whos_that_server/src/config/types.ts";
import env from "../lib/zodEnvSchema.ts";

export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(env.VITE_SERVER_URL, {
    autoConnect: false,
});
