import { nanoid } from "nanoid";
import type { GameStateType, ClientToServerEvents, ServerToClientEvents } from "./config/types";
import type { Server } from "socket.io";

//redo with server logic redo
function winningKeyGenerator(max: number): [number, number] {
    const winningKeyOne = Math.floor(Math.random() * max);
    const winningKeyTwo = Math.floor(Math.random() * max);
    return [winningKeyOne, winningKeyTwo];
}

const activeRoomIdsMap = new Map<string, GameStateType>(); //Active Games

export function setupSocketEventHandlers(io: Server<ClientToServerEvents, ServerToClientEvents>) {
    io.on("connection", (socket) => {
        console.log("User connected:", socket.id);

        // Create a new game
        socket.on("createGame", (preset, numOfChars, ack) => {
            let gameId = nanoid(6);
            while (gameId in activeRoomIdsMap) gameId = nanoid(6); //setTimeout??
            activeRoomIdsMap.set(gameId, {
                players: ["", ""],
                playAgainReqs: [false, false],
                cardIdsToGuess: winningKeyGenerator(numOfChars),
                preset: preset,
                numOfChars: numOfChars,
            });

            //socket.emit("gameCreated", [gameId, games[gameId]]);
            ack(gameId, { success: true, msg: `Created game ${gameId} successfully.` });
            console.log(`Player ${socket.id} created game: ${gameId}`);
        });

        //join game
        socket.on("joinGame", (gameId, ack) => {
            const gameState = activeRoomIdsMap.get(gameId);
            if (gameState) {
                const players = gameState.players;

                if (!players.includes(socket.id) && players.includes("")) {
                    players[players.indexOf("")] = socket.id;

                    void socket.join(gameId);
                    socket.to(gameId).emit("playerJoined", gameState);

                    console.log(
                        `Player ${socket.id} joined game ${gameId}. Current game state:`,
                        gameState
                    );
                    ack(gameState, { success: true, msg: `Joined game ${gameId} successfuly.` });
                } else if (players.includes(socket.id)) {
                    console.log(`Player ${socket.id} is already in ${gameId}.`);
                    ack(gameState, { success: true, msg: `Already in game: ${gameId}` });
                } else {
                    console.log(`Game ${gameId} is full!`);
                    ack(gameState, { success: false, msg: `Game ${gameId} is full!` });
                }
            } else {
                console.error(`Game ${gameId} not found!`);
                ack(
                    {
                        players: ["", ""],
                        playAgainReqs: [false, false],
                        cardIdsToGuess: [-1, -1],
                        preset: "",
                        numOfChars: 0,
                    },
                    { success: false, msg: `Game ${gameId} not found!` }
                );
            }
        });

        socket.on("guess", (gameId, guessCorrectness) => {
            console.log(
                `Recieved correctness of guess by player: ${
                    socket.id
                } in game: ${gameId}, ${guessCorrectness.toString()}`
            );

            socket.to(gameId).emit("recieveOppGuess", guessCorrectness);
        });

        socket.on("disconnecting", () => {
            for (const roomId of socket.rooms) {
                const gameState = activeRoomIdsMap.get(roomId);
                if (gameState) {
                    const players = gameState.players;
                    players[players.indexOf(socket.id)] = "";
                    gameState.playAgainReqs = [false, false];
                    gameState.cardIdsToGuess = winningKeyGenerator(gameState.numOfChars);
                    console.log([players]);
                    if (players.every((p) => p !== "")) {
                        activeRoomIdsMap.delete(roomId);
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
            const gameState = activeRoomIdsMap.get(roomId);
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
                io.to(roomId).emit("errorMessage", {
                    message: roomDoesNotExist,
                });
            }
        });
    });
}
