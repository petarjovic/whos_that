import { useState, useEffect } from "react";
import ModalLayout from "../layout/ModalLayout";
import { useBetterAuthSession } from "../../lib/hooks.ts";

const SEEN_DAILY_MODAL = "hasSeenDailyModal";

const DailyGameModal = ({
    gangName,
    detectiveName,
}: {
    gangName: string;
    detectiveName: string;
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const { session } = useBetterAuthSession();

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
            classNames="text-center font-medium max-w-5xl max-xl:w-3/4 max-sm:w-9/10 max-sm:px-2 max-sm:py-6 sm:p-8"
        >
            <p className="text-xl max-sm:text-base mb-7 space-y-3  italic text-blue-500">
                Welcome to{" "}
                <span className="font-bold text-orange-300 text-shadow-xs/70">
                    Who&apos;s That<span className="text-red-500">?</span>
                </span>{" "}
                &apos;s new game mode! Each day a new game will be the day&apos;s challenge. You
                need to guess today&apos;s character by asking our friendly AI up to 6 Yes-or-No
                questions about them. Good luck!
            </p>

            <div className="border mb-7 px-2 2xl:px-5">
                <h1 className="text-4xl text-neutral-700 font-bold whitespace-pre-wrap mt-4 mb-6 w-fit mx-auto text-center underline">
                    Break-in at &quot;Whos That?&quot; HQ!
                </h1>

                <p className="text-lg max-sm:text-base pb-3 text-neutral-700">
                    <span className="text-xl font-medium">Oh no!</span> There was a break-in at{" "}
                    <span className="italic">
                        &quot;Who&apos;s That?&quot; HQ by a member of the notorious
                        <span className="italic font-bold text-red-600"> {gangName} </span>
                        gang.{" "}
                    </span>{" "}
                    The exact identity of the attacker is a mystery, but Who&apos;s That? Inc. has
                    claims they will discover the attackers identity and bring them to justice. The
                    facility was extensively damaged, and it is reported that the HQs AI assistant,
                    Whos-That-Bot-3000, was damaged in the attack. It is currently unclear if the
                    young AI will survive. Aditionally, there are rumours that
                    <span className="italic">
                        {" "}
                        Whos-That has enlisted the help of {session ? "the" : "a"} world-famous{" "}
                        <span className="italic font-bold text-blue-600">
                            {" "}
                            Detective{session ? detectiveName : ""}
                        </span>
                        .
                    </span>
                </p>
            </div>
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
