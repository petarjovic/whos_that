import { useNavigate } from "react-router";
import { useState } from "react";
import FirstVisitModal from "../misc/FirstVisitModal.tsx"; // Add this import

const HomePage = () => {
    const [gameIdToJoin, setGameIdToJoin] = useState("");
    const navigate = useNavigate();

    const handleJoinExistingGame = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        void navigate(`/play-game/${gameIdToJoin}`);
    };

    return (
        <div className="my-auto text-center">
            <button
                className="border-b-9 border-x-1 text-shadow-xs/80 active:border-b-1 active:shadow-2xs duration-15 hover:text-shadow-none hover:shadow-xs w-fit cursor-pointer rounded-md border-blue-600 bg-blue-500 px-5 py-5 text-3xl font-bold text-white shadow-sm transition-all hover:border-blue-700 hover:bg-blue-600 hover:text-gray-100 active:translate-y-[1px] max-2xl:px-4 max-2xl:py-3 max-2xl:text-2xl"
                onClick={() => {
                    void navigate("/create-game");
                }}
            >
                Play New Game
            </button>
            <p className="font-digitag mt-35 text-shadow-sm/80 text-5xl font-bold tracking-wider text-white max-2xl:mt-28 max-2xl:text-4xl">
                OR
            </p>
            <form className="mt-35 items-center max-2xl:mt-28" onSubmit={handleJoinExistingGame}>
                <input
                    id="gameIdInput"
                    name="gameIdInput"
                    type="text"
                    className="inset-shadow-sm shadow-xs hover:shadow-sm/30 w-fit rounded-md border border-cyan-500 bg-white p-2 text-center align-sub text-2xl text-slate-700 transition-all duration-300 placeholder:text-gray-400 hover:border-slate-300 focus:border-slate-400 focus:shadow-lg max-2xl:p-1.5 max-2xl:text-xl"
                    required
                    minLength={6}
                    maxLength={6}
                    placeholder="Enter Room Id"
                    value={gameIdToJoin}
                    onChange={(e) => {
                        setGameIdToJoin(e.target.value);
                    }}
                />
                <button
                    className="border-b-9 border-x-1 text-shadow-xs/50 active:border-b-1 active:shadow-2xs duration-15 hover:text-shadow-none hover:shadow-xs px-4.5 mx-4 w-fit cursor-pointer rounded-md border-blue-600 bg-blue-500 py-3.5 text-2xl font-bold text-white shadow-sm transition-all hover:border-blue-700 hover:bg-blue-600 hover:text-gray-100 active:translate-y-[1px] max-2xl:px-4 max-2xl:py-3 max-2xl:text-xl"
                    type="submit"
                >
                    Join Game
                </button>
            </form>
            <p className="text-shadow-xs/100 font-digitag fixed bottom-2 left-0 w-full text-center text-xl text-white hover:cursor-default max-2xl:text-lg">
                P<span className="font-digitag tracking-widest">eta</span>r Jovic was here
            </p>
            <FirstVisitModal />
        </div>
    );
};

export default HomePage;

