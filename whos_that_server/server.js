const express = require("express");
const app = express();
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const { nanoid } = require("nanoid");
app.use(cors());

const PORT = 3001;

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"],
    },
});

const games = {}; // store active games in memory

io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // Create a new game
    socket.on("createGame", () => {
        const gameId = nanoid(6);
        while (gameId in games) gameId = nanoid(6); //setTimeout??

        games[gameId] = { players: [], playAgainRequests: new Set() };

        //socket.join(gameId);
        socket.emit("gameCreated", { gameId });
        console.log(`Player ${socket.id} created game: ${gameId}`);
    });

    //join game
    socket.on("joinGame", (gameId) => {
        if (
            gameId in games &&
            !(socket.id in games[gameId].players) &&
            games[gameId].players.length < 2
        ) {
            games[gameId].players.push(socket.id);
            socket.join(gameId);
            io.to(gameId).emit("playerJoined", {
                gameId: gameId,
                serverPlayers: games[gameId].players,
            });
            console.log(`Player ${socket.id} joined game ${gameId}`);
        } else if (gameId in games) {
            io.to(gameId).emit("playerCannotJoinGame", {
                gameId: gameId,
                serverPlayers: games[gameId].players,
            });
            console.log(`Player ${socket.id} cannot join ${gameId}`);
        } else {
            socket.emit("errorMessage", { message: `Game ${gameId} not found` });
        }
    });

    socket.on("guess", (gameData) => {
        const { gameId, guessCorrectly } = gameData;

        console.log(
            `Recieved correctness of guess by player: ${socket.id} in game: ${gameId}, ${guessCorrectly}`
        );

        socket.to(gameId).emit("recieveGameData", gameData);
    });

    socket.on("disconnecting", () => {
        socket.rooms.forEach((room) => {
            if (room in games) {
                console.log(room, games[room].players, socket.id);
                games[room].players = games[room].players.filter((player) => player !== socket.id);
                if (games[room].players.length !== 0) {
                    console.log(`Player ${socket.id} disconnected from ${room}`);
                    socket.to(room).emit("opponentDisconnted");
                } else {
                    console.log("Deleting: ", room, games[room].players, socket.id);
                    delete games[room];
                    console.log("Deleted: ", room);
                }
            }
        });
        console.log("User disconnected: ", socket.id);
    });

    socket.on("playAgain", (gameId) => {
        games[gameId].playAgainRequests.add(socket.id);
        console.log(`${socket.id} requested to play agin`);
        if (games[gameId].playAgainRequests.size >= 2) {
            games[gameId].playAgainRequests.clear();
            io.to(gameId).emit("playAgainConfirmed");
        }
    });
});

server.listen(PORT, () => {
    console.log(`LISTENING ON PORT: ${PORT}`);
});
