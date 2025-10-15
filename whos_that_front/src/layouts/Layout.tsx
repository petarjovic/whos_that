import { Outlet } from "react-router";
import { authClient, type AuthData } from "../lib/auth-client.ts";
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
    else if (session && !session.user.username) authClient.signIn.anonymous();

    return (
        <div
            id="flexContainer"
            className="min-w-screen flex min-h-screen flex-col items-center justify-start bg-gradient-to-b from-cyan-400 to-cyan-600 to-90% bg-fixed"
        >
            <Hero session={session} isPending={isPending} />
            <Outlet context={{ session, isPending } satisfies AuthData} />
        </div>
    );
};
export default Layout;
