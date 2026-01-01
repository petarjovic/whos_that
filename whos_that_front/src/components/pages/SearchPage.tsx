import { useEffect, useState } from "react";
import env from "../../lib/zodEnvSchema.ts";
import { SearchResponseSchema } from "@server/zodSchema";
import { serverResponseSchema } from "../../lib/zodSchema.ts";
import type { UrlPresetInfo, PaginationInfo } from "@server/types";
import LoadingSpinner from "../misc/LoadingSpinner";
import { Link } from "react-router";
import { CardLayout } from "../misc/Cards";
import { logError } from "../../lib/logger.ts";
import { useSearchParams } from "react-router";
import { IoMdSearch } from "react-icons/io";
import LikeButton from "../misc/LikeButton.tsx";
import { MdFirstPage, MdLastPage, MdArrowBackIosNew, MdArrowForwardIos } from "react-icons/md";

const SearchPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();

    const [isLoading, setIsLoading] = useState(true);
    const [gamesList, setGamesList] = useState<UrlPresetInfo[]>([]);
    const [pageInfo, setPageInfo] = useState<PaginationInfo>();
    const [errorMsg, setErrorMsg] = useState("");
    const [searchInput, setSearchInput] = useState(searchParams.get("q") ?? "");

    // Debounce search input
    useEffect(() => {
        const currentQuery = searchParams.get("q") ?? "";
        const timer = setTimeout(() => {
            if (searchInput.length < 3 || searchInput === currentQuery) return;
            setSearchParams((prev) => ({ ...Object.fromEntries(prev), q: searchInput, page: "1" }));
        }, 500);
        return () => clearTimeout(timer);
    }, [searchInput, searchParams, setSearchParams]);

    //Fetch games being searched for
    useEffect(() => {
        const abortController = new AbortController();
        const getPremadeGames = async () => {
            setIsLoading(true);
            try {
                const page = parseInt(searchParams.get("page") ?? "1");
                const limit = parseInt(searchParams.get("limit") ?? "50");

                const url = new URL(`${env.VITE_SERVER_URL}/api/search`);
                url.searchParams.set("q", searchParams.get("q") ?? "");
                url.searchParams.set("page", Number.isNaN(page) ? "1" : page.toString());
                url.searchParams.set("limit", Number.isNaN(limit) ? "50" : limit.toString());
                const sortParam = searchParams.get("sort");
                url.searchParams.set(
                    "sort",
                    sortParam === "newest" || sortParam === "likes" || sortParam === "trending"
                        ? sortParam
                        : "trending"
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
                            "Client did not understand server response while searching games."
                        );
                    }
                } else {
                    const errorData = serverResponseSchema.safeParse(await response.json());
                    setErrorMsg(errorData.data?.message ?? "Error: Failed to search for games.");
                }
            } catch (error) {
                if (error instanceof Error && error.name === "AbortError") return;
                logError(error);
                if (error instanceof Error) {
                    setErrorMsg(error.message);
                } else setErrorMsg("Error: Failed to get search for games.");
            }
            setIsLoading(false);
        };
        void getPremadeGames();
        return () => abortController.abort();
    }, [searchParams]);

    if (errorMsg) throw new Error(errorMsg);
    return (
        <>
            {/* Search Bar */}
            <form
                className="flex items-center justify-around gap-2 rounded-xs border border-neutral-500 bg-neutral-300 py-1.75 pr-1.75 pl-1.5 font-medium max-xl:mt-4 max-xl:mb-1 max-sm:w-9/10 sm:w-7/10 md:w-6/10 lg:w-1/3 xl:mt-5 xl:mb-2"
                onSubmit={(e) => {
                    e.preventDefault();
                }}
            >
                <input
                    id="searchBar"
                    type="search"
                    className="rounded-xs border border-neutral-500 bg-gray-50 px-1 text-left font-medium placeholder:text-zinc-400 max-2xl:py-px max-xl:w-8/10 xl:w-9/10 xl:text-lg 2xl:p-px 2xl:py-0.5 2xl:pl-3"
                    maxLength={20}
                    placeholder="Search Presets"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                />
                <button
                    type="submit"
                    className="flex cursor-pointer items-center rounded-xs bg-red-400 px-1 py-px text-white 2xl:py-0.5"
                >
                    <IoMdSearch size="1.5em" />
                </button>
                <select
                    className="flex cursor-pointer items-center justify-center rounded-xs bg-blue-400 p-0.75 text-center text-white"
                    value={searchParams.get("sort") ?? "trending"}
                    onChange={(e) =>
                        setSearchParams({
                            ...Object.fromEntries(searchParams),
                            sort: e.target.value,
                            page: "1",
                        })
                    }
                >
                    <option className="font-medium" value="trending">
                        Trending
                    </option>
                    <option className="font-medium" value="likes">
                        Likes
                    </option>
                    <option className="font-medium" value="newest">
                        Newest
                    </option>
                </select>
            </form>
            {/* Search Results */}
            {isLoading ? (
                <LoadingSpinner />
            ) : (
                <div className="mt-3 flex flex-wrap items-center justify-evenly gap-4 border border-black bg-neutral-300 px-2 py-3 xl:mx-5">
                    {gamesList.length === 0 && (
                        <p className="mx-auto mt-[40%] text-center text-xl font-medium">
                            Sorry, no presets match your search!{" "}
                            <Link
                                to={"/create-game"}
                                className="text-blue-500 underline hover:text-red-300 hover:italic"
                            >
                                Make your own
                            </Link>
                            !
                        </p>
                    )}
                    {gamesList.map(({ id, title, imageUrl, numLikes, author, userHasLiked }, i) => (
                        <Link key={i} to={`/play-game?preset=${id}`}>
                            <CardLayout name={title} imgSrc={imageUrl} key={i}>
                                <div className="relative mb-0.75 flex items-center justify-center max-xl:mb-px">
                                    <p className="relative right-5 text-center text-sm text-gray-600 italic max-xl:text-xs">
                                        {author ?? ""}{" "}
                                    </p>
                                    <p className="absolute right-2 -bottom-px text-base text-gray-700">
                                        <LikeButton
                                            id={id}
                                            userHasLiked={userHasLiked}
                                            numLikes={numLikes}
                                        />
                                    </p>
                                </div>
                            </CardLayout>
                        </Link>
                    ))}
                </div>
            )}
            {/* Page Controls */}
            {pageInfo && pageInfo.totalPages > 1 && (
                <div className="mt-4 mb-2 flex items-center gap-1 text-lg text-neutral-600">
                    <span className="text-sm">Page: </span>
                    <button
                        onClick={() =>
                            setSearchParams({ ...Object.fromEntries(searchParams), page: "1" })
                        }
                        disabled={pageInfo.page === 1}
                        className="relative left-2 mr-1 cursor-pointer py-1 hover:text-blue-500 disabled:cursor-default disabled:text-gray-300"
                    >
                        <MdFirstPage size="2.2em" />
                    </button>
                    <button
                        onClick={() =>
                            setSearchParams({
                                ...Object.fromEntries(searchParams),
                                page: (pageInfo.page - 1).toString(),
                            })
                        }
                        disabled={pageInfo.page === 1}
                        className="cursor-pointer px-2 py-1 text-lg hover:text-blue-500 disabled:cursor-default disabled:text-gray-300"
                    >
                        <MdArrowBackIosNew size="1.2em" />
                    </button>
                    {pageInfo.page > 2 && <span className="text-neutral-400">...</span>}
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
                                className={`cursor-pointer px-2 py-1 font-medium ${p === pageInfo.page ? "text-red-400" : "text-neutral-500 hover:text-blue-500"}`}
                            >
                                {p}
                            </button>
                        ))}
                    {pageInfo.page < pageInfo.totalPages - 1 && (
                        <span className="text-neutral-400">...</span>
                    )}
                    <button
                        onClick={() =>
                            setSearchParams({
                                ...Object.fromEntries(searchParams),
                                page: (pageInfo.page + 1).toString(),
                            })
                        }
                        disabled={pageInfo.page === pageInfo.totalPages}
                        className="ml-1 cursor-pointer px-1 py-1 text-lg hover:text-blue-500 disabled:cursor-default disabled:text-gray-300"
                    >
                        <MdArrowForwardIos size="1.2em" />
                    </button>
                    <button
                        onClick={() =>
                            setSearchParams({
                                ...Object.fromEntries(searchParams),
                                page: pageInfo.totalPages.toString(),
                            })
                        }
                        disabled={pageInfo.page === pageInfo.totalPages}
                        className="relative right-2 cursor-pointer py-1 text-lg hover:text-blue-500 disabled:cursor-default disabled:text-gray-300"
                    >
                        <MdLastPage size="2.2em" />
                    </button>
                    {/* <div className="ml-2 flex items-center gap-2 text-sm">
                        <label htmlFor="limit-select">Results:</label>
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
                            className="content-center rounded border border-neutral-600 bg-white py-1 hover:cursor-pointer"
                        >
                            <option value="30" className="cursor-pointer">
                                30
                            </option>
                            <option value="50" className="cursor-pointer">
                                50
                            </option>
                            <option value="80" className="cursor-pointer">
                                80
                            </option>
                        </select>
                    </div> */}
                </div>
            )}
        </>
    );
};
export default SearchPage;
