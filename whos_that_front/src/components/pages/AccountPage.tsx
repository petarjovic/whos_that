import { useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { useBetterAuthSession } from "../../lib/hooks.ts";
import { authClient } from "../../lib/auth/auth-client";
import type { SocialSignInProviders } from "../../lib/types";
import { socialSignInProvidersSchema } from "../../lib/zodSchema";
import { z } from "zod";
import LoadingSpinner from "../misc/LoadingSpinner";
import { log } from "../../lib/logger";

/**
 * Masks email address (with *) for privacy (shows first 2 chars and domain)
 */
const maskEmail = (email: string) => {
    const [local, domain] = email.split("@");
    return `${local.slice(0, 2)}${"*".repeat(Math.max(local.length - 5, 2))}@${domain}`;
};

/**
 * User account management page showing profile info and linked social accounts
 */
const AccountPage = () => {
    const navigate = useNavigate();
    const [showEmail, setShowEmail] = useState(false);
    const [linkedAccounts, setLinkedAccounts] = useState<SocialSignInProviders[]>([]);
    const [errorMsg, setErrorMsg] = useState("");

    const { session, isPending } = useBetterAuthSession();
    useEffect(() => {
        if (!session) void navigate("/");
    }, [session, navigate]);

    useEffect(() => {
        // Fetch all OAuth accounts linked to this user (to display accounts that can be linked)
        const getLinkedAccounts = async () => {
            const accounts = await authClient.listAccounts();
            log(accounts);

            if (accounts.error) {
                setErrorMsg("Error getting user's linked accounts.");
            } else {
                // Extract providers then validate they're supported
                const providers = accounts.data.map(({ providerId }) => providerId);

                const validProviders = z.array(socialSignInProvidersSchema).safeParse(providers);
                if (!validProviders.success) {
                    setErrorMsg(
                        "Invalid provider. This should be 10000% impossible idk how you did this."
                    );
                    return;
                }
                setLinkedAccounts(validProviders.data);
            }
        };

        void getLinkedAccounts();
    }, []);

    if (errorMsg) throw new Error(errorMsg);
    else if (isPending || !session) return <LoadingSpinner />;
    else
        return (
            <div className="m-auto flex w-9/10 max-w-2xl flex-col gap-3 border-7 border-double bg-neutral-50 px-3 pt-6 pb-7 text-xl shadow-xs">
                <h2 className="mb-1 text-center text-4xl font-bold">Account Details</h2>
                <div className="font-semibold">
                    Username:{" "}
                    <span className="font-medium text-orange-400 italic">
                        {session.user.displayUsername}
                    </span>
                </div>
                <div className="my-5 font-semibold">
                    Email:{" "}
                    <span
                        className="cursor-pointer font-medium italic transition-colors duration-15 hover:text-amber-200"
                        title={showEmail ? "Click to hide" : "Click to show"}
                        onClick={() => {
                            setShowEmail(!showEmail);
                        }}
                    >
                        {showEmail ? session.user.email : maskEmail(session.user.email)}
                    </span>
                </div>
                <div className="mb-2 font-semibold">
                    Linked Account:{""}{" "}
                    <span className="align-middle text-3xl text-green-600 capitalize max-2xl:text-2xl">
                        {linkedAccounts.toString()}
                    </span>
                    {/* Removed Account Linking for Now */}
                    {/* <div className="text-base">
                        {linkedAccounts.includes("discord") ? (
                            <></>
                        ) : (
                            <DiscordLoginButton text="Link Discord Account" linkAccount={true} />
                        )}
                        {linkedAccounts.includes("google") ? (
                            <></>
                        ) : (
                            <GoogleLoginButton text="Link Google Account" linkAccount={true} />
                        )}
                    </div> */}
                </div>

                <Link to={"/my-games"} className="text-center">
                    <button
                        className="mx-4 w-fit cursor-pointer rounded-md border-x border-b-9 border-amber-600 bg-amber-500 px-4 py-3 text-2xl font-bold tracking-normal text-slate-50 shadow-sm transition-all duration-15 text-shadow-xs/50 hover:border-amber-700 hover:bg-amber-600 hover:text-slate-200 hover:shadow-xs active:-translate-y-px active:border-b active:shadow-2xs max-2xl:px-3 max-2xl:py-2 max-2xl:text-xl"
                        type="button"
                    >
                        My Games
                    </button>
                </Link>
            </div>
        );
};
export default AccountPage;
