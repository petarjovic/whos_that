import ReactModal from "react-modal";
import { useNavigate } from "react-router";
import { Card, OpponentTargetCard } from "../layouts/Cards";
import type { CardDataType } from "../../../whos_that_server/src/config/types.ts";
import type { EndStateType } from "../lib/types.ts";
import { useState } from "react";

interface GameProps {
    emitPlayAgain: () => void;
    emitGuess: (guessCorrectness: boolean) => void;
    endState: EndStateType;
    winningKey: number;
    oppWinningKey: number;
    cardData: CardDataType[];
}

interface confirmGuess {
    isOpen: boolean;
    isWinner: boolean | null;
}

const Game = ({
    emitPlayAgain,
    emitGuess,
    endState,
    winningKey,
    oppWinningKey,
    cardData,
}: GameProps) => {
    const [confirmGuessModal, setConfirmGuessModal] = useState<confirmGuess>({
        isOpen: false,
        isWinner: null,
    });

    const handleConfirmGuessModalResult = (cofirmGuess: boolean) => {
        if (cofirmGuess && confirmGuessModal.isWinner !== null)
            emitGuess(confirmGuessModal.isWinner);
        setConfirmGuessModal({ isOpen: false, isWinner: null });
    };

    const handleOpenConfirmModal = (winner: boolean) => {
        setConfirmGuessModal({ isOpen: true, isWinner: winner });
    };

    const handlePlayAgain = () => {
        emitPlayAgain();
    };

    const oppTargetCardData = cardData.find((card) => card.orderIndex === oppWinningKey);

    return (
        <>
            <div id="gameboard" className="flex flex-wrap items-center justify-evenly mx-10 mt-10">
                {cardData.map(({ imageUrl, name, orderIndex }) => (
                    <Card
                        name={name}
                        imgSrc={imageUrl}
                        winner={winningKey === orderIndex}
                        key={orderIndex}
                        openConfirmModal={handleOpenConfirmModal}
                        resetOnNewGame={endState}
                    />
                ))}
                <EndTurnButton />
                <OpponentTargetCard
                    name={oppTargetCardData?.name ?? ""} //FIX THIS
                    imgSrc={oppTargetCardData?.imageUrl ?? ""}
                />
                ;
            </div>
            <GameEndModal endState={endState} handlePlayAgain={handlePlayAgain} />
            <ConfirmGuessModal
                isOpen={confirmGuessModal.isOpen}
                confirmGuess={handleConfirmGuessModalResult}
            />
        </>
    );
};

const EndTurnButton = () => {
    return (
        <button className="border-zinc-900  border-5 bg-radial from-blue-400 to-blue-900 h-55 w-55 rounded-[5%] overflow-hidden mx-1 my-2.5  cursor-pointer">
            <div className="font-bold text-3xl text-white drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.8)] hover:text-gray-400">
                End Turn
            </div>
        </button>
    );
};

interface GameEndModalProps {
    endState: EndStateType;
    handlePlayAgain: () => void;
}

const GameEndModal = ({ endState, handlePlayAgain }: GameEndModalProps) => {
    let modalText = "";
    const navigate = useNavigate();

    switch (endState) {
        case "correctGuess":
            modalText = "You've guessed correctly! Congratulations you win!";
            break;
        case "wrongGuess":
            modalText = "Wrong guess! Sorry you've lost, better luck next time!";
            break;
        case "oppCorrectGuess":
            modalText = "Dang, you opponent guessed correctly! You've lost :(";
            break;
        case "oppWrongGuess":
            modalText = "Your opponent guessed wrong! A lucky break, you win!";
            break;
    }

    return (
        <ReactModal
            isOpen={Boolean(endState)}
            className="border-slate-300 border-3 shadow-2xl rounded-2xl bg-radial from-slate-100 to-slate-200  fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-fit w-fit inline-block text-center p-10"
        >
            <p className="m-auto my-12 text-5xl font-bold">{modalText}</p>
            <div className="m-auto flex flex-row justify-evenly">
                <button
                    className="w-50 h-20 m-auto text-2xl text-neutral-100 font-bold border-b-9 border-x-1 border-green-700 bg-green-600 hover:bg-green-700 hover:border-green-800 px-1 rounded-md cursor-pointer shadow-md text-shadow-xs active:border-none active:translate-y-[1px] active:shadow-2xs active:inset-shadow-md"
                    onClick={handlePlayAgain}
                >
                    Play again!
                </button>
                <button
                    onClick={() => {
                        void navigate("/");
                    }}
                    className="w-50 h-20 m-auto text-2xl text-neutral-100 font-bold border-b-9 border-x-1 border-red-700 bg-red-600 hover:bg-red-700 hover:border-red-800 px-1 rounded-md cursor-pointer shadow-md text-shadow-xs active:border-none active:translate-y-[1px] active:shadow-2xs active:inset-shadow-md"
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
}

const ConfirmGuessModal = ({ isOpen, confirmGuess }: ConfirmGuessModalProps) => {
    return (
        <ReactModal
            isOpen={isOpen}
            className="border-slate-300 border-3 shadow-2xl rounded-2xl bg-radial from-slate-100 to-slate-200  fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-fit w-fit inline-block text-center p-10"
        >
            <p className="m-auto my-12 text-5xl font-bold">
                Are you sure this <br /> is the guy!?
            </p>
            <div className="flex flex-row justify-between">
                <button
                    className="mr-10 w-50 h-20 m-auto text-2xl text-neutral-100 font-bold border-b-9 border-green-700 bg-green-600 hover:bg-green-700 hover:border-green-800 px-1 rounded-md cursor-pointer shadow-md text-shadow-xs active:border-none active:translate-y-[1px] active:shadow-2xs active:inset-shadow-md"
                    onClick={() => {
                        confirmGuess(true);
                    }}
                >
                    It&#39;s Him.
                </button>
                <button
                    className="ml-20 w-50 h-20 m-auto text-2xl text-neutral-100 font-bold border-b-9 border-amber-600 bg-amber-500 hover:bg-amber-600 hover:border-amber-700 px-1 rounded-md cursor-pointer shadow-md text-shadow-xs active:border-none active:translate-y-[1px] active:shadow-2xs active:inset-shadow-md"
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
