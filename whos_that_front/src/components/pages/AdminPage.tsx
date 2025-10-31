import { useEffect, useState } from "react";
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

const AdminPage = () => {
    const navigate = useNavigate();
    const [premadeGamesList, setPremadeGamesList] = useState<PresetInfo>([]);
    const { session, isPending } = useBetterAuthSession();
    const [errorMsg, setErrorMsg] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    //Fetch games
    useEffect(() => {
        console.log(session?.user.role);
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
                        const validatePresetInfo = PresetInfoSchema.safeParse(
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
            case "Make Public":
            case "Make Private": {
                try {
                    console.log("Making Private");
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
                            <select
                                className="text-md shadow-xs relative w-fit cursor-pointer content-center rounded-[50%] bg-transparent p-px text-center shadow-white"
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
                                <button className="text-2xl" type="button">
                                    ⚙️
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
                    </CardLayout>
                </Link>
            ))}
        </div>
    );
};
export default AdminPage;
