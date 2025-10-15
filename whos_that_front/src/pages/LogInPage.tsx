import GoogleLoginButton from "../lib/GoogleLoginButton";
import DiscordLoginButton from "../lib/DiscordLoginButton";

const LogInPage = () => {
    return (
        <div className="shadow-2xl/40 my-35 bg-linear-to-b w-150 mx-auto rounded-lg from-blue-400 to-blue-500 p-8 text-white">
            <h2 className="text-shadow-xs/50 mb-5 text-center text-5xl font-bold tracking-tight text-white">
                Log In
            </h2>
            <div className="flex items-center justify-center">
                <DiscordLoginButton />
                <p className="text-shadow-sm/80 font-digitag mx-10 mb-2 mt-4 text-center text-3xl text-white">
                    Or
                </p>
                <GoogleLoginButton />
            </div>
        </div>
    );
};
export default LogInPage;
