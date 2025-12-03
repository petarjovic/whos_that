import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router";
import { socket } from "../../lib/socket.ts";
import Game from "./GamePage.tsx";
import WaitingRoom from "../pages/WaitingRoomPage.tsx";
import type { GameStateType, CardDataUrlType } from "@server/types";
import type { EndStateType } from "../../lib/types.ts";
import { gameDataTypeSchema, userHasLikedSchema } from "@server/zodSchema";
import { serverResponseSchema } from "../../lib/zodSchema.ts";
import env from "../../lib/zodEnvSchema.ts";
import { logError, log } from "../../lib/logger.ts";
import { useBetterAuthSession } from "../../lib/LayoutContextProvider.ts";
import { likeGame } from "../../lib/apiHelpers.ts";

/**
 * Manages game state and Socket.IO connection lifecycle
 * Handles both creating new games and joining existing ones
 */
const GameStateManager = ({ isNewGame }: { isNewGame: boolean }) => {
    const nav = useNavigate();
    const { joinRoomId = "" } = useParams();
    const [roomId, setRoomId] = useState(joinRoomId);
    const [title, setTitle] = useState("");
    const [searchParams] = useSearchParams();
    // Initialize with preset from URL query param if present
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
    const [playerHasLiked, setPlayerHasLiked] = useState<boolean | null>(null);

    const { session, isPending } = useBetterAuthSession();

    //If player is logged in check if they've liked the game
    useEffect(() => {
        const fetchLikeInfo = async () => {
            if (session && !isPending && gameState.preset) {
                try {
                    const response: Response = await fetch(
                        `${env.VITE_SERVER_URL}/api/userHasLiked/${gameState.preset}`,
                        { method: "GET", credentials: "include" }
                    );

                    if (!response.ok) {
                        const errorData = serverResponseSchema.parse(await response.json());
                        throw new Error(errorData.message || "Getting userHasLiked data failed.");
                    } else {
                        const { userHasLiked } = userHasLikedSchema.parse(await response.json());
                        setPlayerHasLiked(userHasLiked);
                    }
                } catch (error) {
                    logError(error);
                    if (error instanceof Error) setErrorMsg(error.message);
                    else setErrorMsg("Getting images failed.");
                }
            }
        };
        void fetchLikeInfo();
    }, [session, isPending, gameState.preset]);

    const handleLikeGame = async () => {
        if (session && !isPending && gameState.preset) {
            try {
                const response: Response = await likeGame(gameState.preset);

                if (!response.ok) {
                    const errorData = serverResponseSchema.parse(await response.json());
                    throw new Error(errorData.message || "Error liking game.");
                } else {
                    setPlayerHasLiked(true);
                }
            } catch (error) {
                logError(error);
                if (error instanceof Error) setErrorMsg(error.message);
                else setErrorMsg("Getting images failed.");
            }
        }
    };

    /**
     * Determines which player slot this client occupies (0 or 1)
     * Returns -1 if socket not connected or player not in game
     */
    const getPlayerIndex = (): number => {
        if (!socket.id) return -1;
        const index = gameState.players.indexOf(socket.id);
        return index;
    };

    // Fetch game data (images and metadata) when preset is available
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

    // Set up Socket.IO connection and event listeners
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

        // Cleanup: remove listeners and disconnect on unmount
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

    // Create new game once card data is loaded
    useEffect(() => {
        if (isNewGame && cardData.length > 0) {
            socket.emit("createGame", gameState.preset, cardData.length, (id, response) => {
                if (response.success) {
                    log(response.msg);
                    setRoomId(id);
                    void nav(`/play-game/${id}`, { replace: true });
                } else {
                    setErrorMsg(response.msg);
                }
            });
        }
    }, [isNewGame, cardData.length, nav, gameState.preset]);

    // Join existing game using room ID from URL
    useEffect(() => {
        if (!isNewGame) {
            socket.emit("joinGame", roomId, (gameData, response) => {
                setGameState(gameData);
                if (!response.success) {
                    void nav("/"); //flesh this out, pop-up upon returning to home page?
                }
                log(response.msg);
            });
        }
    }, [roomId, isNewGame, nav]);

    const emitGuess = (guessCorrectly: boolean) => {
        socket.emit("guess", roomId, guessCorrectly);
        log(
            `Player ${String(socket.id)} emitted guess: ${guessCorrectly.toString()} in game ${roomId}`
        );
        if (guessCorrectly) {
            setEndState("correctGuess");
        } else {
            setEndState("wrongGuess");
        }
    };

    const emitPlayAgain = () => {
        socket.emit("playAgain", roomId);
        log(`Player ${String(socket.id)} requested to play again in room ${roomId}`);
    };

    if (errorMsg) throw new Error(errorMsg);
    // Show waiting room until both players connected and data loaded
    else if (gameState.players.includes("") || cardData.length === 0)
        return <WaitingRoom gameId={roomId} />;
    else {
        const playerIndex = getPlayerIndex();
        if (playerIndex === -1) {
            throw new Error("Socket not connected or this player is somehow not in room.");
        }
        // Pass opponent's target as oppWinningKey, player's own target as winningKey
        return (
            <Game
                emitPlayAgain={emitPlayAgain}
                emitGuess={emitGuess}
                endState={endState}
                oppWinningKey={gameState.cardIdsToGuess[playerIndex]}
                winningKey={gameState.cardIdsToGuess[1 - playerIndex]}
                cardData={cardData}
                title={title}
                playerHasLiked={playerHasLiked}
                handleLikeGame={handleLikeGame}
            />
        );
    }
};

export default GameStateManager;
