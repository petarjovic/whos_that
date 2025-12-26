import ReactModal from "react-modal";
import { useNavigate } from "react-router";
import { Card, OpponentTargetCard } from "../misc/Cards.tsx";
import type { CardDataUrl, RoomState, UserHasLiked } from "@server/types";
import { useEffect, useState } from "react";
import { FaHeart } from "react-icons/fa6";
import LikeButton from "../misc/LikeButton.tsx";
import { emitPlayAgain, emitGuess, getSocketId, emitPassTurn } from "../../lib/socket.ts";
import GameBoard from "./GameBoard.tsx";
import { fetchLikeInfo, useBetterAuthSession } from "../../lib/hooks.ts";

type ConfirmGuessModal = { isOpen: false } | { isOpen: true; isWinner: boolean; name: string };

interface GameProps {
    roomState: RoomState;
    cardData: CardDataUrl[];
    title: string;
}

/**
 * Main game component displaying character grid and opponent's target
 * Handles guess confirmation and play again requests
 */
const Game = ({ roomState, cardData, title }: GameProps) => {
    const [confirmGuessModal, setConfirmGuessModal] = useState<ConfirmGuessModal>({
        isOpen: false,
    });

    //At start of game shows player if they're going first or second, lasts 4.5s
    const [showTurnModal, setShowTurnModal] = useState(true);
    useEffect(() => {
        const timer = setTimeout(() => setShowTurnModal(false), 99000);
        return () => clearTimeout(timer);
    }, []);

    const socketId = getSocketId();
    if (!socketId) {
        //sanity check, component wont load with invalid socketId
        throw new Error("This client has no socket id... panic!");
    }

    const handleConfirmGuessModalResult = (cofirmGuess: boolean) => {
        if (cofirmGuess && confirmGuessModal.isOpen)
            emitGuess(roomState.id, confirmGuessModal.isWinner);
        setConfirmGuessModal({ isOpen: false });
    };

    const handleOpenConfirmModal = (winner: boolean, name: string) => {
        setConfirmGuessModal({ isOpen: true, isWinner: winner, name: name });
    };

    // Extract winning keys from room state
    const opponentSocketId = roomState.players.find((id) => id !== socketId) ?? ""; //should never actually be ""
    const winningKey = roomState.cardIdsToGuess[socketId];
    const oppWinningKey = roomState.cardIdsToGuess[opponentSocketId];

    // Create list of character card components
    const cardList = cardData.map(({ imageUrl, name, orderIndex }) => (
        <Card
            name={name}
            imgSrc={imageUrl}
            winner={winningKey === orderIndex}
            key={orderIndex}
            openConfirmModal={handleOpenConfirmModal}
            resetOnNewGame={roomState.endState}
            guessingDisabled={socketId !== roomState.curTurn}
        />
    ));

    //Generate card which indicates which char opponent is guessing
    const oppTargetCardData = cardData.find((card) => card.orderIndex === oppWinningKey);
    if (!oppTargetCardData) {
        throw new Error("Cannot find opponent's card data."); //sanity check 2
    }
    const oppTargetCard = (
        <OpponentTargetCard
            key={cardData.length + 1}
            name={oppTargetCardData.name}
            imgSrc={oppTargetCardData.imageUrl}
        />
    );

    const passTurnButton =
        socketId === roomState.curTurn ? (
            <div className="my-auto border border-neutral-700 hover:scale-105">
                <button
                    type="button"
                    className="flex h-40 w-40 cursor-pointer flex-col items-center justify-center border-5 border-neutral-100 bg-red-400 text-neutral-50 text-shadow-xs/50 hover:bg-red-500"
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        emitPassTurn(roomState.id);
                    }}
                >
                    <span className="text-xl font-medium">End Turn</span>
                    <span>Without Guessing</span>
                </button>
            </div>
        ) : (
            <div className="my-auto border border-neutral-700">
                <div className="flex h-40 w-40 flex-col items-center justify-center border-5 border-neutral-100 bg-slate-500 text-neutral-50 text-shadow-xs/50">
                    <span className="text-xl font-medium">
                        Opponent&apos;s Turn To Ask A Question
                    </span>
                </div>
            </div>
        );
    cardList.push(passTurnButton);

    return (
        <>
            <GameBoard title={title} cardList={cardList} targetCard={oppTargetCard} />
            {/* Modals */}
            <div>
                <GameEndModal key="game-end-modal" roomState={roomState} />
                <ConfirmGuessModal
                    key="confirm-guess-modal"
                    isOpen={
                        confirmGuessModal.isOpen &&
                        !Object.values(roomState.endState).some((e) => e !== null)
                    }
                    confirmGuess={handleConfirmGuessModalResult}
                    name={confirmGuessModal.isOpen ? confirmGuessModal.name : ""}
                />
                <FirstTurnModal
                    key="first-turn-modal"
                    isOpen={showTurnModal}
                    goingFirst={socketId === roomState.curTurn}
                />
            </div>
        </>
    );
};

/*
 * Pops up for 5 seconds at start of game to tell player if they're first or second
 */
const FirstTurnModal = ({ isOpen, goingFirst }: { isOpen: boolean; goingFirst: boolean }) => (
    <ReactModal
        isOpen={isOpen}
        className="absolute top-1/2 left-1/2 mx-auto flex h-fit w-9/10 -translate-x-1/2 -translate-y-1/2 flex-col gap-4 border-2 border-neutral-800 bg-neutral-200 px-2 text-center max-lg:max-w-2xl max-md:py-5 md:max-lg:py-8 lg:max-w-3xl lg:py-8 lg:max-2xl:px-5 2xl:px-10 2xl:pt-12 2xl:pb-10"
        overlayClassName="fixed inset-0 bg-zinc-700/70"
    >
        <p className="font-bold text-amber-500 text-shadow-xs/70 max-2xl:text-4xl 2xl:mb-2 2xl:text-5xl">
            {goingFirst ? "You're going First!" : "You're going Second!"}
        </p>
        <p className="font-medium max-2xl:max-w-19/20 max-2xl:text-xl 2xl:mx-auto 2xl:max-w-3/4 2xl:text-2xl">
            Remember: you can only guess on your own turn,{" "}
            <span className="italic">instead of asking a question!</span>
        </p>
    </ReactModal>
);

interface ConfirmGuessModalProps {
    isOpen: boolean;
    confirmGuess: (confirmed: boolean) => void;
    name: string;
}

/**
 * Confirmation modal before submitting a guess
 * Prevents accidental wrong guesses that end the game
 */
const ConfirmGuessModal = ({ isOpen, confirmGuess, name }: ConfirmGuessModalProps) => {
    return (
        <ReactModal
            isOpen={isOpen}
            className="absolute top-1/2 left-1/2 mx-auto flex h-fit w-9/10 -translate-x-1/2 -translate-y-1/2 flex-col gap-4 border-2 border-neutral-800 bg-neutral-200 px-2 text-center max-lg:max-w-2xl max-md:py-5 md:max-lg:py-8 lg:max-w-3xl lg:py-8 2xl:pt-12 2xl:pb-10"
            overlayClassName="fixed inset-0 bg-zinc-900/70"
        >
            <p className="mx-auto mb-1 leading-none font-medium whitespace-pre-wrap text-neutral-800 max-lg:text-3xl lg:text-4xl 2xl:text-[42px]">
                Are you sure it&apos;s <span className="font-bold text-orange-600">{name}</span>?
            </p>
            <div className="mx-auto flex max-lg:gap-5 lg:mt-5 lg:gap-10 2xl:gap-20">
                <button
                    className="cursor-pointer rounded-xs bg-green-600 text-center font-medium text-neutral-50 hover:bg-green-700 max-lg:text-xl max-md:px-3.5 max-md:py-1.5 md:max-lg:px-4.5 md:max-lg:py-2 lg:px-5 lg:py-3 lg:text-2xl"
                    onClick={() => {
                        confirmGuess(true);
                    }}
                >
                    Yes I&apos;m sure
                </button>
                <button
                    className="cursor-pointer rounded-xs bg-amber-500 text-center font-medium text-neutral-50 grayscale-10 hover:bg-amber-600 max-lg:text-xl max-md:px-3.5 max-md:py-1.5 md:max-lg:px-4.5 md:max-lg:py-2 lg:px-5 lg:py-3 lg:text-2xl"
                    onClick={() => {
                        confirmGuess(false);
                    }}
                >
                    Actually...
                </button>
            </div>
        </ReactModal>
    );
};

interface GameEndModalProps {
    roomState: RoomState;
}

/**
 * Modal shown when game ends with win/loss message
 * Allows play again or exit to home, also displays message prompting user to like game if not liked
 */
const GameEndModal = ({ roomState }: GameEndModalProps) => {
    let paraText = "";
    let headingText = "";
    const navigate = useNavigate();
    const { session, isPending } = useBetterAuthSession();

    //Tracks whether player has requested to play again, resets on room reset
    const [playAgainSent, setPlayAgainSent] = useState(false);
    useEffect(() => {
        if (Object.values(roomState.endState).every((e) => e === null)) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setPlayAgainSent(false);
        }
    }, [roomState.endState]);

    //Tracks whether not player has liked this game (changes the prompt user sees)
    const [playerHasLiked, setPlayerHasLiked] = useState<UserHasLiked>(null);
    useEffect(() => {
        const getPlayerLikeInfo = async () => {
            if (session && !isPending && roomState.gameId) {
                setPlayerHasLiked(await fetchLikeInfo(roomState.gameId));
            }
        };
        void getPlayerLikeInfo();
    }, [session, isPending, roomState.gameId]);

    const handlePlayAgain = () => {
        setPlayAgainSent(true);
        emitPlayAgain(roomState.id);
    };

    const socketId = getSocketId();
    const opponentSocketId = roomState.players.find((id) => id !== socketId) ?? ""; //Should never be ""

    //Comparisons to bool are inentional, type is boolean | null
    if (roomState.endState[socketId] === true) {
        headingText = "You Win!";
        paraText = "Good guessing!";
    } else if (roomState.endState[socketId] === false) {
        headingText = "You Lose!";
        paraText = "Oh no, wrong guess :(";
    } else if (roomState.endState[opponentSocketId] === true) {
        headingText = "You Lose!";
        paraText = "Dang, you opponent guessed correctly!";
    } else {
        headingText = "You Win!";
        paraText = "Your opponent guessed wrong! \n A lucky break!";
    }

    return (
        <ReactModal
            isOpen={Object.values(roomState.endState).some((e) => e !== null)}
            className="absolute top-1/2 left-1/2 mx-auto flex h-fit w-9/10 -translate-x-1/2 -translate-y-1/2 flex-col gap-4 border-2 border-neutral-800 bg-neutral-200 px-2 text-center max-lg:max-w-2xl max-md:py-5 md:max-lg:py-8 lg:max-w-3xl lg:py-8 2xl:pt-12 2xl:pb-8"
            overlayClassName="fixed inset-0 bg-zinc-900/70"
        >
            <h2
                className={`font-digitag mx-auto text-shadow-2xs/100 max-lg:leading-none max-md:text-[6rem] md:leading-27 md:max-xl:text-[7.5rem] xl:text-[9.5rem] ${headingText === "You Win!" ? "text-green-600" : "text-red-600"} max-2xl:mb-4 max-lg:mb-0 2xl:mb-5`}
            >
                {headingText}
            </h2>
            <p className="mx-auto text-4xl font-medium whitespace-pre-wrap text-neutral-800 max-2xl:mb-1 max-sm:text-2xl 2xl:mb-2.5">
                {paraText}
            </p>
            <div className="mx-auto mt-2.5 flex flex-row max-sm:gap-4 sm:max-lg:gap-13 lg:gap-20">
                <button
                    className={`cursor-pointer rounded-xs text-center font-medium text-neutral-50 max-lg:text-xl max-md:px-3.5 max-md:py-1.5 md:max-lg:px-4.5 md:max-lg:py-2 lg:px-5 lg:py-3 lg:text-2xl ${playAgainSent ? "bg-gray-700" : "bg-green-600 hover:bg-green-700"}`}
                    onClick={() => {
                        handlePlayAgain();
                    }}
                    disabled={playAgainSent}
                >
                    {playAgainSent ? "Waiting..." : "Play Again"}
                </button>
                <button
                    onClick={() => {
                        void navigate("/");
                    }}
                    className="scale-95 cursor-pointer rounded-xs bg-amber-600 text-center font-medium text-neutral-50 hover:bg-amber-700 max-lg:px-3 max-lg:py-1.25 max-lg:text-xl lg:px-5 lg:py-3 lg:text-2xl"
                >
                    Home Page
                </button>
            </div>
            <div>
                {playerHasLiked !== null ? (
                    playerHasLiked ? (
                        <div className="flex items-center justify-center">
                            <span className="mr-2 text-xl font-medium italic">
                                Thank you for your support!
                            </span>
                            <FaHeart
                                size={"1.75em"}
                                className="inline text-xl text-red-600 transition-transform"
                            />
                        </div>
                    ) : (
                        <>
                            <p className="text-2xl font-semibold">Did you enjoy this preset?</p>
                            <div className="flex items-center justify-center">
                                <span className="mr-2 text-xl font-medium italic">
                                    Click to give it a like:
                                </span>
                                <LikeButton
                                    size={"L"}
                                    id={roomState.gameId}
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

export default Game;
