import { io, Socket } from "socket.io-client";
import type { ServerToClientEvents, ClientToServerEvents } from "@server/types";
import env from "./zodEnvSchema.ts";
import { log } from "./logger.ts";

export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(env.VITE_SERVER_URL, {
    autoConnect: false,
});

export const getSocketId = (): string => {
    return socket.id ?? "";
};

export const emitGuess = (roomId: string, guessCorrectly: boolean) => {
    socket.emit("guess", roomId, guessCorrectly);
    log(
        `Player ${String(socket.id)} emitted guess: ${guessCorrectly.toString()} in game ${roomId}`
    );
};

export const emitPlayAgain = (roomId: string) => {
    socket.emit("playAgain", roomId);
    log(`Player ${String(socket.id)} requested to play again in room ${roomId}`);
};

export const emitChooseCharacter = (roomId: string, indexNum: number) => {
    socket.emit("chooseCharacter", roomId, indexNum);
    log(`Player ${String(socket.id)} sent character choice to room ${roomId}`);
};

export const emitPassTurn = (roomId: string) => {
    socket.emit("passTurn", roomId);
    log(`Player ${String(socket.id)} passed their turn in ${roomId}`);
};
