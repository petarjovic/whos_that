import { useState } from "react";
import { Link } from "react-router";
const SignUpPage = () => {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [passwordConfirmation, setPasswordConfirmation] = useState("");

    return (
        <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full mt-20 tracking-wide">
            <h2 className="text-2xl font-bold text-center text-zinc-900 mb-6">Create an Account</h2>
            <form id="registrationForm">
                <div className="mb-4">
                    <label htmlFor="username" className="block text-zinc-800 font-semibold mb-2">
                        Username
                    </label>
                    <input
                        type="text"
                        id="username"
                        className="w-full px-4 py-2 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:border-gray-100 focus:ring-blue-400 placeholder:text-gray-400 inset-shadow-md hover:shadow-sm hover:inset-shadow-lg"
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
                    <label htmlFor="email" className="block text-zinc-800 font-semibold mb-2">
                        Email
                    </label>
                    <input
                        type="email"
                        id="email"
                        className="w-full px-4 py-2 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:border-gray-100 focus:ring-blue-400 placeholder:text-gray-400 inset-shadow-md hover:shadow-sm hover:inset-shadow-lg"
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
                    <label htmlFor="password" className="block text-zinc-800 font-semibold mb-2">
                        Password
                    </label>
                    <input
                        type="password"
                        id="password"
                        className="w-full px-4 py-2 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:border-gray-100 focus:ring-blue-400 placeholder:text-gray-400 inset-shadow-md hover:shadow-sm hover:inset-shadow-lg"
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
                        className="block text-zinc-800 font-semibold mb-2"
                    >
                        Confirm Password
                    </label>
                    <input
                        type="password"
                        id="confirm-password"
                        className="w-full px-4 py-2 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:border-gray-100 focus:ring-blue-400 placeholder:text-gray-400 inset-shadow-md hover:shadow-sm hover:inset-shadow-lg"
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
                    className="w-full bg-blue-500 text-white py-2 rounded-lg font-semibold hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50"
                >
                    Sign Up
                </button>
            </form>
            <p className="text-center text-gray-600 mt-4">
                Already have an account?{" "}
                <Link to="/login" className="text-blue-500 font-semibold">
                    Log In
                </Link>
            </p>
        </div>
    );
};
export default SignUpPage;
