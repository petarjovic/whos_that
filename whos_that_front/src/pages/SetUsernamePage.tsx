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
        <div className="mt-20 w-full max-w-md rounded-lg bg-cyan-100 p-8 tracking-wide shadow-2xl">
            <h2 className="mb-6 text-center text-2xl font-bold text-zinc-900">
                Choose Your Username
            </h2>
            <p className="mb-6 text-center text-gray-600">Please set a username for your account</p>
            <form onSubmit={(e) => void handleSubmit(e)}>
                <div className="mb-4">
                    <label htmlFor="username" className="mb-2 block font-semibold text-zinc-800">
                        Username
                    </label>
                    <input
                        type="text"
                        id="username"
                        className="inset-shadow-md hover:inset-shadow-lg w-full rounded-lg border border-gray-400 bg-white px-4 py-2 placeholder:text-gray-400 hover:shadow-sm focus:border-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        placeholder="Enter your username"
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
                    {error && (
                        <p className="shadow-xs mt-3 rounded-md border border-red-200 bg-red-50 p-2 text-red-500 shadow-red-50">
                            {error}
                        </p>
                    )}
                </div>
                <button
                    type="submit"
                    className="w-full rounded-lg bg-blue-500 py-2 font-semibold text-white hover:bg-blue-600 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? "Setting Username..." : "Continue"}
                </button>
            </form>
        </div>
    );
};

export default SetUsernamePage;
