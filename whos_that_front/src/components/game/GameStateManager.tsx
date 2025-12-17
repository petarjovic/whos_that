import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router";
import { socket } from "../../lib/socket.ts";
import Game from "./GamePage.tsx";
import WaitingRoom from "../pages/WaitingRoomPage.tsx";
import type { RoomState, CardDataUrlType } from "@server/types";
import { gameDataTypeSchema, userHasLikedSchema } from "@server/zodSchema";
import { serverResponseSchema } from "../../lib/zodSchema.ts";
import env from "../../lib/zodEnvSchema.ts";
import { logError, log } from "../../lib/logger.ts";
import { useBetterAuthSession } from "../../lib/hooks.ts";
import CharacterPicker from "./CharacterPicker.tsx";

/**
 * Manages game state and Socket.IO connection lifecycle
 * Handles both creating new games and joining existing ones
 */
const GameStateManager = ({ isNewGame }: { isNewGame: boolean }) => {
    const nav = useNavigate();
    const { joinRoomId = "" } = useParams();
    const [title, setTitle] = useState("");
    const [searchParams] = useSearchParams();
    // Initialize with preset from URL query param if present
    const [roomState, setRoomState] = useState<RoomState>({
        id: joinRoomId,
        players: ["", ""],
        playAgainReqs: [false, false],
        cardIdsToGuess: [-1, -1],
        preset: searchParams.get("preset") ?? "",
        numOfChars: 0,
        endState: [null, null],
    });
    const [errorMsg, setErrorMsg] = useState("");
    const [cardData, setCardData] = useState<CardDataUrlType[]>([]);
    const [playerHasLiked, setPlayerHasLiked] = useState<boolean | null>(null); //has user liked this preset

    const { session, isPending } = useBetterAuthSession();

    // Fetch game data (images and metadata) when preset id is available
    useEffect(() => {
        const fetchImages = async () => {
            if (roomState.preset) {
                try {
                    const response: Response = await fetch(
                        `${env.VITE_SERVER_URL}/api/gameData/${roomState.preset}`,
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
    }, [roomState.preset]);

    //If player is logged in check if they've liked the game
    useEffect(() => {
        const fetchLikeInfo = async () => {
            if (session && !isPending && roomState.preset) {
                try {
                    const response: Response = await fetch(
                        `${env.VITE_SERVER_URL}/api/userHasLiked/${roomState.preset}`,
                        { method: "GET", credentials: "include" }
                    );

                    if (!response.ok) {
                        const errorData = serverResponseSchema.parse(await response.json());
                        throw new Error(errorData.message || "Getting like data failed.");
                    } else {
                        const { userHasLiked } = userHasLikedSchema.parse(await response.json());
                        setPlayerHasLiked(userHasLiked);
                    }
                } catch (error) {
                    logError(error);
                    setErrorMsg(
                        error instanceof Error ? error.message : "Getting like data failed."
                    );
                }
            }
        };
        void fetchLikeInfo();
    }, [session, isPending, roomState.preset]);

    // Set up Socket.IO connection and event listeners
    useEffect(() => {
        //connect and connect error handler
        socket.connect();
        socket.on("connect_error", (err) => {
            logError(err);
            setErrorMsg("Error connecting websocket to server.");
        });

        //this event synchronizes data with the server
        socket.on("updateRoomState", (newGameState) => {
            log(`Received new game state: ${JSON.stringify(newGameState)}`);
            setRoomState(newGameState);
        });

        //event on oppontent disconnection
        socket.on("opponentDisconnected", (newGameState) => {
            log("Opponent Disconnected");
            setRoomState(newGameState);
        });

        //error event
        socket.on("errorMessage", ({ message }) => {
            logError(message);
            setErrorMsg(message);
        });

        // Cleanup: remove listeners and disconnect on unmount
        return () => {
            socket.off("connect_error");
            socket.off("errorMessage");
            socket.off("updateRoomState");
            socket.off("opponentDisconnected");
            socket.disconnect();
        };
    }, []);

    // Create new room once card data is loaded
    useEffect(() => {
        if (isNewGame && cardData.length > 0) {
            socket.emit("createRoom", roomState.preset, cardData.length, (id, response) => {
                if (response.success) {
                    log(response.msg);
                    setRoomState((prev) => ({ ...prev, id: id }));
                    void nav(`/play-game/${id}`, { replace: true });
                } else {
                    setErrorMsg(response.msg);
                }
            });
        }
    }, [isNewGame, cardData.length, nav, roomState.preset]);

    // Join existing game using room ID from URL
    useEffect(() => {
        if (!isNewGame) {
            socket.emit("joinRoom", roomState.id, (joinedRoomState, response) => {
                if (!response.success) {
                    void nav("/"); //flesh this out, pop-up upon returning to home page?
                }
                setRoomState(joinedRoomState);
                log(response.msg);
            });
        }
    }, [roomState.id, isNewGame, nav]);

    /**
     * Determines which player slot this client occupies (0 or 1)
     * Returns -1 if socket not connected or player not in game
     */
    const getPlayerIndex = (): number => {
        if (!socket.id) return -1;
        const index = roomState.players.indexOf(socket.id);
        return index;
    };

    if (errorMsg) throw new Error(errorMsg);
    // Show waiting room until both players connected and data loaded
    else if (roomState.players.includes("") || cardData.length === 0)
        return <WaitingRoom gameId={roomState.id} cardData={cardData} />;
    //Show character picker until both players have selected a character
    else if (roomState.cardIdsToGuess.includes(-1))
        return <CharacterPicker roomId={roomState.id} cardData={cardData} />;
    else {
        const playerIndex = getPlayerIndex();
        if (playerIndex === -1) {
            throw new Error("Socket not connected or this player is somehow not in room.");
        }
        // Pass opponent's target as oppWinningKey, player's own target as winningKey
        return (
            <Game
                roomState={roomState}
                playerIndex={playerIndex}
                cardData={cardData}
                title={title}
                playerHasLiked={playerHasLiked}
            />
        );
    }
};

export default GameStateManager;
