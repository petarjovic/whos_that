import { nanoid } from "nanoid";
import type { RoomState, ClientToServerEvents, ServerToClientEvents } from "../config/types.ts";
import type { Server } from "socket.io";
import { roomIdSchema, createRoomParamsSchema } from "../config/zod/zodSchema.ts";

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
    // Validates room ID format and emits error if invalid
    const validateRoomId = (roomId: string, socketId: string): boolean => {
        const roomIdValid = roomIdSchema.safeParse(roomId);
        if (!roomIdValid.success) {
            io.to(socketId).emit("errorMessage", {
                message: "Invalid room id.",
            });
            return false;
        } else return true;
    };

    io.on("connection", (socket) => {
        console.log("User connected:", socket.id);

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
                console.warn(`Socket ${socket.id} tried to create room with invalid parameters.`);
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

            ack(roomId, { success: true, msg: `Created room: ${roomId} successfully.` });
            console.log(`Player ${socket.id} created room: ${roomId}`);
        });

        /**
         * Player joins an existing game room
         */
        socket.on("joinRoom", (roomId, ack) => {
            //Validate room id format
            if (!validateRoomId(roomId, socket.id)) {
                console.error(`${socket.id} requested to join an invalid roomId.`);
                return ack(createEmptyRoomState(), {
                    success: false,
                    msg: `Invalid roomId provided.`,
                });
            }
            //Check room is active
            const roomState = ActiveRoomIdsMap.get(roomId);
            if (!roomState) {
                console.error(`Room ${roomId} not found!`);
                return ack(createEmptyRoomState(), {
                    success: false,
                    msg: `Room ${roomId} not found!`,
                });
            }

            //Player already in room (still success = true)
            if (Object.values(roomState.players).includes(socket.id)) {
                console.log(`Player ${socket.id} is already in ${roomId}.`);
                return ack(roomState, { success: true, msg: `Already in game: ${roomId}` });
            }

            //Fail: room is full
            if (roomState.players.length >= 2) {
                console.log(`Room ${roomId} is full!`);
                return ack(roomState, { success: false, msg: `Room ${roomId} is full!` });
            }

            //Sucess: room has space
            roomState.players.push(socket.id);
            roomState.cardIdsToGuess[socket.id] = -1;
            roomState.playAgainReqs[socket.id] = false;
            roomState.endState[socket.id] = null;
            void socket.join(roomId);

            //If there is now two players in the room, randomly set one to have it be their turn
            if (roomState.players.length === 2) {
                const randI = Math.floor(Math.random() * 2);
                roomState.curTurn = roomState.players[randI];
            }

            socket.to(roomId).emit("updateRoomState", roomState);
            return ack(roomState, {
                //Maybe doesn't need to be ack ?
                success: true,
                msg: `Joined room ${roomId} successfuly.`,
            });
        });

        /**
         * Sets player's character choice
         */
        socket.on("chooseCharacter", (roomId, indexNum) => {
            //Validate room id and that it is active
            if (!validateRoomId(roomId, socket.id)) return;
            const roomState = ActiveRoomIdsMap.get(roomId);
            if (!roomState) {
                return void console.warn(
                    `Player: ${socket.id} sent character choice to room: ${roomId} which is not active`
                );
            }

            const players = roomState.players;
            const cardIdsToGuess = roomState.cardIdsToGuess;

            //Fail: player not in room
            if (!players.includes(socket.id)) {
                const playerNotInRoom = `Player: ${socket.id} choosing character was not found in room: ${roomId} `;
                io.to(roomId).emit("errorMessage", {
                    message: playerNotInRoom,
                });
                return void console.warn(playerNotInRoom);
            }

            //Success
            if (indexNum > 0 && indexNum < roomState.numOfChars) {
                cardIdsToGuess[socket.id] = indexNum;
            } else {
                cardIdsToGuess[socket.id] = Math.floor(Math.random() * roomState.numOfChars);
            }
            io.to(roomId).emit("updateRoomState", roomState);
        });

        /**
         * Sends other player signal that it is their turn
         */
        socket.on("passTurn", (roomId) => {
            //Validate room id, that it is active, and player is in it
            if (!validateRoomId(roomId, socket.id)) return;
            const roomState = ActiveRoomIdsMap.get(roomId);
            if (!roomState) return;
            if (!roomState.players.includes(socket.id)) return;

            //Get other player's id, update room state, and respond
            const otherPlayer = roomState.players.find((id) => id !== socket.id);
            if (!otherPlayer) return;

            roomState.curTurn = otherPlayer;
            socket.to(roomId).emit("updateTurnOnly", {
                curTurn: otherPlayer,
            });
        });

        /**
         * Recieves guess from player and updates endState accordingly
         */
        socket.on("guess", (roomId, guessCorrectness) => {
            //Validate room id and that it is active
            if (!validateRoomId(roomId, socket.id)) return;
            const roomState = ActiveRoomIdsMap.get(roomId);
            if (!roomState) {
                return void console.warn(
                    `Player: ${socket.id} sent guess to room: ${roomId} which does not exist.`
                );
            }

            //Fail: player not in room
            if (!roomState.players.includes(socket.id)) {
                io.to(roomId).emit("errorMessage", { message: "Player not in room." });
                return void console.warn(
                    `Player ${socket.id} making guess was not found in game ${roomId}.`
                );
            }
            //Success
            console.log(`Received guess from ${socket.id} in ${roomId}: ${guessCorrectness}`);
            roomState.endState[socket.id] = guessCorrectness;
            io.to(roomId).emit("updateRoomState", roomState);
        });

        /**
         * Handles player disconnection and room cleanup
         * @event disconnecting
         */
        socket.on("disconnecting", () => {
            //Loop through rooms this socket is in (should be 1)
            for (const roomId of socket.rooms) {
                const roomState = ActiveRoomIdsMap.get(roomId);
                if (!roomState) continue; //this shouldn't happen

                roomState.players = roomState.players.filter((id) => id !== socket.id);

                //Delete room if no players left
                if (roomState.players.length === 0) {
                    ActiveRoomIdsMap.delete(roomId);
                    console.log("Deleted room:", roomId);
                }
                //Update room if another player is in it
                else {
                    delete roomState.playAgainReqs[socket.id];
                    delete roomState.cardIdsToGuess[socket.id];
                    delete roomState.endState[socket.id];
                    roomState.curTurn = "";

                    console.log(`Player ${socket.id} disconnected from ${roomId}.`);
                    socket.to(roomId).emit("opponentDisconnected", roomState);
                }
            }
            console.log("User disconnected:", socket.id);
        });

        /**
         * Handles play again request from a player
         * @event playAgain
         */
        socket.on("playAgain", (roomId) => {
            //Validate room id and that it is active
            if (!validateRoomId(roomId, socket.id)) return;
            const roomState = ActiveRoomIdsMap.get(roomId);
            if (!roomState) {
                const roomDoesNotExist = `Player: ${socket.id} sent play again request to room: ${roomId} which does not exist.`;
                io.to(socket.id).emit("errorMessage", {
                    message: roomDoesNotExist,
                });
                return void console.warn(roomDoesNotExist);
            }

            const players = roomState.players;
            const playAgainReqs = roomState.playAgainReqs;

            //Fail: player not in room
            if (!players.includes(socket.id)) {
                const playerNotInRoom = `Player ${socket.id} requesting to play again was not found in game ${roomId} .`;
                io.to(roomId).emit("errorMessage", {
                    message: playerNotInRoom,
                });
                return void console.warn(playerNotInRoom);
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
