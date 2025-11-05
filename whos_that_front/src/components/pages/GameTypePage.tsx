import { CardLayout } from "../misc/Cards.tsx";
import PublicGamesImg from "@client/assets/PublicGames.svg";
import PrivateGamesImg from "@client/assets/PrivateGames.webp";
import CustomGameImg from "@client/assets/CustomGame.svg";
import { Link } from "react-router";
import { useBetterAuthSession } from "../../lib/LayoutContextProvider.ts";

const GameTypePage = () => {
    const { session, isPending } = useBetterAuthSession();

    return (
        <div className="sm:mt-26 flex w-4/5 max-w-4xl items-center max-sm:mt-10 max-sm:min-h-screen max-sm:flex-col sm:h-fit sm:justify-between">
            <Link to={isPending ? "" : "/premade-games"}>
                <CardLayout name="Browse Public Games" imgSrc={PublicGamesImg}>
                    <></>
                </CardLayout>
            </Link>
            {session ? (
                <Link to={isPending ? "" : "/my-games"}>
                    <CardLayout name="Your Games" imgSrc={PrivateGamesImg}>
                        <></>
                    </CardLayout>
                </Link>
            ) : (
                <></>
            )}

            <Link to={isPending ? "" : session ? "/create-game/new" : "/log-in"}>
                <CardLayout name="Create a Custom Game" imgSrc={CustomGameImg}>
                    <p className="text-center text-sm max-sm:text-xs">
                        {session ? "" : "(must be logged)"}
                    </p>
                </CardLayout>
            </Link>
        </div>
    );
};
export default GameTypePage;
