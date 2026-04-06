// src/components/KofiWidget.js
import { useState } from "react";
import kofiSymbol from "../../assets/kofi_symbol.webp";

const KofiWidget = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="relative bg-transparent rounded">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex gap-1.5 items-center bg-blue-400 shadow-sm border border-blue-300 py-1.25 rounded px-1.75 font-medium font-sans text-neutral-800 cursor-pointer hover:scale-102 active:scale-99 text-center align-text-top"
            >
                <img src={kofiSymbol} alt="Kofi Symbol" className="w-7 h-6 relative top-px" />{" "}
                Support the Project!
            </button>
            {isOpen && (
                <div className="absolute bottom-full max-md:-left-23 max-2xl:-left-10 2xl:left-20 mb-2 z-50 w-90 shadow/15 bg-transparent  border-3 border-blue-300 rounded-sm">
                    <button
                        onClick={() => setIsOpen(false)}
                        className="absolute top-2 right-3 text-neutral-700 hover:text-red-500 font-bold text-2xl z-10 rounded cursor-pointer "
                    >
                        ×
                    </button>
                    <iframe
                        id="kofiframe"
                        src="https://ko-fi.com/petarjovic/?hidefeed=true&widget=true&embed=true&preview=true"
                        style={{
                            border: "none",
                            width: "100%",
                            padding: "4px",
                            background: "#f9f9f9",
                        }}
                        height="648"
                        title="petarjovic"
                    />
                </div>
            )}
        </div>
    );
};
export default KofiWidget;
