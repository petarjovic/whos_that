import { Link, useNavigate } from "react-router";
import { useState } from "react";

const App = () => {
    const [gameIdToJoin, setGameIdToJoin] = useState("");
    const navigate = useNavigate();

    const handleJoinExistingGame = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (gameIdToJoin.length === 6) {
            void navigate(`/play-game/${gameIdToJoin}`);
        }
    };

    return (
        <div className="mt-40 text-center">
            <Link to={"/play-game"}>
                <button className="bg-blue-600 hover:bg-blue-800 text-2xl  font-bold rounded-md text-neutral-100  py-3 px-5 cursor-pointer shadow-xs hover:shadow-lg">
                    Create New Game
                </button>
            </Link>
            <p
                className="font-digitag mt-30 text-5xl
            xl font-bold text-neutral-200 text-shadow-xl"
            >
                OR
            </p>
            <form className="mt-30 items-center" onSubmit={handleJoinExistingGame}>
                <input
                    id="gameIdInput"
                    name="gameIdInput"
                    type="text"
                    className="bg-white placeholder:text-gray-400 text-slate-700 text-2xl border border-slate-200 rounded-md px-3 py-2 transition duration-300 ease focus:outline-none focus:border-slate-400 hover:border-slate-300 shadow-sm hover:shadow-md focus:shadow-lg  "
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
                    className="bg-blue-600 hover:bg-blue-800 text-2xl  font-bold rounded-md text-neutral-100 py-3 px-5 cursor-pointer shadow-xs hover:shadow-lg"
                    type="submit"
                >
                    Join Existing Game
                </button>
            </form>
        </div>
    );
};

export default App;
