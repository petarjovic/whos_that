import { useEffect, useState } from "react";
import env from "../../lib/zodEnvSchema.ts";
import { SearchResponseSchema } from "@server/zodSchema";
import type { ServerResponse } from "src/lib/types";
import type { UrlPresetInfo, PaginationInfo } from "@server/types";
import { useBetterAuthSession } from "../../lib/LayoutContextProvider.ts";
import LoadingSpinner from "../misc/LoadingSpinner";
import { Link } from "react-router";
import { CardLayout } from "../misc/Cards";
import { logError } from "../../lib/logger.ts";
import { FaHeart } from "react-icons/fa6";
import { useSearchParams } from "react-router";
import { IoMdSearch } from "react-icons/io";
import { likeGame } from "../../lib/apiHelpers.ts";

const SearchPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();

    const [isLoading, setIsLoading] = useState(true);
    const [gamesList, setGamesList] = useState<UrlPresetInfo[]>([]);
    const [pageInfo, setPageInfo] = useState<PaginationInfo>();
    const [errorMsg, setErrorMsg] = useState("");
    const [searchInput, setSearchInput] = useState(searchParams.get("q") ?? "");

    const { session, isPending } = useBetterAuthSession();

    // Debounce search input
    useEffect(() => {
        const currentQuery = searchParams.get("q") ?? "";
        const timer = setTimeout(() => {
            if (searchInput.length < 3 || searchInput === currentQuery) return;
            setSearchParams((prev) => ({ ...Object.fromEntries(prev), q: searchInput, page: "1" }));
        }, 500);
        return () => clearTimeout(timer);
    }, [searchInput, setSearchParams]);

    //Fetch games being searched for
    useEffect(() => {
        const abortController = new AbortController();
        const getPremadeGames = async () => {
            setIsLoading(true);
            try {
                const page = parseInt(searchParams.get("page") ?? "1");
                const limit = parseInt(searchParams.get("limit") ?? "30");

                const url = new URL(`${env.VITE_SERVER_URL}/api/search`);
                url.searchParams.set("q", searchParams.get("q") ?? "");
                url.searchParams.set("page", Number.isNaN(page) ? "1" : page.toString());
                url.searchParams.set("limit", Number.isNaN(limit) ? "30" : limit.toString());
                url.searchParams.set(
                    "sort",
                    searchParams.get("sort") === "newest" ? "newest" : "likes"
                );

                const response = await fetch(url, {
                    credentials: "include",
                    method: "GET",
                    signal: abortController.signal,
                });

                if (response.ok) {
                    const validSearchRes = SearchResponseSchema.safeParse(await response.json());
                    if (validSearchRes.success) {
                        setGamesList(validSearchRes.data.games);
                        setPageInfo(validSearchRes.data.pagination);
                    } else {
                        setErrorMsg(
                            "Client did not understand server response while getting user's games."
                        );
                    }
                } else {
                    const errorData = (await response.json()) as ServerResponse;
                    setErrorMsg(errorData.message ?? "Error: Failed to get user's games.");
                }
            } catch (error) {
                if (error instanceof Error && error.name === "AbortError") return;
                logError(error);
                if (error instanceof Error) {
                    setErrorMsg(error.message);
                } else setErrorMsg("Error: Failed to get user's games.");
            }
            setIsLoading(false);
        };
        void getPremadeGames();
        return () => abortController.abort();
    }, [searchParams]);

    /**
     * Handles user liking and unliking games
     */
    const handleLikeGame = async (e: React.MouseEvent<HTMLButtonElement>, gameId: string) => {
        e.preventDefault();
        e.stopPropagation();
        if (!session) return;

        //Update UI
        setGamesList((prev) =>
            prev.map((game) =>
                game.id === gameId
                    ? {
                          ...game,
                          userHasLiked: !game.userHasLiked,
                          numLikes: game.userHasLiked ? game.numLikes - 1 : game.numLikes + 1,
                      }
                    : game
            )
        );

        //Like game and catch errors
        try {
            const response = await likeGame(gameId);

            if (response.ok) {
                return;
            } else {
                const errorData = (await response.json()) as ServerResponse;
                setErrorMsg(errorData.message ?? "Failed to like game.");
            }
        } catch (error) {
            logError(error);
            if (error instanceof Error) {
                setErrorMsg(error.message);
            } else setErrorMsg("Failed to like game.");
        }
    };

    if (errorMsg) throw new Error(errorMsg);
    if (isPending) return <LoadingSpinner />;
    return (
        <>
            {/* Search Bar */}
            <form
                className="max-sm:w-9/10 sm:w-7/10 md:w-6/10 rounded-xs flex items-center justify-around border border-neutral-500 bg-neutral-300 py-1.5 max-xl:mb-1 max-xl:mt-4 lg:w-1/3 xl:mb-2 xl:mt-5"
                onSubmit={(e) => e.preventDefault()}
            >
                <input
                    id="searchBar"
                    type="search"
                    className="xl:w-9/10 max-xl:w-8/10 rounded-xs border border-neutral-500 bg-gray-50 px-1 text-left font-medium placeholder:text-zinc-400 max-2xl:py-px xl:text-lg 2xl:p-px 2xl:py-0.5 2xl:pl-3"
                    maxLength={20}
                    placeholder="Search Presets"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                />
                <button
                    type="submit"
                    className="rounded-xs flex cursor-pointer items-center bg-red-400 px-1 py-px text-white 2xl:py-0.5"
                >
                    <IoMdSearch size="1.5em" />
                </button>
            </form>
            {/* Search Results */}
            {isLoading ? (
                <LoadingSpinner />
            ) : (
                <div className="mt-3 flex flex-wrap items-center justify-evenly gap-4 xl:mx-10">
                    {gamesList.length === 0 && (
                        <p className="mx-auto mt-[40%] text-center text-xl font-medium">
                            Sorry, no presets match your search!{" "}
                            <Link
                                to={"/create-game"}
                                className="text-blue-500 underline hover:italic hover:text-red-300"
                            >
                                Make your own
                            </Link>
                            !
                        </p>
                    )}
                    {gamesList.map(({ id, title, imageUrl, numLikes, author, userHasLiked }, i) => (
                        <Link key={i} to={`/play-game?preset=${id}`}>
                            <CardLayout name={title} imgSrc={imageUrl} key={i}>
                                <div className="mb-0.75 relative flex items-center justify-center max-xl:mb-px">
                                    <p className="relative right-5 text-center text-sm italic text-gray-600 max-xl:text-xs">
                                        {author ?? ""}{" "}
                                    </p>
                                    <p className="absolute -bottom-px right-2 text-base text-gray-700">
                                        <button
                                            className="flex cursor-pointer items-center whitespace-pre-wrap align-sub"
                                            onClick={(e) => {
                                                handleLikeGame(e, id);
                                            }}
                                            title={userHasLiked ? "Unlike Game" : "Like Game"}
                                        >
                                            {numLikes}{" "}
                                            <FaHeart
                                                size={"1.3em"}
                                                className={`${
                                                    userHasLiked ? "text-red-500" : "text-zinc-500"
                                                } mb-px align-middle transition-transform hover:text-red-600 max-md:text-xl`}
                                            />
                                        </button>
                                    </p>
                                </div>
                            </CardLayout>
                        </Link>
                    ))}
                </div>
            )}
            {/* Page Controls */}
            {pageInfo && pageInfo.totalPages > 1 && (
                <div className="mb-2 mt-4 flex items-center gap-1 text-lg text-neutral-600">
                    <button
                        onClick={() =>
                            setSearchParams({ ...Object.fromEntries(searchParams), page: "1" })
                        }
                        disabled={pageInfo.page === 1}
                        className="tracking-tightest scale-130 mr-1 cursor-pointer py-1 hover:text-blue-500 disabled:cursor-default disabled:text-gray-300"
                    >
                        &lt;&lt;
                    </button>
                    <button
                        onClick={() =>
                            setSearchParams({
                                ...Object.fromEntries(searchParams),
                                page: (pageInfo.page - 1).toString(),
                            })
                        }
                        disabled={pageInfo.page === 1}
                        className="scale-120 cursor-pointer px-2 py-1 text-lg hover:text-blue-500 disabled:cursor-default disabled:text-gray-300"
                    >
                        &lt;
                    </button>
                    {pageInfo.page > 2 && <span>...</span>}
                    {[pageInfo.page - 1, pageInfo.page, pageInfo.page + 1]
                        .filter((p) => p > 0 && p <= pageInfo.totalPages)
                        .map((p) => (
                            <button
                                key={p}
                                onClick={() =>
                                    setSearchParams({
                                        ...Object.fromEntries(searchParams),
                                        page: p.toString(),
                                    })
                                }
                                className={`cursor-pointer px-2 py-1 font-medium ${p === pageInfo.page ? "text-red-400" : "hover:text-blue-500"}`}
                            >
                                {p}
                            </button>
                        ))}
                    {pageInfo.page < pageInfo.totalPages - 1 && <span>...</span>}
                    <button
                        onClick={() =>
                            setSearchParams({
                                ...Object.fromEntries(searchParams),
                                page: (pageInfo.page + 1).toString(),
                            })
                        }
                        disabled={pageInfo.page === pageInfo.totalPages}
                        className="scale-120 cursor-pointer px-1 py-1 text-lg hover:text-blue-500 disabled:cursor-default disabled:text-gray-300"
                    >
                        &gt;
                    </button>
                    <button
                        onClick={() =>
                            setSearchParams({
                                ...Object.fromEntries(searchParams),
                                page: pageInfo.totalPages.toString(),
                            })
                        }
                        disabled={pageInfo.page === pageInfo.totalPages}
                        className="tracking-tightest scale-130 ml-1 cursor-pointer py-1 text-lg hover:text-blue-500 disabled:cursor-default disabled:text-gray-300"
                    >
                        &gt;&gt;
                    </button>
                    <div className="ml-2 flex items-center gap-2 text-sm">
                        <label htmlFor="limit-select"># of Results:</label>
                        <select
                            id="limit-select"
                            value={pageInfo.limit}
                            onChange={(e) =>
                                setSearchParams({
                                    ...Object.fromEntries(searchParams),
                                    limit: e.target.value,
                                    page: "1",
                                })
                            }
                            className="content-center rounded border border-gray-500 bg-white py-1 hover:cursor-pointer"
                        >
                            <option value="10" className="cursor-pointer">
                                10
                            </option>
                            <option value="20" className="cursor-pointer">
                                20
                            </option>
                            <option value="30" className="cursor-pointer">
                                30
                            </option>
                            <option value="40" className="cursor-pointer">
                                40
                            </option>
                            <option value="50" className="cursor-pointer">
                                50
                            </option>
                        </select>
                    </div>
                </div>
            )}
        </>
    );
};
export default SearchPage;
