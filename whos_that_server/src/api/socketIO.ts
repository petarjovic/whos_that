/* eslint-disable @typescript-eslint/no-dynamic-delete */
import { nanoid } from "nanoid";
import type { RoomState, ClientToServerEvents, ServerToClientEvents } from "../config/types.ts";
import type { Server } from "socket.io";
import { roomIdSchema, createRoomParamsSchema } from "../config/zod/zodSchema.ts";
import { logger } from "../config/logger.ts";

const ActiveRoomIdsMap = new Map<string, RoomState>();

const createEmptyRoomState = (): RoomState => ({
    id: "",
    gameId: "",
    numOfChars: 0,
    players: [],
    curTurn: "",
    playAgainReqs: {},
    cardIdsToGuess: {},
    endState: {},
});

/**
 * Sets up Socket.IO event handlers for game functionality
 * @param io - Socket.IO server instance
 */
export function setupSocketEventHandlers(io: Server<ClientToServerEvents, ServerToClientEvents>) {
    /**
     * Gets room state from ActiveRoomIdsMap
     * Emits error to socket if roomId is invalid or not in map
     */
    const getRoomState = (roomId: string, socketId: string): RoomState | undefined => {
        const roomIdValid = roomIdSchema.safeParse(roomId);
        if (!roomIdValid.success) {
            logger.warn(`Warning: socket ${socketId} sent event with invalid roomId ${roomId} .`);
            io.to(socketId).emit("errorMessage", {
                message: "Invalid room id.",
            });
            return undefined;
        }
        const roomState = ActiveRoomIdsMap.get(roomId);
        if (!roomState) {
            logger.warn(`Warning: socket ${socketId} sent event to an inactive roomId ${roomId} .`);
            io.to(socketId).emit("errorMessage", {
                message: `Room ${roomId} is not active.`,
            });
            return undefined;
        }
        return roomState;
    };

    io.on("connection", (socket) => {
        logger.debug(`User connected: ${socket.id}`);

        /**
         * Creates a new game room with specified preset and character count
         */
        socket.on("createRoom", (gameId, numOfChars, ack) => {
            //Validate params from client
            const validateCreateRoomParams = createRoomParamsSchema.safeParse({
                gameId,
                numOfChars,
            });
            if (!validateCreateRoomParams.success) {
                logger.warn(`Socket ${socket.id} tried to create room with invalid parameters.`);
                ack("", { success: false, msg: `Invalid parameters for creating a room.` });
                return;
            }

            //Success, generate room id
            let roomId = nanoid(6);
            while (ActiveRoomIdsMap.has(roomId)) roomId = nanoid(6);
            ActiveRoomIdsMap.set(roomId, {
                ...createEmptyRoomState(),
                id: roomId,
                gameId,
                numOfChars,
            });

            logger.debug(`Player ${socket.id} created room: ${roomId}`);
            return ack(roomId, { success: true, msg: `Created room: ${roomId} successfully.` });
        });

        /**
         * Player joins an existing game room
         */
        socket.on("joinRoom", (roomId) => {
            const roomState = getRoomState(roomId, socket.id);
            if (!roomState) return;

            //Player already in room (do nothing)
            if (Object.values(roomState.players).includes(socket.id)) return;

            //Fail: room is full
            if (roomState.players.length >= 2) {
                io.to(roomId).emit("errorMessage", {
                    message: `Cannot join room ${roomId}: it is full!`,
                });
                return;
            }

            //Sucess: room has space
            roomState.players.push(socket.id);
            roomState.cardIdsToGuess[socket.id] = -1;
            roomState.playAgainReqs[socket.id] = false;
            roomState.endState[socket.id] = null;
            void socket.join(roomId);

            //If there is now two players in the room, randomly set curTurn
            if (roomState.players.length === 2) {
                const randI = Math.floor(Math.random() * 2);
                roomState.curTurn = roomState.players[randI];
            }

            io.to(roomId).emit("updateRoomState", roomState);
        });

        /**
         * Sets player's character choice
         */
        socket.on("chooseCharacter", (roomId, indexNum) => {
            const roomState = getRoomState(roomId, socket.id);
            if (!roomState) return;

            const players = roomState.players;
            const cardIdsToGuess = roomState.cardIdsToGuess;

            //Fail: player not in room, should not be possible
            if (!players.includes(socket.id)) {
                logger.warn(
                    `Error: player ${socket.id} sending chooseCharacter evemt was not found in room: ${roomId} .`
                );
                return;
            }

            //Success
            if (indexNum > 0 && indexNum < roomState.numOfChars) {
                cardIdsToGuess[socket.id] = indexNum;
            } else {
                //Player chose "random"
                cardIdsToGuess[socket.id] = Math.floor(Math.random() * roomState.numOfChars);
            }
            io.to(roomId).emit("updateRoomState", roomState);
        });

        /**
         * Sends other player signal that it is their turn
         */
        socket.on("passTurn", (roomId) => {
            const roomState = getRoomState(roomId, socket.id);
            if (!roomState) return;
            if (!roomState.players.includes(socket.id)) {
                logger.warn(
                    `Warning: socket ${socket.id} sent passTurn event to ${roomId} where it's not a player.`
                );
                return;
            }

            //Get other player's id, update room state, and respond
            const otherPlayer = roomState.players.find((id) => id !== socket.id);
            if (!otherPlayer) {
                logger.warn(
                    `Warning: socket ${socket.id} sent passTurn event to ${roomId} which has no other player.`
                );
                return;
            }

            roomState.curTurn = otherPlayer;
            io.to(roomId).emit("updateTurnOnly", {
                curTurn: otherPlayer,
            });
        });

        /**
         * Recieves guess from player and updates endState accordingly
         */
        socket.on("guess", (roomId, guessCorrectness) => {
            const roomState = getRoomState(roomId, socket.id);
            if (!roomState) return;

            //Fail: player not in room, shouldn't be possible
            if (!roomState.players.includes(socket.id)) {
                logger.warn(
                    `Warning: socket ${socket.id} sent guess event to ${roomId} which it is not a player in.`
                );
                return;
            }
            //Success
            logger.debug(`Guess from ${socket.id} in ${roomId}: ${guessCorrectness.toString()}.`);
            roomState.endState[socket.id] = guessCorrectness;
            io.to(roomId).emit("updateRoomState", roomState);
        });

        /**
         * Handles player disconnection and room cleanup
         * @event disconnecting
         */
        socket.on("disconnecting", () => {
            logger.debug(`Socket disconnected: ${socket.id}`);
            //Loop through rooms this socket is in (should be only 1)
            for (const roomId of socket.rooms) {
                //Skip the socket's own room ID
                if (roomId === socket.id) continue;

                const roomState = ActiveRoomIdsMap.get(roomId);
                if (!roomState) {
                    logger.warn(
                        `Warning: scoket ${socket.id} was somehow in an inactive room ${roomId} .`
                    );
                    continue; //this shouldn't happen
                }

                roomState.players = roomState.players.filter((id) => id !== socket.id);

                //Delete room if no players left
                if (roomState.players.length === 0) {
                    ActiveRoomIdsMap.delete(roomId);
                    logger.debug(`Deleted room: ${roomId}`);
                }
                //Update room if another player is in it
                else {
                    delete roomState.playAgainReqs[socket.id];
                    delete roomState.cardIdsToGuess[socket.id];
                    delete roomState.endState[socket.id];
                    roomState.curTurn = "";

                    logger.debug(`Player ${socket.id} disconnected from ${roomId} .`);
                    socket.to(roomId).emit("opponentDisconnected", roomState);
                }
            }
        });

        /**
         * Handles play again request from a player
         * @event playAgain
         */
        socket.on("playAgain", (roomId) => {
            const roomState = getRoomState(roomId, socket.id);
            if (!roomState) return;

            const players = roomState.players;
            const playAgainReqs = roomState.playAgainReqs;

            //Fail: player not in room, should not be possible
            if (!players.includes(socket.id)) {
                logger.warn(
                    `Warning: socket ${socket.id} sent playAgain event to ${roomId} which it is not a player in.`
                );
                return;
            }

            //Success: if both players request to play again, reset room state
            playAgainReqs[socket.id] = true;
            if (Object.values(playAgainReqs).every(Boolean)) {
                players.forEach((id) => {
                    roomState.cardIdsToGuess[id] = -1;
                    roomState.playAgainReqs[id] = false;
                    roomState.endState[id] = null;
                });
                io.to(roomId).emit("updateRoomState", roomState);
            }
        });
    });
}

export function cleanupSocketRooms(io: Server<ClientToServerEvents, ServerToClientEvents>) {
    logger.info(`Broadcasting shutdown to ${ActiveRoomIdsMap.size.toString()} active rooms.`);

    // Notify all connected clients
    io.emit("errorMessage", {
        message: "Server shutting down for update. We should be back up quickly!",
    });
    ActiveRoomIdsMap.clear(); //why not

    // Disconnect all sockets with a delay to allow message delivery
    return new Promise<void>((resolve) => {
        setTimeout(() => {
            io.disconnectSockets(true);
            resolve();
        }, 1000);
    });
}
