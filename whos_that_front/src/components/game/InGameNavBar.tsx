import { useBetterAuthSession } from "../../lib/hooks";
import Hero from "../layout/Hero";

const InGameNavBar = ({ title }: { title: string }) => {
    const { session, isPending } = useBetterAuthSession();

    return (
        <div className="letter 3xl:mt-10 relative z-10 w-[92dvw] bg-linear-to-b from-neutral-100 to-neutral-200 p-1 text-center shadow-[0_10px_8px_10px_rgba(0,0,0,0.4),0_10px_8px_10px_rgba(0,0,0,0.35)]">
            <Hero session={session} isPending={isPending} />
            <p className="my-2.5 text-4xl font-bold text-neutral-700">{title}</p>
        </div>
    );
};
export default InGameNavBar;
