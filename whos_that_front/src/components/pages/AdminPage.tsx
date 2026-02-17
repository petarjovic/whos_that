import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { CardLayout } from "../misc/Cards.tsx";
import { useBetterAuthSession } from "../../lib/hooks.ts";
import { serverResponseSchema } from "../../lib/zodSchema.ts";
import { SearchResponseSchema } from "@server/zodSchema";
import type { PaginationInfo, UrlPresetInfo } from "@server/types";
import env from "../../lib/zodEnvSchema.ts";
import { logError } from "../../lib/logger.ts";
import LoadingSpinner from "../misc/LoadingSpinner.tsx";
import { IoMdSearch } from "react-icons/io";
import { FcSettings } from "react-icons/fc";
import { MdFirstPage, MdLastPage, MdArrowBackIosNew, MdArrowForwardIos } from "react-icons/md";

const AdminPage = () => {
    const nav = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const [isLoading, setIsLoading] = useState(true);
    const [gamesList, setGamesList] = useState<UrlPresetInfo[]>([]);
    const [pageInfo, setPageInfo] = useState<PaginationInfo>();
    const [errorMsg, setErrorMsg] = useState("");
    const [searchInput, setSearchInput] = useState(searchParams.get("q") ?? "");
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

    const { isPending, session } = useBetterAuthSession();

    useEffect(() => {
        if (!isPending && session?.user.role !== "admin") void nav("/404");
    }, [session, isPending, nav]);

    // Debounce search input
    useEffect(() => {
        const currentQuery = searchParams.get("q") ?? "";
        const timer = setTimeout(() => {
            if (searchInput.length < 3 || searchInput === currentQuery) return;
            setSearchParams((prev) => ({ ...Object.fromEntries(prev), q: searchInput, page: "1" }));
        }, 500);
        return () => clearTimeout(timer);
    }, [searchInput, searchParams, setSearchParams]);

    useEffect(() => {
        const abortController = new AbortController();
        const getPremadeGames = async () => {
            setIsLoading(true);
            try {
                const page = parseInt(searchParams.get("page") ?? "1");
                const limit = parseInt(searchParams.get("limit") ?? "60");
                const privParam = searchParams.get("priv") ?? "public";

                const url = new URL(`${env.VITE_SERVER_URL}/api/search`);
                url.searchParams.set("q", searchParams.get("q") ?? "");
                url.searchParams.set("page", Number.isNaN(page) ? "1" : page.toString());
                url.searchParams.set("limit", Number.isNaN(limit) ? "60" : limit.toString());
                const sortParam = searchParams.get("sort");
                url.searchParams.set(
                    "sort",
                    sortParam === "newest" || sortParam === "likes" || sortParam === "trending"
                        ? sortParam
                        : "trending"
                );
                url.searchParams.set("priv", privParam);

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

    const handleGameSettings = async (action: string, gameId: string, title: string) => {
        switch (action) {
            case "Delete Game": {
                const confirmed = confirm(
                    `Are you sure you want to delete ${title}? This action cannot be undone!`
                );
                if (!confirmed) break;

                setGamesList((prev) => prev.filter((game) => game.id !== gameId));
                try {
                    const response = await fetch(
                        `${env.VITE_SERVER_URL}/api/admin/deleteGame/${gameId}`,
                        {
                            credentials: "include",
                            method: "DELETE",
                        }
                    );
                    if (!response.ok) {
                        const errorData = serverResponseSchema.safeParse(await response.json());
                        setErrorMsg(errorData.data?.message ?? "Failed to delete game.");
                    }
                } catch (error) {
                    logError(error);
                    setErrorMsg("Failed to delete game.");
                }
                break;
            }
            case "Make Public":
            case "Make Private": {
                setGamesList((prev) =>
                    prev.map((game) =>
                        game.id === gameId ? { ...game, isPublic: !game.isPublic } : game
                    )
                );
                try {
                    const response = await fetch(
                        `${env.VITE_SERVER_URL}/api/admin/switchPrivacy/${gameId}`,
                        {
                            credentials: "include",
                            method: "PUT",
                        }
                    );
                    if (!response.ok) {
                        const errorData = serverResponseSchema.safeParse(await response.json());
                        setErrorMsg(errorData.data?.message ?? "Failed to change game privacy.");
                    }
                } catch (error) {
                    logError(error);
                    setErrorMsg("Failed to change game privacy.");
                }
                break;
            }
        }
    };

    if (errorMsg) throw new Error(errorMsg);
    return (
        <>
            <form
                className="flex items-center justify-around gap-2 rounded-xs border border-neutral-500 bg-neutral-300 px-1.5 py-1.75 max-xl:mt-4 max-xl:mb-1 max-sm:w-9/10 sm:w-7/10 md:w-6/10 lg:w-1/3 xl:mt-5 xl:mb-2"
                onSubmit={(e) => e.preventDefault()}
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
                    value={searchParams.get("sort") ?? "newest"}
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
                <select
                    className="flex cursor-pointer items-center justify-center rounded-xs bg-orange-400 p-0.75 text-center text-white"
                    value={searchParams.get("priv") ?? "public"}
                    onChange={(e) =>
                        setSearchParams({
                            ...Object.fromEntries(searchParams),
                            priv: e.target.value,
                            page: "1",
                        })
                    }
                >
                    <option className="font-medium" value="public">
                        Public
                    </option>
                    <option className="font-medium" value="private">
                        Private
                    </option>
                    <option className="font-medium" value="both">
                        Both
                    </option>
                </select>
            </form>
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
                    {gamesList.map(({ id, title, imageUrl, isPublic, author }, i) => (
                        <Link key={i} to={`/play-game?preset=${id}`}>
                            <CardLayout name={title} imgSrc={imageUrl}>
                                <div className="relative mb-0.75 flex items-center justify-center gap-1 max-xl:mb-px">
                                    <p className="text-center text-sm text-gray-600 italic max-xl:text-xs">
                                        {author ?? ""}{" "}
                                    </p>
                                    <p
                                        className={`text-sm font-semibold ${isPublic ? "text-green-600" : "text-red-600"}`}
                                    >
                                        {isPublic ? "Public" : "Private"}
                                    </p>
                                    <div onMouseLeave={() => setOpenDropdownId(null)}>
                                        <button
                                            type="button"
                                            className="cursor-pointer hover:scale-110"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setOpenDropdownId(id);
                                            }}
                                            onMouseEnter={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setOpenDropdownId(id);
                                            }}
                                        >
                                            <FcSettings size="1.5rem" />
                                        </button>
                                        {openDropdownId === id && (
                                            <div className="absolute top-7 right-0 z-1 min-w-32 border border-black bg-neutral-400 font-medium shadow-md/10">
                                                <button
                                                    type="button"
                                                    className="flex w-full cursor-pointer items-center justify-around p-px pt-0.5 text-white hover:bg-slate-200 hover:text-black"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        void handleGameSettings(
                                                            isPublic
                                                                ? "Make Private"
                                                                : "Make Public",
                                                            id,
                                                            title
                                                        );
                                                        setOpenDropdownId(null);
                                                    }}
                                                >
                                                    {isPublic ? "Make Private" : "Make Public"}
                                                </button>
                                                <button
                                                    type="button"
                                                    className="items-ceneter flex w-full cursor-pointer justify-around p-px pb-0.5 font-medium text-red-700 hover:bg-red-300 hover:text-red-950"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        void handleGameSettings(
                                                            "Delete Game",
                                                            id,
                                                            title
                                                        );
                                                        setOpenDropdownId(null);
                                                    }}
                                                >
                                                    Delete Game
                                                </button>
                                            </div>
                                        )}
                                    </div>
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
                </div>
            )}
        </>
    );
};
export default AdminPage;
