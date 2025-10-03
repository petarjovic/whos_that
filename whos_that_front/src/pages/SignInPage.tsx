import { useState, type FormEvent } from "react";
import { Link } from "react-router";
import { logIn } from "../logic/AuthActions";
import { useNavigate } from "react-router";
import { authClient } from "../lib/auth-client";

const SignInPage = () => {
    const navigate = useNavigate();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [errorMsg, setErrorMsg] = useState("");

    const {
        data: session,
        isPending, //loading state
        error, //error object
    } = authClient.useSession(); //ERROR HANDLING

    if (isPending) return <div>Loading...</div>;
    else if (session) void navigate("/");

    const handleLogIn = async (e: FormEvent) => {
        e.preventDefault();
        const logInResult = await logIn(username, password);
        if (logInResult.error) {
            console.error(logInResult.error.message); //HANDLE BETTER
            setErrorMsg(logInResult.error.message ?? "");
        } else {
            void navigate("/");
        }
    };
    return (
        <div className="mt-20 w-full max-w-md rounded-lg bg-white p-8 tracking-wide shadow-2xl">
            <h2 className="mb-6 text-center text-2xl font-bold text-zinc-900">Sign In</h2>
            <form
                id="signInForm"
                onSubmit={(e) => {
                    void handleLogIn(e);
                }}
            >
                <div className="mb-4">
                    <label htmlFor="username" className="mb-2 block font-semibold text-zinc-800">
                        Username or Email
                    </label>
                    <input
                        type="text"
                        id="existing-username"
                        className="inset-shadow-md hover:inset-shadow-lg w-full rounded-lg border border-gray-400 px-4 py-2 placeholder:text-gray-400 hover:shadow-sm focus:border-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        placeholder="Enter your username or email"
                        autoComplete="email"
                        onChange={(e) => {
                            setUsername(e.target.value);
                        }}
                        value={username}
                        required
                    />
                    {/* <p className="text-red-500 text-sm mt-2 hidden" id="usernameError">
                        Username is required.
                    </p> */}
                </div>
                <div className="mb-4">
                    <label htmlFor="password" className="mb-2 block font-semibold text-zinc-800">
                        Password
                    </label>
                    <input
                        type="password"
                        id="existing-password"
                        className="inset-shadow-md hover:inset-shadow-lg w-full rounded-lg border border-gray-400 px-4 py-2 placeholder:text-gray-400 hover:shadow-sm focus:border-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        placeholder="********"
                        autoComplete="current-password"
                        onChange={(e) => {
                            setPassword(e.target.value);
                        }}
                        value={password}
                        required
                    />
                    <p
                        className={`shadow-xs max-h-23 mb-1 mt-3 overflow-y-auto rounded-md border border-red-200 bg-red-50 p-2 text-red-500 shadow-red-50 ${errorMsg ? "" : "hidden"}`}
                    >
                        {errorMsg}
                    </p>
                </div>

                <button
                    type="submit"
                    className="w-full rounded-lg bg-blue-500 py-2 font-semibold text-white hover:bg-blue-600 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50"
                >
                    Log In
                </button>
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
