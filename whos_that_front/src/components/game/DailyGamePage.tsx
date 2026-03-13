import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Card } from "../misc/Cards.tsx";
import type { DailyGame, UserHasLiked } from "@server/types";
import { dailyGameInfoSchema } from "@server/zodSchema";
import { serverResponseSchema, dailyProgressSchema } from "../../lib/zodSchema.ts";
import type { DailyProgress, ChatMessage } from "../../lib/types.ts";
import env from "../../lib/zodEnvSchema.ts";
import { log, logError } from "../../lib/logger.ts";
import GameBoard from "./GameBoard.tsx";
import LoadingSpinner from "../misc/LoadingSpinner.tsx";
import ChatPanel from "./ChatPanel.tsx";
import { ConfirmGuessModal } from "./GamePage.tsx";
import type { ConfirmGuessModalState } from "./GamePage.tsx";
import { fetchLikeInfo, useBetterAuthSession } from "../../lib/hooks.ts";
import { FaHeart } from "react-icons/fa6";
import LikeButton from "../misc/LikeButton.tsx";
import InGameNavBar from "./InGameNavBar.tsx";
import DailyGameModal from "./DailyGameModal.tsx";
import ModalLayout from "../layout/ModalLayout.tsx";

const DAILY_END_STATE = {};
const MAX_NUM_OF_QUESTIONS = 6;

//Get today's date in YYYY-MM-DD format to use as a key for saving progress in localStorage
const getTodayKey = () => new Date().toISOString().split("T")[0];

const DailyGamePage = () => {
    const [dailyGameInfo, setDailyGameInfo] = useState<DailyGame>();
    const [numQuestionsLeft, setNumQuestionsLeft] = useState(MAX_NUM_OF_QUESTIONS);
    const [isAsking, setIsAsking] = useState(false);
    const [guessState, setGuessState] = useState<ConfirmGuessModalState>({ isOpen: false });
    const [errorMsg, setErrorMsg] = useState("");

    const initialMessage: ChatMessage = {
        isUser: false,
        msg: 'Ughhh...they got me good, my circuits are messed up. I know everything about the intruder but I can\'t say who it was! I\'ll only have power to respond to 6 questions, and only with a  "Yes", "No" or "I don\'t know". Detective, please solve the case!',
    };

    const [messages, setMessages] = useState<ChatMessage[]>([initialMessage]);

    const { session, isPending } = useBetterAuthSession();
    const [playerHasLiked, setPlayerHasLiked] = useState<UserHasLiked>(null);

    // Load locally saved progress on mount
    useEffect(() => {
        const savedProgress = localStorage.getItem("dailyProgress");
        if (savedProgress) {
            try {
                const parsed = JSON.parse(savedProgress) as DailyProgress;
                const validationResult = dailyProgressSchema.safeParse(parsed);
                if (validationResult.success) {
                    const progress = validationResult.data;
                    if (progress.date === getTodayKey()) {
                        setMessages(progress.messages);
                        setNumQuestionsLeft(progress.numQuestionsLeft);
                        if (progress.guessState.isWinner !== undefined) {
                            setGuessState({
                                isOpen: false,
                                isWinner: progress.guessState.isWinner,
                                name: "",
                            });
                        }
                    } else {
                        localStorage.removeItem("dailyProgress");
                    }
                } else {
                    logError(validationResult.error);
                    localStorage.removeItem("dailyProgress");
                }
            } catch (error) {
                logError(error);
            }
        }
    }, []);

    // Save progress whenever state changes
    useEffect(() => {
        if (messages.length > 1 || "isWinner" in guessState) {
            const progress: DailyProgress = {
                date: getTodayKey(),
                messages,
                numQuestionsLeft,
                guessState: "isWinner" in guessState ? { isWinner: guessState.isWinner } : {},
            };
            localStorage.setItem("dailyProgress", JSON.stringify(progress));
        }
    }, [messages, numQuestionsLeft, guessState]);

    useEffect(() => {
        const getPlayerLikeInfo = async () => {
            if (session && !isPending && dailyGameInfo?.ogGameId !== undefined) {
                if (dailyGameInfo.ogGameId.length > 0)
                    setPlayerHasLiked(Boolean(await fetchLikeInfo(dailyGameInfo.ogGameId)));
                else setPlayerHasLiked(false);
            }
        };
        void getPlayerLikeInfo();
    }, [session, isPending, dailyGameInfo?.ogGameId]);

    useEffect(() => {
        const fetchDaily = async () => {
            const dailyRes = await fetch(`${env.VITE_SERVER_URL}/api/daily`);
            if (!dailyRes.ok) {
                const errorData = serverResponseSchema.safeParse(await dailyRes.json());
                throw new Error((errorData.data?.message ?? "") || "No daily game scheduled.");
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
                <div className="flex flex-col items-center max-xl:h-1/2 xl:mt-9 xl:w-1/5 xl:min-w-[19.5dvw] ">
                    {/* Battery Level (6 Max) */}
                    <ChatPanel
                        messages={messages}
                        onSend={(q) => {
                            void handleAsk(q);
                        }}
                        isLoading={isAsking}
                        opponentLabel="Whos-That-Bot-3000"
                        batteryLevel={numQuestionsLeft}
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

            <GameEndModal
                isOpen={gameOver}
                playerHasLiked={playerHasLiked}
                target={targetCharacterName}
                win={"isWinner" in guessState ? guessState.isWinner : false}
                numQuestionsLeft={numQuestionsLeft}
                gameId={dailyGameInfo.ogGameId}
            />

            <DailyGameModal
                gangName={dailyGameInfo.title}
                detectiveName={session?.user.displayUsername ?? "Detective"}
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
        paraText = `The correct character was ${target}! \n Better luck tomorrow!`;
    }

    return (
        <ModalLayout
            isOpen={isOpen}
            handleClose={() => {
                /* No handling needed */
            }}
            classNames="h-fit flex flex-col gap-4 px-2 text-center max-lg:max-w-2xl max-md:py-5 md:max-lg:py-8 lg:max-w-3xl lg:py-10 2xl:pt-12 2xl:pb-8"
        >
            <h2
                className={`font-digitag mx-auto  text-shadow-sm/50 max-lg:leading-none max-md:text-[6rem] md:leading-27 md:max-xl:text-[7rem] xl:text-[8rem] ${headingText === "You Win!" ? "text-green-600" : "text-orange-600"} max-2xl:my-4 max-lg:mb-0 2xl:my-5`}
            >
                {headingText}
            </h2>
            <p className="mx-auto text-4xl font-medium whitespace-pre-wrap text-neutral-800 max-2xl:my-1 max-sm:text-2xl 2xl:my-2.5">
                {paraText}
            </p>
            <div className="mx-auto mt-1 flex flex-row max-sm:gap-4 sm:max-lg:gap-13 lg:gap-20">
                <button
                    onClick={() => {
                        void navigate("/");
                    }}
                    className="scale-95 cursor-pointer rounded-xs bg-blue-400 text-center font-medium text-neutral-50 hover:bg-blue-500 max-lg:px-3 max-lg:py-1.25 max-lg:text-xl lg:px-5 lg:py-3 lg:text-2xl inset-shadow-sm/15 inset-shadow-blue-50 shadow-sm/15 border border-blue-500 hover:border-blue-600 hover:scale-102 active:scale-100"
                >
                    Home Page
                </button>
            </div>
            <div>
                {playerHasLiked !== null ? (
                    playerHasLiked || gameId.length === 0 ? (
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
        </ModalLayout>
    );
};

export default DailyGamePage;
