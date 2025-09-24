import { CardLayout } from "../layouts/Cards";
import obama from "../assets/presidents/Barack_Obama.jpg";
import alfred from "../assets/cats/Alfred.jpg";
import CustomGameImage from "../assets/CustomGame.svg";
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
                <CardLayout name="Browse Public Games" imgSrc={obama}>
                    <></>
                </CardLayout>
            </Link>
            {session ? (
                <Link to={isPending ? "" : "/my-games"}>
                    <CardLayout name="Your Private Games" imgSrc={alfred}>
                        <></>
                    </CardLayout>
                </Link>
            ) : (
                <></>
            )}

            <Link to={isPending ? "" : session ? "/create-game/new" : "/sign-up"}>
                <CardLayout name="Create a Custom Game" imgSrc={CustomGameImage}>
                    <p className="text-center text-sm">
                        {session ? "" : "(need to login to create custom game)"}
                    </p>
                </CardLayout>
            </Link>
        </div>
    );
};
export default GameTypePage;
