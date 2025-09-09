import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { socket } from "./socket.tsx";
import Game from "../game/Game.tsx";
import WaitingRoom from "../pages/WaitingRoomPage.tsx";
import ErrorPage from "../pages/ErrorPage.tsx";
import type { GameStateType } from "../../../whos_that_server/src/config/types.ts";
import type { ServerErrorResponse } from "./Actions.tsx";

export type winLoseFlagType = boolean | null;
export type EndStateType = "" | "correctGuess" | "wrongGuess" | "oppCorrectGuess" | "oppWrongGuess";

const GameStateManager = ({ newGame }: { newGame: boolean }) => {
    const navigate = useNavigate();
    let { joinGameId = "" } = useParams();
    if (joinGameId === "getImageAction") joinGameId = "";
    const [gameId, setGameId] = useState(joinGameId);
    const [gameState, setGameState] = useState<GameStateType>({
        players: ["", ""],
        playAgainReqs: [false, false],
        cardIdsToGuess: [-1, -1],
    });
    const [endState, setEndState] = useState<EndStateType>("");
    const [error, setError] = useState("");
    const [images, setImages] = useState({});

    useEffect(() => {
        const getImages = async () => {
            try {
                const response: Response = await fetch("http://localhost:3001/api/preMadeGame", {
                    method: "GET",
                });

                if (!response.ok) {
                    const errorData = (await response.json()) as ServerErrorResponse;
                    return { error: errorData.message || "Upload failed" };
                }

                const result = (await response.json()) as object;
                setImages(result);
            } catch (error) {
                console.error("Upload error:", error);
                return error;
            }
        };
        void getImages();
    }, []);

    useEffect(() => {
        socket.connect();

        socket.on("connect_error", (err) => {
            setError(`Could not connect to server, server responded with: ${err.message}`);
        });

        socket.on("recieveOppGuess", (oppGuess) => {
            if (oppGuess) setEndState("oppCorrectGuess");
            else setEndState("oppWrongGuess");
        });

        socket.on("playerJoined", (gameData: GameStateType) => {
            console.log(`Player joined: `, gameData.players);
            setGameState(gameData);
            setEndState("");
        });

        socket.on("playAgainConfirmed", (gameData: GameStateType) => {
            setGameState(gameData);
            setEndState("");
        });

        socket.on("opponentDisconnted", (gameData: GameStateType) => {
            console.log("Opponent Disconnected");
            setGameState(gameData);
            setEndState("");
        });

        //do this correctly later
        socket.on("errorMessage", ({ message }) => {
            console.error(`Error: ${message}`);
            setError(message);
        });

        return () => {
            socket.off("connect_error");
            socket.off("recieveOppGuess");
            socket.off("playerJoined");
            socket.off("playAgainConfirmed");
            socket.off("errorMessage");
            socket.off("opponentDisconnted");
            socket.disconnect();
        };
    }, []);

    //Handle creating a new game
    useEffect(() => {
        if (newGame) {
            socket.emit("createGame", (newGameId, response) => {
                if (response.success) {
                    console.log(response.msg);
                    setGameId(newGameId);
                    void navigate(`/play-game/${newGameId}`);
                } else {
                    setError(response.msg);
                }
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [newGame]);

    //Handle joining an existing game
    useEffect(() => {
        if (!newGame) {
            socket.emit("joinGame", gameId, (gameData, response) => {
                setGameState(gameData);
                if (!response.success) {
                    void navigate("/"); //flesh this out, pop-up upon returning to home page?
                }
                console.log(response.msg);
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [gameId, newGame]);

    const emitGuess = (guessCorrectly: boolean) => {
        socket.emit("guess", gameId, guessCorrectly);
        console.log(
            `Player %s emited guess: ${guessCorrectly.toString()} in game ${gameId}`,
            socket.id
        );
        if (guessCorrectly) {
            setEndState("correctGuess");
        } else {
            setEndState("wrongGuess");
        }
    };

    const emitPlayAgain = () => {
        socket.emit("playAgain", gameId);
        console.log(`Player %s requested to play again in room ${gameId}`, socket.id);
    };

    console.log(images);

    if (error) return <ErrorPage error={error} />;
    else if (gameState.players.includes("") || !Object.keys(images).length)
        return <WaitingRoom gameId={gameId} />;
    else
        return (
            <Game
                emitPlayAgain={emitPlayAgain}
                emitGuess={emitGuess}
                endState={endState}
                oppWinningKey={gameState.cardIdsToGuess[gameState.players.indexOf(socket.id ?? "")]} //handle this fallback different
                winningKey={
                    gameState.cardIdsToGuess[1 - gameState.players.indexOf(socket.id ?? "")] //handle this fallback different
                }
                images={images}
            />
        );
};

export default GameStateManager;
