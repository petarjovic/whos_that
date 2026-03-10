import GoogleLoginButton from "./GoogleLoginButton";
import DiscordLoginButton from "./DiscordLoginButton";

/**
 * Login page offering SSO via Discord and Google
 */
const LogInPage = () => {
    return (
        <div className="m-auto flex flex-col items-center justify-center gap-5 border-7 border-double bg-neutral-100 px-10 pt-6 pb-7 text-center text-5xl shadow-sm/50 text-neutral-800">
            <h2 className="font-bold">Log In</h2>
            <GoogleLoginButton />
            <p className="text-xl font-medium">Or</p>
            <DiscordLoginButton />
        </div>
    );
};
export default LogInPage;
