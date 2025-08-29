import ReactModal from "react-modal";
import black from "../assets/black.jpg";
import { useState } from "react";

interface CardLayoutPropsType {
    children: React.ReactNode;
    name: string;
    imgSrc: string;
    flipped: boolean;
}

export const CardLayout = ({ children, name, imgSrc, flipped }: CardLayoutPropsType) => {
    return (
        <figure
            className="border-3 border-gray-200 flex flex-col justify-between bg-gray-200 h-100 w-66 rounded-lg overflow-hidden mx-1 my-2.5 
            shadow-xs/15 hover:shadow-xl/30 transition-shadow hover:translate-y-[-1px]"
        >
            <img
                className="object-fill h-[84.5%] max-h-[85%] rounded-xs"
                src={flipped ? black : imgSrc}
                alt={name}
            />
            <figcaption className=" text-zinc-900 relative bottom-0.75 text-center text-xl font-bold m-auto h-[4.5%] w-full">
                {name}
            </figcaption>
            {children}
        </figure>
    );
};

interface CardPropsType {
    name: string;
    imgSrc: string;
    winner: boolean;
    handleCheckWinner: (win: boolean) => void;
}
export const Card = ({ name, imgSrc, winner, handleCheckWinner }: CardPropsType) => {
    const [flipped, setflipped] = useState(false);
    const [openModal, setOpenModal] = useState(false);

    const handleCloseModalAndCheckWinner = () => {
        setOpenModal(false);
        handleCheckWinner(winner);
    };

    return (
        <>
            <CardLayout name={name} imgSrc={imgSrc} flipped={flipped}>
                <div className="box-content flex justify-between h-[9.5%] border-t-3 border-gray-200">
                    <button
                        className="text-lg text-neutral-100 font-bold bg-green-600 hover:bg-green-800 border-gray-200 px-1 h-full w-[35%] border-r-3 cursor-pointer rounded-sm text-shadow-xs"
                        onClick={() => {
                            setOpenModal(true);
                        }}
                    >
                        The Guy
                    </button>
                    <div className="relative top-0.5 text-2xl font-bold m-auto text-center align-sub">
                        ❓
                    </div>
                    <button
                        className="text-lg text-neutral-100 font-bold  bg-red-600 hover:bg-red-800 border-gray-200 px-1 h-full w-[35%] border-l-3 cursor-pointer rounded-md"
                        onClick={() => {
                            setflipped(!flipped);
                        }}
                    >
                        Not Guy
                    </button>
                </div>
            </CardLayout>
            <ReactModal
                isOpen={openModal}
                className="border-slate-300 border-3 shadow-2xl rounded-2xl bg-radial from-slate-100 to-slate-200  fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-fit w-fit inline-block text-center p-10"
            >
                <p className="m-auto my-12 text-5xl font-bold">
                    Are you sure this <br /> is the guy!?
                </p>
                <div className="flex flex-row justify-between">
                    <button
                        className="mr-10 w-50 h-20 m-auto text-2xl text-neutral-100 font-bold border-b-9 border-green-700 bg-green-600 hover:bg-green-700 hover:border-green-800 px-1 rounded-md cursor-pointer shadow-md text-shadow-xs active:border-none active:translate-y-[1px] active:shadow-2xs active:inset-shadow-md"
                        onClick={handleCloseModalAndCheckWinner}
                    >
                        It&#39;s Him.
                    </button>
                    <button
                        className="ml-20 w-50 h-20 m-auto text-2xl text-neutral-100 font-bold border-b-9 border-amber-600 bg-amber-500 hover:bg-amber-600 hover:border-amber-700 px-1 rounded-md cursor-pointer shadow-md text-shadow-xs active:border-none active:translate-y-[1px] active:shadow-2xs active:inset-shadow-md"
                        onClick={() => {
                            setOpenModal(false);
                        }}
                    >
                        ...On Second Thought
                    </button>
                </div>
            </ReactModal>
        </>
    );
};

export const OpponentTargetCard = ({ name, imgSrc }: { name: string; imgSrc: string }) => {
    return (
        <CardLayout name={name} imgSrc={imgSrc} flipped={false}>
            <p className="text-center text-lg font-bold m-auto h-full bg-gray-200 w-full mt-2">
                Your Opponent has to Guess
            </p>
        </CardLayout>
    );
};
