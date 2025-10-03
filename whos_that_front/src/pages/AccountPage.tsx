import { useNavigate } from "react-router";
import { authClient } from "../lib/auth-client";
import { useState } from "react";
import { Link } from "react-router";

const AccountPage = () => {
    const navigate = useNavigate();
    const [showEmail, setShowEmail] = useState(false);
    const {
        data: session,
        isPending, //loading state
        error, //error object
    } = authClient.useSession(); //ERROR HANDLING

    const maskEmail = (email: string) => {
        const [local, domain] = email.split("@");
        return `${local.slice(0, 2)}${"*".repeat(Math.max(local.length - 5, 2))}@${domain}`;
    };

    const handleResetPassword = () => {};

    if (isPending) return <div>Loading...</div>;
    else if (session === null || error) {
        void navigate("/sign-up");
        return <></>;
    } else
        return (
            <div className="my-10 w-1/2 rounded-lg bg-cyan-100 p-6 shadow-md">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="mb-2 text-2xl font-bold text-gray-900">Account Details</h2>
                        <p className="text-gray-700">
                            Username:{" "}
                            <span className="font-semibold text-gray-900">
                                {session.user.displayUsername}
                            </span>
                            <br></br>
                            Email:{" "}
                            <span
                                className="cursor-pointer font-semibold text-gray-900 transition-colors hover:text-cyan-700"
                                title={showEmail ? "Click to hide" : "Click to show"}
                                onClick={() => {
                                    setShowEmail(!showEmail);
                                }}
                            >
                                {showEmail ? session.user.email : maskEmail(session.user.email)}
                            </span>
                        </p>
                    </div>
                    <Link to={"/my-games"}>
                        <button
                            className="w-fill border-b-9 border-x-1 text-shadow-xs/30 active:border-b-1 active:shadow-2xs active:inset-shadow-md text-md mx-4 mt-3 h-10 cursor-pointer rounded-md border-blue-600 bg-blue-500 px-2 font-semibold text-white shadow-md hover:border-blue-700 hover:bg-blue-600 active:translate-y-[1px]"
                            type="button"
                        >
                            My Games
                        </button>
                    </Link>
                    <div className="grow text-end">
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
