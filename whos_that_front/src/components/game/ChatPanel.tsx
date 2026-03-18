import { useEffect, useRef, useState } from "react";
import { GiVintageRobot } from "react-icons/gi";
import { CiMinimize1 } from "react-icons/ci";
import type { ChatMessage } from "../../lib/types";

interface ChatPanelProps {
    messages: ChatMessage[];
    onSend: (text: string) => void;
    isLoading?: boolean;
    opponentLabel?: string;
    batteryLevel?: number;
}

const ChatPanel = ({
    messages,
    onSend,
    isLoading,
    opponentLabel = "Opponent",
    batteryLevel = -1,
}: ChatPanelProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [draft, setDraft] = useState("");
    const bottomRef = useRef<HTMLDivElement>(null);

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
        <div className="flex h-full min-h-1/3 flex-col bg-slate-900 shadow-[0_10px_100px_30px_rgba(0,0,0,0.5)] xl:min-w-96 w-full relative z-2">
            <div className="flex items-center justify-between border-[#374151] border-2 bg-linear-to-b from-[#6b7280] to-[#4b5563] p-1 text-center font-mono font-bold uppercase tracking-wider text-gray-300 shadow-[inset_0_1px_2px_rgba(156,163,175,0.4),inset_0_-2px_4px_rgba(0,0,0,0.5),0_3px_8px_rgba(0,0,0,0.4)] relative before:content-[''] before:absolute before:inset-0 before:bg-[repeating-linear-gradient(90deg,rgba(0,0,0,0.03)_0px,rgba(0,0,0,0.03)_2px,transparent_2px,transparent_4px)] before:pointer-events-none">
                <span className="flex items-center justify-around w-full max-xl:pr-1 h-full">
                    <span className="flex items-center justify-center gap-2">
                        {" "}
                        <GiVintageRobot size={"2.25em"} className="text-gray-300" />
                        {opponentLabel}
                    </span>
                    <div className="flex items-center min-h-4.75">
                        {batteryLevel >= 0 ? (
                            <>
                                <div className=" w-1.25 h-4.5 bg-gray-800 rounded-l-sm"></div>
                                <div className="flex flex-row-reverse gap-1 3xl:w-28.75 w-27.5 border-2 inset-shadow-sm/15 border-gray-700 rounded-sm p-1 bg-slate-600">
                                    {Array.from({ length: batteryLevel }, (_, i) => (
                                        <div
                                            key={i}
                                            className="w-3.5 h-9 rounded-xs shadow-xs/50 bg-green-500"
                                        ></div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <></>
                        )}
                    </div>
                </span>
                <button
                    onClick={() => setIsOpen(false)}
                    className="cursor-pointer font-bold text-[#d1d5db] hover:text-[#e5e7eb] xl:hidden pr-3"
                    aria-label="Minimize chat"
                >
                    <CiMinimize1 size={"2em"} />
                </button>
            </div>

            <div className="flex flex-1 flex-col gap-3 overflow-y-auto bg-black/40 px-3 py-3 font-mono text-sm relative before:content-[''] before:absolute before:inset-0 before:bg-[repeating-linear-gradient(0deg,rgba(15,23,42,0.15)_0px,rgba(15,23,42,0.15)_1px,transparent_1px,transparent_2px)] before:pointer-events-none before:z-10 after:content-[''] after:absolute after:inset-0 after:bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(15,23,42,0.3)_100%)] after:pointer-events-none after:z-10 border-x-3 border-gray-800">
                {messages.map((msg, i) => (
                    <div
                        key={i}
                        className={`w-fit max-w-[85%] border-2 px-3 py-2 font-mono ${
                            msg.isUser
                                ? "self-end border-blue-400 bg-blue-950/80 text-blue-100 text-shadow-[0_0_2px_rgba(96,165,250,0.5)] shadow-[0_0_11px_rgba(96,165,250,0.5)]"
                                : "self-start border-cyan-400 bg-cyan-950/80 text-cyan-100 text-shadow-[0_0_2px_rgba(34,211,238,0.5)] shadow-[0_0_11px_rgba(34,211,238,0.5)]"
                        }`}
                    >
                        {msg.msg}
                    </div>
                ))}
                {isLoading && (
                    <div className="self-start animate-pulse font-mono text-sm italic text-cyan-400">
                        &gt; {opponentLabel} is processing...
                    </div>
                )}
                <div ref={bottomRef} />
            </div>

            <form
                className="flex gap-2 border-2 border-[#374151] bg-[#4b5563] p-2 shadow-[inset_0_2px_3px_rgba(255,255,255,0.2),0_-1px_0_rgba(255,255,255,0.1)] min-h-16 relative before:content-[''] before:absolute before:inset-0 before:bg-[repeating-linear-gradient(90deg,rgba(0,0,0,0.03)_0px,rgba(0,0,0,0.03)_2px,transparent_2px,transparent_4px)] before:pointer-events-none"
                onSubmit={handleSubmit}
            >
                <input
                    type="text"
                    id="message-text"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    disabled={isLoading}
                    placeholder="Enter Question..."
                    className="border-2 border-slate-700 bg-slate-950 px-3 py-1 font-mono text-sm text-cyan-500 placeholder-cyan-700 shadow-[inset_0_0_10px_rgba(0,0,0,0.8)] focus:border-slate-600  focus:placeholder-cyan-600 focus:outline-none disabled:opacity-50 w-full relative before:content-['']  before:absolute before:inset-0 before:bg-[repeating-linear-gradient(0deg,rgba(0,0,0,0.0.05)_0px,rgba(0,0,0,0.05)_1px,transparent_1px,transparent_2px)] before:pointer-events-none min-w-70 3xl:min-w-73"
                />
                <button
                    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
                    disabled={isLoading || draft.trim().length < 5}
                    className="mx-auto w-fit cursor-pointer max-w-20 min-w-20 border-x border-t border-b-9 border-cyan-800 bg-cyan-700 px-2 text-semibold text-gray-200  font-semibold hover:text-gray-300 shadow-sm/20 transition-all active:mt-px active:mr-px flex-1 hover:border-cyan-900 hover:bg-cyan-800 active:bg-cyan-700 active:borcer-cyan-800 duration-22 text-shadow-xs/50 py-1 hover:shadow-xs active:-translate-y-px active:border-b active:shadow-2xs relative z-1"
                    type="submit"
                >
                    [ASK]
                </button>
            </form>
        </div>
    );

    return (
        <>
            {/* Desktop: static sidebar */}
            <div className="hidden min-h-1/2 w-1/5 min-w-[19.5dvw] shrink-0 xl:flex xl:flex-col relative z-1  shadow-[-5px_10px_10px_8px_rgba(0,0,0,0.35)]">
                {panel}
            </div>

            {/* Mobile: FAB + overlay */}
            <div className="xl:hidden">
                {isOpen && (
                    <div
                        className="fixed inset-0 z-40 bg-black/60"
                        onClick={() => setIsOpen(false)}
                        aria-hidden="true"
                    />
                )}

                <div
                    className={`fixed inset-x-0 bottom-0 z-50 flex flex-col transition-transform duration-300 max-h-[66dvh] ${
                        isOpen ? "translate-y-0" : "translate-y-full"
                    }`}
                >
                    {panel}
                </div>

                {!isOpen && (
                    <button
                        onClick={() => setIsOpen(true)}
                        className="fixed right-4 bottom-4 z-50 flex h-14 w-14 cursor-pointer items-center justify-center border-4 border-cyan-400 bg-slate-900 text-2xl shadow-[0_0_20px_rgba(34,211,238,0.6)] hover:bg-slate-800 hover:shadow-[0_0_30px_rgba(34,211,238,0.8)] active:scale-95 animate-flash-cyan"
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
