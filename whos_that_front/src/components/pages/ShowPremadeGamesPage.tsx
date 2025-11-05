import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { CardLayout } from "../misc/Cards.tsx";
import type { ServerResponse } from "../../lib/types.ts";
import { useBetterAuthSession } from "../../lib/LayoutContextProvider.ts";
import { serverResponseSchema } from "../../lib/zodSchema.ts";
import { PresetInfoSchema } from "@server/zodSchema";
import type { PresetInfo } from "@server/types";
import env from "../../lib/zodEnvSchema.ts";
import { logError, log } from "../../lib/logger.ts";
import LoadingSpinner from "../misc/LoadingSpinner.tsx";
import { FaArrowUpRightFromSquare, FaHeart } from "react-icons/fa6";
import { FcSettings } from "react-icons/fc";

import ReactModal from "react-modal";

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

const ShowPremadeGamesPage = ({ myGames }: { myGames: boolean }) => {
    const navigate = useNavigate();
    const [premadeGamesList, setPremadeGamesList] = useState<PresetInfo>([]);
    const { session, isPending } = useBetterAuthSession();
    const [errorMsg, setErrorMsg] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [shareModalGameId, setShareModalGameId] = useState("");

    //Fetch games
    useEffect(() => {
        if (!isPending && myGames && !session) void navigate("/");
        else if (!isPending) {
            const getPremadeGames = async () => {
                setIsLoading(true);
                try {
                    const response = await fetch(
                        `${env.VITE_SERVER_URL}/api/` +
                            (myGames ? "getMyGames" : "getAllPremadeGames"),
                        {
                            credentials: "include",
                            method: "GET",
                        }
                    );

                    if (response.ok) {
                        const validatePresetInfo = PresetInfoSchema.safeParse(
                            await response.json()
                        );
                        if (validatePresetInfo.success)
                            setPremadeGamesList(validatePresetInfo.data);
                        else {
                            logError(validatePresetInfo.error);
                            setErrorMsg("Client did not understand server response.");
                        }
                    } else {
                        const errorData = (await response.json()) as ServerResponse;
                        setErrorMsg(errorData.message ?? "Failed to get premadeGames.");
                    }
                } catch (error) {
                    logError(error);
                    if (error instanceof Error) {
                        setErrorMsg(error.message);
                    } else setErrorMsg("Failed to get premadeGames.");
                } finally {
                    setIsLoading(false);
                }
            };
            void getPremadeGames();
        }
    }, [myGames, session, isPending, navigate]);

    const handleShareGame = async (e: React.MouseEvent<HTMLButtonElement>, gameId: string) => {
        e.preventDefault();
        e.stopPropagation();

        setShareModalGameId(gameId);
    };

    const handleLikeGame = async (e: React.MouseEvent<HTMLButtonElement>, gameId: string) => {
        e.preventDefault();
        e.stopPropagation();
        if (!session) return;
        setIsLoading(true);

        try {
            const response = await fetch(`${env.VITE_SERVER_URL}/api/likeGame/${gameId}`, {
                credentials: "include",
                method: "PUT",
            });

            if (response.ok) {
                void navigate(0);
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
        } finally {
            setIsLoading(false);
        }
    };

    const handleGameSettings = async (
        e: React.ChangeEvent<HTMLSelectElement>,
        gameId: string,
        title: string
    ) => {
        e.preventDefault();
        e.stopPropagation();
        setIsLoading(true);
        const opt = e.target.value;

        switch (opt) {
            case "Delete Game": {
                const confirmed = confirm(
                    //Redo this one day!
                    `Are you sure you want to delete ${title}? This action cannot be undone!`
                );
                if (confirmed) {
                    try {
                        const response = await fetch(
                            `${env.VITE_SERVER_URL}/api/deleteGame/${gameId}`,
                            {
                                credentials: "include",
                                method: "DELETE",
                            }
                        );
                        if (response.ok) {
                            log(await response.json());
                            void navigate(0);
                        } else {
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
            case "Make Public":
            case "Make Private": {
                try {
                    console.log("Making Private");
                    const response = await fetch(
                        `${env.VITE_SERVER_URL}/api/switchPrivacy/${gameId}`,
                        {
                            credentials: "include",
                            method: "PUT",
                        }
                    );
                    if (response.ok) {
                        void navigate(0);
                    } else {
                        const errorData = serverResponseSchema.safeParse(await response.json());
                        setErrorMsg(
                            errorData.data?.message ??
                                "Failed to change game privacy settings, server might be down, try again later."
                        );
                    }
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
        setIsLoading(false);
    };

    if (errorMsg) throw new Error(errorMsg);
    else if (isLoading) return <LoadingSpinner />;
    return (
        <>
            <div className="mx-10 mt-3 flex flex-wrap items-center justify-evenly">
                <h2 className="font-times text-shadow-sm/100 my-2 w-full text-center text-6xl text-white max-md:text-5xl">
                    {myGames ? "Your Games" : "Public Games"}
                </h2>
                {premadeGamesList.length === 0 && (
                    <p className="mx-auto mt-[50%] text-center text-2xl font-semibold text-gray-600">
                        {myGames
                            ? "You have no games yet."
                            : "No public games!? Something's Fishy..."}
                    </p>
                )}
                {premadeGamesList.map(
                    ({ id, title, imageUrl, isPublic, numLikes, author, userHasLiked }, i) => (
                        <Link key={i} to={`/play-game?preset=${id}`}>
                            <CardLayout name={title} imgSrc={imageUrl} key={i}>
                                {myGames ? (
                                    <div className="items-center-safe flex justify-between">
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                handleShareGame(e, id);
                                            }}
                                            className="cursor-pointer pl-2 text-xl hover:text-blue-500"
                                            title="Share Link"
                                        >
                                            <FaArrowUpRightFromSquare />
                                        </button>
                                        <p
                                            className={`text-center text-base font-semibold ${isPublic ? "text-green-600" : "text-red-600"}`}
                                        >
                                            {isPublic ? "Public" : "Private"}
                                        </p>
                                        <select
                                            className="text-md shadow-xs/15 hover:shadow-md/33 active:shadow-2xs relative mb-1 mr-1 w-fit cursor-pointer content-center rounded-[50%] border border-slate-400 bg-gray-300 p-px text-center text-slate-400 hover:text-blue-500"
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
                                            <button type="button" className="shadow-xs/50 text-3xl">
                                                <FcSettings />
                                            </button>
                                            {/* Extra option is needed for functionality, keep it and keep hidden. */}
                                            <option className="hidden"></option>
                                            <option className="bg-slate-500 px-1 text-white hover:bg-slate-300 hover:text-black">
                                                {isPublic ? "Make Private" : "Make Public"}
                                            </option>
                                            <option className="bg-slate-500 px-1 text-white hover:bg-red-400">
                                                Delete Game
                                            </option>
                                        </select>
                                    </div>
                                ) : (
                                    <div className="relative flex items-baseline justify-center">
                                        <p className="mb-0.5 text-center text-sm italic tracking-wide text-gray-600">
                                            {author ?? ""}{" "}
                                        </p>
                                        <p className="absolute bottom-0.5 right-1 text-base text-gray-700">
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
                                                        userHasLiked
                                                            ? "text-red-600"
                                                            : "text-slate-400"
                                                    } rounded-[50%] text-2xl hover:text-red-300 max-md:text-xl`}
                                                />
                                            </button>
                                        </p>
                                    </div>
                                )}
                            </CardLayout>
                        </Link>
                    )
                )}
            </div>
            <ShareGameModal
                showShareModal={Boolean(shareModalGameId)}
                setShareModalGameId={setShareModalGameId}
                id={shareModalGameId}
            />
        </>
    );
};

export default ShowPremadeGamesPage;
