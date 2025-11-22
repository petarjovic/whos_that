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

    // Calc num grid cols for consistent layout ("+ 3" is a heuristic I found works)
    let numGridCols = Math.ceil(Math.sqrt(cardData.length)) + 3;
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
            <p className="my-1 text-4xl font-bold">{title}</p>
            {/* Game Board */}
            {/* Styled as grid on large screens, as flexbox on small screens */}
            <div
                id="gameboard"
                className={`mx-auto mb-2.5 px-5 xl:grid ${GridColsClasses[numGridCols]} w-full items-center justify-center justify-items-center max-xl:flex max-xl:flex-wrap max-xl:justify-between max-xl:gap-2 xl:gap-5`}
            >
                {cardList}
            </div>
            {/* Last Row of Cards, is always flexbox for better visuals */}
            <div className="mb-2.5 flex w-full flex-wrap justify-evenly px-10 max-2xl:px-4">
                {lastRow}
                <OpponentTargetCard
                    name={oppTargetCardData.name}
                    imgSrc={oppTargetCardData.imageUrl}
                />
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
            className="shadow-2xl/30 max-sm:max-w-9/10 bg-linear-to-b border-b-13 text-shadow-xs/100 px-15 absolute left-1/2 top-1/2 mx-auto max-h-[90vh] w-auto max-w-4xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg border-x border-blue-600 from-blue-400 to-blue-500 py-8 text-center text-neutral-100 shadow-2xl"
            overlayClassName="fixed inset-0 bg-gray-700/75"
        >
            <h2
                className={`font-digitag text-shadow-md/80 mx-auto text-[10rem] leading-none ${headingText === "You Win!" ? "text-shadow-green-900 text-green-500" : "text-shadow-red-900 text-red-700"} `}
            >
                {headingText}
            </h2>
            <p className="text-shadow-slate-700 m-auto my-12 whitespace-pre-wrap text-5xl font-medium text-white max-sm:my-5">
                {paraText}
            </p>
            <div className="m-auto flex flex-row justify-evenly">
                <button
                    className={`w-50 border-b-9 text-shadow-xs/100 active:shadow-2xs mr-50 shadow-sm/20 m-auto cursor-pointer rounded-md border-x px-1 py-5 text-3xl text-neutral-100 ${playAgainSent ? "border-gray-600 bg-gray-500" : "border-green-700 bg-green-600 hover:border-green-800 hover:bg-green-700 active:-translate-y-px active:border-none"} max-sm:mr-10`}
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
                    className="w-50 border-b-9 text-shadow-xs/100 active:shadow-2xs duration-15 hover:shadow-xs shadow-sm/20 active:-trasnlate-y-px m-auto cursor-pointer rounded-md border-x border-red-800 bg-red-700 px-1 py-5 text-3xl text-neutral-100 transition-all hover:border-red-900 hover:bg-red-800 active:border-none"
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
            className="shadow-2xl/30 bg-linear-to-b border-b-13 text-shadow-xs/100 px-15 max-sm:max-w-9/10 absolute left-1/2 top-1/2 mx-auto max-h-[90vh] w-auto max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg border-x border-blue-700 from-blue-400 to-blue-600 py-8 text-center text-neutral-100 shadow-2xl"
            overlayClassName="fixed inset-0 bg-gray-500/70"
        >
            <p className="text-shadow-slate-700 m-auto my-12 whitespace-pre-wrap text-5xl font-medium text-white">
                Are you sure it&apos;s <span className="font-semibold text-yellow-300">{name}</span>
                ?
            </p>
            <div className="flex flex-row justify-between max-sm:justify-center">
                <button
                    className="max-w-50 border-b-9 text-shadow-xs/80 active:shadow-2xs shadow-sm/20 m-auto mr-10 cursor-pointer rounded-md border-green-700 bg-green-600 px-2 py-5 text-3xl text-neutral-100 hover:border-green-800 hover:bg-green-700 active:-translate-y-px active:border-none max-sm:mr-5 max-sm:px-4 max-sm:py-2"
                    onClick={() => {
                        confirmGuess(true);
                    }}
                >
                    Yes I&apos;m sure
                </button>
                <button
                    className="max-w-50 border-b-9 text-shadow-xs/80 active:shadow-2xs shadow-sm/20 m-auto ml-20 cursor-pointer rounded-md border-yellow-700 bg-yellow-600 px-1 py-2 text-2xl text-neutral-100 hover:border-yellow-800 hover:bg-yellow-700 active:-translate-y-px active:border-none max-sm:ml-10 max-sm:py-3"
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
