import { Outlet } from "react-router";
import { authClient, type AuthData } from "../../lib/auth/auth-client.ts";
import Hero from "./Hero.tsx";
import { useEffect } from "react";
import { useNavigate } from "react-router";

const Layout = () => {
    const authData = authClient.useSession();
    const navigate = useNavigate();
    const { data: session, isPending, error } = authData;

    useEffect(() => {
        if (session && !session.user.username) void navigate("/set-username");
    }, [session, navigate]);

    if (error) throw error;

    return (
        <div
            id="flexContainer"
            className="bg-linear-to-b flex flex-col items-center justify-start overflow-x-hidden from-cyan-500 to-cyan-600 sm:h-screen sm:w-screen lg:bg-fixed"
        >
            <Hero session={session} isPending={isPending} />
            <Outlet context={{ session, isPending } satisfies AuthData} />
        </div>
    );
};
export default Layout;
