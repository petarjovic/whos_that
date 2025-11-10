import { useState, useEffect, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { useBetterAuthSession } from "../../lib/LayoutContextProvider.ts";
import { authClient } from "../../lib/auth/auth-client.ts";
import { logError } from "../../lib/logger.ts";

/**
 * One-time username setup page shown after initial account creation
 * Redirects away if user is not logged in or already has a username
 */
const SetUsernamePage = () => {
    const navigate = useNavigate();
    const [username, setUsername] = useState("");
    const [error, setError] = useState(""); //Error msg displayed to user
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { session, isPending } = useBetterAuthSession();

    useEffect(() => {
        // Redirect if not logged in or username already set
        if (!isPending && (!session || session.user.username)) {
            void navigate("/");
        }
    }, [session, isPending, navigate]);

    if (isPending) return <div>Loading...</div>;

    const handleSubmitUsername = async (e: FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const result = await authClient.updateUser({
            username: username.toLowerCase(),
            displayUsername: username,
        });

        if (result.error) {
            logError(result.error);
            setError("An error occurred while setting username.");
        } else {
            void navigate("/account");
        }

        setIsSubmitting(false);
    };

    return (
        <div className="shadow-2xl/40 my-35 bg-linear-to-b border-b-10 mx-auto w-2/5 max-w-xl rounded-lg border-x border-blue-600 from-blue-400 to-blue-500 to-50% p-8 text-white">
            <h2 className="text-shadow-xs/100 mb-5 text-center text-4xl font-bold text-orange-300">
                Choose Your <span className="text-orange-300">Username</span>
            </h2>
            <p className="text-shadow-xs/100 mb-6 text-center text-xl text-white">
                Please pick a username for yourself, note that your username{" "}
                <span className="text-xl italic text-orange-300">cannot be changed</span> !
            </p>
            <form
                className="text-center"
                onSubmit={(e) => {
                    void handleSubmitUsername(e);
                }}
            >
                {error.length > 0 ? (
                    <p className="mx-auto mb-5 w-fit rounded-md border border-red-400 bg-red-200 px-8 py-1.5 text-red-500">
                        {error}
                    </p>
                ) : (
                    <></>
                )}
                <div className="mx-auto mb-6 flex items-center justify-center">
                    <label
                        htmlFor="username"
                        className="text-shadow-sm/33 mb-2 mr-5 mt-1 text-2xl font-semibold text-white"
                    >
                        Username:
                    </label>
                    <input
                        type="text"
                        id="username"
                        className="inset-shadow-xs w-full rounded-lg border border-blue-500 bg-slate-50 px-3 py-1.5 text-center text-lg text-gray-800 placeholder:text-gray-500 hover:shadow-sm"
                        placeholder="Enter a username"
                        value={username}
                        onChange={(e) => {
                            setUsername(e.target.value);
                        }}
                        minLength={3}
                        maxLength={20}
                        pattern="[a-zA-Z0-9_]+"
                        title="Username can only contain letters, numbers, and underscores!"
                        required
                    />
                </div>

                <button
                    type="submit"
                    className="text-shadow-xs/100 active:shadow-2xs hover:shadow-xs/15 shadow-sm/20 duration-15 hover:font-gray-200 w-fit cursor-pointer rounded-md border-x border-b-8 border-amber-600 bg-amber-500 px-20 py-2 text-xl font-semibold text-white transition-all hover:border-amber-700 hover:bg-amber-600 active:translate-y-px active:border-none"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? "Setting Username..." : "Continue"}
                </button>
            </form>
        </div>
    );
};

export default SetUsernamePage;
