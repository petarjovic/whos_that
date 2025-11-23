import { useState, useEffect } from "react";
import type { EndStateType } from "../../lib/types.ts";
import type { PropsWithChildren } from "react";
import { FaQuestion } from "react-icons/fa";

interface CardLayoutProps {
    name: string;
    imgSrc: string | undefined;
    isOppCard?: boolean;
    isGame?: boolean;
}

/**
 * Reused card layout component
 * Adapts styling based on whether it's in-game (including signfiying opponent's card), or browsing
 */
export const CardLayout = ({
    children,
    name,
    imgSrc,
    isOppCard = false,
    isGame = false,
}: PropsWithChildren<CardLayoutProps>) => {
    return (
        <figure
            className={`border ${isGame || isOppCard ? "max-xl:h-66 max-xl:w-42 w-50 h-73" : "max-xl:h-34 h-56 w-40 max-xl:w-24"} rounded-xs flex flex-col justify-between overflow-hidden ${isOppCard ? "animate-[flash-attention_2s_ease-in-out_1] border-orange-300 bg-orange-300" : "border-gray-500 bg-white hover:scale-105"} text-center`}
        >
            <img
                className="max-h-8/10 h-8/10 mx-1.5 mt-1.5 border border-neutral-400 bg-neutral-200 object-fill"
                src={imgSrc}
                alt={name}
            />
            <figcaption
                className={` ${isGame || isOppCard ? "items-center text-lg max-md:text-base" : "items-baseline text-base hover:text-blue-500"} h-1/20 m-auto flex text-center font-semibold leading-none text-black`}
            >
                {name}
            </figcaption>
            {/* Children slot (15% height remaining) for in-game controls or metadata */}
            {children}
        </figure>
    );
};

interface CardProps {
    name: string;
    imgSrc: string;
    winner: boolean;
    openConfirmModal: (win: boolean, name: string) => void;
    resetOnNewGame: EndStateType; // Triggers card reset when game ends
    isGame?: boolean;
}
/**
 * Interactive game card with hide/unhide (flip) and "guess" functionality
 */
export const Card = ({
    name,
    imgSrc,
    winner,
    openConfirmModal,
    resetOnNewGame,
    isGame = false,
}: CardProps) => {
    const [flipped, setFlipped] = useState(false);

    // Reset card visibility when new game starts (empty string = no end state)
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
                {/* In game controls for hiding and guessing characters */}
                <div className="mx-1 mb-1 box-content flex h-[9%] justify-between border-neutral-900 max-sm:mb-px">
                    {/* Guess Button */}
                    <button
                        className={`w-[34%] cursor-pointer rounded bg-green-500 px-0.5 text-center font-semibold text-neutral-100 transition-all hover:bg-green-700 max-2xl:text-sm max-sm:font-medium ${flipped ? "hidden" : ""}`}
                        onClick={() => {
                            openConfirmModal(winner, name);
                        }}
                        disabled={flipped}
                    >
                        Guess
                    </button>
                    {/* Visual separator */}
                    <div className="relative top-px m-auto text-center text-lg text-red-600 max-2xl:text-sm">
                        <FaQuestion />
                    </div>
                    {/* Hide/Unhide Button */}
                    <button
                        className="w-[34%] cursor-pointer rounded bg-red-500 px-0.5 text-center font-semibold text-neutral-100 transition-all hover:bg-red-700 max-2xl:text-sm max-sm:font-medium"
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

/**
 * Special card showing which character the opponent needs to guess
 */
export const OpponentTargetCard = ({ name, imgSrc }: { name: string; imgSrc: string }) => {
    return (
        <CardLayout name={name} imgSrc={imgSrc} isOppCard={true}>
            <p className="mx-auto mt-0.5 w-full bg-orange-300 text-center text-sm font-bold">
                Opponent's Card
            </p>
        </CardLayout>
    );
};
