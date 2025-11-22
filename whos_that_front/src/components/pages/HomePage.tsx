import { useNavigate } from "react-router";
import { useState } from "react";
import FirstVisitModal from "../misc/FirstVisitModal.tsx";
import PublicGamesImg from "@client/assets/PublicGames.svg";
import { useBetterAuthSession } from "../../lib/LayoutContextProvider.ts";
import CustomGameImg from "@client/assets/CustomGame.svg";
import { IoMdSearch } from "react-icons/io";
import { GiExitDoor } from "react-icons/gi";
import { CardLayout } from "../misc/Cards.tsx";
import { Link } from "react-router";
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
            <div className="h-full text-center text-neutral-800 max-2xl:mt-4 max-xl:flex max-xl:flex-col max-xl:gap-6 max-md:justify-end md:max-xl:justify-around xl:grid xl:grid-cols-2 xl:grid-rows-1 xl:gap-4 2xl:mt-3">
                <div className="flex h-full flex-col gap-2 max-xl:justify-end xl:border-r xl:border-neutral-600 xl:pr-4">
                    <div className="px-1 pt-1 text-center">
                        <form
                            className="rounded-xs 2xl:py-2.25 flex justify-around border border-neutral-400 bg-neutral-300 py-1.5"
                            onSubmit={handleJoinExistingGame}
                        >
                            <input
                                id="searchBar"
                                type="search"
                                className="rounded-xs md:max-xl:w-7/10 max-md:w-6/10 border border-neutral-400 bg-neutral-50 px-1 text-left font-medium placeholder:text-zinc-400 max-2xl:py-px xl:w-3/4 2xl:p-0.5"
                                required
                                minLength={6}
                                maxLength={6}
                                placeholder="Search Game Theme"
                                value={gameIdToJoin}
                                onChange={(e) => {
                                    setGameIdToJoin(e.target.value);
                                }}
                            />
                            <button
                                className="hover:scale-102 2xl:py-0.75 flex cursor-pointer rounded bg-red-400 px-1.5 py-px text-white hover:bg-red-500"
                                type="button"
                            >
                                <IoMdSearch className="mr-px" size="1.5em" /> Search
                            </button>
                        </form>
                        <div className="p-px text-lg font-semibold">Search Presets</div>
                    </div>
                    <div className="h-0 w-full self-center border-b border-neutral-600"></div>

                    <div className="rounded-xs col-start-1 cursor-pointer pt-2 text-center">
                        <div className="rounded-xs 2xl:py-2.25 flex w-fit justify-around gap-4 border border-neutral-400 bg-neutral-300 px-4 py-2">
                            <Link to={`/play-game?preset=${"REPLACE LATER"}`}>
                                <CardLayout name={"test"} imgSrc={CustomGameImg}>
                                    <p className="text-center text-xs italic text-gray-600 max-md:hidden">
                                        Pepsi Cola
                                    </p>
                                </CardLayout>
                            </Link>
                            <Link to={`/play-game?preset=${"REPLACE LATER"}`}>
                                <CardLayout name={"test"} imgSrc={CustomGameImg}>
                                    <p className="text-center text-xs italic text-gray-600 max-md:hidden">
                                        Pepsi Cola
                                    </p>
                                </CardLayout>
                            </Link>
                            <Link to={`/play-game?preset=${"REPLACE LATER"}`}>
                                <CardLayout name={"test"} imgSrc={CustomGameImg}>
                                    <p className="text-center text-xs italic text-gray-600 max-md:hidden">
                                        Pepsi Cola
                                    </p>
                                </CardLayout>
                            </Link>
                        </div>
                        <div className="p-px text-lg font-semibold">Who's That Most Recent</div>
                    </div>
                    <div className="h-0 w-full self-center border-b border-neutral-600"></div>
                    <div className="rounded-xs col-start-1 cursor-pointer pt-2 text-center max-xl:hidden">
                        <div className="rounded-xs 2xl:py-2.25 flex w-fit justify-around gap-4 border border-neutral-400 bg-neutral-300 px-4 py-2">
                            <Link to={`/play-game?preset=${"REPLACE LATER"}`}>
                                <CardLayout name={"test"} imgSrc={CustomGameImg}>
                                    <p className="text-center text-xs italic text-gray-600">
                                        Pepsi Cola
                                    </p>
                                </CardLayout>
                            </Link>
                            <Link to={`/play-game?preset=${"REPLACE LATER"}`}>
                                <CardLayout name={"test"} imgSrc={CustomGameImg}>
                                    <p className="text-center text-xs italic text-gray-600">
                                        Pepsi Cola
                                    </p>
                                </CardLayout>
                            </Link>
                            <Link to={`/play-game?preset=${"REPLACE LATER"}`}>
                                <CardLayout name={"test"} imgSrc={CustomGameImg}>
                                    <p className="text-center text-xs italic text-gray-600">
                                        Pepsi Cola
                                    </p>
                                </CardLayout>
                            </Link>
                        </div>
                        <div className="p-px text-lg font-semibold">Who's That Most Wanted</div>
                    </div>
                </div>

                <div className="flex flex-col gap-3 max-xl:justify-start xl:justify-center">
                    <button
                        className="hover:scale-102 col-start-2 cursor-pointer text-center text-lg font-semibold"
                        onClick={() => {
                            void navigate(isPending ? "" : session ? "/create-game" : "/login");
                        }}
                    >
                        <div className="rounded-xs border border-neutral-400 bg-neutral-300">
                            <img
                                className="h-51 grayscale-25 2xl:h-55 mx-auto object-fill text-center"
                                src={CustomGameImg}
                            ></img>
                        </div>
                        Create Custom Set
                    </button>
                    <div className="h-0 w-full self-center border-b border-neutral-600"></div>
                    {/* Form for joining room using code */}
                    <div className="p-1 text-center xl:col-start-2">
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
                                className="hover:scale-102 2xl:py-0.75 ml-5 flex cursor-pointer rounded bg-red-400 px-1.5 py-px font-medium text-white hover:bg-red-500"
                                type="submit"
                            >
                                <GiExitDoor className="relative top-0.5 mr-0.5" size="1.25em" />{" "}
                                Join Game
                            </button>
                        </form>
                        <div className="p-px text-lg font-semibold">Join an Exisitng Game</div>
                    </div>
                </div>

                {/* Creator Signature */}
                <div className="text-neutral-500 xl:absolute xl:bottom-3 xl:left-[47%]">
                    <p className="text-sm"> By Petar Jovic</p>
                </div>

                <FirstVisitModal />
            </div>
        </>
    );
};

export default HomePage;

