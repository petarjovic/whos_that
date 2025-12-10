import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { CardLayout } from "../misc/Cards.tsx";
import type { ServerResponse } from "../../lib/types.ts";
import { useBetterAuthSession } from "../../lib/LayoutContextProvider.ts";
import { serverResponseSchema } from "../../lib/zodSchema.ts";
import { UrlPresetInfoListSchema } from "@server/zodSchema";
import type { UrlPresetInfo } from "@server/types";
import env from "../../lib/zodEnvSchema.ts";
import { logError, log } from "../../lib/logger.ts";
import LoadingSpinner from "../misc/LoadingSpinner.tsx";

/**
 * Admin dashboard for managing all games (public and private)
 * Only accessible to users with admin role
 */
const AdminPage = () => {
    const navigate = useNavigate();
    const [premadeGamesList, setPremadeGamesList] = useState<UrlPresetInfo[]>([]);
    const [errorMsg, setErrorMsg] = useState(""); //Used to throw error if set to non-empty string
    const [isLoading, setIsLoading] = useState(true);

    const { session, isPending } = useBetterAuthSession();
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

    // Verify admin access and fetch all games
    useEffect(() => {
        console.log(session?.user.role);
        // Redirect non-admin users to 404
        if (!isPending && (!session || session.user.role !== "admin")) void navigate("/404");
        else if (!isPending) {
            const getPremadeGames = async () => {
                setIsLoading(true);
                try {
                    const response = await fetch(`${env.VITE_SERVER_URL}/api/admin/listAllGames`, {
                        credentials: "include",
                        method: "GET",
                    });

                    if (response.ok) {
                        const validatePresetInfo = UrlPresetInfoListSchema.safeParse(
                            await response.json()
                        );
                        if (validatePresetInfo.success)
                            setPremadeGamesList(validatePresetInfo.data);
                        else setErrorMsg("Client did not understand server response.");
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
    }, [session, isPending, navigate]);

    /**
     * Handles admin actions on games (delete and change privacy)
     * Nearly the same as handleGameSettings func in ShowPremadeGames.tsx
     */
    const handleGameSettings = async (action: string, gameId: string, title: string) => {
        setIsLoading(true);

        switch (action) {
            case "Delete Game": {
                // TODO: replace confirmation with custom modal
                const confirmed = confirm(
                    `Are you sure you want to delete ${title}? This action cannot be undone!`
                );
                if (confirmed) {
                    try {
                        const response = await fetch(
                            `${env.VITE_SERVER_URL}/api/admin/deleteGame/${gameId}`,
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

            case "Make Public": //Catch both cases since logic is the same
            case "Make Private": {
                try {
                    log("Making Private");
                    const response = await fetch(
                        `${env.VITE_SERVER_URL}/api/admin/switchPrivacy/${gameId}`,
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
        <div className="mx-10 mt-3 flex flex-wrap items-center justify-evenly">
            <h2 className="font-times text-shadow-sm/100 my-2 w-full text-center text-6xl text-white max-md:text-5xl">
                All Games
            </h2>
            {premadeGamesList.length === 0 && (
                <p className="mx-auto mt-[50%] text-center text-2xl font-semibold text-gray-600">
                    No games exist!? Something's Fishy...
                </p>
            )}
            {premadeGamesList.map(({ id, title, imageUrl, isPublic, author }, i) => (
                <Link key={i} to={`/play-game?preset=${id}`}>
                    <CardLayout name={title} imgSrc={imageUrl} key={i}>
                        <div className="flex items-baseline justify-between">
                            <p className="mb-0.5 text-center text-sm italic tracking-wide text-gray-600">
                                {author ?? ""}{" "}
                            </p>
                            <p
                                className={`text-center text-sm font-semibold ${isPublic ? "text-green-600" : "text-red-600"}`}
                            >
                                {isPublic ? "Public" : "Private"}
                            </p>
                            {openDropdownId === id && (
                                <div className="z-1 shadow-md/10 absolute right-0 top-7 min-w-32 border border-black bg-neutral-400 font-medium">
                                    <button
                                        type="button"
                                        className="flex w-full cursor-pointer items-center justify-around p-px pt-0.5 text-white hover:bg-slate-200 hover:text-black"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            void handleGameSettings(
                                                isPublic ? "Make Private" : "Make Public",
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
                                            void handleGameSettings("Delete Game", id, title);
                                            setOpenDropdownId(null);
                                        }}
                                    >
                                        Delete Game
                                    </button>
                                </div>
                            )}
                        </div>
                    </CardLayout>
                </Link>
            ))}
        </div>
    );
};
export default AdminPage;
