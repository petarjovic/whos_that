import type { EndState } from "@server/types";
import { useState, useEffect } from "react";
import type { PropsWithChildren } from "react";
import { FaQuestion } from "react-icons/fa";

interface CardLayoutProps {
    name: string;
    imgSrc: string | undefined;
    isOppCard?: boolean;
    size?: "S" | "M" | "L";
}

type sizeTailwind = {
    [key in "S" | "M" | "L"]: string;
};

const sizeMap: sizeTailwind = {
    S: "w-26.75 h-42",
    M: "w-40.5 h-63.75",
    L: "max-xl:h-66.75 max-xl:w-39 w-45.75 h-72.5 ",
};

/**
 * Reused card layout component
 * Adapts styling based on whether it's in-game (including signfiying opponent's card), or browsing
 */
export const CardLayout = ({
    children,
    name,
    imgSrc,
    isOppCard = false,
    size = "M",
}: PropsWithChildren<CardLayoutProps>) => {
    return (
        <figure
            className={`border ${sizeMap[size]} flex flex-col justify-between rounded-xs hover:scale-106 ${isOppCard ? "animate-[flash-attention_2s_ease-in-out_1] border-orange-300 bg-orange-300" : "border-neutral-600 bg-neutral-50"} text-center`}
        >
            <img
                className={`mx-1 mt-1 h-8/10 max-h-8/10 border border-neutral-400 bg-gray-300 object-fill ${isOppCard ? "grayscale-100" : ""}`}
                src={imgSrc}
                alt={name}
            />
            <figcaption
                className={`${size === "L" ? "cursor-default items-center text-lg max-md:text-base" : "items-center text-base"} ${size === "M" ? "hover:text-blue-500" : ""} m-auto flex max-h-1/10 text-center leading-none font-semibold text-black`}
            >
                {name}
            </figcaption>
            <div className="max-h-1/10">{children}</div>
        </figure>
    );
};

interface CardProps {
    name: string;
    imgSrc: string;
    winner: boolean;
    openConfirmModal: (win: boolean, name: string) => void;
    resetOnNewGame: EndState; // Triggers card reset when game ends
    guessingDisabled: boolean;
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
    guessingDisabled,
}: CardProps) => {
    const [flipped, setFlipped] = useState(false);

    // Reset card visibility when new game starts
    useEffect(() => {
        if (resetOnNewGame.every((e) => e === null)) setFlipped(false);
    }, [resetOnNewGame]);

    return (
        <>
            <CardLayout name={flipped ? "" : name} imgSrc={flipped ? undefined : imgSrc} size="L">
                {/* In game controls for hiding and guessing characters */}
                <div className="mx-1 mb-1 box-content flex items-center justify-between">
                    {/* Guess Button */}
                    <button
                        className={`w-[34%] rounded px-0.5 py-px text-center font-semibold text-neutral-100 transition-all text-shadow-xs/40 max-2xl:text-sm max-sm:font-medium ${flipped ? "hidden" : ""} ${guessingDisabled ? "bg-neutral-700" : "cursor-pointer bg-green-600 text-shadow-green-900 hover:bg-green-700"}`}
                        onClick={() => {
                            openConfirmModal(winner, name);
                        }}
                        disabled={flipped || guessingDisabled}
                    >
                        Guess
                    </button>
                    {/* Visual separator */}
                    <div className="relative top-px m-auto text-center text-lg text-red-600 max-2xl:text-sm">
                        <FaQuestion />
                    </div>
                    {/* Hide/Unhide Button */}
                    <button
                        className="w-[34%] cursor-pointer rounded bg-red-600 px-0.5 py-px text-center font-semibold text-neutral-100 transition-all text-shadow-xs/40 text-shadow-red-900 hover:bg-red-700 max-2xl:text-sm max-sm:font-medium"
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
        <CardLayout name={name} imgSrc={imgSrc} isOppCard={true} size={"L"}>
            <p className="mx-auto mb-1 w-full bg-orange-300 text-center text-base font-medium text-neutral-700">
                Opponent to Guess
            </p>
        </CardLayout>
    );
};
