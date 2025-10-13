import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { CardLayout } from "../layouts/Cards.tsx";
import type { ServerResponse } from "../lib/types.ts";
import { useBetterAuthSession } from "../layouts/LayoutContextProvider.ts";
import { serverResponseSchema } from "../lib/zodSchema.ts";
import { PresetInfoSchema } from "../../../whos_that_server/src/config/zod/zodSchema.ts";
import type { PresetInfo } from "../../../whos_that_server/src/config/types.ts";

const ShowPremadeGamesPage = ({ myGames }: { myGames: boolean }) => {
    const navigate = useNavigate();
    const [premadeGamesList, setPremadeGamesList] = useState<PresetInfo>([]);
    const { session, isPending } = useBetterAuthSession();
    const [errorMsg, setErrorMsg] = useState("");

    //Fetch games
    useEffect(() => {
        if (!isPending && myGames && !session)
            void navigate("/"); //Maybe throw error instead?
        else if (!isPending) {
            const getPremadeGames = async () => {
                try {
                    const response = await fetch(
                        "http://localhost:3001/api/" +
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
                    console.error("Error:", error);
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
        //SECURITY?
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
                    const response = await fetch(`http://localhost:3001/api/deleteGame/${gameId}`, {
                        credentials: "include",
                        method: "DELETE",
                    });
                    if (response.ok) {
                        console.log(await response.json());
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
        <div className="mx-10 mt-10 flex flex-wrap items-center justify-evenly">
            {premadeGamesList.map(({ id, title, imageUrl, isPublic, author }, i) => (
                <Link key={i} to={`/play-game?preset=${id}`}>
                    <CardLayout name={title} imgSrc={imageUrl} key={i}>
                        {myGames ? (
                            <>
                                <select
                                    className="text-md absolute m-0.5 w-fit cursor-pointer content-center rounded-[50%] bg-slate-100 text-center"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                    }}
                                    onChange={(e) => {
                                        void handleGameSettings(e, id, title);
                                    }}
                                >
                                    <button className="text-2xl">⚙️</button>
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
