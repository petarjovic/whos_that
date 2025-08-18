import { useState } from "react";
import Hero from "./Hero";
import black from "./assets/black.jpg";
import ReactModal from "react-modal";

ReactModal.setAppElement("#root");

const Game = () => {
    const [openGameEndModal, setOpenGameEndModal] = useState(false);
    const [gameWin, setGameWin] = useState(null);

    const images = Object.values(
        import.meta.glob("./assets/presidents/*.{jpg,jpeg,png}", {
            eager: true,
            query: "?url",
            import: "default",
        })
    ).sort();
    const [winningKey, setWinningKey] = useState(Math.floor(Math.random() * images.length));
    console.log(winningKey);

    const handleCheckWinner = (winner) => {
        setGameWin(winner);
        setOpenGameEndModal(true);
    };

    const cards = images.map((img, i) => (
        <Card
            imgSrc={img}
            key={i}
            winner={winningKey === i}
            handleCheckWinner={handleCheckWinner}
        />
    ));

    const handlePlayAgain = () => {
        setGameWin(null);
        setOpenGameEndModal(false);
        setWinningKey(Math.floor(Math.random() * images.length));
    };

    return (
        <>
            <div className="flex flex-col items-center justify-start bg-gradient-to-br to-blue-500 from-cyan-200 min-h-screen w-full ">
                <Hero />
                <div
                    id="gameboard"
                    className="flex flex-wrap items-center justify-evenly mx-10 mt-10"
                >
                    {cards}
                    <EndTurnButton />
                </div>
            </div>
            <GameEndModal
                isOpen={openGameEndModal}
                win={gameWin}
                handlePlayAgain={handlePlayAgain}
            />
        </>
    );
};

const Card = ({ imgSrc, winner, handleCheckWinner }) => {
    const [flipped, setflipped] = useState(false);
    const [openModal, setOpenModal] = useState(false);

    const handleCloseModalAndCheckWinner = () => {
        setOpenModal(false);
        handleCheckWinner(winner);
    };

    return (
        <>
            <div className="border-5 bg-radial from-40% from-white to-zinc-900 h-85 w-55 rounded-[5%] overflow-hidden mx-1 my-2.5">
                <img
                    className="object-cover h-[90%] max-h-[90%] max-w-full"
                    src={flipped ? black : imgSrc}
                    alt=""
                />
                <div className="flex justify-between h-[10%] border-t-2">
                    <button
                        className="text-neutral-100 font-bold border-r-2 border-black bg-green-600 hover:bg-green-900 px-1 h-full w-fit rounded-r-[5%] cursor-pointer"
                        onClick={() => setOpenModal(true)}
                    >
                        The Guy
                    </button>
                    <div className="text-2xl m-auto text-center">❓</div>
                    <button
                        className="text-neutral-100 font-bold border-l-2 border-black bg-red-600 hover:bg-red-900 px-1 h-full w-fit rounded-l-[5%] cursor-pointer"
                        onClick={() => setflipped(!flipped)}
                    >
                        Not Guy
                    </button>
                </div>
            </div>
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
                        It's Him.
                    </button>
                    <button
                        className="w-50 h-20 text-2xl text-neutral-100 font-bold border-3 border-black bg-amber-500 hover:bg-amber-600 px-1 rounded-[2%] cursor-pointer"
                        onClick={() => setOpenModal(false)}
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

const GameEndModal = ({ win, isOpen, handlePlayAgain }) => {
    console.log(win);
    let modalText = "";

    if (win) modalText = "Correct! You win congratulations!";
    else modalText = "Wrong guess, you lose, sorry!";

    return (
        <ReactModal
            isOpen={isOpen}
            className="border-zinc-900 border-4 rounded-2xl bg-radial from-white to-zinc-300  fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-fit w-fit inline-block text-center p-10"
        >
            <p className="m-auto my-12 text-5xl font-bold">{modalText}</p>
            <div className="flex flex-row justify-between">
                <button
                    className="w-50 h-20 m-auto text-2xl text-neutral-100 font-bold border-3 border-black bg-green-600 hover:bg-green-900 px-1 rounded-[2%] cursor-pointer"
                    onClick={handlePlayAgain}
                >
                    Play again!
                </button>
            </div>
        </ReactModal>
    );
};

export default Game;
