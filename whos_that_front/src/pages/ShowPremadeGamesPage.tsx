import { useEffect, useState } from "react";
import obama from "../assets/presidents/Barack_Obama.jpg";
import { Link } from "react-router";
import { CardLayout } from "../layouts/Cards.tsx";
import type { ServerErrorResponse } from "../lib/types.ts";

const ShowPremadeGamesPage = () => {
    const [premadeGamesList, setPremadeGamesList] = useState<string[]>([]);

    useEffect(() => {
        const getPremadeGames = async () => {
            try {
                const response: Response = await fetch(
                    "http://localhost:3001/api/getAllPremadeGames",
                    {
                        method: "GET",
                    }
                );

                if (!response.ok) {
                    const errorData = (await response.json()) as ServerErrorResponse;
                    return { error: errorData.message || "Upload failed" }; //fix this error
                }

                const result = (await response.json()) as string[];
                setPremadeGamesList(result);
            } catch (error) {
                console.error("Upload error:", error);
                return error; //fix error handling
            }
        };
        void getPremadeGames();
    }, []);

    const premadeGames = premadeGamesList.map((game_name, i) => (
        <Link key={i} to={`/play-game?preset=${game_name}`}>
            <CardLayout name={game_name} imgSrc={obama} key={i}>
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
