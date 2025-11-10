import { nanoid } from "nanoid";
import type { GameStateType, ClientToServerEvents, ServerToClientEvents } from "../config/types.ts";
import type { Server } from "socket.io";
import { roomIdSchema, createRoomParamsSchema } from "../config/zod/zodSchema.ts";

/**
 * Generates two random character indices for players to guess
 * @param max - Maximum number of characters in the game
 * @returns Tuple of two random indices
 */
function winningKeyGenerator(max: number): [number, number] {
    const winningKeyOne = Math.floor(Math.random() * max);
    const winningKeyTwo = Math.floor(Math.random() * max);
    return [winningKeyOne, winningKeyTwo];
}

const ActiveRoomIdsMap = new Map<string, GameStateType>();

const EmptyGameState: GameStateType = {
    players: ["", ""],
    playAgainReqs: [false, false],
    cardIdsToGuess: [-1, -1],
    preset: "",
    numOfChars: 0,
} as const;

/**
 * Sets up Socket.IO event handlers for game functionality
 * @param io - Socket.IO server instance
 */
export function setupSocketEventHandlers(io: Server<ClientToServerEvents, ServerToClientEvents>) {
    // Validates room ID format and emits error if invalid
    const validateRoomId = (roomId: string, socketId: string): boolean => {
        const roomIdValid = roomIdSchema.safeParse(roomId);
        if (roomIdValid.success) return roomIdValid.success;
        else {
            io.to(socketId).emit("errorMessage", {
                message: "Invalid room id.",
            });
            return false;
        }
    };

    io.on("connection", (socket) => {
        console.log("User connected:", socket.id);

        /**
         * Creates a new game room with specified preset and character count
         * @event createGame
         */
        socket.on("createGame", (preset, numOfChars, ack) => {
            const validateCreateRoomParams = createRoomParamsSchema.safeParse({
                preset,
                numOfChars,
            });
            if (validateCreateRoomParams.success) {
                // Generate unique room ID
                let roomId = nanoid(6);
                while (ActiveRoomIdsMap.has(roomId)) roomId = nanoid(6);
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

        /**
         * Joins an existing game room
         * @event joinGame
         */
        socket.on("joinGame", (roomId, ack) => {
            if (validateRoomId(roomId, socket.id)) {
                const gameState = ActiveRoomIdsMap.get(roomId);
                if (gameState) {
                    const players = gameState.players;

                    // Add player to first available slot
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
                        //Error and invalid request handling ↓
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

        /**
         * Broadcasts player's guess result to opponent
         * @event guess
         */
        socket.on("guess", (roomId, guessCorrectness) => {
            if (validateRoomId(roomId, socket.id)) {
                console.log(
                    `Recieved correctness of guess by player: ${
                        socket.id
                    } in game: ${roomId}, ${guessCorrectness.toString()}`
                );

                socket.to(roomId).emit("receiveOppGuess", guessCorrectness);
            }
        });

        /**
         * Handles player disconnection and room cleanup
         * @event disconnecting
         */
        socket.on("disconnecting", () => {
            //For each room this player socket is in (should only be one room)
            for (const roomId of socket.rooms) {
                const gameState = ActiveRoomIdsMap.get(roomId);

                if (gameState) {
                    // Remove player from room and reset game state
                    const players = gameState.players;
                    players[players.indexOf(socket.id)] = "";
                    gameState.playAgainReqs = [false, false];
                    gameState.cardIdsToGuess = winningKeyGenerator(gameState.numOfChars);
                    console.log([players]);
                    // Delete room if empty
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

        /**
         * Handles play again request from a player
         * @event playAgain
         */
        socket.on("playAgain", (roomId) => {
            if (validateRoomId(roomId, socket.id)) {
                const gameState = ActiveRoomIdsMap.get(roomId);

                if (gameState) {
                    const playerIndex = gameState.players.indexOf(socket.id);
                    // Verify player is in the room
                    if (playerIndex !== -1) {
                        gameState.playAgainReqs[playerIndex] = true;
                        // Reset game when both players agree
                        if (gameState.playAgainReqs.every(Boolean)) {
                            gameState.cardIdsToGuess = winningKeyGenerator(gameState.numOfChars);
                            gameState.playAgainReqs = [false, false];
                            io.to(roomId).emit("playAgainConfirmed", gameState);
                        }
                        //Error and invalid request handling ↓
                    } else {
                        const playerNotInRoom = `Player ${socket.id} requesting to play again was not found in game ${roomId} .`;
                        io.to(roomId).emit("errorMessage", {
                            message: playerNotInRoom,
                        });
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
