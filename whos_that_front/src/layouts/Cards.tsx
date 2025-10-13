import { useState, useEffect } from "react";
import type { EndStateType } from "../lib/types.ts";
import type { PropsWithChildren } from "react";

interface CardLayoutProps {
    name: string;
    imgSrc: string | undefined;
    isOppCard?: boolean;
    isGame?: boolean;
}

export const CardLayout = ({
    children,
    name,
    imgSrc,
    isOppCard = false,
    isGame = false,
}: PropsWithChildren<CardLayoutProps>) => {
    return (
        <figure
            className={`border-3 shadow-xs/15 ${isGame || isOppCard ? "my-1 h-72 w-48" : "h-86 my-2 w-56"} mx-1 flex flex-col justify-between overflow-hidden rounded-lg ${isOppCard ? "border-orange-300 bg-orange-300" : "hover:shadow-xl/25 border-gray-200 bg-gray-200 hover:translate-y-[-1px]"} transition-shadow`}
        >
            <img
                className="rounded-xs h-[84.5%] max-h-[85%] bg-gray-300 object-fill"
                src={imgSrc}
                alt={name}
            />
            <figcaption
                className={`bottom-0.75 ${isGame || isOppCard ? "text-md" : "text-lg hover:text-blue-500"} relative m-auto h-[4.5%] w-full text-center font-semibold`}
            >
                {name}
            </figcaption>
            {children}
        </figure>
    );
};

interface CardProps {
    name: string;
    imgSrc: string;
    winner: boolean;
    openConfirmModal: (win: boolean, name: string) => void;
    resetOnNewGame: EndStateType;
    isGame?: boolean;
}
export const Card = ({
    name,
    imgSrc,
    winner,
    openConfirmModal,
    resetOnNewGame,
    isGame = false,
}: CardProps) => {
    const [flipped, setFlipped] = useState(false);

    useEffect(() => {
        if (resetOnNewGame.length === 0) setFlipped(false);
    }, [resetOnNewGame]);

    return (
        <>
            <CardLayout
                name={flipped ? "" : name}
                imgSrc={flipped ? undefined : imgSrc}
                isGame={isGame}
            >
                <div className="border-t-3 box-content flex h-[9.5%] justify-between border-gray-200">
                    <button
                        className={`border-r-3 text-shadow-xs text-md h-full w-[35%] cursor-pointer rounded-sm border-gray-200 bg-green-600 px-1 text-center font-semibold text-neutral-100 hover:bg-green-800 ${flipped ? "hidden" : ""}`}
                        onClick={() => {
                            openConfirmModal(winner, name);
                        }}
                        disabled={flipped}
                    >
                        Guess
                    </button>
                    <div className="relative top-0.5 m-auto text-center align-sub text-lg">❓</div>
                    <button
                        className="border-l-3 text-md h-full w-[35%] cursor-pointer rounded-md border-gray-200 bg-red-600 px-1 text-center font-semibold text-neutral-100 hover:bg-red-800"
                        onClick={() => {
                            setFlipped(!flipped);
                        }}
                    >
                        {flipped ? "Unhide" : "Hide"}
                    </button>
                </div>
            </CardLayout>
        </>
    );
};

export const OpponentTargetCard = ({ name, imgSrc }: { name: string; imgSrc: string }) => {
    return (
        <CardLayout name={name} imgSrc={imgSrc} isOppCard={true}>
            <p className="mx-auto mt-0.5 w-full bg-orange-300 text-center text-sm font-bold text-cyan-950">
                Oppenent To Guess
            </p>
        </CardLayout>
    );
};
