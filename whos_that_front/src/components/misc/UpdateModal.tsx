import { useState, useEffect } from "react";
import ModalLayout from "../layout/ModalLayout";

const SEEN_UPDATE = "hasSeenUpdateModal";
const VISITED_BEFORE = "hasVisitedBefore";

/* Modal pop up shown to returning users on updates */
const UpdateModal = () => {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const hasSeenUpdate = localStorage.getItem(SEEN_UPDATE);
        const hasVisited = localStorage.getItem(VISITED_BEFORE);

        if (!hasSeenUpdate && hasVisited) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setIsOpen(false); //CURRENTLY OFF SO SET TO FALSE
        }
    }, []);

    const handleClose = () => {
        localStorage.setItem(SEEN_UPDATE, "true");
        setIsOpen(false);
    };

    return (
        <ModalLayout
            isOpen={isOpen}
            handleClose={handleClose}
            classNames="text-center font-medium max-w-4xl max-xl:w-3/4 max-sm:w-9/10 max-sm:px-2 max-sm:py-6 sm:p-8"
        >
            <h1 className="mb-8 font-bold whitespace-pre-wrap text-blue-400 text-shadow-xs/50 max-md:text-3xl md:text-4xl lg:text-5xl">
                <span>✨</span> Happy New Year <span>✨</span>
            </h1>

            <div className="mb-7 space-y-3 text-xl max-sm:text-lg">
                <p className="text-2xl max-sm:text-xl">
                    To celebrate 2026
                    <span className="font-bold text-orange-300 text-shadow-xs/100 max-md:text-2xl md:text-3xl">
                        {" "}
                        Who&apos;s That<span className="text-red-500">?</span>
                    </span>{" "}
                    that has gotten some updates: most importantly it now supports games with
                    <span className="text-red-400 italic"> up to 36 images</span>!
                </p>
                <p>
                    Thanks for using the app, I never thought so many people would find it useful.
                    Please be patient as we iron-out all the features. Lots of big updates coming in
                    2026.
                </p>
            </div>

            <button
                onClick={handleClose}
                className="mx-auto h-16 w-fit cursor-pointer rounded-md border-x border-b-9 border-amber-600 bg-amber-500 px-8 text-2xl font-bold text-white shadow-sm/20 transition-all duration-15 text-shadow-xs/75 hover:border-amber-700 hover:bg-amber-600 hover:shadow-sm/20 hover:shadow-xs active:-translate-y-px active:border-none active:shadow-2xs"
            >
                Ok Quit Yapping
            </button>
        </ModalLayout>
    );
};
export default UpdateModal;
