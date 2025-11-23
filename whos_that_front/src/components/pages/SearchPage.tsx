import { useEffect, useState } from "react";
import env from "../../lib/zodEnvSchema.ts";
import { PresetInfoSchema } from "@server/zodSchema";
import type { ServerResponse } from "src/lib/types";
import type { PresetInfo } from "@server/types";
import { useBetterAuthSession } from "../../lib/LayoutContextProvider.ts";
import LoadingSpinner from "../misc/LoadingSpinner";
import { Link } from "react-router";
import { CardLayout } from "../misc/Cards";
import { logError } from "../../lib/logger.ts";
import { FaHeart } from "react-icons/fa";
import { useSearchParams } from "react-router";
import { z } from "zod";

const SearchPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();

    const [isLoading, setIsLoading] = useState(true);
    const [gamesList, setGamesList] = useState<PresetInfo>([]);
    const [errorMsg, setErrorMsg] = useState("");

    const { session, isPending } = useBetterAuthSession();

    //Fetch games being searched for
    useEffect(() => {
        const getPremadeGames = async () => {
            setIsLoading(true);
            try {
                const validPage = z.number().safeParse(searchParams.get("page"));
                const validLimit = z.number().safeParse(searchParams.get("page"));

                const url = new URL(`${env.VITE_SERVER_URL}/api/search`);
                url.searchParams.set("q", searchParams.get("q") ?? "");
                url.searchParams.set("page", validPage.success ? validPage.data.toString() : "1");
                url.searchParams.set(
                    "limit",
                    validLimit.success ? validLimit.data.toString() : "20"
                );
                url.searchParams.set(
                    "sort",
                    searchParams.get("sort") === "newest" ? "newest" : "likes"
                );

                const response = await fetch(url, {
                    credentials: "include",
                    method: "GET",
                });

                if (response.ok) {
                    const validatePresetInfo = PresetInfoSchema.safeParse(await response.json());
                    if (validatePresetInfo.success) setGamesList(validatePresetInfo.data);
                    else {
                        setErrorMsg(
                            "Client did not understand server response while getting user's games."
                        );
                    }
                } else {
                    const errorData = (await response.json()) as ServerResponse;

                    setErrorMsg(errorData.message ?? "Failed to get user's games.");
                }
            } catch (error) {
                logError(error);
                if (error instanceof Error) {
                    setErrorMsg(error.message);
                } else setErrorMsg("Error: Failed to get user's games.");
            } finally {
                setIsLoading(false);
            }
        };
        void getPremadeGames();
    }, []);

    /**
     * Handles user liking and unliking game
     */
    const handleLikeGame = async (e: React.MouseEvent<HTMLButtonElement>, gameId: string) => {
        e.preventDefault();
        e.stopPropagation();
        if (!session) return;

        // Optimistically update UI via state
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

        try {
            //Request to like game on server
            const response = await fetch(`${env.VITE_SERVER_URL}/api/likeGame/${gameId}`, {
                credentials: "include",
                method: "PUT",
            });

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
    else if (isLoading || isPending) return <LoadingSpinner />;
    return (
        <div className="mx-10 mt-3 flex flex-wrap items-center justify-evenly">
            <h2 className="text-4xl font-semibold">Search Results</h2>
            {gamesList.length === 0 && (
                <p className="mx-auto mt-[40%] text-center text-xl font-medium">
                    Sorry, no presets match your search!{" "}
                    <Link
                        to={"/create-game"}
                        className="text-blue-500 underline hover:italic hover:text-red-300"
                    >
                        Make your own!
                    </Link>
                </p>
            )}
            {gamesList.map(({ id, title, imageUrl, numLikes, author, userHasLiked }, i) => (
                <Link key={i} to={`/play-game?preset=${id}`}>
                    <CardLayout name={title} imgSrc={imageUrl} key={i}>
                        <div className="mb-0.75 relative flex items-center justify-center max-xl:mb-px">
                            <p className="mb-[1.5px] text-center text-sm italic text-gray-600 max-xl:text-xs">
                                {author ?? ""}{" "}
                            </p>
                            <p className="absolute bottom-0.5 right-1.5 text-base text-gray-700">
                                <button
                                    className="flex cursor-pointer items-center whitespace-pre-wrap align-sub"
                                    onClick={(e) => {
                                        handleLikeGame(e, id);
                                    }}
                                    title={userHasLiked ? "Unlike Game" : "Like Game"}
                                >
                                    {numLikes}{" "}
                                    <FaHeart
                                        className={`${
                                            userHasLiked ? "text-red-600" : "text-zinc-800"
                                        } active:scale-130 hover:scale-111 scale-105 rounded-[50%] text-2xl transition-transform hover:text-red-300 max-md:text-xl`}
                                    />
                                </button>
                            </p>
                        </div>
                    </CardLayout>
                </Link>
            ))}
        </div>
        //TODO: ADD PAGINATION UI
    );
};
export default SearchPage;
