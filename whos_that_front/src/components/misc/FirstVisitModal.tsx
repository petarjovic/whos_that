import { useState, useEffect } from "react";
import ReactModal from "react-modal";

const VISITED_BEFORE = "hasVisitedBefore";

const FirstVisitModal = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [showGameplay, setShowGameplay] = useState(false);

    useEffect(() => {
        const hasVisited = localStorage.getItem(VISITED_BEFORE);

        if (!hasVisited) {
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
            className="shadow-2xl/30 border-x-1 bg-linear-to-b border-b-13 text-shadow-xs/100 w-9/10 absolute left-1/2 top-1/2 mx-auto max-h-[90vh] max-w-6xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg border-blue-700 from-blue-400 to-blue-600 p-8 text-center text-neutral-100 shadow-2xl"
            shouldCloseOnOverlayClick={false}
            shouldCloseOnEsc={false}
            overlayClassName="fixed inset-0 bg-gray-600/75"
        >
            <div className="text-center">
                <h1 className="font-digitag text-shadow-md/85 mb-5 whitespace-pre-wrap text-9xl font-bold tracking-wider text-orange-300">
                    Welcome
                </h1>

                <div className="mb-7 space-y-3 text-2xl">
                    <p className="text-3xl">
                        <span className="font-bold text-orange-300">
                            Who's That<span className="text-red-500">?</span>
                        </span>{" "}
                        is a character elimination game inspired by classic board games!
                    </p>
                    <p className="mx-auto w-[85%]">
                        Upload images to represent "characters" in your own custom game! Or play
                        using a premade set of "characters" by browsing existing games. Room codes
                        let you play your custom game privately with friends, or you can share it
                        publicly for others to enjoy.
                    </p>

                    <div className="mt-4">
                        <h3 className="text-shadow-sm/33 mb-2 text-4xl font-bold text-orange-300">
                            How to Get Started:
                        </h3>
                        <ul className="space-y-2 pl-4">
                            <li>
                                Click <strong className="text-2xl">Play New Game</strong> to browse
                                existing games or create a custom game.
                            </li>
                            <li>
                                <strong className="text-2xl italic text-orange-300">
                                    If you have a room code:
                                </strong>{" "}
                                enter it in the input box and click join game!
                            </li>
                        </ul>
                    </div>

                    <div className="mt-5">
                        <button
                            onClick={() => setShowGameplay(!showGameplay)}
                            className={`cursor-pointer font-bold ${showGameplay ? "text-shadow-sm/33 text-4xl text-orange-300" : "text-shadow-2xs/90 text-3xl underline"} hover:italic hover:text-amber-500`}
                        >
                            {showGameplay ? "Game Rules:" : "Don't Know How to Play?"}
                        </button>
                        {showGameplay && (
                            <p className="w-9/10 mx-auto mt-2">
                                Who's That is a two person game where players take turns asking
                                yes-or-no questions to narrow down the other's secret character!
                                You'll see which character your opponent is trying to guess (bottom
                                right of your board), and they'll know which you need to guess. Ask
                                clever questions to eliminate possibilities and make your best guess
                                before your opponent... but watch out - if you guess wrong: you
                                lose!
                            </p>
                        )}
                    </div>
                </div>

                <button
                    onClick={handleClose}
                    className="border-b-9 border-x-1 text-shadow-xs/100 active:shadow-2xs hover:shadow-sm/20 duration-15 shadow-sm/20 hover:shadow-xs mx-auto h-16 w-fit cursor-pointer rounded-md border-amber-600 bg-amber-500 px-8 text-2xl font-bold text-white transition-all hover:border-amber-700 hover:bg-amber-600 active:translate-y-[1px] active:border-none"
                >
                    Ok I Get It
                </button>
            </div>
        </ReactModal>
    );
};
export default FirstVisitModal;
