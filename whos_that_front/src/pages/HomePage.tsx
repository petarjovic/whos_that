import { useNavigate } from "react-router";
import { useState } from "react";

const HomePage = () => {
    const [gameIdToJoin, setGameIdToJoin] = useState("");
    const navigate = useNavigate();

    const handleJoinExistingGame = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        void navigate(`/play-game/${gameIdToJoin}`);
    };

    return (
        <div className="mt-42 text-center">
            <button
                className="w-fill h-22 border-b-9 border-x-1 text-shadow-xs/30 active:border-b-1 active:shadow-2xs active:inset-shadow-md mx-4 cursor-pointer rounded-md border-blue-600 bg-blue-500 px-5 text-3xl font-semibold text-white shadow-md hover:border-blue-700 hover:bg-blue-600 hover:text-slate-200 active:translate-y-[1px]"
                onClick={() => {
                    void navigate("/create-game");
                }}
            >
                Play New Game
            </button>
            <p className="font-digitag mt-35 text-shadow-sm text-5xl font-bold text-white">OR</p>
            <form className="mt-35 items-center" onSubmit={handleJoinExistingGame}>
                <input
                    id="gameIdInput"
                    name="gameIdInput"
                    type="text"
                    className="inset-shadow-sm shadow-xs rounded-md border border-cyan-500 bg-white p-2.5 align-sub text-2xl text-slate-700 transition-all duration-300 placeholder:text-gray-400 hover:border-slate-300 hover:shadow-md focus:border-slate-400 focus:shadow-lg focus:outline-none"
                    required
                    minLength={6}
                    maxLength={6}
                    placeholder="Enter 6 Digit Game Code"
                    value={gameIdToJoin}
                    onChange={(e) => {
                        setGameIdToJoin(e.target.value);
                    }}
                />
                <button
                    className="w-fill h-17 border-b-9 border-x-1 text-shadow-xs/30 active:border-b-1 active:shadow-2xs active:inset-shadow-md duration-5 mx-4 cursor-pointer rounded-md border-blue-600 bg-blue-500 px-4 text-2xl font-bold text-white shadow-md transition-all hover:border-blue-700 hover:bg-blue-600 hover:text-slate-200 active:translate-y-[1px]"
                    type="submit"
                >
                    Join Existing Game
                </button>
            </form>
        </div>
    );
};

export default HomePage;

