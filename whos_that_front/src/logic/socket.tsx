import { io, Socket } from "socket.io-client";
//see if theres better way of doing this
import type {
    ServerToClientEvents,
    ClientToServerEvents,
} from "../../../whos_that_server/src/config/types.ts";

const ServerURL = "http://localhost:3001";

export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(ServerURL, {
    autoConnect: false,
});
