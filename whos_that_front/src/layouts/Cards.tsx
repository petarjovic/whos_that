import black from "../assets/black.jpg";
import { useState, useEffect } from "react";
import type { EndStateType } from "../lib/types.ts";

interface CardLayoutProps {
    children: React.ReactNode;
    name: string;
    imgSrc: string;
}

export const CardLayout = ({ children, name, imgSrc }: CardLayoutProps) => {
    return (
        <figure className="border-3 h-100 w-66 shadow-xs/15 hover:shadow-xl/30 mx-1 my-2.5 flex flex-col justify-between overflow-hidden rounded-lg border-gray-200 bg-gray-200 transition-shadow hover:translate-y-[-1px]">
            <img className="rounded-xs h-[84.5%] max-h-[85%] object-fill" src={imgSrc} alt={name} />
            <figcaption className="bottom-0.75 relative m-auto h-[4.5%] w-full text-center text-xl font-bold text-zinc-900">
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
    openConfirmModal: (win: boolean) => void;
    resetOnNewGame: EndStateType;
}
export const Card = ({ name, imgSrc, winner, openConfirmModal, resetOnNewGame }: CardProps) => {
    const [flipped, setFlipped] = useState(false);

    useEffect(() => {
        if (resetOnNewGame.length === 0) setFlipped(false);
    }, [resetOnNewGame]);

    return (
        <>
            <CardLayout name={name} imgSrc={flipped ? black : imgSrc}>
                <div className="border-t-3 box-content flex h-[9.5%] justify-between border-gray-200">
                    <button
                        className="border-r-3 text-shadow-xs h-full w-[35%] cursor-pointer rounded-sm border-gray-200 bg-green-600 px-1 text-center text-lg font-bold text-neutral-100 hover:bg-green-800"
                        onClick={() => {
                            openConfirmModal(winner);
                        }}
                    >
                        Guess
                    </button>
                    <div className="relative top-0.5 m-auto text-center align-sub text-2xl font-bold">
                        ❓
                    </div>
                    <button
                        className="border-l-3 h-full w-[35%] cursor-pointer rounded-md border-gray-200 bg-red-600 px-1 text-center text-lg font-bold text-neutral-100 hover:bg-red-800"
                        onClick={() => {
                            setFlipped(!flipped);
                        }}
                    >
                        Flip
                    </button>
                </div>
            </CardLayout>
        </>
    );
};

export const OpponentTargetCard = ({ name, imgSrc }: { name: string; imgSrc: string }) => {
    return (
        <CardLayout name={name} imgSrc={imgSrc}>
            <p className="m-auto mt-2 h-full w-full bg-gray-200 text-center text-lg font-bold">
                Your Opponent has to Guess
            </p>
        </CardLayout>
    );
};
