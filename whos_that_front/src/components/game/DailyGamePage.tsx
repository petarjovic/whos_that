import ReactModal from "react-modal";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Card } from "../misc/Cards.tsx";
import type { DailyGame, UserHasLiked } from "@server/types";
import { dailyGameInfoSchema } from "@server/zodSchema";
import { serverResponseSchema } from "../../lib/zodSchema.ts";
import env from "../../lib/zodEnvSchema.ts";
import { log, logError } from "../../lib/logger.ts";
import GameBoard from "./GameBoard.tsx";
import LoadingSpinner from "../misc/LoadingSpinner.tsx";
import ChatPanel, { type ChatMessage } from "./ChatPanel.tsx";
import { ConfirmGuessModal } from "./GamePage.tsx";
import type { ConfirmGuessModalState } from "./GamePage.tsx";
import { fetchLikeInfo, useBetterAuthSession } from "../../lib/hooks.ts";
import { FaHeart } from "react-icons/fa6";
import LikeButton from "../misc/LikeButton.tsx";
import { AiFillQuestionCircle } from "react-icons/ai";
import InGameNavBar from "./InGameNavBar.tsx";

// Stable empty EndState — passed to Card only to satisfy the resetOnNewGame prop.
// The daily has no play-again, so this never changes and card flips never auto-reset.
const DAILY_END_STATE = {};
const MAX_NUM_OF_QUESTIONS = 6;

/**
 * Daily "Wordle-style" game page. Fetches today's scheduled character and game,
 * renders the board with the AI chat panel for asking yes/no questions.
 */
const DailyGamePage = () => {
    const [dailyGameInfo, setDailyGameInfo] = useState<DailyGame>();
    const [numQuestionsLeft, setNumQuestionsLeft] = useState(MAX_NUM_OF_QUESTIONS);
    const [isAsking, setIsAsking] = useState(false);
    const [guessState, setGuessState] = useState<ConfirmGuessModalState>({ isOpen: false });
    const [errorMsg, setErrorMsg] = useState("");

    //initialize chatbox with first message
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            isUser: false,
            msg: "Hello, I'm Whos-That-Bot-300! I'm here to help you guess todays mystery character, I can answer any yes/no question about them, at the cost of 1 question token. Make sure you have enough information about the character to make a guess by the time you run out! ",
        },
    ]);

    const { session, isPending } = useBetterAuthSession();

    //Tracks whether not player has liked this game (changes the prompt user sees on game end)
    const [playerHasLiked, setPlayerHasLiked] = useState<UserHasLiked>(null);
    useEffect(() => {
        const getPlayerLikeInfo = async () => {
            if (session && !isPending && dailyGameInfo?.ogGameId) {
                setPlayerHasLiked(Boolean(await fetchLikeInfo(dailyGameInfo.ogGameId))); //wrap in bool to elegantly handle case where ogGameId has been deleted
            }
        };
        void getPlayerLikeInfo();
    }, [session, isPending, dailyGameInfo?.ogGameId]);

    useEffect(() => {
        const fetchDaily = async () => {
            const dailyRes = await fetch(`${env.VITE_SERVER_URL}/api/daily`);
            if (!dailyRes.ok) {
                const errorData = serverResponseSchema.parse(await dailyRes.json());
                throw new Error(errorData.message || "No daily game scheduled.");
            }

            const dailyGameInfoDb = dailyGameInfoSchema.parse(await dailyRes.json());
            log(dailyGameInfoDb);
            setDailyGameInfo(dailyGameInfoDb);
        };

        fetchDaily().catch((error: unknown) => {
            logError(error);
            setErrorMsg(error instanceof Error ? error.message : "Failed to load daily game.");
        });
    }, []);

    const handleAsk = async (question: string) => {
        if (numQuestionsLeft <= 0) return;

        setIsAsking(true);
        setMessages((prev) => [...prev, { isUser: true, msg: question }]);
        try {
            const res = await fetch(`${env.VITE_SERVER_URL}/api/daily/ask`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ question }),
            });
            const data = (await res.json()) as { answer?: string };
            setMessages((prev) => [
                ...prev,
                { isUser: false, msg: data.answer ?? "I don't know." },
            ]);
        } catch (error) {
            logError(error);
            setMessages((prev) => [...prev, { isUser: false, msg: "Error reaching the server." }]);
        } finally {
            setNumQuestionsLeft((prev) => prev - 1);
            setIsAsking(false);
        }
    };

    const handleConfirmGuess = (confirmed: boolean) => {
        if (confirmed && guessState.isOpen) {
            // Collapse isOpen but preserve isWinner to drive the game-end modal
            setGuessState((prev) => ({ ...prev, isOpen: false }));
        } else {
            setGuessState({ isOpen: false });
        }
    };

    // Game is over once a guess was confirmed — isOpen is false but isWinner is present
    const gameOver = !guessState.isOpen && "isWinner" in guessState;

    if (errorMsg) throw new Error(errorMsg);
    if (!dailyGameInfo?.cardData.length || dailyGameInfo.winningIndex) return <LoadingSpinner />;
    const cardData = dailyGameInfo.cardData;
    const wIndex = dailyGameInfo.winningIndex;

    const targetCharacterName = cardData.find((card) => card.orderIndex === wIndex)?.name ?? "";

    const cardList = cardData.map(({ imageUrl, name, orderIndex }) => (
        <Card
            key={orderIndex}
            name={name}
            imgSrc={imageUrl}
            winner={orderIndex === wIndex}
            openConfirmModal={(isWinner, name) => setGuessState({ isOpen: true, isWinner, name })}
            resetOnNewGame={DAILY_END_STATE}
            guessingDisabled={gameOver}
        />
    ));

    return (
        <>
            <InGameNavBar title={dailyGameInfo.title} />
            <div className="flex h-full w-full gap-2 px-2">
                <div className="flex flex-col items-center lg:mt-9 lg:w-1/5 lg:min-w-[19.5dvw] ">
                    <div className="mb-3 flex gap-1.5 justify-self-center">
                        {/* Message Tokens */}
                        {Array.from({ length: numQuestionsLeft }, (_, i) => (
                            <div key={i} className="relative">
                                <AiFillQuestionCircle
                                    size="3em"
                                    className="drop-shadow-[0_4px_6px_rgba(0,0,0,0.5)] [filter:drop-shadow(0_4px_6px_rgba(0,0,0,0.5))_drop-shadow(inset_0_2px_4px_rgba(255,255,255,0.3))]"
                                    style={{
                                        color: "#d97706",
                                        filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.5)) drop-shadow(0 -1px 2px rgba(255,200,100,0.6))",
                                    }}
                                />
                                <span
                                    className="absolute inset-0 flex items-center justify-center text-2xl font-black text-slate-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] pointer-events-none"
                                    style={{
                                        textShadow:
                                            "0 1px 3px rgba(0,0,0,0.9), 0 0 8px rgba(200,200,255,0.3)",
                                    }}
                                >
                                    ?
                                </span>
                            </div>
                        ))}
                    </div>
                    <ChatPanel
                        messages={messages}
                        onSend={(q) => {
                            void handleAsk(q);
                        }}
                        isLoading={isAsking}
                        opponentLabel="Whos-That-Bot-3000"
                    />
                </div>
                <div className="h-full min-w-8/10 flex-1 mb-4">
                    <GameBoard cardList={cardList} />
                </div>
            </div>

            <ConfirmGuessModal
                isOpen={guessState.isOpen}
                confirmGuess={handleConfirmGuess}
                name={guessState.isOpen ? guessState.name : ""}
            />

            {/* Game end modal */}
            <GameEndModal
                isOpen={gameOver}
                playerHasLiked={playerHasLiked}
                target={targetCharacterName}
                win={"isWinner" in guessState ? guessState.isWinner : false}
                numQuestionsLeft={numQuestionsLeft}
                gameId={dailyGameInfo.ogGameId}
            />
        </>
    );
};

const GameEndModal = ({
    isOpen,
    win,
    numQuestionsLeft,
    playerHasLiked,
    gameId,
    target,
}: {
    isOpen: boolean;
    win: boolean;
    numQuestionsLeft: number;
    playerHasLiked: UserHasLiked;
    gameId: string;
    target: string;
}) => {
    const navigate = useNavigate();

    let headingText = "";
    let paraText = "";
    if (win) {
        headingText = "You Win!";
        paraText = `You got ${target} in ${String(MAX_NUM_OF_QUESTIONS - numQuestionsLeft)} questions, good guessing!`;
    } else {
        headingText = "Wrong Guess!";
        paraText = `The correct character was ${target}! Better luck next time!`;
    }

    return (
        <ReactModal
            isOpen={isOpen}
            className="absolute top-1/2 left-1/2 mx-auto flex h-fit -translate-x-1/2 -translate-y-1/2 flex-col gap-4 border-2 border-neutral-800 bg-neutral-200 px-2 text-center max-lg:max-w-2xl max-md:py-5 md:max-lg:py-8 lg:max-w-3xl lg:py-8 2xl:pt-12 2xl:pb-8"
            overlayClassName="fixed inset-0 bg-zinc-900/70"
        >
            <h2
                className={`font-digitag mx-auto text-shadow-2xs/100 max-lg:leading-none max-md:text-[6rem] md:leading-27 md:max-xl:text-[7.5rem] xl:text-[9.5rem] ${headingText === "You Win!" ? "text-green-600" : "text-orange-600"} max-2xl:mb-4 max-lg:mb-0 2xl:mb-5`}
            >
                {headingText}
            </h2>
            <p className="mx-auto text-4xl font-medium whitespace-pre-wrap text-neutral-800 max-2xl:mb-1 max-sm:text-2xl 2xl:mb-2.5">
                {paraText}
            </p>
            <div className="mx-auto mt-1 flex flex-row max-sm:gap-4 sm:max-lg:gap-13 lg:gap-20">
                <button
                    onClick={() => {
                        void navigate("/");
                    }}
                    className="scale-95 cursor-pointer rounded-xs bg-blue-400 text-center font-medium text-neutral-50 hover:bg-blue-500 max-lg:px-3 max-lg:py-1.25 max-lg:text-xl lg:px-5 lg:py-3 lg:text-2xl"
                >
                    Home Page
                </button>
            </div>
            <div>
                {playerHasLiked !== null ? (
                    playerHasLiked ? (
                        <div className="flex items-center justify-center">
                            <span className="mr-2 text-xl font-medium italic">
                                Thanks for playing!
                            </span>
                            <FaHeart
                                size={"1.75em"}
                                className="inline text-xl text-red-700 transition-transform"
                            />
                        </div>
                    ) : (
                        <>
                            <p className="text-2xl font-semibold">
                                Did you enjoy todays characters?
                            </p>
                            <div className="flex items-center justify-center">
                                <span className="mr-2 text-xl font-medium italic">
                                    Click to give the game a like:
                                </span>
                                <LikeButton
                                    size={"L"}
                                    id={gameId}
                                    userHasLiked={playerHasLiked}
                                    numLikes={-1}
                                />
                            </div>
                        </>
                    )
                ) : (
                    <div className="mt-2">
                        <p className="text-2xl font-semibold">Did you enjoy this preset?</p>
                        <button
                            type="button"
                            className="mt-1 cursor-pointer bg-red-400 px-2 py-1.25 font-medium text-white hover:bg-red-600 lg:px-2.5 lg:py-1.5 lg:text-base xl:text-base"
                            onClick={() => {
                                void navigate("/login");
                            }}
                        >
                            {"Sign Up / Log In"}
                        </button>
                        <span className="text-lg italic">
                            {" "}
                            to give it a like and save it for later!
                        </span>
                    </div>
                )}
            </div>
        </ReactModal>
    );
};

export default DailyGamePage;
