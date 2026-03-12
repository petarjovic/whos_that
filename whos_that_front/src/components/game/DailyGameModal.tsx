import { useState, useEffect } from "react";
import ModalLayout from "../layout/ModalLayout";

const SEEN_DAILY_MODAL = "hasSeenDailyModal";

const DailyGameModal = ({
    gangName,
    detectiveName,
}: {
    gangName: string;
    detectiveName: string;
}) => {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const hasSeenDailyModal = localStorage.getItem(SEEN_DAILY_MODAL);

        if (!hasSeenDailyModal) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setIsOpen(true);
        }
    }, []);

    const handleClose = () => {
        localStorage.setItem(SEEN_DAILY_MODAL, "true");
        setIsOpen(false);
    };

    return (
        <ModalLayout
            isOpen={isOpen}
            handleClose={handleClose}
            classNames="text-center font-medium max-w-4xl max-xl:w-3/4 max-sm:w-9/10 max-sm:px-2 max-sm:py-6 sm:p-8"
        >
            <h1 className="text-4xl text-neutral-700 font-bold whitespace-pre-wrap pb-3.5 mb-4 border-b   ">
                Break-in at &quot;Whos That?&quot; HQ!
            </h1>

            <p className="text-lg max-sm:text-base mb-7 space-y-3 text-neutral-700">
                <span className="text-xl font-medium">Oh no!</span> There was a break-in at
                &quot;Who&apos;s That?&quot; HQ by a member of the notorious {gangName} gang. The
                exact identity of the attacker is a mystery, but Who&apos;s That? Inc. has stated
                that they will discover the attackers identity and bring them to justice. The
                facility was extensively damaged, and it is reported that the HQs AI assistant,
                Whos-That-Bot-3000, was damaged in the attack. It is currently unclear if the young
                AI will survive. Aditionally, there are rumours that Whos-That has enlisted the help
                of the world-famous Detective {detectiveName}, to identify the attacker and bring
                them to justice.
            </p>

            <button
                onClick={handleClose}
                className="mx-auto h-13 w-fit cursor-pointer rounded-md border border-red-500 bg-red-400 px-4 text-xl font-semibold text-white shadow-sm/20 transition-all duration-15 text-shadow-xs/75 hover:border-red-600 hover:bg-red-500 hover:shadow-sm/20 hover:shadow-xs active:-translate-y-px active:border-none active:shadow-2xs"
            >
                I&apos;m on the Case!
            </button>
        </ModalLayout>
    );
};
export default DailyGameModal;
