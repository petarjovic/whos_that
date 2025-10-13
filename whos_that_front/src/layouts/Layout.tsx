import { Outlet } from "react-router";
import { authClient, type AuthData } from "../lib/auth-client.ts";
import Hero from "./Hero.tsx";

const Layout = () => {
    const authData = authClient.useSession();
    const { data: session, isPending, error } = authData;

    if (error) throw error;

    return (
        <div
            id="flexContainer"
            className="flex min-h-screen w-full flex-col items-center justify-start bg-gradient-to-b from-cyan-400 to-cyan-600 to-90% bg-fixed"
        >
            <Hero session={session} isPending={isPending} />
            <Outlet context={{ session, isPending } satisfies AuthData} />
        </div>
    );
};
export default Layout;
