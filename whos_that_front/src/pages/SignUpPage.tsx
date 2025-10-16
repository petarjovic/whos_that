// Old sign up page with email, may rise from the dead one day
import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router";
import { useNavigate } from "react-router";
import { useBetterAuthSession } from "../layouts/LayoutContextProvider.ts";
import DiscordLoginButton from "../lib/DiscordLoginButton.tsx";
import { authClient } from "../lib/auth-client.ts";
import env from "../lib/zodEnvSchema.ts";
import { logError, log } from "../lib/logger.ts";

const forbiddenUsernameSubstrings = ["admin", "official", "whos"];

const SignUpPage = () => {
    const navigate = useNavigate();
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [passwordConfirmation, setPasswordConfirmation] = useState("");
    const [signUpIssue, setSignUpIssue] = useState("");
    const [signingUp, setSigningUp] = useState(false);

    const { session, isPending } = useBetterAuthSession();

    useEffect(() => {
        if (session) void navigate("/");
    }, [session, navigate]);

    if (isPending) return <div>Loading...</div>;

    const handleSignUp = async (e: FormEvent) => {
        e.preventDefault();
        setSigningUp(true);
        if (password !== passwordConfirmation) {
            setSignUpIssue("Passwords don't match.");
            setSigningUp(false);
            return;
        }
        for (const forbid of forbiddenUsernameSubstrings) {
            if (username.includes(forbid)) {
                setSignUpIssue(`Username cannot contain "${forbid}".`);
                setSigningUp(false);
                return;
            }
        }
        const signUpResult = await authClient.signUp.email({
            email: email,
            password: password,
            username: username,
            name: "",
            callbackURL: `${env.VITE_APP_URL}/account`,
        });

        if (signUpResult.error) {
            logError(signUpResult.error);
            setSignUpIssue(signUpResult.error.message ?? "Something went wrong, please try again");
        } else {
            log(signUpResult.data);
            void navigate("/account");
        }
        setSigningUp(false);
    };

    return (
        <div className="mt-15 shadow-xl/25 w-full max-w-md rounded-lg bg-blue-500 p-8 tracking-wide text-white">
            <h2 className="text-shadow-sm/50 mb-5 text-center text-4xl font-bold tracking-normal text-white">
                Create an Account
            </h2>
            <form
                id="registrationForm"
                onSubmit={(e) => {
                    void handleSignUp(e);
                }}
            >
                <div className="mb-4">
                    <label
                        htmlFor="username"
                        className="text-shadow-xs/80 mb-2 block text-lg font-semibold text-white"
                    >
                        Username:
                    </label>
                    <input
                        type="text"
                        id="username"
                        className="inset-shadow-md hover:inset-shadow-lg w-full rounded-lg border border-gray-400 bg-white px-4 py-2 text-zinc-900 placeholder:text-gray-500 hover:shadow-sm"
                        minLength={3}
                        maxLength={20}
                        placeholder="Enter a username"
                        autoComplete="username"
                        onChange={(e) => {
                            setUsername(e.target.value);
                        }}
                        value={username}
                        required
                    />
                </div>
                <div className="mb-4">
                    <label
                        htmlFor="email"
                        className="text-shadow-xs/80 mb-2 block text-lg font-semibold text-white"
                    >
                        Email:
                    </label>
                    <input
                        type="email"
                        id="email"
                        className="inset-shadow-md hover:inset-shadow-lg w-full rounded-lg border border-gray-400 bg-white px-4 py-2 placeholder:text-gray-400 hover:shadow-sm focus:border-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        placeholder="Enter your email"
                        autoComplete="email"
                        onChange={(e) => {
                            setEmail(e.target.value);
                        }}
                        value={email}
                        required
                    />
                </div>
                <div className="mb-4">
                    <label
                        htmlFor="password"
                        className="text-shadow-xs/80 mb-2 block text-lg font-semibold text-white"
                    >
                        Password:
                    </label>
                    <input
                        type="password"
                        id="password"
                        className="inset-shadow-md hover:inset-shadow-lg w-full rounded-lg border border-gray-400 bg-white px-4 py-2 placeholder:text-gray-400 hover:shadow-sm focus:border-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        placeholder="********"
                        autoComplete="new-password"
                        onChange={(e) => {
                            setPassword(e.target.value);
                        }}
                        value={password}
                        required
                    />
                </div>
                <div className="mb-4">
                    <label
                        htmlFor="confirm-password"
                        className="text-shadow-xs/80 mb-2 block text-lg font-semibold text-white"
                    >
                        Confirm Password:
                    </label>
                    <input
                        type="password"
                        id="confirm-password"
                        className="inset-shadow-md hover:inset-shadow-lg w-full rounded-lg border border-gray-400 bg-white px-4 py-2 placeholder:text-gray-400 hover:shadow-sm focus:border-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        placeholder="********"
                        autoComplete="new-password"
                        onChange={(e) => {
                            setPasswordConfirmation(e.target.value);
                        }}
                        value={passwordConfirmation}
                        required
                    />
                    {signUpIssue ? (
                        <p className="shadow-xs max-h-23 mb-1 mt-3 overflow-y-auto rounded-md border border-red-200 bg-red-50 p-2 text-red-500 shadow-red-50">
                            {signUpIssue}
                        </p>
                    ) : (
                        <></>
                    )}
                </div>
                <button
                    type="submit"
                    className="text-shadow-xs/80 w-full cursor-pointer rounded-lg bg-amber-500 py-2 font-semibold text-white transition-all hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50"
                    disabled={signingUp}
                >
                    {signingUp ? "Submitting..." : "Sign Up"}
                </button>
                <p className="my-2 text-center text-white">Or</p>
                <DiscordLoginButton disable={signingUp} />
            </form>
            <p className="text-gray- text-shadow-xs/50 mt-4 text-center text-white">
                Already have an account?{" "}
                {signingUp ? (
                    <div className="inline font-semibold text-blue-500 hover:underline">Log In</div>
                ) : (
                    <Link to="/log-in" className="font-semibold text-amber-500 hover:underline">
                        Log In
                    </Link>
                )}
            </p>
        </div>
    );
};
export default SignUpPage;
