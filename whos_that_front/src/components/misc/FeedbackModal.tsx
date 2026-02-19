import { useState } from "react";
import ReactModal from "react-modal";
import env from "../../lib/zodEnvSchema.ts";
import { logError } from "../../lib/logger.ts";
import type { Feedback } from "@server/types";

// eslint-disable-next-line @typescript-eslint/consistent-indexed-object-style
const FEEDBACK_LABELS: Record<Feedback["type"], string> = {
    Bug: "Bug Report",
    FeatureReq: "Feature Request",
    Other: "Comment",
};

const FeedbackModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
    const [feedback, setFeedback] = useState<Feedback>({ type: "Bug", message: "" });
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleClose = () => {
        onClose();
        setTimeout(() => {
            setSubmitting(false);
            setSubmitted(false);
            setFeedback({ type: "Other", message: "" });
        }, 200);
    };

    const handleSubmit = async () => {
        if (!feedback.message.trim()) return;
        setSubmitting(true);
        try {
            const res = await fetch(`${env.VITE_SERVER_URL}/api/feedback`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    ...feedback,
                    url: window.location.href,
                    userAgent: navigator.userAgent,
                }),
            });
            if (!res.ok) throw new Error(`Server responded with ${res.status.toString()}`);
            setSubmitted(true);
        } catch (e) {
            logError(e);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <ReactModal
                isOpen={isOpen}
                onRequestClose={handleClose}
                className="absolute top-1/2 left-1/2 mx-auto flex h-fit w-[97%] max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col gap-4 border-2 border-neutral-800 bg-neutral-200 px-4 py-6 text-center shadow-lg"
                overlayClassName="fixed inset-0 z-50 bg-zinc-900/70"
                shouldCloseOnOverlayClick={false}
                shouldCloseOnEsc={!submitting}
            >
                <h2 className="text-3xl font-bold text-neutral-800">Feedback</h2>

                {submitted ? (
                    <div className="flex flex-col gap-4">
                        <p className="text-xl font-medium text-green-700">
                            Thanks! Your feedback has been submitted.
                        </p>
                        <button
                            onClick={handleClose}
                            className="mx-auto w-1/2 cursor-pointer rounded-xs bg-red-400 p-1 text-lg font-medium text-white hover:bg-red-500"
                        >
                            Close
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3 text-left">
                        {/* Type selector */}
                        <div className="flex items-center gap-1.5 rounded-xs border border-neutral-400 bg-neutral-300 px-3 py-2 text-center">
                            <div className="mx-auto">
                                {" "}
                                <label
                                    htmlFor="feedback-type"
                                    className="mr-2 text-sm font-semibold tracking-wide text-neutral-700 uppercase"
                                >
                                    Reason:
                                </label>
                                <select
                                    id="feedback-type"
                                    value={feedback.type}
                                    onChange={(e) =>
                                        setFeedback({
                                            ...feedback,
                                            type: e.target.value as Feedback["type"],
                                        })
                                    }
                                    disabled={submitting}
                                    className="rounded border border-neutral-400 bg-neutral-50 py-1 text-center text-base font-medium text-neutral-800 focus:outline-none"
                                >
                                    {(
                                        Object.entries(FEEDBACK_LABELS) as [
                                            Feedback["type"],
                                            string,
                                        ][]
                                    ).map(([value, label]) => (
                                        <option key={value} value={value}>
                                            {label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Message */}
                        <div className="flex flex-col gap-1 rounded-xs border border-neutral-400 bg-neutral-300 px-3 py-2">
                            <label
                                htmlFor="feedback-message"
                                className="text-sm font-semibold tracking-wide text-neutral-700 uppercase"
                            >
                                Message <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                id="feedback-message"
                                value={feedback.message}
                                onChange={(e) =>
                                    setFeedback({ ...feedback, message: e.target.value })
                                }
                                placeholder={
                                    feedback.type === "Bug"
                                        ? "Please describe the bug in detail, including what you were doing when it occured. This will help us fix it faster!"
                                        : "Let us know your thoughts..."
                                }
                                rows={4}
                                maxLength={2000}
                                disabled={submitting}
                                className="w-full resize-none rounded border border-neutral-400 bg-neutral-50 p-1.5 text-base font-medium placeholder:text-gray-400 focus:outline-none"
                            />
                            <span className="self-end text-xs text-neutral-500">
                                {feedback.message.length}/2000
                            </span>
                        </div>

                        {/* Actions */}
                        <div className="mt-1 flex justify-center gap-4">
                            <button
                                onClick={handleClose}
                                disabled={submitting}
                                className="w-1/3 cursor-pointer rounded-xs border border-neutral-500 bg-neutral-300 p-1 text-base font-medium text-neutral-800 hover:bg-neutral-400 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Exit
                            </button>
                            <button
                                onClick={() => {
                                    void handleSubmit();
                                }}
                                disabled={submitting || !feedback.message.trim()}
                                className={`w-1/3 cursor-pointer rounded-xs p-1 text-base font-medium text-white disabled:cursor-not-allowed ${
                                    submitting || !feedback.message.trim()
                                        ? "bg-gray-700"
                                        : "bg-red-400 hover:bg-red-500"
                                }`}
                            >
                                {submitting ? "Sending..." : "Submit"}
                            </button>
                        </div>
                    </div>
                )}
            </ReactModal>
        </>
    );
};

export default FeedbackModal;
