import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { CardLayout } from "../misc/Cards.tsx";
import { useBetterAuthSession } from "../../lib/hooks.ts";
import { serverResponseSchema } from "../../lib/zodSchema.ts";
import { UrlPresetInfoListSchema } from "@server/zodSchema";
import type { UrlPresetInfo } from "@server/types";
import env from "../../lib/zodEnvSchema.ts";
import { logError } from "../../lib/logger.ts";
import LoadingSpinner from "../misc/LoadingSpinner.tsx";
import { FaArrowUpRightFromSquare } from "react-icons/fa6";
import { FcSettings } from "react-icons/fc";
import ReactModal from "react-modal";
import { FaHeart } from "react-icons/fa";
import { RiSafe3Fill } from "react-icons/ri";
import LikeButton from "../misc/LikeButton.tsx";

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
            className="absolute top-1/2 left-1/2 mx-auto max-h-[90vh] w-fit max-w-6xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg border-x border-b-13 border-blue-600 bg-linear-to-b from-blue-400 to-blue-500 p-8 text-center text-neutral-100 shadow-2xl/30 shadow-2xl text-shadow-xs/100"
        >
            <p className="mb-3 text-center text-5xl font-semibold text-orange-300 max-2xl:text-4xl max-sm:text-3xl">
                Share Link
            </p>
            <p className="text-3xl font-medium max-sm:text-2xl">
                Anyone with this link can create a room using these characters:
            </p>
            <p className="my-5 rounded-2xl border-2 border-blue-500 bg-white px-1 py-3 text-2xl text-orange-400 text-shadow-xs/50 max-sm:my-3 max-sm:py-2 max-sm:text-xl">
                https://whos-that.com/play-game?preset={id}
            </p>
            <button
                className="mx-auto h-16 w-fit cursor-pointer rounded-md border-x border-b-9 border-amber-600 bg-amber-500 px-8 text-2xl font-bold text-white shadow-sm/20 transition-all duration-15 text-shadow-xs/100 hover:border-amber-700 hover:bg-amber-600 hover:shadow-sm/20 hover:shadow-xs active:-translate-y-px active:border-none active:shadow-2xs"
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
    const [gamesList, setGamesList] = useState<UrlPresetInfo[]>([]);
    const [likedGamesList, setLikedGamesList] = useState<UrlPresetInfo[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [shareModalGameId, setShareModalGameId] = useState("");
    const [errorMsg, setErrorMsg] = useState(""); //For throwing error if set to non-empty string
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

    const { session, isPending } = useBetterAuthSession();

    // Fetch game info from appropriate endpoint based on page type
    useEffect(() => {
        // Redirect if trying to access "my games" without auth
        if (!isPending && !session) void navigate("/");
        else if (!isPending) {
            //get games user made
            const getMyGames = async () => {
                setIsLoading(true);
                try {
                    const response = await fetch(`${env.VITE_SERVER_URL}/api/getMyGames`, {
                        credentials: "include",
                        method: "GET",
                    });

                    if (response.ok) {
                        const validatePresetInfo = UrlPresetInfoListSchema.safeParse(
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
                        const errorData = serverResponseSchema.safeParse(await response.json());
                        setErrorMsg(errorData.data?.message ?? "Failed to get user's games.");
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
            //get games user has liked
            const getMyLikedGames = async () => {
                setIsLoading(true);
                try {
                    const response = await fetch(`${env.VITE_SERVER_URL}/api/getMyLikedGames`, {
                        credentials: "include",
                        method: "GET",
                    });

                    if (response.ok) {
                        const validatePresetInfo = UrlPresetInfoListSchema.safeParse(
                            await response.json()
                        );
                        if (validatePresetInfo.success) setLikedGamesList(validatePresetInfo.data);
                        else {
                            logError(validatePresetInfo.error);
                            setErrorMsg(
                                "Client did not understand server response while getting user's liked games."
                            );
                        }
                    } else {
                        const errorData = serverResponseSchema.safeParse(await response.json());
                        setErrorMsg(errorData.data?.message ?? "Failed to get user's liked games.");
                    }
                } catch (error) {
                    logError(error);
                    if (error instanceof Error) {
                        setErrorMsg(error.message);
                    } else setErrorMsg("Failed to get user's liked games.");
                } finally {
                    setIsLoading(false);
                }
            };
            void getMyGames();
            void getMyLikedGames();
        }
    }, [session, isPending, navigate]);

    /**
     * Opens share modal with game link (only used on user's own games)
     */
    const handleShareGame = (e: React.MouseEvent<HTMLButtonElement>, gameId: string) => {
        e.preventDefault();
        e.stopPropagation();
        setShareModalGameId(gameId);
    };

    /**
     * Handles game management actions for user's own games (delete, privacy toggle)
     */
    const handleGameSettings = async (action: string, gameId: string, title: string) => {
        switch (action) {
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
    };

    if (errorMsg) throw new Error(errorMsg);
    else if (isLoading || isPending) return <LoadingSpinner />;
    return (
        <>
            <h2 className="mt-3 mb-2 flex items-center gap-1 text-center text-[2rem] leading-none font-semibold">
                <RiSafe3Fill size={"0.9em"} className="scale-x-[-1]" /> Your Presets{" "}
                <RiSafe3Fill size={"0.9em"} />
            </h2>
            <div className="flex w-fit flex-wrap items-center justify-center gap-4 border border-black bg-neutral-300 px-2 py-2.5 text-center max-xl:mx-auto xl:mx-8">
                {gamesList.length === 0 ? (
                    <p className="text-center text-xl font-medium max-sm:m-auto sm:m-5 2xl:m-10">
                        No presets made yet.{" "}
                        <Link
                            to={"/create-game"}
                            className="text-blue-500 underline hover:text-red-300 hover:italic"
                        >
                            Make a new one here
                        </Link>
                        !
                    </p>
                ) : (
                    gamesList.map(({ id, title, imageUrl, isPublic }, i) => (
                        <Link key={i} to={`/play-game?preset=${id}`}>
                            <CardLayout name={title} imgSrc={imageUrl} key={i}>
                                <div className="flex items-center justify-between">
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            handleShareGame(e, id);
                                        }}
                                        className="relative bottom-1.5 ml-2 cursor-pointer text-xl text-gray-700 hover:scale-105 hover:text-blue-500 active:scale-125 max-lg:text-lg"
                                        title="Share Link"
                                    >
                                        <FaArrowUpRightFromSquare />
                                    </button>
                                    <p
                                        className={`relative bottom-1 text-center text-base font-semibold whitespace-pre max-sm:font-medium ${isPublic ? "text-green-700" : "text-red-700"}`}
                                    >
                                        {isPublic ? " Public" : " Private"}
                                    </p>
                                    <div
                                        className="relative"
                                        onMouseLeave={() => setOpenDropdownId(null)}
                                    >
                                        <button
                                            type="button"
                                            className="relative right-1 bottom-1.5 cursor-pointer hover:scale-110"
                                            title="Settings"
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
                                            <FcSettings size={"1.75rem"} />
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
                    ))
                )}
            </div>
            {likedGamesList.length === 0 ? (
                <></>
            ) : (
                <>
                    <h3 className="mt-5 flex items-center gap-2 text-center text-3xl font-semibold">
                        <FaHeart size={"0.9em"} /> Liked Games <FaHeart size={"0.9em"} />
                    </h3>
                    <div className="mt-2 mb-4 flex flex-wrap items-center justify-evenly gap-4 border border-black bg-neutral-300 px-2 py-3 xl:mx-5">
                        {likedGamesList.map(
                            ({ id, title, imageUrl, numLikes, author, userHasLiked }, i) => (
                                <Link key={i} to={`/play-game?preset=${id}`}>
                                    <CardLayout name={title} imgSrc={imageUrl} key={i}>
                                        <div className="relative mb-0.75 flex items-center justify-center max-xl:mb-px">
                                            <p className="relative right-5 text-center text-sm text-gray-600 italic max-xl:text-xs">
                                                {author ?? ""}
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
                            )
                        )}
                    </div>
                </>
            )}

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
