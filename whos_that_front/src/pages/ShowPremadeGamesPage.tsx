import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { CardLayout } from "../layouts/Cards.tsx";
import type { ServerResponse } from "../lib/types.ts";
import { useBetterAuthSession } from "../layouts/LayoutContextProvider.ts";
import { serverResponseSchema } from "../lib/zodSchema.ts";
import { PresetInfoSchema } from "../../../whos_that_server/src/config/zod/zodSchema.ts";
import type { PresetInfo } from "../../../whos_that_server/src/config/types.ts";
import env from "../lib/zodEnvSchema.ts";
import { logError, log } from "../lib/logger.ts";

const ShowPremadeGamesPage = ({ myGames }: { myGames: boolean }) => {
    const navigate = useNavigate();
    const [premadeGamesList, setPremadeGamesList] = useState<PresetInfo>([]);
    const { session, isPending } = useBetterAuthSession();
    const [errorMsg, setErrorMsg] = useState("");

    //Fetch games
    useEffect(() => {
        if (!isPending && myGames && !session) void navigate("/");
        else if (!isPending) {
            const getPremadeGames = async () => {
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
                        else setErrorMsg("Client did not understand server response.");
                    } else {
                        const errorData = (await response.json()) as ServerResponse;
                        setErrorMsg(errorData.message || "Failed to get premadeGames.");
                    }
                } catch (error) {
                    logError(error);
                    if (error instanceof Error) {
                        setErrorMsg(error.message);
                    } else setErrorMsg("Failed to get premadeGames.");
                }
            };
            void getPremadeGames();
        }
    }, [myGames, session, isPending, navigate]);

    const handleGameSettings = async (
        e: React.ChangeEvent<HTMLSelectElement>,
        gameId: string,
        title: string
    ) => {
        e.preventDefault();
        e.stopPropagation();
        const opt = e.target.value;

        switch (opt) {
            case "Delete Game": {
                const confirmed = confirm(
                    //Redo this one day!
                    `Are you sure you want to delete ${title}? This action cannot be undone!`
                );
                if (confirmed) {
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
                } else break;
            }
            default: {
                break;
            }
        }
    };

    if (errorMsg) throw new Error(errorMsg);

    return (
        <div className="mx-10 mt-3 flex flex-wrap items-center justify-evenly">
            <h2 className="font-times text-shadow-sm/100 my-2 w-full text-center text-6xl tracking-wider text-white">
                {myGames ? "Your Games" : "Public Games"}
            </h2>
            {premadeGamesList.length === 0 && (
                <p className="mx-auto mt-[50%] text-center text-2xl font-semibold text-gray-600">
                    {myGames ? "You have no games yet." : "No public games... Something's Fishy..."}
                </p>
            )}
            {premadeGamesList.map(({ id, title, imageUrl, isPublic, author }, i) => (
                <Link key={i} to={`/play-game?preset=${id}`}>
                    <CardLayout name={title} imgSrc={imageUrl} key={i}>
                        {myGames ? (
                            <>
                                <select
                                    className="text-md shadow-xs absolute m-1.5 w-fit cursor-pointer content-center rounded-[50%] bg-slate-100 p-[1px] text-center shadow-white"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                    }}
                                    onChange={(e) => {
                                        void handleGameSettings(e, id, title);
                                    }}
                                >
                                    <button className="text-3xl">⚙️</button>
                                    <option className="text-md hidden bg-slate-500 px-1 text-white hover:bg-slate-300 hover:text-black">
                                        Change Title
                                    </option>
                                    <option className="text-md bg-slate-500 px-1 text-white hover:bg-red-400">
                                        Delete Game
                                    </option>
                                </select>
                                <p
                                    className={`text-center text-sm font-semibold ${isPublic ? "text-green-600" : "text-red-600"}`}
                                >
                                    {isPublic ? "Public" : "Private"}
                                </p>
                            </>
                        ) : (
                            <p className="mb-0.5 text-center text-sm italic tracking-wide text-gray-600">
                                {author ?? ""}{" "}
                            </p>
                        )}
                    </CardLayout>
                </Link>
            ))}
        </div>
    );
};
export default ShowPremadeGamesPage;
