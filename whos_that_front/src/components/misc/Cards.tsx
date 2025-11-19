import { useState, useEffect } from "react";
import type { EndStateType } from "../../lib/types.ts";
import type { PropsWithChildren } from "react";

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
            className={`border-2 ${isGame || isOppCard ? "my-0.75 max-xl:h-66 max-xl:w-42 h-72 w-48" : "h-91 w-59 my-2 max-xl:h-72 max-xl:w-48"} rounded-xs flex flex-col justify-between overflow-hidden ${isOppCard ? "animate-[flash-attention_2s_ease-in-out_1] border-orange-300 bg-orange-300" : "border-neutral-900 bg-neutral-400 hover:scale-105"} text-center transition-shadow`}
        >
            {/* Image takes up 84.5% of card height */}
            <img
                className="rounded-xs mx-1 mt-1 h-[83%] border bg-neutral-300 object-fill"
                src={imgSrc}
                alt={name}
            />
            {/* This is used for character names and game names, height is 4.5%  */}
            <figcaption
                className={` ${isGame || isOppCard ? "text-base" : "hover:text-blue-500 max-2xl:text-lg max-md:text-base 2xl:text-xl"} x relative bottom-px mx-auto h-[4.5%] text-center font-semibold leading-none text-black`}
            >
                {name}
            </figcaption>
            {/* Children slot (11% height remaining) for in-game controls or metadata */}
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
                <div className="mx-1 mb-0.5 box-content flex h-[9%] justify-between border-neutral-900 max-sm:mb-px">
                    {/* Guess Button */}
                    <button
                        className={`w-[35%] cursor-pointer border-2 border-neutral-600 bg-green-600 px-0.5 text-center font-semibold text-neutral-100 transition-all hover:bg-green-800 max-2xl:text-sm max-sm:font-medium ${flipped ? "hidden" : ""}`}
                        onClick={() => {
                            openConfirmModal(winner, name);
                        }}
                        disabled={flipped}
                    >
                        Guess
                    </button>
                    {/* Visual separator */}
                    <div className="m-auto text-center align-sub text-lg max-2xl:text-sm">❓</div>
                    {/* Hide/Unhide Button */}
                    <button
                        className="w-[35%] cursor-pointer border-2 border-neutral-600 bg-red-600 px-0.5 text-center font-semibold text-neutral-100 transition-all hover:bg-red-800 max-2xl:text-sm max-sm:font-medium"
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
