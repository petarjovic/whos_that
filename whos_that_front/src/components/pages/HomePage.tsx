import { useNavigate } from "react-router";
import { useState } from "react";
import FirstVisitModal from "../misc/FirstVisitModal.tsx";
import PublicGamesImg from "@client/assets/PublicGames.svg";
import { useBetterAuthSession } from "../../lib/LayoutContextProvider.ts";
import CustomGameImg from "@client/assets/CustomGame.svg";

/**
 * Landing page with option to "create new game" or "join existing game" via room code
 */
const HomePage = () => {
    const [gameIdToJoin, setGameIdToJoin] = useState("");
    const navigate = useNavigate();
    const { session, isPending } = useBetterAuthSession();

    const handleJoinExistingGame = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        void navigate(`/play-game/${gameIdToJoin}`);
    };

    return (
        <>
            <div className="mt-6 flex h-full flex-col gap-5 text-center text-neutral-800 max-md:justify-end md:justify-around 2xl:gap-4">
                <button
                    className="hover:scale-102 rounded-xs sm:w-100 cursor-pointer text-center text-lg font-semibold"
                    onClick={() => {
                        void navigate(isPending ? "" : "/premade-games");
                    }}
                >
                    <div className="rounded-xs border border-neutral-400 bg-neutral-300">
                        <img
                            className="h-51 grayscale-25 2xl:h-55 mx-auto object-fill text-center"
                            src={PublicGamesImg}
                        ></img>
                    </div>
                    Browse Presets
                </button>
                <div className="h-0 w-full border-b border-black"></div>
                <button
                    className="hover:scale-102 cursor-pointer text-center text-lg font-semibold"
                    onClick={() => {
                        void navigate(isPending ? "" : session ? "/create-game" : "/login");
                    }}
                >
                    <div className="rounded-xs border border-neutral-400 bg-neutral-300">
                        {/* <div className="relative h-0 w-0">
                            <div className="z-1 top-37 left-24.5 rounded-xs absolute w-fit border border-orange-950 bg-orange-200 px-7 py-2 text-center text-base leading-none text-red-950 opacity-60">
                                Wanted
                            </div>
                        </div> */}
                        <img
                            className="h-51 grayscale-25 2xl:h-55 mx-auto object-fill text-center"
                            src={CustomGameImg}
                        ></img>
                    </div>
                    Create Custom Set
                </button>
                <div className="h-0 w-full border-b border-black"></div>
                {/* Form for joining room using code */}
                <div className="p-1 text-center">
                    <form
                        className="rounded-xs 2xl:py-2.25 flex justify-around border border-neutral-400 bg-neutral-300 py-1.5"
                        onSubmit={handleJoinExistingGame}
                    >
                        <input
                            id="gameIdInput"
                            name="gameIdInput"
                            type="text"
                            className="rounded-xs w-1/2 border border-neutral-400 bg-neutral-50 px-1 text-center font-medium placeholder:text-zinc-400 max-2xl:py-px 2xl:p-0.5"
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
                            className="hover:scale-102 2xl:py-0.75 ml-5 cursor-pointer rounded bg-red-400 px-1.5 py-px font-medium text-white hover:bg-red-500"
                            type="submit"
                        >
                            Join Game
                        </button>
                    </form>
                    <div className="p-px text-lg font-semibold">Join an Exisitng Game</div>
                </div>

                {/* Creator Signature */}
                <div className="flex flex-col text-neutral-500">
                    <p className="text-sm"> By Petar Jovic</p>
                </div>

                <FirstVisitModal />
            </div>
        </>
    );
};

export default HomePage;

