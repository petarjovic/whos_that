import express from "express";
import http from "http";
import cors from "cors";
import multer from "multer";
import { Server } from "socket.io";
import { nanoid } from "nanoid";
import { S3Client } from "@aws-sdk/client-s3";

const storage = multer.diskStorage({
    destination: "uploads/",
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now().toString() + ".jpg";
        cb(null, file.originalname + "-" + uniqueSuffix);
    },
});
const upload = multer({ storage });

const app = express();
app.use(
    cors({
        origin: "*",
    })
);

const PORT = process.env.PORT ?? 3001;

type ResponseType = {
    success: boolean;
    msg: string;
};

type GameIdMapType = {
    [gameId: string]: GameStateType;
};

export type GameStateType = {
    players: [string, string];
    cardIdsToGuess: [number, number];
    playAgainReqs: [boolean, boolean];
};

export interface ServerToClientEvents {
    //gameCreated: (data: [string, GameStateType]) => void;
    playerJoined: (gameState: GameStateType) => void;
    // playerCannotJoinGame: (data: { gameId: string; serverPlayers: [string, string] }) => void;
    recieveOppGuess: (winLose: boolean) => void;
    opponentDisconnted: (gameState: GameStateType) => void;
    playAgainConfirmed: (gameState: GameStateType) => void;
    errorMessage: (error: { message: string }) => void;
}

export interface ClientToServerEvents {
    createGame: (ack: (gameId: string, response: ResponseType) => void) => void;
    joinGame: (
        gameId: string,
        ack: (gameData: GameStateType, response: ResponseType) => void
    ) => void;
    guess: (gameId: string, guessCorrectness: boolean) => void;
    playAgain: (gameId: string) => void;
}

const server = http.createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents>(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"],
    },
});

app.post("/api/uploadImage", upload.single("image-upload"), (req, res) => {
    console.log(req);
    res.send({ sucess: true, fileId: 1, url: "whatevertf" });
});

//redo with server logic redo
function winningKeyGenerator(): [number, number] {
    const winningKeyOne = Math.floor(Math.random() * 22);
    const winningKeyTwo = Math.floor(Math.random() * 22);
    return [winningKeyOne, winningKeyTwo];
}

const games: GameIdMapType = {}; // store active games in memory

io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // Create a new game
    socket.on("createGame", (ack) => {
        let gameId = nanoid(6);
        while (gameId in games) gameId = nanoid(6); //setTimeout??
        games[gameId] = {
            players: ["", ""],
            playAgainReqs: [false, false],
            cardIdsToGuess: winningKeyGenerator(),
        };

        //socket.emit("gameCreated", [gameId, games[gameId]]);
        ack(gameId, { success: true, msg: `Created game ${gameId} successfully.` });
        console.log(`Player ${socket.id} created game: ${gameId}`);
    });

    //join game
    socket.on("joinGame", (gameId, ack) => {
        if (gameId in games) {
            const gameState = games[gameId];
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
            if (room in games) {
                const players = games[room].players;
                players[players.indexOf(socket.id)] = "";
                games[room].playAgainReqs = [false, false];
                games[room].cardIdsToGuess = winningKeyGenerator();

                if (!players.every((p) => p === "")) {
                    console.log(
                        `Player ${socket.id} disconnected from ${room}. Current game state: `,
                        games[room]
                    );
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

    socket.on("playAgain", (gameId) => {
        const index = games[gameId].players.indexOf(socket.id);

        if (index !== -1) {
            games[gameId].playAgainReqs[index] = true;
            if (games[gameId].playAgainReqs.every((bool) => bool)) {
                games[gameId].cardIdsToGuess = winningKeyGenerator();
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
