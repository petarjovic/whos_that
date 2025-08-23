import express from "express";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";
import { nanoid } from "nanoid";

const app = express();
app.use(cors());

const PORT = 3001;

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"],
    },
});

type GameIdMapType = {
    [gameId: string]: GameStateType;
};

export type GameStateType = {
    players: [string, string];
    cardIdsToGuess: [number, number];
    playAgainReqs: [boolean, boolean];
};

const games: GameIdMapType = {}; // store active games in memory

io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // Create a new game
    socket.on("createGame", () => {
        let gameId = nanoid(6);
        while (gameId in games) gameId = nanoid(6); //setTimeout??

        //REHANDLE WINNING KEY GENERATOR
        const winningKeyOne = Math.floor(Math.random() * 22);
        const winningKeyTwo = Math.floor(Math.random() * 22);

        games[gameId] = {
            players: ["", ""],
            playAgainReqs: [false, false],
            cardIdsToGuess: [winningKeyOne, winningKeyTwo],
        };

        //socket.join(gameId);
        socket.emit("gameCreated", [gameId, games[gameId]]);
        console.log(`Player ${socket.id} created game: ${gameId}`);
    });

    //join game
    socket.on("joinGame", (gameId: string) => {
        if (
            gameId in games &&
            !(socket.id in games[gameId].players) &&
            games[gameId].players.some((player) => player === "")
        ) {
            const playersTuple = games[gameId].players;
            playersTuple[playersTuple.indexOf("")] = socket.id;
            socket.join(gameId);

            io.to(gameId).emit("playerJoined", games[gameId]);
            console.log(`Player ${socket.id} joined game ${gameId}`);
        } else if (gameId in games) {
            io.to(gameId).emit("playerCannotJoinGame", {
                gameId: gameId,
                serverPlayers: games[gameId].players,
            });
            console.log(`Player ${socket.id} cannot join ${gameId}`);
        } else {
            io.to(gameId).emit("errorMessage", { message: `Game ${gameId} not found` });
        }
    });

    socket.on("guess", (gameData) => {
        const { gameId, guessCorrectly } = gameData;

        console.log(
            `Recieved correctness of guess by player: ${socket.id} in game: ${gameId}, ${guessCorrectly}`
        );

        socket.to(gameId).emit("recieveWinLose", !guessCorrectly);
    });

    socket.on("disconnecting", () => {
        socket.rooms.forEach((room: string) => {
            if (room in games) {
                console.log(room, games[room], socket.id);
                const playerTuple = games[room].players;
                playerTuple[playerTuple.indexOf(socket.id)] = "";
                games[room].playAgainReqs = [false, false];
                //REHANDLE WINNING KEY GENERATOR
                const winningKeyOne = Math.floor(Math.random() * 22);
                const winningKeyTwo = Math.floor(Math.random() * 22);
                games[room].cardIdsToGuess = [winningKeyOne, winningKeyTwo];

                if (!playerTuple.every((p) => p === "")) {
                    console.log(`Player ${socket.id} disconnected from ${room}`);
                    socket.to(room).emit("opponentDisconnted", games[room]);
                } else {
                    console.log("Deleting: ", room, games[room].players, socket.id);
                    delete games[room];
                    console.log("Deleted: ", room);
                }
            }
        });
        console.log("User disconnected: ", socket.id);
    });

    socket.on("playAgain", (gameId: string) => {
        const index = games[gameId].players.indexOf(socket.id);

        if (index !== -1) {
            games[gameId].playAgainReqs[index] = true;
            if (games[gameId].playAgainReqs.every((bool) => bool)) {
                //REHANDLE WINNING KEY GENERATOR
                const winningKeyOne = Math.floor(Math.random() * 22);
                const winningKeyTwo = Math.floor(Math.random() * 22);
                games[gameId].cardIdsToGuess = [winningKeyOne, winningKeyTwo];
                games[gameId].playAgainReqs = [false, false];
                io.to(gameId).emit("playAgainConfirmed", games[gameId]);
            }
        } else {
            io.to(gameId).emit("errorMessage", {
                message: `Player ${socket.id} requesting to play again was not found in game ${gameId} .`,
            });
        }
    });
});

server.listen(PORT, () => {
    console.log(`LISTENING ON PORT: ${PORT}`);
});
