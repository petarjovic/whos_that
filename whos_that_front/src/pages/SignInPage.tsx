import { useState, type FormEvent } from "react";
import { Link } from "react-router";
import { logIn } from "../logic/AuthActions";

const SignInPage = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const handleLogIn = async (e: FormEvent) => {
        e.preventDefault();
        const logInResult = await logIn(username, password);
        if (logInResult.error) {
            console.error(logInResult.error.message); //HANDLE BETTER
        }
    };
    return (
        <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full mt-20 tracking-wide">
            <h2 className="text-2xl font-bold text-center text-zinc-900 mb-6">Sign In</h2>
            <form
                id="signInForm"
                onSubmit={(e) => {
                    void handleLogIn(e);
                }}
            >
                <div className="mb-4">
                    <label htmlFor="username" className="block text-zinc-800 font-semibold mb-2">
                        Username or Email
                    </label>
                    <input
                        type="text"
                        id="existing-username"
                        className="w-full px-4 py-2 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:border-gray-100 focus:ring-blue-400 placeholder:text-gray-400 inset-shadow-md hover:shadow-sm hover:inset-shadow-lg"
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
                    <label htmlFor="password" className="block text-zinc-800 font-semibold mb-2">
                        Password
                    </label>
                    <input
                        type="password"
                        id="existing-password"
                        className="w-full px-4 py-2 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:border-gray-100 focus:ring-blue-400 placeholder:text-gray-400 inset-shadow-md hover:shadow-sm hover:inset-shadow-lg"
                        placeholder="********"
                        autoComplete="current-password"
                        onChange={(e) => {
                            setPassword(e.target.value);
                        }}
                        value={password}
                        required
                    />
                    {/* <p className="text-red-500 text-sm mt-2 hidden" id="passwordError">
                        Password is required.
                    </p> */}
                </div>

                <button
                    type="submit"
                    className="w-full bg-blue-500 text-white py-2 rounded-lg font-semibold hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50 hover:shadow-md"
                >
                    Log In
                </button>
            </form>
            <p className="text-center text-gray-600 mt-4">
                Don&apos;t have an account yet?{" "}
                <Link to="/sign-up" className="text-blue-500 font-semibold hover:underline">
                    Sign Up
                </Link>
            </p>
        </div>
    );
};
export default SignInPage;
