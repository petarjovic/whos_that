import { useState, useEffect } from "react";
import ModalLayout from "../layout/ModalLayout.tsx";
import env from "../../lib/zodEnvSchema.ts";
import { logError } from "../../lib/logger.ts";
import type { CardDataUrl } from "@server/types";
import { serverResponseSchema } from "../../lib/zodSchema.ts";
import { gameDataSchema } from "@server/zodSchema";
import { CardLayout } from "../misc/Cards.tsx";
import LoadingSpinner from "../misc/LoadingSpinner.tsx";

interface ScheduleDailyModalProps {
    gameId: string;
    onClose: () => void;
}

const ScheduleDailyModal = ({ gameId, onClose }: ScheduleDailyModalProps) => {
    const [cardData, setCardData] = useState<CardDataUrl[]>([]);
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const [scheduledDate, setScheduledDate] = useState("");
    const [characterContext, setCharacterContext] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchGameData = async () => {
            setLoading(true);
            try {
                const res = await fetch(`${env.VITE_SERVER_URL}/api/gameData/${gameId}`, {
                    credentials: "include",
                });
                if (!res.ok) throw new Error(`Failed to fetch game data: ${res.status.toString()}`);
                const validData = gameDataSchema.safeParse(await res.json());
                if (!validData.success) throw new Error("Invalid game data");
                setCardData(validData.data.cardData);
            } catch (e) {
                logError(e);
            } finally {
                setLoading(false);
            }
        };
        void fetchGameData();
    }, [gameId]);

    const handleClose = () => {
        onClose();
        setTimeout(() => {
            setSelectedIndex(null);
            setScheduledDate("");
            setCharacterContext("");
            setSubmitting(false);
            setSubmitted(false);
        }, 200);
    };

    const handleSubmit = async () => {
        if (selectedIndex === null || !scheduledDate || !characterContext.trim()) return;
        setSubmitting(true);
        try {
            const res = await fetch(`${env.VITE_SERVER_URL}/api/daily/schedule`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    gameId,
                    scheduledDate,
                    winningIndex: selectedIndex,
                    characterContext,
                }),
            });
            if (!res.ok) {
                const errorData = serverResponseSchema.safeParse(await res.json());
                throw new Error(errorData.data?.message ?? "Failed to schedule daily");
            }
            setSubmitted(true);
        } catch (e) {
            logError(e);
            alert(e instanceof Error ? e.message : "Failed to schedule daily");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <ModalLayout
            classNames="flex h-fit w-[97%] max-w-4xl flex-col gap-4 px-6 py-6 overflow-y-auto"
            isOpen={true}
            handleClose={handleClose}
        >
            <h2 className="text-5xl font-bold leading-none text-cyan-500 text-center text-shadow-sm/20">
                Schedule Daily
            </h2>

            {submitted ? (
                <div className="flex flex-col gap-4 text-center">
                    <p className="text-xl font-medium text-green-700">
                        Daily scheduled successfully!
                    </p>
                    <button
                        onClick={handleClose}
                        className="mx-auto w-1/2 cursor-pointer rounded-xs bg-red-400 p-1 text-lg font-medium text-white hover:bg-red-500 inset-shadow-neutral-200 inset-shadow-sm/15 shadow-sm active:shadow-none"
                    >
                        Close
                    </button>
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    <div className="flex justify-around gap-5 w-full items-center ">
                        {/* Game ID */}
                        <div className="flex items-center gap-5 rounded-xs border border-neutral-500 bg-neutral-300 px-3 py-3 inset-shadow-neutral-200 inset-shadow-sm/15 shadow-xs w-full h-full">
                            <label className="text-sm font-semibold tracking-wide text-neutral-700 uppercase">
                                Game Id:
                            </label>
                            <p className="font-medium text-neutral-800 bg-gray-200 px-1.5 py-0.5 border border-neutral-400 rounded">
                                {gameId}
                            </p>
                        </div>

                        {/* Date Picker */}
                        <div className="flex gap-1 justify-between rounded-xs border border-neutral-500 bg-neutral-300 px-3 py-2 inset-shadow-neutral-200 inset-shadow-sm/15 shadow-xs w-full h-full">
                            <label
                                htmlFor="scheduled-date"
                                className="flex gap-1 items-center text-sm font-semibold tracking-wide text-neutral-700 uppercase"
                            >
                                Date <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="scheduled-date"
                                type="date"
                                value={scheduledDate}
                                onChange={(e) => setScheduledDate(e.target.value)}
                                disabled={submitting}
                                className="w-17/20 rounded border border-neutral-400 bg-neutral-50 p-1.5 text-base font-medium focus:outline-none cursor-pointer"
                            />
                        </div>
                    </div>

                    {/* Character Selection */}
                    <div className="flex flex-col gap-2 rounded-xs border border-neutral-500 bg-neutral-300 px-2 py-2 inset-shadow-neutral-200 inset-shadow-sm/15 shadow-xs">
                        <label className="text-sm font-semibold tracking-wide text-neutral-700 uppercase">
                            Winning Character <span className="text-red-500">*</span>
                        </label>

                        {loading ? (
                            <LoadingSpinner />
                        ) : (
                            <div className="flex flex-wrap gap-2 px-0.5 py-2.5  justify-center w-fit items-center  border-stone-600 border bg-stone-400 inset-shadow-sm/15 shadow-xs/15">
                                {cardData.map(({ imageUrl, name, orderIndex }) => (
                                    <button
                                        key={orderIndex}
                                        type="button"
                                        onClick={() => setSelectedIndex(orderIndex)}
                                        disabled={submitting}
                                        className="disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                    >
                                        <CardLayout
                                            name={name}
                                            imgSrc={imageUrl}
                                            size="S"
                                            highlightOnHover={true}
                                        >
                                            {selectedIndex === orderIndex && (
                                                <div className="h-0 w-0 relative">
                                                    {" "}
                                                    <div className="absolute bottom-10 left-4 w-18 rounded bg-green-500/90 text-white py-0.5 text-center text-xs font-semibold">
                                                        Selected
                                                    </div>
                                                </div>
                                            )}
                                        </CardLayout>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Character Context */}
                    <div className="flex flex-col gap-1 rounded-xs border border-neutral-500 bg-neutral-300 px-3 py-2 inset-shadow-neutral-200 inset-shadow-sm/15 shadow-xs">
                        <label
                            htmlFor="character-context"
                            className="text-sm font-semibold tracking-wide text-neutral-700 uppercase"
                        >
                            Character Context <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            id="character-context"
                            value={characterContext}
                            onChange={(e) => setCharacterContext(e.target.value)}
                            placeholder="Provide context about the winning character for the AI to use..."
                            rows={6}
                            maxLength={150000}
                            disabled={submitting}
                            className="w-full resize-none rounded border border-neutral-400 bg-neutral-50 p-1.5 text-base font-medium placeholder:text-gray-400 focus:outline-none"
                        />
                        <span className="self-end text-xs text-neutral-500">
                            {characterContext.length}/150000
                        </span>
                    </div>

                    {/* Actions */}
                    <div className="mt-1 flex justify-center gap-4">
                        <button
                            onClick={handleClose}
                            disabled={submitting}
                            className="w-1/3 cursor-pointer rounded-xs border border-neutral-500 bg-neutral-300 p-1 text-base font-medium text-neutral-800 hover:bg-neutral-400 hover:border-neutral-500 disabled:cursor-not-allowed disabled:opacity-50 inset-shadow-neutral-200 inset-shadow-sm/15 shadow-sm active:shadow-none"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => {
                                void handleSubmit();
                            }}
                            disabled={
                                submitting ||
                                selectedIndex === null ||
                                !scheduledDate ||
                                !characterContext.trim()
                            }
                            className={`w-1/3 cursor-pointer rounded-xs p-1 text-base font-medium text-white disabled:cursor-not-allowed inset-shadow-neutral-200 inset-shadow-sm/15 shadow-sm ${
                                submitting ||
                                selectedIndex === null ||
                                !scheduledDate ||
                                !characterContext.trim()
                                    ? "bg-slate-700"
                                    : "bg-red-400 hover:bg-red-500"
                            }`}
                        >
                            {submitting ? "Scheduling..." : "Schedule"}
                        </button>
                    </div>
                </div>
            )}
        </ModalLayout>
    );
};

export default ScheduleDailyModal;
