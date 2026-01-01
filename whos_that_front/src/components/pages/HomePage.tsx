import { useNavigate } from "react-router";
import { useEffect, useState } from "react";
import FirstVisitModal from "../misc/FirstVisitModal.tsx";
import UpdateModal from "../misc/UpdateModal.tsx";
import { useBetterAuthSession } from "../../lib/hooks.ts";
import CustomGameImg from "@client/assets/CustomGame.svg";
import UsersPresetsImage from "@client/assets/safe.png";
import { IoMdSearch } from "react-icons/io";
import { GiExitDoor } from "react-icons/gi";
import { CardLayout } from "../misc/Cards.tsx";
import { Link } from "react-router";
import type { UrlPresetInfo } from "@server/types";
import { UrlPresetInfoListSchema } from "@server/zodSchema";
import env from "../../lib/zodEnvSchema.ts";
import type { ServerResponse } from "../../lib/types.ts";
import LoadingSpinner from "../misc/LoadingSpinner.tsx";
import LikeButton from "../misc/LikeButton.tsx";

/**
 * Landing page with option to "create new game" or "join existing game" via room code
 */
const HomePage = () => {
    const nav = useNavigate();

    const [errorMsg, setErrorMsg] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    const [trendingGames, setTrendingGames] = useState<UrlPresetInfo[]>([]);
    const [newestGames, setNewestGames] = useState<UrlPresetInfo[]>([]);
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
                        const validPresetInfo = UrlPresetInfoListSchema.safeParse(
                            await response.json()
                        );
                        if (validPresetInfo.success) {
                            setTrendingGames(validPresetInfo.data.slice(0, 3));
                            setNewestGames(validPresetInfo.data.slice(3, 6));
                        } else {
                            setErrorMsg(
                                "Client did not understand server response while getting featured games."
                            );
                        }
                    } else {
                        const errorData = (await response.json()) as ServerResponse;
                        setErrorMsg(errorData.message);
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
            <div className="mx-auto mb-3 h-full text-center text-neutral-800 max-2xl:mt-4 max-xl:mt-20 max-xl:flex max-xl:flex-col max-xl:gap-6 max-md:justify-end max-sm:px-3 md:max-xl:justify-around xl:grid xl:grid-cols-2 xl:grid-rows-1 xl:gap-0 2xl:mt-3">
                <div className="flex h-full flex-col gap-2 max-xl:justify-end xl:border-r xl:border-neutral-950 xl:pr-4">
                    {/* Search Bar */}
                    <div className="px-1 pt-1 text-center">
                        <form
                            className="flex items-center border border-neutral-400 bg-neutral-300 py-1.5 max-xl:justify-around max-sm:flex-col md:px-2 xl:justify-between"
                            onSubmit={handleSearch}
                        >
                            <input
                                id="searchBar"
                                type="search"
                                className="border border-neutral-400 bg-neutral-50 px-1 text-left text-lg font-medium placeholder:text-zinc-400 max-2xl:py-0.75 max-md:w-4/10 max-sm:mt-px max-sm:mb-1.5 max-sm:w-19/20 md:max-xl:w-5/10 xl:w-6/10 2xl:p-0.75 2xl:pl-3"
                                maxLength={20}
                                placeholder="Search by Game Title/Theme"
                                value={inputQuery}
                                onChange={(e) => {
                                    setInputQuery(e.target.value);
                                }}
                            />
                            <div className="flex max-h-8/10 max-sm:mt-0.5 max-sm:gap-5 sm:gap-2">
                                <button
                                    className="flex cursor-pointer items-center bg-red-400 px-1.5 font-medium text-white hover:scale-102 hover:bg-red-500 active:scale-98 max-sm:py-0.5 sm:py-0.75"
                                    type="submit"
                                >
                                    <IoMdSearch className="mr-px" size="1.5em" /> Search
                                </button>
                                <button
                                    className="flex cursor-pointer items-center bg-blue-400 px-1.5 font-medium text-white hover:scale-102 hover:bg-blue-500 active:scale-98 max-sm:py-0.5 sm:py-0.75"
                                    onClick={() => void nav("/search/?sort=trending")}
                                    type="button"
                                >
                                    Browse All
                                </button>
                            </div>
                        </form>
                        <div className="cursor-default p-px text-lg font-semibold xl:text-xl">
                            Search Games
                        </div>
                    </div>
                    <div className="h-0 w-full self-center border-b border-neutral-950"></div>
                    {/* Trending Games */}
                    <div className="col-start-1 cursor-pointer pt-2 text-center max-xl:hidden">
                        <div className="flex items-center justify-center gap-3 border-neutral-700 bg-neutral-400 px-3 py-2 max-xl:w-full xl:w-fit">
                            {isLoading ? (
                                <LoadingSpinner />
                            ) : (
                                trendingGames.map(
                                    (
                                        { id, title, imageUrl, numLikes, author, userHasLiked },
                                        i
                                    ) => (
                                        <Link key={i} to={`/play-game?preset=${id}`}>
                                            <CardLayout name={title} imgSrc={imageUrl} key={i}>
                                                <div className="relative flex items-center justify-center">
                                                    <p className="relative right-5 p-px pb-0.5 text-sm text-neutral-700 italic max-xl:text-xs">
                                                        {author ?? ""}
                                                    </p>
                                                    <div className="absolute right-2.25 bottom-0.75 text-xs text-neutral-700">
                                                        <LikeButton
                                                            id={id}
                                                            numLikes={numLikes}
                                                            userHasLiked={userHasLiked}
                                                            size={"S"}
                                                        />
                                                    </div>
                                                </div>
                                            </CardLayout>
                                        </Link>
                                    )
                                )
                            )}
                        </div>
                        <Link
                            to={"/search/?sort=trending"}
                            className="p-px text-lg font-semibold hover:text-blue-400 xl:text-xl"
                        >
                            Whos-That&apos;s Most Wanted
                        </Link>
                    </div>
                    <div className="h-0 w-full self-center border-b border-neutral-950 max-xl:hidden"></div>
                    {/* Newest Games */}
                    <div className="col-start-1 cursor-pointer pt-2 text-center max-xl:hidden">
                        <div className="flex items-center justify-center gap-3 border-neutral-700 bg-neutral-400 px-3 py-2 max-xl:w-full xl:w-fit">
                            {isLoading ? (
                                <LoadingSpinner />
                            ) : (
                                newestGames.map(
                                    (
                                        { id, title, imageUrl, author, numLikes, userHasLiked },
                                        i
                                    ) => (
                                        <Link key={i} to={`/play-game?preset=${id}`}>
                                            <CardLayout name={title} imgSrc={imageUrl} key={i}>
                                                <div className="relative flex items-center justify-center">
                                                    <p className="relative right-5 p-px pb-0.5 text-sm text-neutral-700 italic max-xl:text-xs">
                                                        {author ?? ""}
                                                    </p>
                                                    <div className="absolute right-2.25 bottom-0.75 text-xs text-neutral-700">
                                                        <LikeButton
                                                            id={id}
                                                            numLikes={numLikes}
                                                            userHasLiked={userHasLiked}
                                                            size={"S"}
                                                        />
                                                    </div>
                                                </div>
                                            </CardLayout>
                                        </Link>
                                    )
                                )
                            )}
                        </div>
                        <Link
                            to={"/search/?sort=newest"}
                            className="p-px text-lg font-semibold hover:text-blue-400 xl:text-xl"
                        >
                            Whos-That&apos;s Newest
                        </Link>
                    </div>
                </div>
                {/* Vertical Space on XL Screens */}
                <div className="flex flex-col gap-3 max-xl:justify-start xl:ml-4 xl:justify-center">
                    {/* Create New Preset */}
                    <button
                        className="col-start-2 cursor-pointer text-center text-lg font-semibold hover:scale-102"
                        onClick={() => {
                            void nav(isPending ? "" : session ? "/create-game" : "/login");
                        }}
                    >
                        <div className="border border-neutral-400 bg-neutral-300 py-1">
                            <img
                                className="neutralscale-25 mx-auto h-51 object-fill text-center max-xl:h-30 2xl:h-55"
                                src={CustomGameImg}
                            ></img>
                        </div>
                        <div className="font-semib p-px text-lg hover:text-blue-400 xl:text-xl">
                            {session ? "Create New Game" : "Create New Custom Game"}
                        </div>
                    </button>
                    <div className="h-0 w-full self-center border-b border-neutral-950"></div>
                    {/* User's Games (if logged in) */}
                    {session ? (
                        <>
                            <button
                                className="col-start-2 cursor-pointer text-center text-lg font-semibold hover:scale-102"
                                onClick={() => void nav("/my-games")}
                            >
                                <div className="border border-neutral-400 bg-neutral-300 py-1">
                                    <img
                                        className="neutralscale-25 mx-auto h-51 object-fill text-center max-xl:h-30 2xl:h-55"
                                        src={UsersPresetsImage}
                                    ></img>
                                </div>
                                <div className="font-semib p-px text-lg hover:text-blue-400 xl:text-xl">
                                    Your Games
                                </div>
                            </button>
                            <div className="h-0 w-full self-center border-b border-neutral-950"></div>
                        </>
                    ) : (
                        <></>
                    )}
                    {/* Join Room */}
                    <div className="p-1 text-center xl:col-start-2">
                        <form
                            className="flex items-center justify-around border border-neutral-400 bg-neutral-300 py-1.5 2xl:py-1.5"
                            onSubmit={handleJoinExistingGame}
                        >
                            <input
                                id="gameIdInput"
                                name="gameIdInput"
                                type="text"
                                className="w-1/2 border border-neutral-400 bg-neutral-50 px-1 py-0.5 text-center font-medium placeholder:text-zinc-400 xl:text-lg"
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
                                className="ml-5 flex cursor-pointer items-center bg-red-400 px-1.5 py-0.75 font-medium text-white hover:scale-102 hover:bg-red-500 active:scale-98 2xl:py-1"
                                type="submit"
                            >
                                <GiExitDoor
                                    className="relative bottom-px mr-0.5 2xl:mr-1"
                                    size="1.25em"
                                />{" "}
                                Join Room
                            </button>
                        </form>
                        <div className="cursor-default p-px text-lg font-semibold xl:text-xl">
                            Have a Room Code?
                        </div>
                    </div>
                </div>

                {/* Creator Signature */}
                <div className="text-neutral-500 xl:absolute xl:bottom-3 xl:left-[62%]">
                    <p className="text-sm"> By Petar Jovic</p>
                </div>

                <FirstVisitModal />
                <UpdateModal />
            </div>
        </>
    );
};

export default HomePage;
