import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router";
import { useNavigate } from "react-router";
import { useBetterAuthSession } from "../layouts/LayoutContextProvider";
import DiscordLoginButton from "../lib/DiscordLoginButton";
import { authClient } from "../lib/auth-client";
import env from "../lib/zodEnvSchema";

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
        const signUpResult = await authClient.signUp.email({
            email: email,
            password: password,
            username: username,
            name: "",
            callbackURL: `${env.VITE_APP_URL}/account`,
        });
        console.log(signUpResult.data);
        if (signUpResult.error) {
            console.error(signUpResult.error);
            setSignUpIssue(signUpResult.error.message ?? "Something went wrong, please try again");
        } else {
            void navigate("/account");
        }
        setSigningUp(false);
    };

    return (
        <div className="mt-15 w-full max-w-md rounded-lg bg-cyan-100 p-8 tracking-wide shadow-2xl">
            <h2 className="mb-5 text-center text-2xl font-bold text-zinc-900">Create an Account</h2>
            <form
                id="registrationForm"
                onSubmit={(e) => {
                    void handleSignUp(e);
                }}
            >
                <div className="mb-4">
                    <label htmlFor="username" className="mb-2 block font-semibold text-zinc-800">
                        Username
                    </label>
                    <input
                        type="text"
                        id="username"
                        className="inset-shadow-md hover:inset-shadow-lg w-full rounded-lg border border-gray-400 bg-white px-4 py-2 placeholder:text-gray-400 hover:shadow-sm focus:border-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        minLength={3}
                        maxLength={20}
                        placeholder="Enter your username"
                        autoComplete="username"
                        onChange={(e) => {
                            setUsername(e.target.value);
                        }}
                        value={username}
                        required
                    />
                </div>
                <div className="mb-4">
                    <label htmlFor="email" className="mb-2 block font-semibold text-zinc-800">
                        Email
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
                    <label htmlFor="password" className="mb-2 block font-semibold text-zinc-800">
                        Password
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
                        className="mb-2 block font-semibold text-zinc-800"
                    >
                        Confirm Password
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
                    className="w-full cursor-pointer rounded-lg bg-blue-500 py-2 font-semibold text-white transition-all hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50"
                    disabled={signingUp}
                >
                    {signingUp ? "Submitting..." : "Sign Up"}
                </button>
                <p className="my-2 text-center">Or</p>
                <DiscordLoginButton disable={signingUp} />
            </form>
            <p className="mt-4 text-center text-gray-600">
                Already have an account?{" "}
                {signingUp ? (
                    <Link to="/login" className="font-semibold text-blue-500 hover:underline">
                        Log In
                    </Link>
                ) : (
                    <div className="font-semibold text-blue-500 hover:underline">Log In</div>
                )}
            </p>
        </div>
    );
};
export default SignUpPage;
