import { useState, type FormEvent } from "react";
import { Link } from "react-router";
import { signUp } from "../logic/AuthActions";
import { useNavigate } from "react-router";
import { authClient } from "../lib/auth-client";

const SignUpPage = () => {
    const navigate = useNavigate();
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [passwordConfirmation, setPasswordConfirmation] = useState("");

    const {
        data: session,
        isPending, //loading state
        error, //error object
    } = authClient.useSession(); //ERROR HANDLING

    if (isPending) return <div>Loading...</div>;
    else if (session) void navigate("/");

    const handleSignUp = async (e: FormEvent) => {
        //ERROR HANDLING
        e.preventDefault();
        if (password !== passwordConfirmation) throw new Error("Passwords don't match.");
        const signUpResult = await signUp(username, email, password);
        console.log(signUpResult.data);
        if (signUpResult.error) {
            console.error(signUpResult.error.message); //HANDLE BETTER
        } else {
            void navigate("/");
        }
    };

    return (
        <div className="mt-20 w-full max-w-md rounded-lg bg-white p-8 tracking-wide shadow-2xl">
            <h2 className="mb-6 text-center text-2xl font-bold text-zinc-900">Create an Account</h2>
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
                        className="inset-shadow-md hover:inset-shadow-lg w-full rounded-lg border border-gray-400 px-4 py-2 placeholder:text-gray-400 hover:shadow-sm focus:border-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        placeholder="Enter your username"
                        autoComplete="username"
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
                    <label htmlFor="email" className="mb-2 block font-semibold text-zinc-800">
                        Email
                    </label>
                    <input
                        type="email"
                        id="email"
                        className="inset-shadow-md hover:inset-shadow-lg w-full rounded-lg border border-gray-400 px-4 py-2 placeholder:text-gray-400 hover:shadow-sm focus:border-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        placeholder="Enter your email"
                        autoComplete="email"
                        onChange={(e) => {
                            setEmail(e.target.value);
                        }}
                        value={email}
                        required
                    />
                    {/* <p className="text-red-500 text-sm mt-2 hidden" id="emailError">
                        Please enter a valid email.
                    </p> */}
                </div>
                <div className="mb-4">
                    <label htmlFor="password" className="mb-2 block font-semibold text-zinc-800">
                        Password
                    </label>
                    <input
                        type="password"
                        id="password"
                        className="inset-shadow-md hover:inset-shadow-lg w-full rounded-lg border border-gray-400 px-4 py-2 placeholder:text-gray-400 hover:shadow-sm focus:border-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        placeholder="********"
                        autoComplete="new-password"
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
                        className="inset-shadow-md hover:inset-shadow-lg w-full rounded-lg border border-gray-400 px-4 py-2 placeholder:text-gray-400 hover:shadow-sm focus:border-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        placeholder="********"
                        autoComplete="new-password"
                        onChange={(e) => {
                            setPasswordConfirmation(e.target.value);
                        }}
                        value={passwordConfirmation}
                        required
                    />
                    {/* <p className="text-red-500 text-sm mt-2 hidden" id="confirmPasswordError">
                        Passwords do not match.
                    </p> */}
                </div>
                <button
                    type="submit"
                    className="w-full rounded-lg bg-blue-500 py-2 font-semibold text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50"
                >
                    Sign Up
                </button>
            </form>
            <p className="mt-4 text-center text-gray-600">
                Already have an account?{" "}
                <Link to="/login" className="font-semibold text-blue-500 hover:underline">
                    Log In
                </Link>
            </p>
        </div>
    );
};
export default SignUpPage;
