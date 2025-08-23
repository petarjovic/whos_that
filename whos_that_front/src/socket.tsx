import { io } from "socket.io-client";

const ServerURL = "http://localhost:3001";

export const socket = io(ServerURL, { autoConnect: false });
