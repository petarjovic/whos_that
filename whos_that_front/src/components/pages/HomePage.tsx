import { useNavigate } from "react-router";
import { useEffect, useState } from "react";
import FirstVisitModal from "../misc/FirstVisitModal.tsx";
import { useBetterAuthSession } from "../../lib/LayoutContextProvider.ts";
import CustomGameImg from "@client/assets/CustomGame.svg";
import UsersPresetsImage from "@client/assets/safe.png";
import { IoMdSearch } from "react-icons/io";
import { GiExitDoor } from "react-icons/gi";
import { CardLayout } from "../misc/Cards.tsx";
import { Link } from "react-router";
import type { PresetInfo } from "@server/types";
import { PresetInfoSchema } from "@server/zodSchema";
import env from "../../lib/zodEnvSchema.ts";
import { FaHeart } from "react-icons/fa";
import type { ServerResponse } from "../../lib/types.ts";
import LoadingSpinner from "../misc/LoadingSpinner.tsx";

/**
 * Landing page with option to "create new game" or "join existing game" via room code
 */
const HomePage = () => {
    const nav = useNavigate();

    const [errorMsg, setErrorMsg] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    const [mostLikedGames, setMostLikedGames] = useState<PresetInfo>([]);
    const [mostRecentGames, setMostRecentGames] = useState<PresetInfo>([]);
    const [inputQuery, setInputQuery] = useState("");
    const [gameIdToJoin, setGameIdToJoin] = useState("");
    const { session, isPending } = useBetterAuthSession();

    //Fetch featured games
    useEffect(() => {
        if (!isPending) {
            const getFeaturedGames = async () => {
                try {
                    setIsLoading(true);
                    const response = await fetch(`${env.VITE_SERVER_URL}/api/featuredGames`, {
                        credentials: "include",
                        method: "GET",
                    });
                    if (response.ok) {
                        const validPresetInfo = PresetInfoSchema.safeParse(await response.json());
                        if (validPresetInfo.success) {
                            setMostLikedGames(validPresetInfo.data.slice(0, 3));
                            setMostRecentGames(validPresetInfo.data.slice(3, 6));
                        } else {
                            setErrorMsg(
                                "Client did not understand server response while getting featured games."
                            );
                        }
                    } else {
                        const errorData = (await response.json()) as ServerResponse;
                        setErrorMsg(errorData.message ?? "Error: Failed to get user's games.");
                    }
                } catch (error) {
                    console.error(error);
                } finally {
                    setIsLoading(false);
                }
            };
            void getFeaturedGames();
        }
    }, [isPending]);

    const handleSearch = (e?: React.FormEvent) => {
        if (e) {
            e.preventDefault();
            void nav(`/search/?q=${inputQuery}`);
        } else void nav(`/search/?q=`);
    };

    const handleJoinExistingGame = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        void nav(`/play-game/${gameIdToJoin}`);
    };

    if (errorMsg) throw new Error(errorMsg);
    return (
        <>
            <div className="h-full text-center text-neutral-700 max-2xl:mt-4 max-xl:flex max-xl:flex-col max-xl:gap-6 max-md:justify-end md:max-xl:justify-around xl:grid xl:grid-cols-2 xl:grid-rows-1 xl:gap-0 2xl:mt-3">
                <div className="flex h-full flex-col gap-2 max-xl:justify-end xl:border-r xl:border-neutral-400 xl:pr-4">
                    <div className="px-1 pt-1 text-center">
                        <form
                            className="flex items-center border border-neutral-500 bg-neutral-300 py-1.5 max-xl:justify-around max-sm:flex-col md:px-2 xl:justify-between 2xl:py-1.5"
                            onSubmit={handleSearch}
                        >
                            <input
                                id="searchBar"
                                type="search"
                                className="md:max-xl:w-5/10 max-sm:w-19/20 max-md:w-4/10 2xl:p-0.75 xl:w-6/10 border border-neutral-500 bg-neutral-50 px-1 text-left font-medium placeholder:text-zinc-400 max-2xl:py-px max-sm:mb-1.5 max-sm:mt-px xl:text-lg 2xl:pl-3"
                                maxLength={20}
                                placeholder="Search Preset Theme"
                                value={inputQuery}
                                onChange={(e) => {
                                    setInputQuery(e.target.value);
                                }}
                            />
                            <div className="flex max-sm:gap-5 sm:gap-2">
                                <button
                                    className="hover:scale-102 2xl:py-0.75 flex cursor-pointer items-center bg-red-400 px-1.5 py-px text-white hover:bg-red-500"
                                    type="submit"
                                >
                                    <IoMdSearch className="mr-px" size="1.5em" /> Search
                                </button>
                                <button
                                    className="hover:scale-102 2xl:py-0.75 flex cursor-pointer items-center bg-blue-400 px-1.5 py-px text-white hover:bg-blue-500"
                                    onClick={() => handleSearch()}
                                    type="button"
                                >
                                    Browse All
                                </button>
                            </div>
                        </form>
                        <div className="cursor-default p-px text-lg font-semibold xl:text-xl">
                            Search Presets
                        </div>
                    </div>
                    <div className="h-0 w-full self-center border-b border-neutral-400"></div>

                    <div className="col-start-1 cursor-pointer pt-2 text-center max-xl:hidden">
                        <div className="flex items-center justify-center gap-3 border border-neutral-700 bg-neutral-300 px-3 py-2 max-xl:w-full xl:w-fit">
                            {isLoading ? (
                                <LoadingSpinner />
                            ) : (
                                mostRecentGames.map(({ id, title, imageUrl, author }, i) => (
                                    <Link key={i} to={`/play-game?preset=${id}`}>
                                        <CardLayout name={title} imgSrc={imageUrl} key={i}>
                                            <p className="text-sm italic text-gray-600 max-xl:text-xs">
                                                {author ?? ""}
                                            </p>
                                        </CardLayout>
                                    </Link>
                                ))
                            )}
                        </div>
                        <div className="p-px text-lg font-semibold hover:text-blue-400 xl:text-xl">
                            Who's That Most Recent
                        </div>
                    </div>
                    <div className="h-0 w-full self-center border-b border-neutral-400 max-xl:hidden"></div>
                    <div className="col-start-1 cursor-pointer pt-2 text-center max-xl:hidden">
                        <div className="flex items-center justify-center gap-3 border border-neutral-700 bg-neutral-300 px-3 py-2 max-xl:w-full xl:w-fit">
                            {isLoading ? (
                                <LoadingSpinner />
                            ) : (
                                mostLikedGames.map(
                                    (
                                        { id, title, imageUrl, numLikes, author, userHasLiked },
                                        i
                                    ) => (
                                        <Link key={i} to={`/play-game?preset=${id}`}>
                                            <CardLayout name={title} imgSrc={imageUrl} key={i}>
                                                <div className="relative flex items-center justify-center">
                                                    <p className="relative right-5 p-px pb-0.5 text-sm italic text-gray-600 max-xl:text-xs">
                                                        {author ?? ""}
                                                    </p>
                                                    <p className="absolute bottom-0.5 right-1.5 text-xs text-gray-700">
                                                        <button
                                                            className="flex cursor-pointer items-center whitespace-pre-wrap align-sub"
                                                            disabled={true}
                                                        >
                                                            <div className="text-sm">
                                                                {numLikes}
                                                            </div>

                                                            <FaHeart
                                                                size={"1.4em"}
                                                                className={`${
                                                                    userHasLiked
                                                                        ? "text-gray-900"
                                                                        : "text-gray-500"
                                                                } ml-0.5`}
                                                            />
                                                        </button>
                                                    </p>
                                                </div>
                                            </CardLayout>
                                        </Link>
                                    )
                                )
                            )}
                        </div>
                        <div className="p-px text-lg font-semibold hover:text-blue-400 xl:text-xl">
                            Who's That Most Wanted
                        </div>
                    </div>
                </div>
                {/* Vertical Space on XL Screens */}
                <div className="flex flex-col gap-3 max-xl:justify-start xl:ml-4 xl:justify-center">
                    {/* Create New Preset */}
                    <button
                        className="hover:scale-102 col-start-2 cursor-pointer text-center text-lg font-semibold"
                        onClick={() => {
                            void nav(isPending ? "" : session ? "/create-game" : "/login");
                        }}
                    >
                        <div className="border border-neutral-500 bg-neutral-300 py-1">
                            <img
                                className="h-51 grayscale-25 2xl:h-55 max-xl:h-30 mx-auto object-fill text-center"
                                src={CustomGameImg}
                            ></img>
                        </div>
                        <div className="font-semib p-px text-lg hover:text-blue-400 xl:text-xl">
                            {session ? "Create New Preset" : "Create Custom Set"}
                        </div>
                    </button>
                    <div className="h-0 w-full self-center border-b border-neutral-400"></div>
                    {/* User's Games (if logged in) */}
                    {session ? (
                        <>
                            <button
                                className="hover:scale-102 col-start-2 cursor-pointer text-center text-lg font-semibold"
                                onClick={() => {
                                    void nav("/my-games");
                                }}
                            >
                                <div className="border border-neutral-500 bg-neutral-300 py-1">
                                    <img
                                        className="max-xl:h-30 h-51 grayscale-25 2xl:h-55 mx-auto object-fill text-center"
                                        src={UsersPresetsImage}
                                    ></img>
                                </div>
                                <div className="font-semib p-px text-lg hover:text-blue-400 xl:text-xl">
                                    Your Presets
                                </div>
                            </button>
                            <div className="h-0 w-full self-center border-b border-neutral-400"></div>
                        </>
                    ) : (
                        <></>
                    )}
                    {/* Form for joining room using code */}
                    <div className="p-1 text-center xl:col-start-2">
                        <form
                            className="flex items-center justify-around border border-neutral-500 bg-neutral-300 py-1.5 2xl:py-1.5"
                            onSubmit={handleJoinExistingGame}
                        >
                            <input
                                id="gameIdInput"
                                name="gameIdInput"
                                type="text"
                                className="w-1/2 border border-neutral-500 bg-neutral-50 px-1 text-center font-medium placeholder:text-zinc-400 max-2xl:py-px xl:text-lg 2xl:p-0.5"
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
                                className="hover:scale-102 2xl:py-0.75 ml-5 flex cursor-pointer items-center bg-red-400 px-1.5 py-px font-medium text-white hover:bg-red-500"
                                type="submit"
                            >
                                <GiExitDoor className="relative bottom-px mr-0.5" size="1.25em" />{" "}
                                Join Game
                            </button>
                        </form>
                        <div className="cursor-default p-px text-lg font-semibold xl:text-xl">
                            Join an Exisitng Game
                        </div>
                    </div>
                </div>

                {/* Creator Signature */}
                <div className="text-neutral-500 xl:absolute xl:bottom-3 xl:left-[62%]">
                    <p className="text-sm"> By Petar Jovic</p>
                </div>

                <FirstVisitModal />
            </div>
        </>
    );
};

export default HomePage;

