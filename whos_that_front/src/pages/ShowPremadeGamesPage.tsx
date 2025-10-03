import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { CardLayout } from "../layouts/Cards.tsx";
import type { ServerResponse } from "../lib/types.ts";
import { authClient } from "../lib/auth-client.ts";

type preMadeGamesListType = {
    title: string;
    id: string;
    imageUrl: string;
    isPublic: boolean;
}[];

const ShowPremadeGamesPage = ({ myGames }: { myGames: boolean }) => {
    const navigate = useNavigate();
    const [premadeGamesList, setPremadeGamesList] = useState<preMadeGamesListType>([]);
    const {
        data: session,
        isPending, //loading state
        error: authError, //error object
    } = authClient.useSession(); //ERROR HANDLING

    //Fetch games
    useEffect(() => {
        if ((!isPending && myGames && !session) || authError)
            void navigate("/"); //Maybe throw error instead?
        else if (!isPending) {
            const getPremadeGames = async () => {
                try {
                    const response = await fetch(
                        "http://localhost:3001/api/" +
                            (myGames ? "getMyGames" : "getAllPremadeGames") +
                            (session ? `?userId=${session.user.id}` : ""),
                        {
                            method: "GET",
                        }
                    );

                    if (response.ok) {
                        const result = (await response.json()) as preMadeGamesListType;
                        setPremadeGamesList(result);
                    } else {
                        const errorData = (await response.json()) as ServerResponse;
                        throw new Error(errorData.message || "Failed to get premadeGames.");
                    }
                } catch (error) {
                    console.error("Error:", error);
                    return error; //fix error handling
                }
            };
            void getPremadeGames();
        }
    }, [myGames, session, isPending, authError, navigate]);

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
                    const response = await fetch(
                        `http://localhost:3001/api/deleteGame?gameId=${gameId}&userId=${session?.user.id ?? ""}`,
                        {
                            method: "DELETE",
                        }
                    );
                    if (response.ok) {
                        console.log(await response.json());
                        void navigate(0);
                    } else {
                        const errorData = (await response.json()) as ServerResponse;
                        console.error(errorData.message || "Failed to delete game.");
                    }
                    break;
                } else break;
            }
            default: {
                break;
            }
        }
    };

    return (
        <div id="gameboard" className="mx-10 mt-10 flex flex-wrap items-center justify-evenly">
            {premadeGamesList.map(({ id, title, imageUrl, isPublic }, i) => (
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
                                <p className="text-center text-sm">
                                    {isPublic ? "Public" : "Private"}
                                </p>
                            </>
                        ) : (
                            <></>
                        )}
                    </CardLayout>
                </Link>
            ))}
        </div>
    );
};
export default ShowPremadeGamesPage;
