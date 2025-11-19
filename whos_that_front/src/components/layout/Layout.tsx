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
            className="min-w-screen flex h-screen min-h-screen w-screen flex-col items-center justify-start bg-[#f3f3f3] bg-repeat"
        >
            <Hero session={session} isPending={isPending} />
            {/* Pass auth data to child routes via context */}
            <Outlet context={{ session, isPending } satisfies AuthData} />
        </div>
    );
};
export default Layout;
