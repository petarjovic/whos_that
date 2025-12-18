import ReactModal from "react-modal";
import { useNavigate } from "react-router";
import { Card, OpponentTargetCard } from "../misc/Cards.tsx";
import type { CardDataUrlType, RoomState } from "@server/types";
import { useEffect, useState } from "react";
import { FaHeart } from "react-icons/fa6";
import LikeButton from "../misc/LikeButton.tsx";
import { emitPlayAgain, emitGuess } from "../../lib/socket.ts";
import GameBoard from "./GameBoard.tsx";

type ConfirmGuessModalState = { isOpen: false } | { isOpen: true; isWinner: boolean; name: string };

interface GameProps {
    roomState: RoomState;
    playerIndex: number; //player 1 or 2, used to calculate winner
    cardData: CardDataUrlType[];
    title: string;
    playerHasLiked: boolean | null;
    isMyTurn: boolean;
    passTurn: () => void;
}

/**
 * Main game component displaying character grid and opponent's target
 * Handles guess confirmation and play again requests
 */
const Game = ({
    roomState,
    playerIndex,
    cardData,
    title,
    playerHasLiked,
    isMyTurn,
    passTurn,
}: GameProps) => {
    const [confirmGuessModal, setConfirmGuessModal] = useState<ConfirmGuessModalState>({
        isOpen: false,
    });
    //Shows player if they're going first or second
    const [showTurnModal, setShowTurnModal] = useState(true);
    useEffect(() => {
        const timer = setTimeout(() => setShowTurnModal(false), 4000);
        return () => clearTimeout(timer);
    }, []);

    const handleConfirmGuessModalResult = (cofirmGuess: boolean) => {
        if (cofirmGuess && confirmGuessModal.isOpen)
            emitGuess(roomState.id, confirmGuessModal.isWinner);
        setConfirmGuessModal({ isOpen: false });
    };

    const handleOpenConfirmModal = (winner: boolean, name: string) => {
        setConfirmGuessModal({ isOpen: true, isWinner: winner, name: name });
    };

    //get winning keys based on if player 1 or player 2
    const oppWinningKey = roomState.cardIdsToGuess[playerIndex];
    const winningKey = roomState.cardIdsToGuess[1 - playerIndex];

    // Create list of character card components
    const cardList = cardData.map(({ imageUrl, name, orderIndex }) => (
        <Card
            name={name}
            imgSrc={imageUrl}
            winner={winningKey === orderIndex}
            key={orderIndex}
            openConfirmModal={handleOpenConfirmModal}
            resetOnNewGame={roomState.endState}
            guessingDisabled={!isMyTurn}
        />
    ));

    //Generate card which indicates what char opponent is guessing
    const oppTargetCardData = cardData.find((card) => card.orderIndex === oppWinningKey);
    if (!oppTargetCardData) {
        throw new Error("Cannot find opponent's card data."); //sanity check
    }
    const oppTargetCard = (
        <OpponentTargetCard name={oppTargetCardData.name} imgSrc={oppTargetCardData.imageUrl} />
    );

    const passTurnButton = isMyTurn ? (
        <div className="my-auto border border-neutral-700 hover:scale-105">
            <button
                type="button"
                className="text-shadow-xs/50 border-5 flex h-40 w-40 cursor-pointer flex-col items-center justify-center border-neutral-100 bg-red-400 text-neutral-50 hover:bg-red-500"
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    passTurn();
                }}
            >
                <span className="text-xl font-medium">End Turn</span>
                <span>Without Guessing</span>
            </button>
        </div>
    ) : (
        <div className="my-auto border border-neutral-700">
            <div className="text-shadow-xs/50 border-5 flex h-40 w-40 flex-col items-center justify-center border-neutral-100 bg-slate-500 text-neutral-50">
                <span className="text-xl font-medium">Opponent's Turn To Ask A Question</span>
            </div>
        </div>
    );
    cardList.push(passTurnButton);

    return (
        <>
            <GameBoard title={title} cardList={cardList} targetCard={oppTargetCard} />
            {/* Modals */}
            <div>
                <GameEndModal
                    roomState={roomState}
                    playerIndex={playerIndex}
                    playerHasLiked={playerHasLiked}
                />
                <ConfirmGuessModalState
                    isOpen={confirmGuessModal.isOpen && !roomState.endState.some((e) => e !== null)}
                    confirmGuess={handleConfirmGuessModalResult}
                    name={confirmGuessModal.isOpen ? confirmGuessModal.name : ""}
                />
                <TurnOrderModal isOpen={showTurnModal} isMyTurn={isMyTurn} />
            </div>
        </>
    );
};

/*
 * Pops up for 5 seconds at start of game to tell player if they're first or second
 */
const TurnOrderModal = ({ isOpen, isMyTurn }: { isOpen: boolean; isMyTurn: boolean }) => (
    <ReactModal
        isOpen={isOpen}
        className="w-9/10 absolute left-1/2 top-1/2 mx-auto flex h-fit -translate-x-1/2 -translate-y-1/2 flex-col gap-4 border-2 border-neutral-800 bg-neutral-200 px-2 text-center max-lg:max-w-2xl max-md:py-5 md:max-lg:py-8 lg:max-w-3xl lg:py-8 2xl:pb-10 2xl:pt-12"
        overlayClassName="fixed inset-0 bg-zinc-900/70"
    >
        <p className="text-shadow-xs/50 text-4xl font-bold text-amber-600">
            {isMyTurn ? "It's your turn to ask a question first!" : "You're going second!"}
        </p>
        <p className="text-xl italic">Remember: you can only guess on your own turn!</p>
    </ReactModal>
);

/**
 * Confirmation modal before submitting a guess
 * Prevents accidental wrong guesses that end the game
 */
const ConfirmGuessModalState = ({ isOpen, confirmGuess, name }: ConfirmGuessModalProps) => {
    return (
        <ReactModal
            isOpen={isOpen}
            className="w-9/10 absolute left-1/2 top-1/2 mx-auto flex h-fit -translate-x-1/2 -translate-y-1/2 flex-col gap-4 border-2 border-neutral-800 bg-neutral-200 px-2 text-center max-lg:max-w-2xl max-md:py-5 md:max-lg:py-8 lg:max-w-3xl lg:py-8 2xl:pb-10 2xl:pt-12"
            overlayClassName="fixed inset-0 bg-zinc-900/70"
        >
            <p className="mx-auto mb-1 whitespace-pre-wrap font-medium leading-none text-neutral-800 max-lg:text-3xl lg:text-4xl 2xl:text-[42px]">
                Are you sure it&apos;s <span className="font-bold text-orange-600">{name}</span>?
            </p>
            <div className="mx-auto flex max-lg:gap-5 lg:mt-5 lg:gap-10 2xl:gap-20">
                <button
                    className="rounded-xs md:max-lg:px-4.5 cursor-pointer bg-green-600 text-center font-medium text-neutral-50 hover:bg-green-700 max-lg:text-xl max-md:px-3.5 max-md:py-1.5 md:max-lg:py-2 lg:px-5 lg:py-3 lg:text-2xl"
                    onClick={() => {
                        confirmGuess(true);
                    }}
                >
                    Yes I&apos;m sure
                </button>
                <button
                    className="rounded-xs md:max-lg:px-4.5 grayscale-10 cursor-pointer bg-amber-500 text-center font-medium text-neutral-50 hover:bg-amber-600 max-lg:text-xl max-md:px-3.5 max-md:py-1.5 md:max-lg:py-2 lg:px-5 lg:py-3 lg:text-2xl"
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
    playerIndex: number;
    playerHasLiked: boolean | null;
}

/**
 * Modal shown when game ends with win/loss message
 * Allows play again or exit to home
 */
const GameEndModal = ({ roomState, playerIndex, playerHasLiked }: GameEndModalProps) => {
    let paraText = "";
    let headingText = "";
    const navigate = useNavigate();
    const [playAgainSent, setPlayAgainSent] = useState(false);

    // Reset button state when new game starts
    useEffect(() => {
        setPlayAgainSent(false);
    }, [roomState]);

    if (roomState.endState.some((e) => e !== null)) {
        if (roomState.endState[playerIndex] === true) {
            headingText = "You Win!";
            paraText = "Good guessing!";
        } else if (roomState.endState[playerIndex] === false) {
            headingText = "You Lose!";
            paraText = "Oh no, wrong guess :(";
        } else if (roomState.endState[1 - playerIndex] === true) {
            headingText = "You Lose!";
            paraText = "Dang, you opponent guessed correctly!";
        } else {
            headingText = "You Win!";
            paraText = "Your opponent guessed wrong! \n A lucky break!";
        }
    }

    return (
        <ReactModal
            isOpen={Boolean(roomState.endState.some((e) => e !== null))}
            className="w-9/10 absolute left-1/2 top-1/2 mx-auto flex h-fit -translate-x-1/2 -translate-y-1/2 flex-col gap-4 border-2 border-neutral-800 bg-neutral-200 px-2 text-center max-lg:max-w-2xl max-md:py-5 md:max-lg:py-8 lg:max-w-3xl lg:py-8 2xl:pb-8 2xl:pt-12"
            overlayClassName="fixed inset-0 bg-zinc-900/70"
        >
            <h2
                className={`text-shadow-2xs/100 font-digitag md:leading-27 mx-auto max-lg:leading-none max-md:text-[6rem] md:max-xl:text-[7.5rem] xl:text-[9.5rem] ${headingText === "You Win!" ? "text-green-600" : "text-red-600"} max-2xl:mb-4 max-lg:mb-0 2xl:mb-5`}
            >
                {headingText}
            </h2>
            <p className="mx-auto whitespace-pre-wrap text-4xl font-medium text-neutral-800 max-2xl:mb-1 max-sm:text-2xl 2xl:mb-2.5">
                {paraText}
            </p>
            <div className="sm:max-lg:gap-13 mx-auto mt-2.5 flex flex-row max-sm:gap-4 lg:gap-20">
                <button
                    className={`rounded-xs md:max-lg:px-4.5 cursor-pointer text-center font-medium text-neutral-50 max-lg:text-xl max-md:px-3.5 max-md:py-1.5 md:max-lg:py-2 lg:px-5 lg:py-3 lg:text-2xl ${playAgainSent ? "bg-gray-700" : "bg-green-600 hover:bg-green-700"}`}
                    onClick={() => {
                        setPlayAgainSent(true);
                        emitPlayAgain(roomState.id);
                    }}
                    disabled={playAgainSent}
                >
                    {playAgainSent ? "Waiting..." : "Play Again"}
                </button>
                <button
                    onClick={() => {
                        void navigate("/");
                    }}
                    className="rounded-xs max-lg:py-1.25 scale-95 cursor-pointer bg-amber-600 text-center font-medium text-neutral-50 hover:bg-amber-700 max-lg:px-3 max-lg:text-xl lg:px-5 lg:py-3 lg:text-2xl"
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
                                    id={roomState.preset}
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
                            className="py-1.25 mt-1 cursor-pointer bg-red-400 px-2 font-medium text-white hover:bg-red-600 lg:px-2.5 lg:py-1.5 lg:text-base xl:text-base"
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

interface ConfirmGuessModalProps {
    isOpen: boolean;
    confirmGuess: (confirmed: boolean) => void;
    name: string;
}

export default Game;
