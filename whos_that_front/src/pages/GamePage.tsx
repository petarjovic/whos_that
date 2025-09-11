import ReactModal from "react-modal";
import { useNavigate } from "react-router";
import { Card, OpponentTargetCard } from "../layouts/Cards";

import type { EndStateType } from "../lib/types.ts";

interface GameProps {
    emitPlayAgain: () => void;
    emitGuess: (guessCorrectness: boolean) => void;
    endState: EndStateType;
    winningKey: number;
    oppWinningKey: number;
    images: object;
}

const Game = ({
    emitPlayAgain,
    emitGuess,
    endState,
    winningKey,
    oppWinningKey,
    images,
}: GameProps) => {
    const imagesAndNames = Object.entries(images) as [string, string][];

    const handleCheckWinner = (win: boolean) => {
        emitGuess(win);
    };
    const handlePlayAgain = () => {
        emitPlayAgain();
    };

    // console.log(winningKey, imagesAndNames[winningKey]);
    // console.log(oppWinningKey, imagesAndNames[oppWinningKey]);

    const cards = imagesAndNames.map(([name, img], i) => (
        <Card
            name={name}
            imgSrc={img}
            key={i}
            winner={winningKey === i}
            handleCheckWinner={handleCheckWinner}
        />
    ));

    return (
        <>
            <div id="gameboard" className="flex flex-wrap items-center justify-evenly mx-10 mt-10">
                {cards}
                <EndTurnButton />
                <OpponentTargetCard
                    name={imagesAndNames[oppWinningKey][0]}
                    imgSrc={imagesAndNames[oppWinningKey][1]}
                />
                ;
            </div>
            <GameEndModal endState={endState} handlePlayAgain={handlePlayAgain} />
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

export default Game;
