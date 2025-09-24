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
    isWinner: boolean | undefined;
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
        isWinner: undefined,
    });

    const handleConfirmGuessModalResult = (cofirmGuess: boolean) => {
        if (cofirmGuess && confirmGuessModal.isWinner !== undefined)
            emitGuess(confirmGuessModal.isWinner);
        setConfirmGuessModal({ isOpen: false, isWinner: undefined });
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
            <div id="gameboard" className="mx-10 mt-10 flex flex-wrap items-center justify-evenly">
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
        <button className="border-5 bg-radial h-55 w-55 mx-1 my-2.5 cursor-pointer overflow-hidden rounded-[5%] border-zinc-900 from-blue-400 to-blue-900">
            <div className="text-3xl font-bold text-white drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.8)] hover:text-gray-400">
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
        case "correctGuess": {
            modalText = "You've guessed correctly! Congratulations you win!";
            break;
        }
        case "wrongGuess": {
            modalText = "Wrong guess! Sorry you've lost, better luck next time!";
            break;
        }
        case "oppCorrectGuess": {
            modalText = "Dang, you opponent guessed correctly! You've lost :(";
            break;
        }
        case "oppWrongGuess": {
            modalText = "Your opponent guessed wrong! A lucky break, you win!";
            break;
        }
    }

    return (
        <ReactModal
            isOpen={Boolean(endState)}
            className="border-3 bg-radial fixed left-1/2 top-1/2 inline-block h-fit w-fit -translate-x-1/2 -translate-y-1/2 rounded-2xl border-slate-300 from-slate-100 to-slate-200 p-10 text-center shadow-2xl"
        >
            <p className="m-auto my-12 text-5xl font-bold">{modalText}</p>
            <div className="m-auto flex flex-row justify-evenly">
                <button
                    className="w-50 border-b-9 border-x-1 text-shadow-xs active:shadow-2xs active:inset-shadow-md m-auto h-20 cursor-pointer rounded-md border-green-700 bg-green-600 px-1 text-2xl font-bold text-neutral-100 shadow-md hover:border-green-800 hover:bg-green-700 active:translate-y-[1px] active:border-none"
                    onClick={handlePlayAgain}
                >
                    Play again!
                </button>
                <button
                    onClick={() => {
                        void navigate("/");
                    }}
                    className="w-50 border-b-9 border-x-1 text-shadow-xs active:shadow-2xs active:inset-shadow-md m-auto h-20 cursor-pointer rounded-md border-red-700 bg-red-600 px-1 text-2xl font-bold text-neutral-100 shadow-md hover:border-red-800 hover:bg-red-700 active:translate-y-[1px] active:border-none"
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
            className="border-3 bg-radial fixed left-1/2 top-1/2 inline-block h-fit w-fit -translate-x-1/2 -translate-y-1/2 rounded-2xl border-slate-300 from-slate-100 to-slate-200 p-10 text-center shadow-2xl"
        >
            <p className="m-auto my-12 text-5xl font-bold">
                Are you sure this <br /> is the guy!?
            </p>
            <div className="flex flex-row justify-between">
                <button
                    className="w-50 border-b-9 text-shadow-xs active:shadow-2xs active:inset-shadow-md m-auto mr-10 h-20 cursor-pointer rounded-md border-green-700 bg-green-600 px-1 text-2xl font-bold text-neutral-100 shadow-md hover:border-green-800 hover:bg-green-700 active:translate-y-[1px] active:border-none"
                    onClick={() => {
                        confirmGuess(true);
                    }}
                >
                    It&#39;s Him.
                </button>
                <button
                    className="w-50 border-b-9 text-shadow-xs active:shadow-2xs active:inset-shadow-md m-auto ml-20 h-20 cursor-pointer rounded-md border-amber-600 bg-amber-500 px-1 text-2xl font-bold text-neutral-100 shadow-md hover:border-amber-700 hover:bg-amber-600 active:translate-y-[1px] active:border-none"
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
