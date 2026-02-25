import { useEffect, useRef, useState } from "react";
import { GiVintageRobot } from "react-icons/gi";

export interface ChatMessage {
    isUser: boolean;
    msg: string;
}

interface ChatPanelProps {
    messages: ChatMessage[];
    onSend: (text: string) => void;
    isLoading?: boolean;
    opponentLabel?: string;
}

const ChatPanel = ({ messages, onSend, isLoading, opponentLabel = "Opponent" }: ChatPanelProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [draft, setDraft] = useState("");
    const bottomRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to latest message
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSubmit = (e: React.SubmitEvent) => {
        e.preventDefault();
        if (!draft.trim() || isLoading) return;
        onSend(draft.trim());
        setDraft("");
    };

    const panel = (
        <div className="flex h-full min-h-1/3 flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-neutral-700 bg-gray-300 px-3 py-2 text-center font-semibold text-neutral-800">
                <span className="mx-auto flex items-center">
                    <GiVintageRobot size={"2.25em"} color={"black"} /> {opponentLabel}
                </span>
                {/* Minimize button — mobile only */}
                <button
                    onClick={() => setIsOpen(false)}
                    className="cursor-pointer text-neutral-500 hover:text-neutral-800 lg:hidden"
                    aria-label="Minimize chat"
                >
                    ✕
                </button>
            </div>

            {/* Message list */}
            <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-3 py-2">
                {messages.map((msg, i) => (
                    <div
                        key={i}
                        className={`w-fit max-w-[85%] rounded px-2 py-1 text-base ${
                            msg.isUser ? "self-end bg-orange-300" : "self-start bg-neutral-300"
                        }`}
                    >
                        {msg.msg}
                    </div>
                ))}
                {isLoading && (
                    <div className="self-start text-sm text-neutral-500 italic">
                        {opponentLabel} is thinking...
                    </div>
                )}
                <div ref={bottomRef} />
            </div>

            {/* Input row */}
            <form
                className="flex gap-1 border-t border-neutral-700 bg-gray-300 p-2"
                onSubmit={handleSubmit}
            >
                <input
                    type="text"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    disabled={isLoading}
                    placeholder={`Ask a yes/no question...`}
                    className="flex-1 rounded-xs border border-neutral-400 bg-neutral-50 px-2 py-1 text-sm text-neutral-800 disabled:opacity-50"
                />
                <button
                    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
                    disabled={isLoading || draft.trim().length < 5}
                    className="cursor-pointer rounded-xs bg-orange-300 px-3 py-1 text-sm font-semibold text-neutral-700 hover:bg-orange-400 disabled:opacity-50"
                    type="submit"
                >
                    Ask
                </button>
            </form>
        </div>
    );

    return (
        <>
            {/* ── Desktop: static sidebar in the flex row ── */}
            <div className="hidden min-h-1/2 w-1/5 min-w-[19.5dvw] shrink-0 rounded-xs border border-neutral-700 bg-neutral-100 lg:flex lg:flex-col">
                {panel}
            </div>

            {/* ── Mobile: FAB + fixed overlay ── */}
            <div className="lg:hidden">
                {/* Backdrop — closes panel when tapping outside */}
                {isOpen && (
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                        aria-hidden="true"
                    />
                )}

                {/* Sliding panel */}
                <div
                    className={`fixed inset-x-0 bottom-0 z-50 rounded-t-md border border-neutral-700 bg-neutral-100 transition-transform duration-300 ${
                        isOpen ? "translate-y-0" : "translate-y-full"
                    }`}
                    style={{ maxHeight: "50dvh" }}
                >
                    {panel}
                </div>

                {/* FAB — hidden when panel is open */}
                {!isOpen && (
                    <button
                        onClick={() => setIsOpen(true)}
                        className="fixed right-4 bottom-4 z-50 flex h-14 w-14 cursor-pointer items-center justify-center rounded-full border border-neutral-700 bg-orange-300 text-2xl shadow-md hover:bg-orange-400 active:scale-95"
                        aria-label="Open chat"
                    >
                        💬
                    </button>
                )}
            </div>
        </>
    );
};

export default ChatPanel;
