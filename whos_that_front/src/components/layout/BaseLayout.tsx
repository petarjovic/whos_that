import { Outlet } from "react-router";
import { authClient, type AuthData } from "../../lib/auth/auth-client.ts";
import { useEffect } from "react";
import { useNavigate } from "react-router";

/**
 * Root layout providing auth context to all routes, without visual chrome.
 */
const BaseLayout = () => {
    const authData = authClient.useSession();
    const navigate = useNavigate();
    const { data: session, isPending, error } = authData;

    useEffect(() => {
        if (session && !session.user.username) void navigate("/set-username");
    }, [session, navigate]);

    if (error) throw error;

    return <Outlet context={{ session, isPending } satisfies AuthData} />;
};
export default BaseLayout;
