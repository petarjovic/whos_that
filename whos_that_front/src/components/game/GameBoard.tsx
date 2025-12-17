import type { JSX } from "react";

interface gridColsTailwind {
    [key: number]: string;
}

// Map of grid column counts to Tailwind classes (Tailwind requires this)
export const GridColsClasses: gridColsTailwind = {
    1: "xl:grid-cols-1",
    2: "xl:grid-cols-2",
    3: "xl:grid-cols-3",
    4: "xl:grid-cols-4",
    5: "xl:grid-cols-5",
    6: "xl:grid-cols-6",
    7: "xl:grid-cols-7",
    8: "xl:grid-cols-8",
    9: "xl:grid-cols-9",
    10: "xl:grid-cols-10",
    11: "xl:grid-cols-11",
    12: "xl:grid-cols-12",
} as const;

const GameBoard = ({
    title,
    cardList,
    targetCard,
}: {
    title: string;
    cardList: JSX.Element[];
    targetCard: JSX.Element;
}) => {
    // Calc num grid cols for consistent layout ("+ 4" is a heuristic)
    let numGridCols = Math.ceil(Math.sqrt(cardList.length)) + 4;
    if (numGridCols > 12) numGridCols = 12;

    const lastRow = cardList.splice(cardList.length - (cardList.length % numGridCols));

    return (
        <>
            <p className="my-2.5 text-4xl font-bold text-neutral-700">{title}</p>
            <div className="mb-2 h-full w-[99%] rounded border bg-slate-400 pt-4">
                {/* grid on large screens, flexbox on small screens */}
                <div
                    id="gameboard"
                    className={`mx-auto mb-2.5 max-lg:px-1 lg:px-2.5 2xl:grid 2xl:px-6 ${GridColsClasses[numGridCols]} 2xl:gap-y-4.5 w-full max-2xl:flex max-2xl:flex-wrap max-2xl:items-center max-2xl:justify-around max-md:gap-2 md:max-2xl:gap-2 2xl:auto-cols-min 2xl:place-items-center 2xl:justify-center 2xl:gap-x-0`}
                >
                    {cardList}
                </div>
                {/* Last Row of Cards, always flexbox, looks better*/}
                <div className="mb-2.5 flex w-full flex-wrap justify-evenly px-10 max-2xl:px-4 max-sm:gap-x-8 max-sm:gap-y-3">
                    {lastRow}
                    {/* Character picker (random option) vs regular board (shows opponents card) */}
                    {targetCard}
                </div>
            </div>
        </>
    );
};
export default GameBoard;
