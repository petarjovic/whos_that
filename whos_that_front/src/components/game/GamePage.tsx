import ReactModal from "react-modal";
import { useNavigate } from "react-router";
import { Card, OpponentTargetCard } from "../misc/Cards.tsx";
import type { CardDataUrlType } from "@server/types";
import type { EndStateType } from "../../lib/types.ts";
import { useEffect, useState } from "react";

interface GameProps {
    emitPlayAgain: () => void;
    emitGuess: (guessCorrectness: boolean) => void;
    endState: EndStateType;
    winningKey: number; // Character index this player needs to guess
    oppWinningKey: number; // Character index opponent needs to guess
    cardData: CardDataUrlType[];
    title: string;
}

type ConfirmGuessModalState = { isOpen: false } | { isOpen: true; isWinner: boolean; name: string };

interface gridColsTailwind {
    [key: number]: string;
}

// Map of grid column counts to Tailwind classes (Tailwind requires this)
const GridColsClasses: gridColsTailwind = {
    1: "xl:grid-cols-1",
    2: "xl:grid-cols-2",
    3: "xl:grid-cols-3",
    4: "xl:grid-cols-4",
    5: "xl:grid-cols-5",
    6: "xl:grid-cols-6",
    7: "xl:grid-cols-7",
    8: "xl:grid-cols-8",
    9: "xl:grid-cols-9",
    10: "xl:grid-cols-10",
    11: "xl:grid-cols-11",
    12: "xl:grid-cols-12",
} as const;

/**
 * Main game component displaying character grid and opponent's target
 * Handles guess confirmation and play again requests
 */
const Game = ({
    emitPlayAgain,
    emitGuess,
    endState,
    winningKey,
    oppWinningKey,
    cardData,
    title,
}: GameProps) => {
    const [confirmGuessModal, setConfirmGuessModal] = useState<ConfirmGuessModalState>({
        isOpen: false,
    });

    // Calc num grid cols for consistent layout ("+ 4" is a heuristic)
    let numGridCols = Math.ceil(Math.sqrt(cardData.length)) + 4;
    if (numGridCols > 12) numGridCols = 12;

    const handleConfirmGuessModalResult = (cofirmGuess: boolean) => {
        if (cofirmGuess && confirmGuessModal.isOpen) emitGuess(confirmGuessModal.isWinner);
        setConfirmGuessModal({ isOpen: false });
    };

    const handleOpenConfirmModal = (winner: boolean, name: string) => {
        setConfirmGuessModal({ isOpen: true, isWinner: winner, name: name });
    };

    const handlePlayAgain = () => {
        emitPlayAgain();
    };

    // Create list of character card components
    const cardList = cardData.map(({ imageUrl, name, orderIndex }) => (
        <Card
            name={name}
            imgSrc={imageUrl}
            winner={winningKey === orderIndex}
            key={orderIndex}
            openConfirmModal={handleOpenConfirmModal}
            resetOnNewGame={endState}
            isGame={true}
        />
    )); // Separate last row of list for layout purposes
    const lastRow = cardList.splice(cardList.length - (cardData.length % numGridCols));

    const oppTargetCardData = cardData.find((card) => card.orderIndex === oppWinningKey);
    if (!oppTargetCardData) {
        //Sanity check
        throw new Error("Cannot find opponent's card data.");
    }

    return (
        <>
            {/* Game Title */}
            <p className="my-1.5 text-4xl font-bold">{title}</p>
            {/* Game Board */}
            {/* grid on large screens, flexbox on small screens */}
            <div className="mb-2 h-full w-[99%] rounded border bg-slate-400 pt-4">
                <div
                    id="gameboard"
                    className={`mx-auto mb-2.5 max-lg:px-1 lg:px-2.5 2xl:grid 2xl:px-6 ${GridColsClasses[numGridCols]} 2xl:gap-y-4.5 w-full max-2xl:flex max-2xl:flex-wrap max-2xl:items-center max-2xl:justify-around max-md:gap-2 md:max-2xl:gap-2 2xl:auto-cols-min 2xl:place-items-center 2xl:justify-center 2xl:gap-x-0`}
                >
                    {cardList}
                </div>
                {/* Last Row of Cards, always flexbox */}
                <div className="mb-2.5 flex w-full flex-wrap justify-evenly px-10 max-2xl:px-4">
                    {lastRow}
                    <OpponentTargetCard
                        name={oppTargetCardData.name}
                        imgSrc={oppTargetCardData.imageUrl}
                    />
                </div>
            </div>
            {/* Modals */}
            <div>
                <GameEndModal endState={endState} handlePlayAgain={handlePlayAgain} />
                <ConfirmGuessModalState
                    isOpen={confirmGuessModal.isOpen}
                    confirmGuess={handleConfirmGuessModalResult}
                    name={confirmGuessModal.isOpen ? confirmGuessModal.name : ""}
                />
            </div>
        </>
    );
};

interface GameEndModalProps {
    endState: EndStateType;
    handlePlayAgain: () => void;
}

/**
 * Modal shown when game ends with win/loss message
 * Allows play again or exit to home
 */
const GameEndModal = ({ endState, handlePlayAgain }: GameEndModalProps) => {
    let paraText = "";
    let headingText = "";
    const navigate = useNavigate();
    const [playAgainSent, setPlayAgainSent] = useState(false);

    // Reset button state when new game starts
    useEffect(() => {
        setPlayAgainSent(false);
    }, [endState]);

    switch (endState) {
        case "correctGuess": {
            headingText = "You Win!";
            paraText = "Good guessing!";
            break;
        }
        case "wrongGuess": {
            headingText = "You Lose!";
            paraText = "Oh no, wrong guess :(";
            break;
        }
        case "oppCorrectGuess": {
            headingText = "You Lose!";
            paraText = "Dang, you opponent guessed correctly!";
            break;
        }
        case "oppWrongGuess": {
            headingText = "You Win!";
            paraText = "Your opponent guessed wrong! \n A lucky break!";
            break;
        }
    }

    return (
        <ReactModal
            isOpen={Boolean(endState)}
            className="w-9/10 absolute left-1/2 top-1/2 mx-auto flex h-fit max-w-4xl -translate-x-1/2 -translate-y-1/2 flex-col gap-4 border-2 border-neutral-800 bg-neutral-200 px-2 text-center shadow-lg max-lg:py-5 lg:py-8"
            overlayClassName="fixed inset-0 bg-zinc-900/70"
        >
            <h2
                className={`font-digitag mx-auto leading-none max-sm:text-[6rem] xl:text-[9rem] ${headingText === "You Win!" ? "text-green-600" : "text-red-600"} `}
            >
                {headingText}
            </h2>
            <p className="mx-auto mb-2 whitespace-pre-wrap text-4xl font-medium text-neutral-800 max-sm:text-2xl">
                {paraText}
            </p>
            <div className="mx-auto flex flex-row gap-4">
                <button
                    className={`rounded-xs cursor-pointer px-2 py-1 text-center text-lg font-medium text-neutral-50 ${playAgainSent ? "bg-gray-700" : "bg-green-600 hover:bg-green-700"}`}
                    onClick={() => {
                        setPlayAgainSent(true);
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
                    className="rounded-xs cursor-pointer bg-red-400 px-7 py-1 text-center text-lg font-medium text-neutral-50 hover:bg-red-500"
                >
                    Exit
                </button>
            </div>
        </ReactModal>
    );
};

interface ConfirmGuessModalProps {
    isOpen: boolean;
    confirmGuess: (confirmed: boolean) => void;
    name: string;
}

/**
 * Confirmation modal before submitting a guess
 * Prevents accidental wrong guesses that end the game
 */
const ConfirmGuessModalState = ({ isOpen, confirmGuess, name }: ConfirmGuessModalProps) => {
    return (
        <ReactModal
            isOpen={isOpen}
            className="w-9/10 absolute left-1/2 top-1/2 mx-auto flex h-fit max-w-xl -translate-x-1/2 -translate-y-1/2 flex-col gap-4 border-2 border-neutral-800 bg-neutral-200 px-2 text-center shadow-lg max-lg:py-5 lg:py-8"
            overlayClassName="fixed inset-0 bg-zinc-900/70"
        >
            <p className="mx-auto mb-2 whitespace-pre-wrap text-3xl font-medium text-neutral-800 lg:text-4xl">
                Are you sure it&apos;s <span className="font-semibold text-orange-600">{name}</span>
                ?
            </p>
            <div className="mx-auto flex max-lg:gap-2 lg:gap-7">
                <button
                    className="rounded-xs cursor-pointer bg-green-600 px-1.5 py-1 text-center text-lg font-medium text-white hover:bg-green-700 lg:text-xl"
                    onClick={() => {
                        confirmGuess(true);
                    }}
                >
                    Yes I&apos;m sure
                </button>
                <button
                    className="rounded-xs cursor-pointer bg-amber-500 px-1.5 py-1 text-center text-lg font-medium text-white hover:bg-amber-600 lg:text-xl"
                    onClick={() => {
                        confirmGuess(false);
                    }}
                >
                    ...On Second Thought
                </button>
            </div>
        </ReactModal>
    );
};

export default Game;
