import black from "../assets/black.jpg";
import { useState, useEffect } from "react";
import type { EndStateType } from "../lib/types";

interface CardLayoutProps {
    children: React.ReactNode;
    name: string;
    imgSrc: string;
}

export const CardLayout = ({ children, name, imgSrc }: CardLayoutProps) => {
    return (
        <figure
            className="border-3 border-gray-200 flex flex-col justify-between bg-gray-200 h-100 w-66 rounded-lg overflow-hidden mx-1 my-2.5 
            shadow-xs/15 hover:shadow-xl/30 transition-shadow hover:translate-y-[-1px]"
        >
            <img className="object-fill h-[84.5%] max-h-[85%] rounded-xs" src={imgSrc} alt={name} />
            <figcaption className=" text-zinc-900 relative bottom-0.75 text-center text-xl font-bold m-auto h-[4.5%] w-full">
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
                <div className="box-content flex justify-between h-[9.5%] border-t-3 border-gray-200">
                    <button
                        className="text-lg text-neutral-100 font-bold bg-green-600 hover:bg-green-800 border-gray-200 px-1 h-full w-[35%] border-r-3 cursor-pointer rounded-sm text-shadow-xs text-center"
                        onClick={() => {
                            openConfirmModal(winner);
                        }}
                    >
                        Guess
                    </button>
                    <div className="relative top-0.5 text-2xl font-bold m-auto text-center align-sub">
                        ❓
                    </div>
                    <button
                        className="text-lg text-neutral-100 font-bold  bg-red-600 hover:bg-red-800 border-gray-200 px-1 h-full w-[35%] border-l-3 cursor-pointer rounded-md text-center"
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
            <p className="text-center text-lg font-bold m-auto h-full bg-gray-200 w-full mt-2">
                Your Opponent has to Guess
            </p>
        </CardLayout>
    );
};
