import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router";
import { socket } from "./socket.tsx";
import Game from "../pages/GamePage.tsx";
import WaitingRoom from "../pages/WaitingRoomPage.tsx";
import ErrorPage from "../pages/ErrorPage.tsx";
import type { GameStateType } from "../../../whos_that_server/src/config/types.ts";
import type { ServerErrorResponse, EndStateType } from "../lib/types.ts";

const GameStateManager = ({ newGame }: { newGame: boolean }) => {
    const navigate = useNavigate();
    let { joinGameId = "" } = useParams();
    if (joinGameId === "getImageAction") joinGameId = "";
    const [gameId, setGameId] = useState(joinGameId);
    const [searchParams] = useSearchParams();
    const [gameState, setGameState] = useState<GameStateType>({
        players: ["", ""],
        playAgainReqs: [false, false],
        cardIdsToGuess: [-1, -1],
        preset: searchParams.get("preset") ?? "",
    });
    const [endState, setEndState] = useState<EndStateType>("");
    const [error, setError] = useState("");
    const [images, setImages] = useState({});

    useEffect(() => {
        const getImages = async () => {
            if (gameState.preset) {
                try {
                    const response: Response = await fetch(
                        `http://localhost:3001/api/preMadeGame?preset=${gameState.preset}`,
                        {
                            //ERROR PRONE PERHAPS
                            method: "GET",
                        }
                    );

                    if (!response.ok) {
                        const errorData = (await response.json()) as ServerErrorResponse;
                        return { error: errorData.message || "Upload failed" }; //fix this error
                    }

                    const result = (await response.json()) as object;
                    setImages(result);
                } catch (error) {
                    console.error("Upload error:", error);
                    return error; //fix error handling
                }
            }
        };
        void getImages();
    }, [gameState.preset]);

    useEffect(() => {
        socket.connect();

        socket.on("connect_error", (err) => {
            setError(`Could not connect to server, server responded with: ${err.message}`);
        });

        socket.on("recieveOppGuess", (oppGuess) => {
            if (oppGuess) setEndState("oppCorrectGuess");
            else setEndState("oppWrongGuess");
        });

        socket.on("playerJoined", (gameData) => {
            console.log(`Player joined: `, gameData.players);
            setGameState(gameData);
            setEndState("");
        });

        socket.on("playAgainConfirmed", (gameData) => {
            setGameState(gameData);
            setEndState("");
        });

        socket.on("opponentDisconnted", (gameData) => {
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
            socket.emit("createGame", gameState.preset, (newGameId, response) => {
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
        //diff way to handle perchance
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
