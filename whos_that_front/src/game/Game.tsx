import { useState } from "react";
import black from "./assets/black.jpg";
import ReactModal from "react-modal";
import { useNavigate } from "react-router";

ReactModal.setAppElement("#root");
import type { EndStateType } from "./GameStateManger";

interface GameProps {
    emitPlayAgain: () => void;
    emitGuess: (guessCorrectness: boolean) => void;
    endState: EndStateType;
    winningKey: number;
    oppWinningKey: number;
}

const Game = ({ emitPlayAgain, emitGuess, endState, winningKey, oppWinningKey }: GameProps) => {
    const imageModules = import.meta.glob("./assets/presidents/*.{jpg,jpeg,png}", {
        eager: true,
        query: "?url",
        import: "default",
    });

    const imagesAndNames = Object.entries(imageModules).map(([path, url]): [string, string] => {
        const name = (path.split("/").pop() ?? path) //see if theres a better way to handle fallback
            .replace(/\.(jpg|jpeg|png)$/i, "")
            .replace(/_/g, " ");
        return [name, url as string]; //also see about this
    });

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

interface CardLayoutPropsType {
    children: React.ReactNode;
    name: string;
    imgSrc: string;
    flipped: boolean;
}

const CardLayout = ({ children, name, imgSrc, flipped }: CardLayoutPropsType) => {
    return (
        <figure className="border-3 border-neutral-300 flex flex-col justify-between bg-neutral-300 h-100 w-66 rounded-lg overflow-hidden mx-1 my-2.5 shadow-/15 hover:shadow-lg/80 transition-shadow">
            <img
                className="object-fill h-[84.5%] max-h-[85%]  "
                src={flipped ? black : imgSrc}
                alt={name}
            />
            <figcaption className=" text-zinc-900 relative bottom-0.75 text-center text-xl font-bold m-auto h-[4.5%] w-full">
                {name}
            </figcaption>
            {children}
        </figure>
    );
};

interface CardPropsType {
    name: string;
    imgSrc: string;
    winner: boolean;
    handleCheckWinner: (win: boolean) => void;
}
const Card = ({ name, imgSrc, winner, handleCheckWinner }: CardPropsType) => {
    const [flipped, setflipped] = useState(false);
    const [openModal, setOpenModal] = useState(false);

    const handleCloseModalAndCheckWinner = () => {
        setOpenModal(false);
        handleCheckWinner(winner);
    };

    return (
        <>
            <CardLayout name={name} imgSrc={imgSrc} flipped={flipped}>
                <div className="box-content flex justify-between h-[9.5%] border-t-3 border-neutral-300">
                    <button
                        className="text-lg text-neutral-200 font-bold  bg-green-600 hover:bg-green-800 border-neutral-300 px-1 h-full w-[35%] border-r-3 cursor-pointer rounded-sm text-shadow-xs"
                        onClick={() => {
                            setOpenModal(true);
                        }}
                    >
                        The Guy
                    </button>
                    <div className="relative top-0.5 text-2xl font-bold m-auto text-center align-sub">
                        ❓
                    </div>
                    <button
                        className="text-lg text-neutral-100 font-bold  bg-red-600 hover:bg-red-800 border-neutral-300 px-1 h-full w-[35%] border-l-3 cursor-pointer rounded-md"
                        onClick={() => {
                            setflipped(!flipped);
                        }}
                    >
                        Not Guy
                    </button>
                </div>
            </CardLayout>
            <ReactModal
                isOpen={openModal}
                className="border-slate-300 border-3 shadow-2xl rounded-2xl bg-radial from-slate-100 to-slate-200  fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-fit w-fit inline-block text-center p-10"
            >
                <p className="m-auto my-12 text-5xl font-bold">
                    Are you sure this <br /> is the guy!?
                </p>
                <div className="flex flex-row justify-between">
                    <button
                        className="mr-10 w-50 h-20 m-auto text-2xl text-neutral-100 font-bold border-b-9 border-green-700 bg-green-600 hover:bg-green-700 hover:border-green-800 px-1 rounded-md cursor-pointer shadow-md text-shadow-xs active:border-none active:translate-y-[1px] active:shadow-2xs active:inset-shadow-md"
                        onClick={handleCloseModalAndCheckWinner}
                    >
                        It&#39;s Him.
                    </button>
                    <button
                        className="ml-20 w-50 h-20 m-auto text-2xl text-neutral-100 font-bold border-b-9 border-amber-600 bg-amber-500 hover:bg-amber-600 hover:border-amber-700 px-1 rounded-md cursor-pointer shadow-md text-shadow-xs active:border-none active:translate-y-[1px] active:shadow-2xs active:inset-shadow-md"
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

const OpponentTargetCard = ({ name, imgSrc }: { name: string; imgSrc: string }) => {
    return (
        <CardLayout name={name} imgSrc={imgSrc} flipped={false}>
            <p className="text-center text-lg font-bold m-auto h-full bg-blue-200 w-full">
                Your Opponent has to Guess
            </p>
        </CardLayout>
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
