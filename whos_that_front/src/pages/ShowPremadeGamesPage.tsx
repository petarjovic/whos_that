import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { CardLayout } from "../layouts/Cards.tsx";
import type { ServerErrorResponse } from "../lib/types.ts";
import { authClient } from "../lib/auth-client.ts";

type preMadeGamesListType = {
    title: string;
    id: string;
    imageUrl: string;
}[];

const ShowPremadeGamesPage = ({ myGames }: { myGames: boolean }) => {
    const navigate = useNavigate();
    const [premadeGamesList, setPremadeGamesList] = useState<preMadeGamesListType>([]);
    const {
        data: session,
        isPending, //loading state
        error: authError, //error object
    } = authClient.useSession(); //ERROR HANDLING

    useEffect(() => {
        if (!isPending && session) {
            const getPremadeGames = async () => {
                try {
                    const response: Response = await fetch(
                        `http://localhost:3001/api/${
                            myGames ? "getMyGames" : "getAllPremadeGames"
                        }?userId=${session.user.id}`,
                        {
                            method: "GET",
                        }
                    );

                    if (!response.ok) {
                        const errorData = (await response.json()) as ServerErrorResponse;
                        throw new Error(errorData.message || "Failed to get premadeGames");
                    }

                    const result = (await response.json()) as preMadeGamesListType;
                    setPremadeGamesList(result);
                } catch (error) {
                    console.error("Error:", error);
                    return error; //fix error handling
                }
            };
            void getPremadeGames();
        } else if ((!isPending && myGames && !session) || authError) void navigate("/");
    }, [myGames, session, isPending, authError]);

    const premadeGames = premadeGamesList.map(({ id, title, imageUrl }, i) => (
        <Link key={i} to={`/play-game?preset=${id}`}>
            <CardLayout name={title} imgSrc={imageUrl} key={i}>
                <></>
            </CardLayout>
        </Link>
    ));

    return (
        <div id="gameboard" className="flex flex-wrap items-center justify-evenly mx-10 mt-10">
            {premadeGames}
        </div>
    );
};
export default ShowPremadeGamesPage;
