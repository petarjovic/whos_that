import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { socket } from "../socket.jsx";
import Game from "./Game";
import WaitingRoom from "./WaitingRoom";
import ErrorPage from "../ErrorPage";

const GameStateManager = ({ newGame }) => {
    const navigate = useNavigate();
    const { joinGameId } = useParams();
    const [gameId, setGameId] = useState(joinGameId);
    const [restartGame, setRestartGame] = useState(false);
    const [gameState, setGameState] = useState({ winner: null });
    const [players, setPlayers] = useState([]);
    const [error, setError] = useState("");
    const [winningKeys, setWinningKeys] = useState([]);

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
        socket.on("recieveGameData", (gameData) => {
            console.log("TEST");
            console.log(gameData);
            setGameState({ winner: !gameData.guessCorrectly });
        });

        socket.on("gameCreated", ({ gameId }) => {
            setGameId(gameId);
            console.log(`Created: ${gameId}`);
            navigate(`/play-game/${gameId}`);
        });

        socket.on("playerJoined", ({ gameId, serverPlayers, winningKeys }) => {
            console.log(`${gameId} contains players: ${serverPlayers}`);
            setPlayers(serverPlayers);
            setWinningKeys(winningKeys);
        });

        socket.on("playerCannotJoinGame", ({ gameId, serverPlayers }) => {
            console.log(
                `Player ${socket.id} tried joing game ${gameId} but was either already in game or max number of players has been reached. Current players according to server: ${serverPlayers}, current players according to client: ${players}`
            );
        });

        socket.on("playAgainConfirmed", () => {
            setRestartGame(true);
            setGameState({ winner: null });
        });

        socket.on("opponentDisconnted", () => {
            console.log("Opponent Disconnected");
            setPlayers([socket.id]);
            setRestartGame(true);
            setGameState({ winner: null });
            setWinningKeys([]);
        });

        //do this correctly later
        socket.on("errorMessage", ({ message }) => {
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
    }, [players, navigate]);

    const emitGuess = (guessCorrectly) => {
        socket.emit("guess", { gameId: gameId, guessCorrectly: guessCorrectly });
        console.log(`Player ${socket.id} emited guess: ${guessCorrectly} in game ${gameId}`);
        setGameState({ winner: guessCorrectly });
    };

    const emitPlayAgain = () => {
        socket.emit("playAgain", gameId);
        console.log(`Player ${socket.id} requested to play again in room ${gameId}`);
    };

    useEffect(() => {
        if (restartGame) {
            const timer = setTimeout(() => setRestartGame(false), 500);
            return () => clearTimeout(timer);
        }
    }, [restartGame]);

    if (error) return <ErrorPage error={error} />;
    else if (players.length != 2) return <WaitingRoom gameId={gameId} />;
    else
        return (
            <Game
                emitPlayAgain={emitPlayAgain}
                emitGuess={emitGuess}
                gameState={gameState}
                restartGame={restartGame}
                oppWinningKey={winningKeys[1 - players.indexOf(socket.id)]}
                winningKey={winningKeys[players.indexOf(socket.id)]}
            />
        );
};

export default GameStateManager;
