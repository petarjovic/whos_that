import { useState } from "react";
import black from "./assets/black.jpg";
import ReactModal from "react-modal";
import { useEffect } from "react";
import { Link } from "react-router";

ReactModal.setAppElement("#root");
import type { winLoseFlagType } from "./GameStateManger";

interface GameProps {
    emitPlayAgain: () => void;
    emitGuess: (guessCorrectness: boolean) => void;
    winLoseFlag: winLoseFlagType;
    winningKey: number;
    oppWinningKey: number;
}

const Game = ({ emitPlayAgain, emitGuess, winLoseFlag, winningKey, oppWinningKey }: GameProps) => {
    const imageModules = import.meta.glob("./assets/presidents/*.{jpg,jpeg,png}", {
        eager: true,
        query: "?url",
        import: "default",
    });

    const imagesAndNames = Object.entries(imageModules).map(([path, url]): [string, string] => {
        const name =
            path.split("/").pop() ??
            path //see if theres a better way to handle fallback
                .replace(/\.(jpg|jpeg|png)$/i, "");
        return [name, url as string]; //also see about this
    });

    const [openGameEndModal, setOpenGameEndModal] = useState(false);

    const handleCheckWinner = (win: boolean) => {
        emitGuess(win);
        setOpenGameEndModal(true);
    };
    const handlePlayAgain = () => {
        emitPlayAgain();
    };

    console.log(winningKey, imagesAndNames[winningKey]);
    console.log(oppWinningKey, imagesAndNames[oppWinningKey]);

    const cards = imagesAndNames.map(([name, img], i) => (
        <Card
            name={name}
            imgSrc={img}
            key={i}
            winner={winningKey === i}
            handleCheckWinner={handleCheckWinner}
        />
    ));

    cards.push(
        <Card
            name={imagesAndNames[oppWinningKey][0]}
            imgSrc={imagesAndNames[oppWinningKey][1]}
            key={cards.length}
            winner={false}
            handleCheckWinner={() => null}
        />
    );

    useEffect(() => {
        if (winLoseFlag !== null) {
            setOpenGameEndModal(true);
        } else {
            setOpenGameEndModal(false);
        }
    }, [winLoseFlag]);

    return (
        <>
            <div id="gameboard" className="flex flex-wrap items-center justify-evenly mx-10 mt-10">
                {cards}
                <EndTurnButton />
            </div>
            <GameEndModal
                isOpen={openGameEndModal}
                win={Boolean(winLoseFlag)}
                handlePlayAgain={handlePlayAgain}
            />
        </>
    );
};

interface CardProps {
    name: string;
    imgSrc: string;
    winner: boolean;
    handleCheckWinner: (win: boolean) => void;
}

const Card = ({ name, imgSrc, winner, handleCheckWinner }: CardProps) => {
    const [flipped, setflipped] = useState(false);
    const [openModal, setOpenModal] = useState(false);
    const cleanName = name.replace(/_/g, " ");

    const handleCloseModalAndCheckWinner = () => {
        setOpenModal(false);
        handleCheckWinner(winner);
    };

    return (
        <>
            <figure className="flex flex-col justify-between border-5 bg-radial from-40% from-white to-zinc-900 h-120 w-80 rounded-[5%] overflow-hidden mx-1 my-2.5">
                <img
                    className="object-fill h-[86%]"
                    src={flipped ? black : imgSrc}
                    alt={cleanName}
                />
                <figcaption className="flex justify-center-safe items-center-safe text-xl font-bold m-auto h-[4.5%] bg-blue-200 w-full">
                    {cleanName}
                </figcaption>
                <div className="flex justify-between h-[9%] border-t-3">
                    <button
                        className="text-xl text-neutral-100 font-bold border-r-2 border-black bg-green-600 hover:bg-green-900 px-1 h-full w-[30%]  rounded-r-[5%] cursor-pointer"
                        onClick={() => {
                            setOpenModal(true);
                        }}
                    >
                        The Guy
                    </button>
                    <div className="text-3xl font-bold m-auto text-center">❓</div>
                    <button
                        className="text-xl text-neutral-100 font-bold border-l-2 border-black bg-red-600 hover:bg-red-900 px-1 h-full w-[30%] rounded-l-[5%] cursor-pointer"
                        onClick={() => {
                            setflipped(!flipped);
                        }}
                    >
                        Not Guy
                    </button>
                </div>
            </figure>
            <ReactModal
                isOpen={openModal}
                className="border-zinc-900 border-4 rounded-2xl bg-radial from-white to-zinc-300  fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-fit w-fit inline-block text-center p-10"
            >
                <p className="m-auto my-12 text-5xl font-bold">
                    Are you sure this <br /> is the guy!?
                </p>
                <div className="flex flex-row justify-between">
                    <button
                        className="w-50 h-20 mr-20 text-2xl text-neutral-100 font-bold border-3 border-black bg-green-600 hover:bg-green-900 px-1 rounded-[2%] cursor-pointer"
                        onClick={handleCloseModalAndCheckWinner}
                    >
                        It&#39;s Him.
                    </button>
                    <button
                        className="w-50 h-20 text-2xl text-neutral-100 font-bold border-3 border-black bg-amber-500 hover:bg-amber-600 px-1 rounded-[2%] cursor-pointer"
                        onClick={() => {
                            setOpenModal(false);
                        }}
                    >
                        ...On Second Thought
                    </button>
                </div>
            </ReactModal>
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
    win: boolean;
    isOpen: boolean;
    handlePlayAgain: () => void;
}

const GameEndModal = ({ win, isOpen, handlePlayAgain }: GameEndModalProps) => {
    let modalText = "";

    if (win) modalText = "Correct! You win congratulations!";
    else modalText = "Wrong guess, you lose, sorry!";

    return (
        <ReactModal
            isOpen={isOpen}
            className="border-zinc-900 border-4 rounded-2xl bg-radial from-white to-zinc-300  fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-fit w-fit inline-block text-center p-10"
        >
            <p className="m-auto my-12 text-5xl font-bold">{modalText}</p>
            <div className="flex flex-row justify-evenly">
                <button
                    className="w-50 h-20 m-auto text-2xl text-neutral-100 font-bold border-3 border-black bg-green-600 hover:bg-green-900 px-1 rounded-[2%] cursor-pointer"
                    onClick={handlePlayAgain}
                >
                    Play again!
                </button>
                <Link to="/" reloadDocument={true}>
                    <button className="w-50 h-20 m-auto text-2xl text-neutral-100 font-bold border-3 border-black bg-red-600 hover:bg-red-900 px-1 rounded-[2%] cursor-pointer">
                        Exit
                    </button>
                </Link>
            </div>
        </ReactModal>
    );
};

export default Game;
