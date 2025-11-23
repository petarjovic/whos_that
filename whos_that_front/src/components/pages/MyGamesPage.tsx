import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { CardLayout } from "../misc/Cards.tsx";
import type { ServerResponse } from "../../lib/types.ts";
import { useBetterAuthSession } from "../../lib/LayoutContextProvider.ts";
import { serverResponseSchema } from "../../lib/zodSchema.ts";
import { PresetInfoSchema } from "@server/zodSchema";
import type { PresetInfo } from "@server/types";
import env from "../../lib/zodEnvSchema.ts";
import { logError } from "../../lib/logger.ts";
import LoadingSpinner from "../misc/LoadingSpinner.tsx";
import { FaArrowUpRightFromSquare } from "react-icons/fa6";
import { FcSettings } from "react-icons/fc";

import ReactModal from "react-modal";

/**
 * Modal for displaying shareable link for a game/preset
 */
const ShareGameModal = ({
    showShareModal,
    setShareModalGameId,
    id,
}: {
    showShareModal: boolean;
    setShareModalGameId: (id: string) => void;
    id: string;
}) => {
    return (
        <ReactModal
            isOpen={showShareModal}
            className="shadow-2xl/30 bg-linear-to-b border-b-13 text-shadow-xs/100 absolute left-1/2 top-1/2 mx-auto max-h-[90vh] w-fit max-w-6xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg border-x border-blue-600 from-blue-400 to-blue-500 p-8 text-center text-neutral-100 shadow-2xl"
        >
            <p className="mb-3 text-center text-5xl font-semibold text-orange-300 max-2xl:text-4xl max-sm:text-3xl">
                Share Link
            </p>
            <p className="text-3xl font-medium max-sm:text-2xl">
                Anyone with this link can create a room using these characters:
            </p>
            <p className="text-shadow-xs/50 my-5 rounded-2xl border-2 border-blue-500 bg-white px-1 py-3 text-2xl text-orange-400 max-sm:my-3 max-sm:py-2 max-sm:text-xl">
                https://whos-that.com/play-game?preset={id}
            </p>
            <button
                className="border-b-9 text-shadow-xs/100 active:shadow-2xs hover:shadow-sm/20 duration-15 shadow-sm/20 hover:shadow-xs mx-auto h-16 w-fit cursor-pointer rounded-md border-x border-amber-600 bg-amber-500 px-8 text-2xl font-bold text-white transition-all hover:border-amber-700 hover:bg-amber-600 active:-translate-y-px active:border-none"
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShareModalGameId("");
                }}
            >
                Close
            </button>
        </ReactModal>
    );
};

/**
 * Can display public games or user's own games
 * Public version supports liking (if logged in)
 * User's own supports sharing, privacy toggling, and deletion
 */
const MyGamesPage = () => {
    const navigate = useNavigate();
    const [gamesList, setGamesList] = useState<PresetInfo>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [shareModalGameId, setShareModalGameId] = useState("");
    const [errorMsg, setErrorMsg] = useState(""); //For throwing error if set to non-empty string

    const { session, isPending } = useBetterAuthSession();

    // Fetch game info from appropriate endpoint based on page type
    useEffect(() => {
        // Redirect if trying to access "my games" without auth
        if (!isPending && !session) void navigate("/");
        else if (!isPending) {
            const getPremadeGames = async () => {
                setIsLoading(true);
                try {
                    const response = await fetch(`${env.VITE_SERVER_URL}/api/getMyGames`, {
                        credentials: "include",
                        method: "GET",
                    });

                    if (response.ok) {
                        const validatePresetInfo = PresetInfoSchema.safeParse(
                            await response.json()
                        );
                        if (validatePresetInfo.success) setGamesList(validatePresetInfo.data);
                        else {
                            logError(validatePresetInfo.error);
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
                    } else setErrorMsg("Failed to get user's games.");
                } finally {
                    setIsLoading(false);
                }
            };
            void getPremadeGames();
        }
    }, [session, isPending, navigate]);

    /**
     * Opens share modal with game link (only used on user's own games)
     */
    const handleShareGame = async (e: React.MouseEvent<HTMLButtonElement>, gameId: string) => {
        e.preventDefault();
        e.stopPropagation();

        setShareModalGameId(gameId);
    };

    /**
     * Handles game management actions for user's own games (delete, privacy toggle)
     */
    const handleGameSettings = async (
        e: React.ChangeEvent<HTMLSelectElement>,
        gameId: string,
        title: string
    ) => {
        e.preventDefault();
        e.stopPropagation();

        switch (e.target.value) {
            case "Delete Game": {
                // TODO: replace confirmation with custom modal
                const confirmed = confirm(
                    `Are you sure you want to delete ${title}? This action cannot be undone!`
                );
                if (confirmed) {
                    setGamesList((prev) => prev.filter((game) => game.id !== gameId));

                    try {
                        const response = await fetch(
                            `${env.VITE_SERVER_URL}/api/deleteGame/${gameId}`,
                            {
                                credentials: "include",
                                method: "DELETE",
                            }
                        );
                        if (!response.ok) {
                            const errorData = serverResponseSchema.safeParse(await response.json());
                            setErrorMsg(errorData.data?.message ?? "Failed to delete game.");
                        }
                        break;
                    } catch (error) {
                        logError(error);
                        setErrorMsg("Failed to delete game.");
                        break;
                    }
                } else break;
            }

            case "Make Public": //cover both cases since logic is the same
            case "Make Private": {
                try {
                    // Optimistically update privacy state/UI
                    setGamesList((prev) =>
                        prev.map((game) =>
                            game.id === gameId
                                ? {
                                      ...game,
                                      isPublic: !game.isPublic,
                                  }
                                : game
                        )
                    );

                    //Wait for privacy setting change on server (partly to prevent user spamming requests)
                    setIsLoading(true);
                    const response = await fetch(
                        `${env.VITE_SERVER_URL}/api/switchPrivacy/${gameId}`,
                        {
                            credentials: "include",
                            method: "PUT",
                        }
                    );

                    if (!response.ok) {
                        const errorData = serverResponseSchema.safeParse(await response.json());
                        setErrorMsg(
                            errorData.data?.message ??
                                "Failed to change game privacy settings, server might be down, try again later."
                        );
                    }
                    setIsLoading(false);
                } catch (error) {
                    logError(error);
                    setErrorMsg("Failed to change game privacy settings.");
                }
                break;
            }
            default: {
                break;
            }
        }
        e.target.value = ""; //Reset html select (required)
    };

    if (errorMsg) throw new Error(errorMsg);
    else if (isLoading || isPending) return <LoadingSpinner />;
    return (
        <>
            <div className="mx-10 mt-3 flex flex-wrap items-center justify-evenly">
                <h2 className="text-4xl font-semibold">Your Presets</h2>
                {gamesList.length === 0 && (
                    <p className="mx-auto mt-[40%] text-center text-xl font-medium">
                        No games made yet!{" "}
                        <Link
                            to={"/create-game"}
                            className="text-blue-500 underline hover:italic hover:text-red-300"
                        >
                            make new game
                        </Link>
                    </p>
                )}
                {gamesList.map(({ id, title, imageUrl, isPublic }, i) => (
                    <Link key={i} to={`/play-game?preset=${id}`}>
                        <CardLayout name={title} imgSrc={imageUrl} key={i}>
                            {/* Own Games */}

                            <div className="flex items-baseline justify-between">
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        handleShareGame(e, id);
                                    }}
                                    className="ml-2 cursor-pointer text-xl text-gray-700 hover:scale-105 hover:text-blue-500 active:scale-125 max-lg:text-lg"
                                    title="Share Link"
                                >
                                    <FaArrowUpRightFromSquare />
                                </button>
                                <p
                                    className={`whitespace-pre text-center text-base font-semibold opacity-80 max-lg:text-sm ${isPublic ? "text-green-600" : "text-red-600"}`}
                                >
                                    {isPublic ? " Public" : " Private"}
                                </p>
                                <select
                                    className="shadow-xs/15 xl:scale-133 scale-120 hover:shadow-sm/50 xl:hover:scale-140 xl:mb-1.75 relative mb-1 mr-1 w-fit cursor-pointer content-center rounded-[50%] border border-slate-400 bg-gray-300 p-px text-center text-base text-slate-400 transition-transform hover:scale-105 hover:text-blue-500 active:shadow-none xl:mr-2"
                                    title="Settings"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                    }}
                                    onChange={(e) => {
                                        e.stopPropagation();
                                        void handleGameSettings(e, id, title);
                                    }}
                                >
                                    <button
                                        type="button"
                                        className="flex items-center justify-center text-2xl max-lg:text-xl"
                                    >
                                        <FcSettings />
                                    </button>
                                    {/* Empty option is needed for functionality, keep it and keep hidden. */}
                                    <option className="hidden"></option>
                                    <option className="bg-slate-500 px-1 text-white hover:bg-slate-300 hover:text-black">
                                        {isPublic ? "Make Private" : "Make Public"}
                                    </option>
                                    <option className="bg-slate-500 px-1 text-white hover:bg-red-400">
                                        Delete Game
                                    </option>
                                </select>
                            </div>
                        </CardLayout>
                    </Link>
                ))}
            </div>
            {/* Modal for sharing link to own games */}
            <ShareGameModal
                showShareModal={Boolean(shareModalGameId)}
                setShareModalGameId={setShareModalGameId}
                id={shareModalGameId}
            />
        </>
    );
};

export default MyGamesPage;
