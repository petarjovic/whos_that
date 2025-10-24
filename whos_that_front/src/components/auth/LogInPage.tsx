import GoogleLoginButton from "./GoogleLoginButton";
import DiscordLoginButton from "./DiscordLoginButton";

const LogInPage = () => {
    return (
        <div className="shadow-2xl/40 my-35 bg-linear-to-b w-xl border-x-1 border-b-10 mx-auto rounded-lg border-blue-700 from-blue-400 to-blue-600 px-12 py-8 text-white max-sm:flex max-sm:max-w-xs max-sm:flex-col">
            <h2 className="text-shadow-xs/100 mb-5 text-center text-5xl font-bold text-white max-2xl:text-4xl">
                Log In
            </h2>
            <div className="flex items-center justify-center max-sm:flex-col">
                <DiscordLoginButton />
                <p className="text-shadow-sm/80 font-digitag mx-auto mb-2 mt-4 text-center text-3xl text-white max-sm:my-8">
                    Or
                </p>
                <GoogleLoginButton />
            </div>
        </div>
    );
};
export default LogInPage;
