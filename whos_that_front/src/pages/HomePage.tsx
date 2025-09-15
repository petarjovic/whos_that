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
        <div className="mt-50 text-center">
            <button
                className="mx-4 px-5 w-fill h-18 text-2xl text-white font-bold border-b-9 border-x-1 border-blue-600 bg-blue-500 hover:bg-blue-600 hover:border-blue-700 rounded-md cursor-pointer shadow-md text-shadow-xs/30 active:border-b-1 active:translate-y-[1px] active:shadow-2xs  active:inset-shadow-md "
                onClick={() => {
                    void navigate("/create-game");
                }}
            >
                Play New Game
            </button>
            <p className="font-digitag mt-35 text-5xl font-bold text-white text-shadow-sm">OR</p>
            <form className="mt-35 items-center" onSubmit={handleJoinExistingGame}>
                <input
                    id="gameIdInput"
                    name="gameIdInput"
                    type="text"
                    className="align-sub bg-white placeholder:text-gray-400 text-slate-700 text-2xl border border-slate-200 rounded-md px-3 py-2 transition duration-300 ease focus:outline-none focus:border-slate-400 hover:border-slate-300 shadow-sm hover:shadow-md focus:shadow-lg"
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
                    className="mx-4 px-4 w-fill h-15 text-2xl text-white font-bold border-b-9 border-x-1 border-blue-600 bg-blue-500 hover:bg-blue-600 hover:border-blue-700 rounded-md cursor-pointer shadow-md text-shadow-xs/30 active:border-b-1 active:translate-y-[1px] active:shadow-2xs  active:inset-shadow-md"
                    type="submit"
                >
                    Join Existing Game
                </button>
            </form>
        </div>
    );
};

export default HomePage;
