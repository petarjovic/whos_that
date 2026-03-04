import { type JSX } from "react";
import bulletinboard from "../../assets/BulletinBoard.jpeg";

const GameBoard = ({
    cardList,
    targetCard,
}: {
    cardList: JSX.Element[];
    targetCard?: JSX.Element;
}) => {
    return (
        <>
            <div
                className="mx-auto -mt-3 flex h-full w-[98%] flex-wrap items-center justify-around gap-2 rounded-2xl border-amber-800 bg-size-[100%_100%] px-22 pt-5 shadow-[0_10px_100px_30px_rgba(0,0,0,0.7)] max-lg:px-1 lg:px-2.5 2xl:mb-1 2xl:auto-cols-min 2xl:place-items-center 2xl:gap-y-4.5 2xl:px-16 2xl:py-16"
                style={{ backgroundImage: `url(${bulletinboard})` }}
            >
                {cardList}
                {targetCard}
            </div>
        </>
    );
};
export default GameBoard;
