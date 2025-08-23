import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { socket } from "../socket.js";
import Game from "./Game.js";
import WaitingRoom from "./WaitingRoom.js";
import ErrorPage from "../ErrorPage.js";

//see if theres better way of doing this
import type { GameStateType } from "../../../whos_that_server/server.ts";

export type winLoseFlagType = boolean | null;

const GameStateManager = ({ newGame }: { newGame: boolean }) => {
    const navigate = useNavigate();
    const { joinGameId = "" } = useParams();
    const [gameId, setGameId] = useState(joinGameId);
    const [gameState, setGameState] = useState<GameStateType>({
        players: ["", ""],
        playAgainReqs: [false, false],
        cardIdsToGuess: [-1, -1],
    });
    const [winLoseFlag, setwinLoseFlag] = useState<winLoseFlagType>(null);
    const [error, setError] = useState("");

    useEffect(() => {
        if (newGame) {
            socket.emit("createGame");
        }
    }, [newGame]);

    useEffect(() => {
        if (!newGame) {
            socket.emit("joinGame", gameId);
        }
    }, [gameId, newGame]);

    useEffect(() => {
        socket.on("recieveWinLose", (winLose: boolean) => {
            console.log(`Player ${socket.id ?? ""} has ${winLose.toString()}`);
            setwinLoseFlag(winLose);
        });

        socket.on("gameCreated", (gameIdAndData: [string, GameStateType]) => {
            setGameId(gameIdAndData[0]);
            setGameState(gameIdAndData[1]);
            console.log(`Created: ${gameIdAndData[0]}`);
            void navigate(`/play-game/${gameIdAndData[0]}`);
        });

        socket.on("playerJoined", (gameData: GameStateType) => {
            console.log(`Player joined: `, gameData);
            setGameState(gameData);
        });

        socket.on(
            "playerCannotJoinGame",
            ({ gameId, serverPlayers }: { gameId: string; serverPlayers: [string, string] }) => {
                console.log(
                    `Player %s tried joing game ${gameId} but was either already in game or max number of players has been reached. Current players according to server: ${
                        (serverPlayers[0], serverPlayers[1])
                    }`,
                    socket.id
                );
            }
        );

        socket.on("playAgainConfirmed", (gameData: GameStateType) => {
            setGameState(gameData);
            setwinLoseFlag(null);
        });

        socket.on("opponentDisconnted", (gameData: GameStateType) => {
            console.log("Opponent Disconnected");
            setGameState(gameData);
            setwinLoseFlag(null);
        });

        //do this correctly later
        socket.on("errorMessage", ({ message }: { message: string }) => {
            setError(message);
        });

        return () => {
            socket.off("recieveGameData");
            socket.off("gameCreated");
            socket.off("playerJoined");
            socket.off("playerAlreadyInGame");
            socket.off("playAgainConfirmed");
            socket.off("errorMessage");
            socket.off("opponentDisconnted");
        };
    }, [navigate]);

    const emitGuess = (guessCorrectly: boolean) => {
        socket.emit("guess", { gameId: gameId, guessCorrectly: guessCorrectly });
        console.log(
            `Player %s emited guess: ${guessCorrectly.toString()} in game ${gameId}`,
            socket.id
        );
        setwinLoseFlag(guessCorrectly);
    };

    const emitPlayAgain = () => {
        socket.emit("playAgain", gameId);
        console.log(`Player %s requested to play again in room ${gameId}`, socket.id);
    };

    if (error) return <ErrorPage error={error} />;
    else if (gameState.players.some((p) => p === "")) return <WaitingRoom gameId={gameId} />;
    else
        return (
            <Game
                emitPlayAgain={emitPlayAgain}
                emitGuess={emitGuess}
                winLoseFlag={winLoseFlag}
                oppWinningKey={gameState.cardIdsToGuess[gameState.players.indexOf(socket.id ?? "")]} //handle this fallback different
                winningKey={
                    gameState.cardIdsToGuess[1 - gameState.players.indexOf(socket.id ?? "")] //handle this fallback different
                }
            />
        );
};

export default GameStateManager;
