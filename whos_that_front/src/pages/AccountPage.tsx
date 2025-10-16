import { useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { useBetterAuthSession } from "../layouts/LayoutContextProvider";
import { authClient } from "../lib/auth-client";
import type { SocialSignInProviders } from "../lib/types";
import DiscordLoginButton from "../lib/DiscordLoginButton";
import { socialSignInProvidersSchema } from "../lib/zodSchema";
import { z } from "zod";
import GoogleLoginButton from "../lib/GoogleLoginButton";

const maskEmail = (email: string) => {
    const [local, domain] = email.split("@");
    return `${local.slice(0, 2)}${"*".repeat(Math.max(local.length - 5, 2))}@${domain}`;
};

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
        const getLinkedAccounts = async () => {
            const accounts = await authClient.listAccounts();
            console.log(accounts);
            if (accounts.error) {
                setErrorMsg("Error getting user's linked accounts.");
            } else {
                const providers = accounts.data.map(({ providerId }) => providerId);
                const zodProviders = z.array(socialSignInProvidersSchema).safeParse(providers);
                if (!zodProviders.success) {
                    setErrorMsg(
                        "Invalid provider. This should be 10000% impossible idk how you did this."
                    );
                    return;
                }
                setLinkedAccounts(zodProviders.data);
            }
        };
        void getLinkedAccounts();
    }, []);

    const handleResetPassword = () => {
        //TODO: implement password resetting
        return;
    };

    if (errorMsg) throw new Error(errorMsg);
    //session cannot actually be null here, check is done to convince typescript
    else if (isPending || !session) return <div>Loading...</div>;
    else
        return (
            <div className="shadow-2xl/30 border-x-1 bg-linear-to-b border-b-10 mx-auto my-10 w-1/2 rounded-lg border-blue-600 from-blue-400 to-blue-500 p-8 text-white">
                <h2 className="text-shadow-sm/70 mb-7 text-center text-5xl font-bold">
                    Account Details
                </h2>
                <div className="flex items-center justify-between">
                    <div>
                        <div className="text-shadow-xs/80 text-2xl">
                            <div className="font-bold">
                                Username:{" "}
                                <span className="font-medium italic">
                                    {session.user.displayUsername}
                                </span>
                            </div>
                            <div className="my-5 font-bold">
                                Email:{" "}
                                <span
                                    className="duration-15 cursor-pointer font-medium italic transition-colors hover:text-amber-200"
                                    title={showEmail ? "Click to hide" : "Click to show"}
                                    onClick={() => {
                                        setShowEmail(!showEmail);
                                    }}
                                >
                                    {showEmail ? session.user.email : maskEmail(session.user.email)}
                                </span>
                            </div>
                            <div className="mb-2 font-semibold">
                                Linked Accounts:{""}{" "}
                                <span className="capitalize text-green-500">
                                    {linkedAccounts.toString()}
                                </span>
                            </div>
                        </div>
                        <div className="text-md mt-5">
                            {linkedAccounts.includes("discord") ? (
                                <></>
                            ) : (
                                <DiscordLoginButton
                                    text="Link Discord Account"
                                    linkAccount={true}
                                />
                            )}
                            {linkedAccounts.includes("google") ? (
                                <></>
                            ) : (
                                <GoogleLoginButton text="Link Google Account" linkAccount={true} />
                            )}
                        </div>
                    </div>

                    <Link to={"/my-games"}>
                        <button
                            className="border-b-9 border-x-1 text-shadow-xs/50 active:border-b-1 active:shadow-2xs active:inset-shadow-md duration-15 mx-4 h-14 w-fit cursor-pointer rounded-md border-amber-600 bg-amber-500 px-3 text-2xl font-bold tracking-normal text-white shadow-md transition-all hover:border-amber-700 hover:bg-amber-600 hover:text-slate-200 active:translate-y-[1px]"
                            type="button"
                        >
                            My Games
                        </button>
                    </Link>
                    <div className="hidden grow text-end">
                        {" "}
                        <button
                            onClick={handleResetPassword}
                            className="w-fill border-b-9 border-x-1 text-shadow-xs/30 active:border-b-1 active:shadow-2xs active:inset-shadow-md text-md mx-4 mt-3 h-10 cursor-pointer rounded-md border-red-700 bg-red-600 px-2 font-semibold text-white shadow-md hover:border-red-800 hover:bg-red-700 active:translate-y-[1px]"
                            type="button"
                        >
                            Reset Password
                        </button>
                    </div>
                </div>
            </div>
        );
};
export default AccountPage;
