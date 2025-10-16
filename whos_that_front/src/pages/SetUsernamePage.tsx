import { useState, useEffect, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { useBetterAuthSession } from "../layouts/LayoutContextProvider";
import { authClient } from "../lib/auth-client";
import { logError } from "../lib/logger.ts";

const SetUsernamePage = () => {
    const navigate = useNavigate();
    const [username, setUsername] = useState("");
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { session, isPending } = useBetterAuthSession();

    useEffect(() => {
        if (!isPending && (!session || session.user.username)) {
            void navigate("/");
        }
    }, [session, isPending, navigate]);

    if (isPending) return <div>Loading...</div>;

    const handleSubmit = async (e: FormEvent) => {
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
        <div className="shadow-2xl/40 my-35 bg-linear-to-b w-150 mx-auto rounded-lg from-blue-400 to-blue-500 to-50% p-8 text-white">
            <h2 className="text-shadow-xs/80 mb-5 text-center text-4xl font-bold tracking-normal text-orange-300">
                Choose Your <span className="text-orange-300">Username</span>
            </h2>
            <p className="text-shadow-2xs/80 mb-6 text-center text-xl text-white">
                Please pick a username for yourself, note that your username{" "}
                <span className="text-xl italic text-orange-300">cannot be changed</span> !
            </p>
            <form
                className="text-center"
                onSubmit={(e) => {
                    void handleSubmit(e);
                }}
            >
                <div className="mx-auto mb-4 flex items-center justify-center">
                    <label
                        htmlFor="username"
                        className="text-shadow-xs/80 mr-15 mb-2 mt-1 text-2xl font-semibold text-white"
                    >
                        Username:
                    </label>
                    <input
                        type="text"
                        id="username"
                        className="inset-shadow-xs hover:inset-shadow-lg w-full rounded-lg border border-blue-300 bg-white px-4 py-2 text-center text-zinc-900 placeholder:text-gray-600 hover:shadow-sm focus:border-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        placeholder="Enter a username"
                        value={username}
                        onChange={(e) => {
                            setUsername(e.target.value);
                        }}
                        minLength={3}
                        maxLength={20}
                        pattern="[a-zA-Z0-9_]+"
                        title="Username can only contain letters, numbers, and underscores"
                        required
                    />
                </div>
                {error.length > 0 ? (
                    <p className="shadow-xs max-h-23 mt-3 overflow-y-auto rounded-md border border-red-200 bg-red-50 p-2 text-red-500 shadow-red-50">
                        {error}
                    </p>
                ) : (
                    <></>
                )}
                <button
                    type="submit"
                    className="text-shadow-xs/80 w-8/10 cursor-pointer rounded-lg bg-amber-500 py-2 text-center font-semibold text-white transition-all hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? "Setting Username..." : "Continue"}
                </button>
            </form>
        </div>
    );
};

export default SetUsernamePage;
