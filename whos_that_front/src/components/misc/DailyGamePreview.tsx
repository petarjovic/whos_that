import { useEffect, useState, useRef } from "react";
import { CardLayout } from "./Cards";
import { dailyGameInfoSchema } from "@server/zodSchema";
import LoadingSpinner from "./LoadingSpinner";
import env from "../../lib/zodEnvSchema";
import { logError } from "../../lib/logger";

export const DailyGamePreview = ({
    setIsDailyToday,
}: {
    setIsDailyToday: (b: boolean) => void;
}) => {
    const [isLoading, setIsLoading] = useState(true);
    const [title, setTitle] = useState("");
    const [imageUrls, setImageUrls] = useState<string[]>([]);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchDaily = async () => {
            setIsLoading(true);
            try {
                const res = await fetch(`${env.VITE_SERVER_URL}/api/daily`);
                if (!res.ok) return;

                const data = dailyGameInfoSchema.parse(await res.json());
                setTitle(data.title);
                setIsDailyToday(true);
                setImageUrls(data.cardData.map((c) => c.imageUrl));
            } catch (error) {
                logError(error);
                setIsDailyToday(false);
            } finally {
                setIsLoading(false);
            }
        };
        void fetchDaily();
    }, []);

    useEffect(() => {
        if (scrollRef.current && imageUrls.length) {
            const scrollWidth = scrollRef.current.scrollWidth / 2;
            scrollRef.current.style.setProperty(
                "--scroll-distance",
                `-${scrollWidth.toString()}px`
            );
        }
    }, [imageUrls]);

    return (
        <>
            {isLoading ? (
                <LoadingSpinner />
            ) : imageUrls.length > 0 ? (
                <>
                    <div className="relative w-full overflow-hidden py-2 ">
                        <div ref={scrollRef} className="animate-scroll flex gap-2 ">
                            {[...imageUrls, ...imageUrls, ...imageUrls].map((url, i) => (
                                <div key={i} className="shrink-0">
                                    <CardLayout name="❓" imgSrc={url} size="XS" />
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="leading-none font-semibold text-xl xl:my-1 text-neutral-900">
                        {"{ " + title + " }"}
                    </div>
                </>
            ) : (
                <div className="m-5 leading-none text-amber-600 xl:my-1">
                    No daily game scheduled for today!
                </div>
            )}
        </>
    );
};
