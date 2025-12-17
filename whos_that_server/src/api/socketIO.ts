import { nanoid } from "nanoid";
import type { RoomState, ClientToServerEvents, ServerToClientEvents } from "../config/types.ts";
import type { Server } from "socket.io";
import { roomIdSchema, createRoomParamsSchema } from "../config/zod/zodSchema.ts";

const ActiveRoomIdsMap = new Map<string, RoomState>();

const createEmptyGameState = (): RoomState => ({
    id: "",
    players: ["", ""],
    playAgainReqs: [false, false],
    cardIdsToGuess: [-1, -1],
    preset: "",
    numOfChars: 0,
    endState: [null, null],
});

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
         */
        socket.on("createRoom", (preset, numOfChars, ack) => {
            //parse params
            const validateCreateRoomParams = createRoomParamsSchema.safeParse({
                preset,
                numOfChars,
            });
            if (validateCreateRoomParams.success) {
                // Generate unique room ID + set initial room state
                let roomId = nanoid(6);
                while (ActiveRoomIdsMap.has(roomId)) roomId = nanoid(6);
                ActiveRoomIdsMap.set(roomId, {
                    ...createEmptyGameState(),
                    id: roomId,
                    preset,
                    numOfChars,
                });

                ack(roomId, { success: true, msg: `Created room: ${roomId} successfully.` });
                console.log(`Player ${socket.id} created room: ${roomId}`);
                //Error and invalid request handling ↓
            } else {
                ack("", { success: false, msg: `Invalid parameters for creating a room.` });
                console.error(
                    `Socket ${socket.id} request to create a room with invalid parameters.`
                );
            }
        });

        /**
         * Joins an existing game room
         */
        socket.on("joinRoom", (roomId, ack) => {
            if (validateRoomId(roomId, socket.id)) {
                const gameState = ActiveRoomIdsMap.get(roomId);
                if (gameState) {
                    const players = gameState.players;

                    // Add player to first available slot
                    if (!players.includes(socket.id) && players.includes("")) {
                        players[players.indexOf("")] = socket.id;

                        void socket.join(roomId);
                        socket.to(roomId).emit("updateRoomState", gameState);

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
                    ack(createEmptyGameState(), {
                        success: false,
                        msg: `Game ${roomId} not found!`,
                    });
                }
            } else {
                console.error(`${socket.id} requested to join an invalid roomId.`);
                ack(createEmptyGameState(), { success: false, msg: `Invalid roomId provided.` });
            }
        });

        /**
         * Sets player's character choice
         */
        socket.on("chooseCharacter", (roomId, indexNum) => {
            //validate room exists
            if (validateRoomId(roomId, socket.id)) {
                const gameState = ActiveRoomIdsMap.get(roomId);

                if (gameState) {
                    const playerIndex = gameState.players.indexOf(socket.id);
                    //validate socket is part of room
                    if (playerIndex !== -1) {
                        console.log(
                            `Recieved character choice of player: ${socket.id} in game: ${roomId}`
                        );
                        if (indexNum > 0 && indexNum < gameState.numOfChars) {
                            gameState.cardIdsToGuess[playerIndex] = indexNum;
                        } else {
                            gameState.cardIdsToGuess[playerIndex] = Math.floor(
                                Math.random() * gameState.numOfChars
                            );
                        }
                        io.to(roomId).emit("updateRoomState", gameState);
                        //Error and invalid request handling ↓
                    } else {
                        const playerNotInRoom = `Player ${socket.id} choosing character was not found in game ${roomId} .`;
                        console.warn(playerNotInRoom);
                        io.to(roomId).emit("errorMessage", {
                            message: playerNotInRoom,
                        });
                    }
                } else {
                    const roomDoesNotExist = `Player: ${socket.id} sent character choice to room: ${roomId} which does not exist.`;
                    console.warn(roomDoesNotExist);
                }
            }
        });

        /**
         * Broadcasts player's guess result (i.e. is it correct) to opponent
         */
        socket.on("guess", (roomId, guessCorrectness) => {
            //validate room exists
            if (validateRoomId(roomId, socket.id)) {
                const gameState = ActiveRoomIdsMap.get(roomId);

                if (gameState) {
                    const playerIndex = gameState.players.indexOf(socket.id);
                    //validate socket is part of room
                    if (playerIndex !== -1) {
                        console.log(
                            `Recieved correctness of guess by player: ${socket.id} in game: ${roomId}, ${guessCorrectness.toString()}`
                        );
                        gameState.endState[playerIndex] = guessCorrectness;
                        io.to(roomId).emit("updateRoomState", gameState);
                        //Error and invalid request handling ↓
                    } else {
                        const playerNotInRoom = `Player ${socket.id} making guess was not found in game ${roomId} .`;
                        console.warn(playerNotInRoom);
                        io.to(roomId).emit("errorMessage", {
                            message: playerNotInRoom,
                        });
                    }
                } else {
                    const roomDoesNotExist = `Player: ${socket.id} sent guess to room: ${roomId} which does not exist.`;
                    console.warn(roomDoesNotExist);
                }
            }
        });

        /**
         * Handles player disconnection and room cleanup
         * @event disconnecting
         */
        socket.on("disconnecting", () => {
            //For each room this player socket is in (usually only one room)
            for (const roomId of socket.rooms) {
                const gameState = ActiveRoomIdsMap.get(roomId);

                if (gameState) {
                    // Remove player from room and reset game state
                    const players = gameState.players;
                    players[players.indexOf(socket.id)] = "";
                    gameState.playAgainReqs = [false, false];
                    gameState.endState = [null, null];
                    gameState.cardIdsToGuess = [-1, -1];
                    console.log([players]);
                    // Delete room if empty
                    if (players.every((p) => p === "")) {
                        ActiveRoomIdsMap.delete(roomId);
                        console.log("Deleted room:", roomId);
                    } else {
                        console.log(`Player ${socket.id} disconnected from ${roomId}.`);
                        socket.to(roomId).emit("opponentDisconnected", gameState);
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
                            gameState.cardIdsToGuess = [-1, -1];
                            gameState.playAgainReqs = [false, false];
                            gameState.endState = [null, null];
                            io.to(roomId).emit("updateRoomState", gameState);
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
