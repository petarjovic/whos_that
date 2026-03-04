import { Outlet, useOutletContext } from "react-router";
import Hero from "./Hero.tsx";
import type { AuthData } from "../../lib/auth/auth-client.ts";
import type { PropsWithChildren } from "react";

/**
 * Newspaper/letter visual wrapper for non-game routes.
 */
const NewspaperLayout = ({ children }: PropsWithChildren) => {
    const { session, isPending } = useOutletContext<AuthData>();

    return (
        <div
            id="flexContainer"
            className="lg:letter 3xl:mt-17 flex h-fit flex-col items-center justify-start bg-linear-to-b from-neutral-100 to-neutral-200 p-1 pt-2.25 text-center shadow-2xl/25 shadow-[0_0_15px_25px_rgba(0,0,0,0.25)] max-lg:min-h-screen max-lg:w-full max-lg:min-w-screen max-lg:bg-repeat lg:mt-10 lg:min-h-[91vh] lg:w-[97vw] lg:min-w-[97vw]"
        >
            <Hero session={session} isPending={isPending} />
            {children ?? <Outlet context={{ session, isPending } satisfies AuthData} />}
        </div>
    );
};
export default NewspaperLayout;
