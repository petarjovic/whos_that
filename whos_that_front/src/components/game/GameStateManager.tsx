import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router";
import { socket } from "../../lib/socket.ts";
import Game from "./GamePage.tsx";
import WaitingRoom from "../pages/WaitingRoomPage.tsx";
import type { GameStateType, CardDataUrlType } from "@server/types";
import type { EndStateType } from "../../lib/types.ts";
import { gameDataTypeSchema } from "@server/zodSchema";
import { serverResponseSchema } from "../../lib/zodSchema.ts";
import env from "../../lib/zodEnvSchema.ts";
import { logError, log } from "../../lib/logger.ts";

const GameStateManager = ({ isNewGame }: { isNewGame: boolean }) => {
    const navigate = useNavigate();
    let { joinGameId = "" } = useParams();
    if (joinGameId === "getImageAction") joinGameId = "";
    const [gameId, setGameId] = useState(joinGameId);
    const [title, setTitle] = useState("");
    const [searchParams] = useSearchParams();
    const [gameState, setGameState] = useState<GameStateType>({
        players: ["", ""],
        playAgainReqs: [false, false],
        cardIdsToGuess: [-1, -1],
        preset: searchParams.get("preset") ?? "",
        numOfChars: 0,
    });
    const [endState, setEndState] = useState<EndStateType>("");
    const [errorMsg, setErrorMsg] = useState("");
    const [cardData, setCardData] = useState<CardDataUrlType[]>([]);

    const getPlayerIndex = (): number => {
        if (!socket.id) return -1;
        const index = gameState.players.indexOf(socket.id);
        return index;
    };

    useEffect(() => {
        const fetchImages = async () => {
            if (gameState.preset) {
                try {
                    const response: Response = await fetch(
                        `${env.VITE_SERVER_URL}/api/gameData/${gameState.preset}`,
                        { method: "GET" }
                    );

                    if (!response.ok) {
                        const errorData = serverResponseSchema.parse(await response.json());
                        throw new Error(errorData.message || "Getting images failed.");
                    }

                    const { title, cardData } = gameDataTypeSchema.parse(await response.json());
                    setTitle(title);
                    setCardData(cardData);
                } catch (error) {
                    logError(error);
                    if (error instanceof Error) setErrorMsg(error.message);
                    else setErrorMsg("Getting images failed.");
                }
            }
        };
        void fetchImages();
    }, [gameState.preset]);

    useEffect(() => {
        socket.connect();

        socket.on("connect_error", (err) => {
            logError(err);
            setErrorMsg(`Could not connect to server, server responded with:\n${err.message}`);
        });

        socket.on("receiveOppGuess", (oppGuess) => {
            if (oppGuess) setEndState("oppCorrectGuess");
            else setEndState("oppWrongGuess");
        });

        socket.on("playerJoined", (gameData) => {
            log(`Player joined: ${gameData.players.toString()}`);
            setGameState(gameData);
            setEndState("");
        });

        socket.on("playAgainConfirmed", (gameData) => {
            setGameState(gameData);
            setEndState("");
        });

        socket.on("opponentDisconnted", (gameData) => {
            log("Opponent Disconnected");
            setGameState(gameData);
            setEndState("");
        });

        socket.on("errorMessage", ({ message }) => {
            logError(message);
            setErrorMsg(message);
        });

        return () => {
            socket.off("connect_error");
            socket.off("receiveOppGuess");
            socket.off("playerJoined");
            socket.off("playAgainConfirmed");
            socket.off("errorMessage");
            socket.off("opponentDisconnted");
            socket.disconnect();
        };
    }, []);

    //Handle creating a new game
    useEffect(() => {
        if (isNewGame && cardData.length > 0) {
            socket.emit("createGame", gameState.preset, cardData.length, (id, response) => {
                if (response.success) {
                    log(response.msg);
                    setGameId(id);
                    void navigate(`/play-game/${id}`);
                } else {
                    setErrorMsg(response.msg);
                }
            });
        }
    }, [isNewGame, cardData.length, navigate, gameState.preset]);

    //Handle joining an existing game
    useEffect(() => {
        if (!isNewGame) {
            socket.emit("joinGame", gameId, (gameData, response) => {
                setGameState(gameData);
                if (!response.success) {
                    void navigate("/"); //flesh this out, pop-up upon returning to home page?
                }
                log(response.msg);
            });
        }
    }, [gameId, isNewGame, navigate]);

    const emitGuess = (guessCorrectly: boolean) => {
        socket.emit("guess", gameId, guessCorrectly);
        log(
            `Player ${String(socket.id)} emited guess: ${guessCorrectly.toString()} in game ${gameId}`
        );
        if (guessCorrectly) {
            setEndState("correctGuess");
        } else {
            setEndState("wrongGuess");
        }
    };

    const emitPlayAgain = () => {
        socket.emit("playAgain", gameId);
        log(`Player ${String(socket.id)} requested to play again in room ${gameId}`);
    };

    if (errorMsg) throw new Error(errorMsg);
    else if (gameState.players.includes("") || cardData.length === 0)
        return <WaitingRoom gameId={gameId} />;
    else {
        const playerIndex = getPlayerIndex();
        if (playerIndex === -1) {
            throw new Error("Socket not connected or this player is somehow not in room.");
        }
        return (
            <Game
                emitPlayAgain={emitPlayAgain}
                emitGuess={emitGuess}
                endState={endState}
                oppWinningKey={gameState.cardIdsToGuess[playerIndex]}
                winningKey={gameState.cardIdsToGuess[1 - playerIndex]}
                cardData={cardData}
                title={title}
            />
        );
    }
};

export default GameStateManager;
