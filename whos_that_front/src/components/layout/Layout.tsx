import { Outlet } from "react-router";
import { authClient, type AuthData } from "../../lib/auth/auth-client.ts";
import Hero from "./Hero.tsx";
import { useEffect } from "react";
import { useNavigate } from "react-router";

/**
 * Root layout component that wraps all pages, handles and provides auth state
 */
const Layout = () => {
    const authData = authClient.useSession();
    const navigate = useNavigate();
    const { data: session, isPending, error } = authData;

    // Redirect authenticated users without username to setup page
    useEffect(() => {
        if (session && !session.user.username) void navigate("/set-username");
    }, [session, navigate]);

    if (error) throw error;

    return (
        <div
            id="flexContainer"
            className="lg:letter flex h-fit flex-col items-center justify-start bg-neutral-100 p-1 pt-2.25 text-center shadow-2xl/25 max-lg:min-h-screen max-lg:w-full max-lg:min-w-screen max-lg:bg-repeat lg:relative lg:bottom-5 lg:mt-12 lg:min-h-[91vh] lg:w-[97vw] lg:min-w-[97vw]"
        >
            <Hero session={session} isPending={isPending} />
            {/* Pass auth data to child routes via context */}
            <Outlet context={{ session, isPending } satisfies AuthData} />
        </div>
    );
};
export default Layout;
