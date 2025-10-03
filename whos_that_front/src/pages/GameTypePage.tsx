import { CardLayout } from "../layouts/Cards";
import PublicGamesImg from "../assets/publicgames.svg";
import PrivateGamesImg from "../assets/whitehatspy.png";
import CustomGameImg from "../assets/CustomGame.svg";
import { Link } from "react-router";
import { authClient } from "../lib/auth-client.ts";

const GameTypePage = () => {
    const {
        data: session,
        isPending, //loading state
        error, //error object
    } = authClient.useSession(); //ERROR HANDLING

    return (
        <div className="mt-26 flex h-full w-[45%] justify-between">
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

            <Link to={isPending ? "" : session ? "/create-game/new" : "/sign-up"}>
                <CardLayout name="Create a Custom Game" imgSrc={CustomGameImg}>
                    <p className="text-center text-sm">
                        {session ? "" : "(need to be logged in to create custom games)"}
                    </p>
                </CardLayout>
            </Link>
        </div>
    );
};
export default GameTypePage;
