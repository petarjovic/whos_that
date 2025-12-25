import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router";
import { socket } from "../../lib/socket.ts";
import Game from "./GamePage.tsx";
import WaitingRoom from "../pages/WaitingRoomPage.tsx";
import type { RoomState, CardDataUrl } from "@server/types";
import { gameDataSchema } from "@server/zodSchema";
import { serverResponseSchema } from "../../lib/zodSchema.ts";
import env from "../../lib/zodEnvSchema.ts";
import { logError, log } from "../../lib/logger.ts";
import CharacterPicker from "./CharacterPicker.tsx";

/**
 * Manages game state and Socket.IO connection lifecycle
 * Handles both creating new games and joining existing ones
 */
const GameStateManager = ({ isNewGame }: { isNewGame: boolean }) => {
    const nav = useNavigate();
    const { joinRoomId = "" } = useParams();
    const [searchParams] = useSearchParams();
    const [roomState, setRoomState] = useState<RoomState>({
        id: joinRoomId, // Initialize from roomId query param if present
        players: [],
        playAgainReqs: {},
        cardIdsToGuess: {},
        gameId: searchParams.get("preset") ?? "", //initalize from searchparam if present
        numOfChars: 0,
        endState: {},
        curTurn: "",
    });
    const [title, setTitle] = useState("");
    const [cardData, setCardData] = useState<CardDataUrl[]>([]);

    const [errorMsg, setErrorMsg] = useState("");

    // Fetch game data (images and metadata) when preset id is available
    useEffect(() => {
        const fetchImages = async () => {
            if (roomState.gameId) {
                try {
                    const response: Response = await fetch(
                        `${env.VITE_SERVER_URL}/api/gameData/${roomState.gameId}`,
                        { method: "GET" }
                    );

                    if (!response.ok) {
                        const errorData = serverResponseSchema.parse(await response.json());
                        throw new Error(errorData.message || "Getting images failed.");
                    }

                    const { title, cardData } = gameDataSchema.parse(await response.json());
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
    }, [roomState.gameId]);

    // Set up Socket.IO connection and event listeners
    useEffect(() => {
        //connect and connect error handler
        socket.connect();
        socket.on("connect_error", (err) => {
            logError(err);
            setErrorMsg("Error connecting websocket to server.");
        });

        //this event synchronizes game state with the server
        socket.on("updateRoomState", (newGameState) => {
            log(`Received new game state: ${JSON.stringify(newGameState)}`);
            setRoomState(newGameState);
        });

        //this event synchronizes player turns
        socket.on("updateTurnOnly", ({ curTurn }) => {
            setRoomState((prev) => ({ ...prev, curTurn }));
        });

        //event on oppontent disconnection
        socket.on("opponentDisconnected", (newGameState) => {
            log("Opponent Disconnected");
            setRoomState(newGameState);
        });

        //Server error event
        socket.on("errorMessage", ({ message }) => {
            logError(message);
            setErrorMsg(message);
        });

        // Cleanup: remove listeners and disconnect on unmount
        return () => {
            socket.off("connect_error");
            socket.off("errorMessage");
            socket.off("updateTurnOnly");
            socket.off("updateRoomState");
            socket.off("opponentDisconnected");
            socket.disconnect();
        };
    }, []);

    // Create new room once card data is loaded
    useEffect(() => {
        if (isNewGame && cardData.length > 0) {
            socket.emit("createRoom", roomState.gameId, cardData.length, (id, response) => {
                if (response.success) {
                    log(response.msg);
                    setRoomState((prev) => ({ ...prev, id: id }));
                    void nav(`/play-game/${id}`, { replace: true });
                } else {
                    setErrorMsg(response.msg);
                }
            });
        }
    }, [isNewGame, cardData.length, nav, roomState.gameId]);

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

    if (errorMsg) throw new Error(errorMsg);
    //Show waiting room until both players connected and data loaded
    else if (roomState.players.length !== 2 || cardData.length === 0)
        return <WaitingRoom gameId={roomState.id} cardData={cardData} />;
    //Show character picker until both players have selected a character
    else if (Object.values(roomState.cardIdsToGuess).some((index) => index < 0))
        return <CharacterPicker roomId={roomState.id} cardData={cardData} />;
    //Make sure that player socket is in player list (if it's not it might be due to server restart, this is mostly so an error is thrown when a change messes something up in dev)
    else if (socket.id && !roomState.players.includes(socket.id))
        throw new Error("Socket not connected or this player is somehow not in this room.");
    //Show game
    else return <Game roomState={roomState} cardData={cardData} title={title} />;
};

export default GameStateManager;
