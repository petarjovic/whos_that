import { nanoid } from "nanoid";
import type { GameStateType, ClientToServerEvents, ServerToClientEvents } from "./config/types";
import type { Server } from "socket.io";
import { roomIdSchema, createRoomParamsSchema } from "./config/zod/zodSchema.ts";
import z from "zod";

function winningKeyGenerator(max: number): [number, number] {
    const winningKeyOne = Math.floor(Math.random() * max);
    const winningKeyTwo = Math.floor(Math.random() * max);
    return [winningKeyOne, winningKeyTwo];
}

const ActiveRoomIdsMap = new Map<string, GameStateType>(); //Active Games

const EmptyGameState: GameStateType = {
    players: ["", ""],
    playAgainReqs: [false, false],
    cardIdsToGuess: [-1, -1],
    preset: "",
    numOfChars: 0,
} as const;

export function setupSocketEventHandlers(io: Server<ClientToServerEvents, ServerToClientEvents>) {
    const validateRoomId = (roomId: string, socketId: string): boolean => {
        const roomIdValid = roomIdSchema.safeParse(roomId);
        if (roomIdValid.success) return roomIdValid.success;
        else {
            io.to(socketId).emit("errorMessage", {
                message: z.prettifyError(roomIdValid.error),
            });
            return false;
        }
    };

    io.on("connection", (socket) => {
        console.log("User connected:", socket.id);

        // Create a new game
        socket.on("createGame", (preset, numOfChars, ack) => {
            const validateCreateRoomParams = createRoomParamsSchema.safeParse({
                preset,
                numOfChars,
            });
            if (validateCreateRoomParams.success) {
                let roomId = nanoid(6);
                while (ActiveRoomIdsMap.has(roomId)) roomId = nanoid(6); //setTimeout??
                ActiveRoomIdsMap.set(roomId, {
                    players: ["", ""],
                    playAgainReqs: [false, false],
                    cardIdsToGuess: winningKeyGenerator(numOfChars),
                    preset,
                    numOfChars,
                });

                ack(roomId, { success: true, msg: `Created room: ${roomId} successfully.` });
                console.log(`Player ${socket.id} created room: ${roomId}`);
            } else {
                ack("", { success: false, msg: `Invalid parameters for creating a room.` });
                console.error(
                    `Socket ${socket.id} request to create a room with invalid parameters.`
                );
            }
        });

        //join game
        socket.on("joinGame", (roomId, ack) => {
            if (validateRoomId(roomId, socket.id)) {
                const gameState = ActiveRoomIdsMap.get(roomId);
                if (gameState) {
                    const players = gameState.players;

                    if (!players.includes(socket.id) && players.includes("")) {
                        players[players.indexOf("")] = socket.id;

                        void socket.join(roomId);
                        socket.to(roomId).emit("playerJoined", gameState);

                        console.log(
                            `Player ${socket.id} joined game ${roomId}. Current game state:`,
                            gameState
                        );
                        ack(gameState, {
                            success: true,
                            msg: `Joined game ${roomId} successfuly.`,
                        });
                    } else if (players.includes(socket.id)) {
                        console.log(`Player ${socket.id} is already in ${roomId}.`);
                        ack(gameState, { success: true, msg: `Already in game: ${roomId}` });
                    } else {
                        console.log(`Game ${roomId} is full!`);
                        ack(gameState, { success: false, msg: `Game ${roomId} is full!` });
                    }
                } else {
                    console.error(`Game ${roomId} not found!`);
                    ack(EmptyGameState, { success: false, msg: `Game ${roomId} not found!` });
                }
            } else {
                console.error(`${socket.id} requested to join an invalid roomId.`);
                ack(EmptyGameState, { success: false, msg: `Invalid roomId provided.` });
            }
        });

        socket.on("guess", (roomId, guessCorrectness) => {
            if (validateRoomId(roomId, socket.id)) {
                console.log(
                    `Recieved correctness of guess by player: ${
                        socket.id
                    } in game: ${roomId}, ${guessCorrectness.toString()}`
                );

                socket.to(roomId).emit("recieveOppGuess", guessCorrectness);
            }
        });

        socket.on("disconnecting", () => {
            for (const roomId of socket.rooms) {
                const gameState = ActiveRoomIdsMap.get(roomId);
                if (gameState) {
                    const players = gameState.players;
                    players[players.indexOf(socket.id)] = "";
                    gameState.playAgainReqs = [false, false];
                    gameState.cardIdsToGuess = winningKeyGenerator(gameState.numOfChars);
                    console.log([players]);
                    if (players.every((p) => p === "")) {
                        ActiveRoomIdsMap.delete(roomId);
                        console.log("Deleted room:", roomId);
                    } else {
                        console.log(`Player ${socket.id} disconnected from ${roomId}.`);
                        socket.to(roomId).emit("opponentDisconnted", gameState);
                    }
                }
            }
            console.log("User disconnected:", socket.id);
        });

        socket.on("playAgain", (roomId) => {
            if (validateRoomId(roomId, socket.id)) {
                const gameState = ActiveRoomIdsMap.get(roomId);
                if (gameState) {
                    const playerIndex = gameState.players.indexOf(socket.id);
                    if (playerIndex === -1) {
                        const playerNotInRoom = `Player ${socket.id} requesting to play again was not found in game ${roomId} .`;
                        io.to(roomId).emit("errorMessage", {
                            message: playerNotInRoom,
                        });
                    } else {
                        gameState.playAgainReqs[playerIndex] = true;
                        if (gameState.playAgainReqs.every(Boolean)) {
                            //Both players agree to play again, reset state
                            gameState.cardIdsToGuess = winningKeyGenerator(gameState.numOfChars);
                            gameState.playAgainReqs = [false, false];
                            io.to(roomId).emit("playAgainConfirmed", gameState);
                        }
                    }
                } else {
                    const roomDoesNotExist = `Player: ${socket.id} sent play again request to room: ${roomId} which does not exist.`;
                    console.error(roomDoesNotExist);
                    io.to(socket.id).emit("errorMessage", {
                        message: roomDoesNotExist,
                    });
                }
            }
        });
    });
}
