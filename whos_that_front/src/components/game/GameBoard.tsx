import { type JSX } from "react";

const GameBoard = ({
    title,
    cardList,
    targetCard,
}: {
    title: string;
    cardList: JSX.Element[];
    targetCard: JSX.Element;
}) => {
    return (
        <>
            <p className="my-2.5 text-4xl font-bold text-neutral-700">{title}</p>
            <div className="mb-2 h-full w-[99%] rounded border bg-slate-400 pt-4">
                <div
                    id="gameboard"
                    className={`mx-auto mb-2.5 flex w-full flex-wrap items-center justify-around gap-2 max-lg:px-1 lg:px-2.5 2xl:auto-cols-min 2xl:place-items-center 2xl:gap-y-4.5 2xl:px-6`}
                >
                    {cardList}
                    {targetCard}
                </div>

                {/* Character picker (random option) vs regular board (shows opponents card) */}
            </div>
        </>
    );
};
export default GameBoard;
