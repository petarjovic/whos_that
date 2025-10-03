import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router";
import { socket } from "./socket.tsx";
import Game from "../pages/GamePage.tsx";
import WaitingRoom from "../pages/WaitingRoomPage.tsx";
import ErrorPage from "../pages/ErrorPage.tsx";
import type {
    GameStateType,
    GameDataType,
    CardDataUrlType,
} from "../../../whos_that_server/src/config/types.ts";
import type { ServerResponse, EndStateType } from "../lib/types.ts";

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
    const [error, setError] = useState("");
    //const [images, setImages] = useState({});
    const [cardData, setCardData] = useState<CardDataUrlType[]>([]);
    useEffect(() => {
        const fetchImages = async () => {
            if (gameState.preset) {
                try {
                    const response: Response = await fetch(
                        `http://localhost:3001/api/gameData?preset=${gameState.preset}`,
                        {
                            //ERROR PRONE PERHAPS
                            method: "GET",
                        }
                    );

                    if (!response.ok) {
                        //fix this error handling
                        const errorData = (await response.json()) as ServerResponse;
                        setError(errorData.message || "Getting images failed.");
                        throw new Error(errorData.message || "Getting images failed.");
                    }

                    const { title, cardData } = (await response.json()) as GameDataType;
                    setTitle(title);
                    setCardData(cardData);
                } catch (error) {
                    console.error("Error:", error);
                    return error; //fix error handling
                }
            }
        };
        void fetchImages();
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
            //MAKE SURE GAME INFORMATION IS UP TO DATE? AVOID RACE CONDITION
            console.log("Player joined:", gameData.players);
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
        if (isNewGame && cardData.length > 0) {
            socket.emit("createGame", gameState.preset, cardData.length, (id, response) => {
                if (response.success) {
                    console.log(response.msg);
                    setGameId(id);
                    void navigate(`/play-game/${id}`);
                } else {
                    setError(response.msg);
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
                console.log(response.msg);
            });
        }
    }, [gameId, isNewGame, navigate]);

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

    if (error) return <ErrorPage error={error} />;
    else if (gameState.players.includes("") || cardData.length === 0)
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
                cardData={cardData}
                title={title}
            />
        );
};

export default GameStateManager;
