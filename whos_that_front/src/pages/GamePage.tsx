import ReactModal from "react-modal";
import { useNavigate } from "react-router";
import { Card, OpponentTargetCard } from "../layouts/Cards";
import type { CardDataUrlType } from "../../../whos_that_server/src/config/types.ts";
import type { EndStateType } from "../lib/types.ts";
import { useEffect, useState } from "react";

interface GameProps {
    emitPlayAgain: () => void;
    emitGuess: (guessCorrectness: boolean) => void;
    endState: EndStateType;
    winningKey: number;
    oppWinningKey: number;
    cardData: CardDataUrlType[];
    title: string;
}

type ConfirmGuessModal = { isOpen: false } | { isOpen: true; isWinner: boolean; name: string };

interface gridColsTailwind {
    [key: number]: string;
}

const GridColsClasses: gridColsTailwind = {
    1: "grid-cols-1",
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-4",
    5: "grid-cols-5",
    6: "grid-cols-6",
    7: "grid-cols-7",
    8: "grid-cols-8",
    9: "grid-cols-9",
    10: "grid-cols-10",
    11: "grid-cols-11",
    12: "grid-cols-12",
} as const;

const Game = ({
    emitPlayAgain,
    emitGuess,
    endState,
    winningKey,
    oppWinningKey,
    cardData,
    title,
}: GameProps) => {
    const [confirmGuessModal, setConfirmGuessModal] = useState<ConfirmGuessModal>({
        isOpen: false,
    });

    let numGridCols = Math.ceil(Math.sqrt(cardData.length)) + 3;
    if (numGridCols > 12) numGridCols = 12; //Just in case

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
    ));
    const lastRow = cardList.splice(cardList.length - (cardData.length % numGridCols));

    const oppTargetCardData = cardData.find((card) => card.orderIndex === oppWinningKey);

    if (!oppTargetCardData) {
        throw new Error("Cannot find oppent's card data.");
    }

    return (
        <>
            <p className="font-times text-shadow-sm/100 my-2 w-full text-center text-[4.2rem] leading-none tracking-wider text-white">
                {title}
            </p>
            <div
                id="gameboard"
                className={`mb-2.5 grid px-10 ${GridColsClasses[numGridCols]} w-full justify-center justify-items-center gap-2.5`}
            >
                {cardList}
            </div>
            <div className="mb-1 flex w-full flex-wrap justify-evenly px-10">
                {lastRow}
                <OpponentTargetCard
                    name={oppTargetCardData.name}
                    imgSrc={oppTargetCardData.imageUrl}
                />
            </div>
            <div>
                <GameEndModal endState={endState} handlePlayAgain={handlePlayAgain} />
                <ConfirmGuessModal
                    isOpen={confirmGuessModal.isOpen}
                    confirmGuess={handleConfirmGuessModalResult}
                    name={confirmGuessModal.name}
                />
            </div>
        </>
    );
};

interface GameEndModalProps {
    endState: EndStateType;
    handlePlayAgain: () => void;
}

const GameEndModal = ({ endState, handlePlayAgain }: GameEndModalProps) => {
    let modalText = "";
    const navigate = useNavigate();
    const [playAgainSent, setPlayAgainSent] = useState(false);

    useEffect(() => {
        setPlayAgainSent(false);
    }, [endState]);

    switch (endState) {
        case "correctGuess": {
            modalText = "Correct! Congratulations you win!";
            break;
        }
        case "wrongGuess": {
            modalText = "Oh no, wrong guess! Sorry but you lose!";
            break;
        }
        case "oppCorrectGuess": {
            modalText = "Dang, you opponent guessed correctly! \n You've lost :(";
            break;
        }
        case "oppWrongGuess": {
            modalText = "Your opponent guessed wrong! \n A lucky break, congratulations you win!";
            break;
        }
    }

    return (
        <ReactModal
            isOpen={Boolean(endState)}
            className="border-3 bg-radial fixed left-1/2 top-1/2 h-fit w-fit -translate-x-1/2 -translate-y-1/2 whitespace-pre-line rounded-2xl border-slate-200 from-slate-50 to-slate-300 px-5 py-10 text-center shadow-2xl"
        >
            <p className="m-auto my-12 text-5xl font-bold">{modalText}</p>
            <div className="m-auto flex flex-row justify-evenly">
                <button
                    className={`w-50 border-b-9 border-x-1 text-shadow-xs/30 active:shadow-2xs active:inset-shadow-md m-auto h-20 cursor-pointer rounded-md px-1 text-3xl text-neutral-100 shadow-md ${playAgainSent ? "border-gray-600 bg-gray-500" : "border-green-700 bg-green-600 hover:border-green-800 hover:bg-green-700 active:translate-y-[1px] active:border-none"}`}
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
                    className="w-50 border-b-9 border-x-1 text-shadow-xs/30 active:shadow-2xs active:inset-shadow-md m-auto h-20 cursor-pointer rounded-md border-red-700 bg-red-600 px-1 text-3xl text-neutral-100 shadow-md hover:border-red-800 hover:bg-red-700 active:translate-y-[1px] active:border-none"
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

const ConfirmGuessModal = ({ isOpen, confirmGuess, name }: ConfirmGuessModalProps) => {
    return (
        <ReactModal
            isOpen={isOpen}
            className="border-3 bg-radial fixed left-1/2 top-1/2 inline-block h-fit w-fit -translate-x-1/2 -translate-y-1/2 rounded-2xl border-slate-300 from-slate-100 to-slate-200 p-10 text-center shadow-2xl"
        >
            <p className="m-auto my-12 text-5xl font-medium">
                Are you sure it&apos;s <span className="font-semibold">{name}</span>?
            </p>
            <div className="flex flex-row justify-between">
                <button
                    className="w-50 border-b-9 text-shadow-xs/30 active:shadow-2xs active:inset-shadow-md m-auto mr-10 h-20 cursor-pointer rounded-md border-green-700 bg-green-600 px-2 text-3xl text-neutral-100 shadow-md hover:border-green-800 hover:bg-green-700 active:translate-y-[1px] active:border-none"
                    onClick={() => {
                        confirmGuess(true);
                    }}
                >
                    Yes I&apos;m sure
                </button>
                <button
                    className="w-50 border-b-9 text-shadow-xs/30 active:shadow-2xs active:inset-shadow-md m-auto ml-20 h-20 cursor-pointer rounded-md border-amber-600 bg-amber-500 px-1 text-2xl text-neutral-100 shadow-md hover:border-amber-700 hover:bg-amber-600 active:translate-y-[1px] active:border-none"
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
