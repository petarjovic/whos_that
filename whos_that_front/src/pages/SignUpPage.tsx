import { useState, type FormEvent } from "react";
import { Link } from "react-router";
import { signUp, handleSocialSignIn } from "../logic/AuthActions";
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
                        className="inset-shadow-md hover:inset-shadow-lg w-full rounded-lg border border-gray-400 bg-white px-4 py-2 placeholder:text-gray-400 hover:shadow-sm focus:border-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
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
                        className="inset-shadow-md hover:inset-shadow-lg w-full rounded-lg border border-gray-400 bg-white px-4 py-2 placeholder:text-gray-400 hover:shadow-sm focus:border-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
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
                        className="inset-shadow-md hover:inset-shadow-lg w-full rounded-lg border border-gray-400 bg-white px-4 py-2 placeholder:text-gray-400 hover:shadow-sm focus:border-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
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
                    className="w-full cursor-pointer rounded-lg bg-blue-500 py-2 font-semibold text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50"
                >
                    Sign Up
                </button>
                <p className="my-2 text-center">Or</p>
                <button
                    type="button"
                    className="w-8/10 mx-auto flex cursor-pointer items-center justify-center rounded-lg bg-indigo-500 px-6 py-2 text-sm font-medium text-white shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
                    onClick={(e) => {
                        void handleSocialSignIn(e, "discord");
                    }}
                >
                    <svg
                        className="mr-2 h-6 w-6"
                        xmlns="http://www.w3.org/2000/svg"
                        width="800px"
                        height="800px"
                        viewBox="0 -28.5 256 256"
                        version="1.1"
                        preserveAspectRatio="xMidYMid"
                    >
                        <g>
                            <path
                                d="M216.856339,16.5966031 C200.285002,8.84328665 182.566144,3.2084988 164.041564,0 C161.766523,4.11318106 159.108624,9.64549908 157.276099,14.0464379 C137.583995,11.0849896 118.072967,11.0849896 98.7430163,14.0464379 C96.9108417,9.64549908 94.1925838,4.11318106 91.8971895,0 C73.3526068,3.2084988 55.6133949,8.86399117 39.0420583,16.6376612 C5.61752293,67.146514 -3.4433191,116.400813 1.08711069,164.955721 C23.2560196,181.510915 44.7403634,191.567697 65.8621325,198.148576 C71.0772151,190.971126 75.7283628,183.341335 79.7352139,175.300261 C72.104019,172.400575 64.7949724,168.822202 57.8887866,164.667963 C59.7209612,163.310589 61.5131304,161.891452 63.2445898,160.431257 C105.36741,180.133187 151.134928,180.133187 192.754523,160.431257 C194.506336,161.891452 196.298154,163.310589 198.110326,164.667963 C191.183787,168.842556 183.854737,172.420929 176.223542,175.320965 C180.230393,183.341335 184.861538,190.991831 190.096624,198.16893 C211.238746,191.588051 232.743023,181.531619 254.911949,164.955721 C260.227747,108.668201 245.831087,59.8662432 216.856339,16.5966031 Z M85.4738752,135.09489 C72.8290281,135.09489 62.4592217,123.290155 62.4592217,108.914901 C62.4592217,94.5396472 72.607595,82.7145587 85.4738752,82.7145587 C98.3405064,82.7145587 108.709962,94.5189427 108.488529,108.914901 C108.508531,123.290155 98.3405064,135.09489 85.4738752,135.09489 Z M170.525237,135.09489 C157.88039,135.09489 147.510584,123.290155 147.510584,108.914901 C147.510584,94.5396472 157.658606,82.7145587 170.525237,82.7145587 C183.391518,82.7145587 193.761324,94.5189427 193.539891,108.914901 C193.539891,123.290155 183.391518,135.09489 170.525237,135.09489 Z"
                                fill="#ffffff"
                                fillRule="nonzero"
                            ></path>
                        </g>
                    </svg>
                    <span>Sign in with Discord</span>
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
