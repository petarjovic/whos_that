import { useState, useEffect } from "react";
import ReactModal from "react-modal";

const VISITED_BEFORE = "hasVisitedBefore";

/* Modal pop up shown to uysers on first time visit to site */
const FirstVisitModal = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [showGameplay, setShowGameplay] = useState(false);

    useEffect(() => {
        const hasVisited = localStorage.getItem(VISITED_BEFORE);

        if (!hasVisited) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setIsOpen(true);
        }
    }, []);

    const handleClose = () => {
        localStorage.setItem(VISITED_BEFORE, "true");
        setIsOpen(false);
    };

    return (
        <ReactModal
            isOpen={isOpen}
            onRequestClose={handleClose}
            className="absolute top-1/2 left-1/2 mx-auto max-h-[90vh] max-w-6xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto border-2 bg-neutral-200 text-center shadow max-sm:w-9/10 max-sm:px-2 max-sm:py-6 sm:p-8"
            shouldCloseOnOverlayClick={false}
            shouldCloseOnEsc={false}
            overlayClassName="fixed inset-0 bg-zinc-800/75"
        >
            <div className="text-center">
                <h1 className="font-digitag mb-4 text-9xl font-bold tracking-wider whitespace-pre-wrap text-orange-300 text-shadow-sm/100 max-sm:text-7xl">
                    <span className="font-digitag">W</span>e
                    <span className="font-digitag relative left-2">l</span>come
                </h1>

                <div className="mb-7 space-y-3 text-2xl max-sm:text-xl">
                    <p className="text-3xl max-sm:text-2xl">
                        <span className="font-bold text-orange-300 text-shadow-xs/100">
                            Who&apos;s That<span className="text-red-500">?</span>
                        </span>{" "}
                        is a character elimination game inspired by classic board games!
                    </p>

                    <div className="mt-4">
                        <h3 className="mb-2 text-4xl font-bold text-orange-400 text-shadow-xs/100 max-sm:text-3xl">
                            How to Get Started:
                        </h3>
                        <ul className="space-y-2 pl-4">
                            <li>
                                From the homepage you can either browse and play exisiting games, or
                                create your own custom game.
                            </li>
                            <li>
                                <strong className="text-2xl text-red-400 italic">
                                    If you have a room code:
                                </strong>{" "}
                                enter it in the input box and click join game!
                            </li>
                        </ul>
                    </div>

                    <div className="mt-5">
                        <button
                            onClick={() => setShowGameplay(!showGameplay)}
                            className={`cursor-pointer font-bold ${showGameplay ? "text-4xl text-orange-300 text-shadow-sm/33 max-sm:text-3xl" : "text-3xl text-blue-500 underline max-sm:text-2xl"} hover:text-red-400 hover:italic`}
                        >
                            {showGameplay ? "Game Rules:" : "Don't Know How to Play?"}
                        </button>
                        {showGameplay && (
                            <p className="mx-auto mt-2 w-9/10">
                                Who&apos;s That is a customizable version of the two person game
                                where players take turns asking yes-or-no questions to narrow down
                                the other&apos;s secret character! You&apos;ll see which character
                                your opponent is trying to guess, and they&apos;ll know which you
                                need to guess. Ask clever questions to eliminate possibilities and
                                make your best guess before your opponent... but watch out - if you
                                guess wrong: you lose!
                            </p>
                        )}
                    </div>
                </div>

                <button
                    onClick={handleClose}
                    className="mx-auto h-16 w-fit cursor-pointer rounded-md border-x border-b-9 border-amber-600 bg-amber-500 px-8 text-2xl font-bold text-white shadow-sm/20 transition-all duration-15 text-shadow-xs/100 hover:border-amber-700 hover:bg-amber-600 hover:shadow-sm/20 hover:shadow-xs active:-translate-y-px active:border-none active:shadow-2xs"
                >
                    Ok I Get It
                </button>
            </div>
        </ReactModal>
    );
};
export default FirstVisitModal;
