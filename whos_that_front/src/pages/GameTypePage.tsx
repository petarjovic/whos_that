import { CardLayout } from "../layouts/Cards";
import obama from "../assets/presidents/Barack_Obama.jpg";
import CustomGameImage from "../assets/CustomGame.svg";
import { Link } from "react-router";

const GameTypePage = () => {
    return (
        <div className="flex justify-between mt-26 w-[45%] h-full">
            <Link to="/play-game">
                <CardLayout name="Play a Premade Game" imgSrc={obama} flipped={false}>
                    <></>
                </CardLayout>
            </Link>
            <Link to="/create-game/new">
                <CardLayout name="Create a Custom Game" imgSrc={CustomGameImage} flipped={false}>
                    <></>
                </CardLayout>
            </Link>
        </div>
    );
};
export default GameTypePage;
