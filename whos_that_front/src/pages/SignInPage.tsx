import { useState, useEffect, type FormEvent } from "react";
import { Link } from "react-router";
import { authClient } from "../lib/auth-client";
import { useNavigate } from "react-router";
import { useBetterAuthSession } from "../layouts/LayoutContextProvider";
import DiscordLoginButton from "../lib/DiscordLoginButton";
import env from "../lib/zodEnvSchema";

const SignInPage = () => {
    const navigate = useNavigate();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [signInIssue, setSignInIssue] = useState("");
    const [loggingIn, setLoggingIn] = useState(false);

    const { session, isPending } = useBetterAuthSession();

    useEffect(() => {
        if (session) void navigate("/");
    }, [session, navigate]);

    if (isPending) return <div>Loading...</div>;

    const handleLogIn = async (e: FormEvent) => {
        e.preventDefault();
        setLoggingIn(true);
        const logInResult = await authClient.signIn.username({
            username: username,
            password: password,
            callbackURL: env.VITE_APP_URL,
        });
        if (logInResult.error) {
            console.error(logInResult.error.message);
            setSignInIssue(logInResult.error.message ?? "Error logging in.");
        } else {
            void navigate("/");
        }
        setLoggingIn(false);
    };

    return (
        <div className="mt-20 w-full max-w-md rounded-lg bg-cyan-100 p-8 tracking-wide shadow-2xl">
            <h2 className="mb-6 text-center text-2xl font-bold text-zinc-900">Sign In</h2>
            <form
                id="signInForm"
                onSubmit={(e) => {
                    void handleLogIn(e);
                }}
            >
                <div className="mb-4">
                    <label htmlFor="username" className="mb-2 block font-semibold text-zinc-800">
                        Username
                    </label>
                    <input
                        type="text"
                        id="existing-username"
                        className="inset-shadow-md hover:inset-shadow-lg w-full rounded-lg border border-gray-400 bg-white px-4 py-2 placeholder:text-gray-400 hover:shadow-sm focus:border-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        placeholder="Enter your username or email"
                        autoComplete="email"
                        onChange={(e) => {
                            setUsername(e.target.value);
                        }}
                        value={username}
                        required
                    />
                </div>
                <div className="mb-4">
                    <label htmlFor="password" className="mb-2 block font-semibold text-zinc-800">
                        Password
                    </label>
                    <input
                        type="password"
                        id="existing-password"
                        className="inset-shadow-md hover:inset-shadow-lg w-full rounded-lg border border-gray-400 bg-white px-4 py-2 placeholder:text-gray-400 hover:shadow-sm focus:border-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        placeholder="********"
                        autoComplete="current-password"
                        onChange={(e) => {
                            setPassword(e.target.value);
                        }}
                        value={password}
                        required
                    />
                    {signInIssue ? (
                        <p className="shadow-xs max-h-23 mb-1 mt-3 overflow-y-auto rounded-md border border-red-200 bg-red-50 p-2 text-red-500 shadow-red-50">
                            {signInIssue}
                        </p>
                    ) : (
                        <></>
                    )}
                </div>

                <button
                    type="submit"
                    className="w-full rounded-lg bg-blue-500 py-2 font-semibold text-white hover:bg-blue-600 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50"
                    disabled={loggingIn}
                >
                    Log In
                </button>
                <p className="my-1 text-center">Or</p>
                <DiscordLoginButton />
            </form>
            <p className="mt-4 text-center text-gray-600">
                Don&apos;t have an account yet?{" "}
                <Link to="/sign-up" className="font-semibold text-blue-500 hover:underline">
                    Sign Up
                </Link>
            </p>
        </div>
    );
};
export default SignInPage;
