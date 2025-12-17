import { useState, useEffect, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { useBetterAuthSession } from "../../lib/hooks.ts";
import { authClient } from "../../lib/auth/auth-client.ts";
import { logError } from "../../lib/logger.ts";
import { PiPenNibFill } from "react-icons/pi";

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
        <div className="border-7 w-9/10 shadow-xs/60 m-auto flex max-w-2xl flex-col gap-5 border-double bg-neutral-50 px-2 pb-7 pt-6 text-center text-4xl">
            <h2 className="font-bold">Choose Username</h2>
            <p className="text-center text-xl">
                Please pick a username for yourself, note that your username{" "}
                <span className="font-medium italic">cannot be changed</span> !
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

                <div className="rounded-xs w-9/10 mx-auto mb-2 flex flex-col items-center justify-around border border-neutral-800 bg-neutral-300 px-2 py-1 text-center">
                    <label
                        htmlFor="username"
                        className="flex items-center p-px text-center text-lg font-semibold"
                    >
                        <PiPenNibFill
                            className="relative bottom-px mr-1 scale-x-[-1]"
                            size="1.25em"
                        />
                        <div>Username</div>
                        <PiPenNibFill className="relative bottom-px ml-1" size="1.25em" />
                    </label>
                    <input
                        type="text"
                        id="username"
                        className="border-groove w-full rounded border border-neutral-400 bg-neutral-50 p-1 text-center text-lg font-medium placeholder:text-gray-400"
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
                    className={`rounded-xs-xs mx-auto w-1/2 p-1 text-center text-lg font-medium text-white ${isSubmitting ? "border-gray-800 bg-gray-700" : "bg-red-400 hover:bg-red-500"}`}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? "Setting Username..." : "Continue"}
                </button>
            </form>
        </div>
    );
};

export default SetUsernamePage;
