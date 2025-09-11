import { nanoid } from "nanoid";
import type { GameIdMapType, ClientToServerEvents, ServerToClientEvents } from "./config/types";
import type { Server } from "socket.io";

//redo with server logic redo
function winningKeyGenerator(): [number, number] {
    const winningKeyOne = Math.floor(Math.random() * 22);
    const winningKeyTwo = Math.floor(Math.random() * 22);
    return [winningKeyOne, winningKeyTwo];
}

const gamesIdMap: GameIdMapType = {}; // store active games in memory

export function setupSocketEventHandlers(io: Server<ClientToServerEvents, ServerToClientEvents>) {
    io.on("connection", (socket) => {
        console.log("User connected:", socket.id);

        // Create a new game
        socket.on("createGame", (preset, ack) => {
            let gameId = nanoid(6);
            while (gameId in gamesIdMap) gameId = nanoid(6); //setTimeout??
            gamesIdMap[gameId] = {
                players: ["", ""],
                playAgainReqs: [false, false],
                cardIdsToGuess: winningKeyGenerator(),
                preset: preset,
            };

            //socket.emit("gameCreated", [gameId, games[gameId]]);
            ack(gameId, { success: true, msg: `Created game ${gameId} successfully.` });
            console.log(`Player ${socket.id} created game: ${gameId}`);
        });

        //join game
        socket.on("joinGame", (gameId, ack) => {
            if (gameId in gamesIdMap) {
                const gameState = gamesIdMap[gameId];
                const players = gameState.players;

                if (!players.includes(socket.id) && players.includes("")) {
                    players[players.indexOf("")] = socket.id;

                    socket.join(gameId);
                    socket.to(gameId).emit("playerJoined", gameState);

                    console.log(
                        `Player ${socket.id} joined game ${gameId}. Current game state: `,
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
                    },
                    { success: false, msg: `Game ${gameId} not found!` }
                );
            }
        });

        socket.on("guess", (gameId, guessCorrectness) => {
            console.log(
                `Recieved correctness of guess by player: ${socket.id} in game: ${gameId}, ${guessCorrectness}`
            );

            socket.to(gameId).emit("recieveOppGuess", guessCorrectness);
        });

        socket.on("disconnecting", () => {
            socket.rooms.forEach((room: string) => {
                if (room in gamesIdMap) {
                    const players = gamesIdMap[room].players;
                    players[players.indexOf(socket.id)] = "";
                    gamesIdMap[room].playAgainReqs = [false, false];
                    gamesIdMap[room].cardIdsToGuess = winningKeyGenerator();

                    if (!players.every((p) => p === "")) {
                        console.log(
                            `Player ${socket.id} disconnected from ${room}. Current game state: `,
                            gamesIdMap[room]
                        );
                        socket.to(room).emit("opponentDisconnted", gamesIdMap[room]);
                    } else {
                        console.log("Deleting: ", room, gamesIdMap[room].players, socket.id);
                        delete gamesIdMap[room];
                        console.log("Deleted: ", room);
                    }
                }
            });
            console.log("User disconnected: ", socket.id);
        });

        socket.on("playAgain", (gameId) => {
            const index = gamesIdMap[gameId].players.indexOf(socket.id);

            if (index !== -1) {
                gamesIdMap[gameId].playAgainReqs[index] = true;
                if (gamesIdMap[gameId].playAgainReqs.every((bool) => bool)) {
                    gamesIdMap[gameId].cardIdsToGuess = winningKeyGenerator();
                    gamesIdMap[gameId].playAgainReqs = [false, false];
                    io.to(gameId).emit("playAgainConfirmed", gamesIdMap[gameId]);
                }
            } else {
                io.to(gameId).emit("errorMessage", {
                    message: `Player ${socket.id} requesting to play again was not found in game ${gameId} .`,
                });
            }
        });
    });
}
