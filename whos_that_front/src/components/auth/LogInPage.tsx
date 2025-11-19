import GoogleLoginButton from "./GoogleLoginButton";
import DiscordLoginButton from "./DiscordLoginButton";

/**
 * Login page offering SSO via Discord and Google
 */
const LogInPage = () => {
    return (
        <div className="border-7 shadow-xs/60 m-auto flex flex-col items-center gap-5 border-double bg-neutral-50 px-10 pb-7 pt-6 text-center text-5xl">
            <h2 className="font-bold">Log In</h2>
            <DiscordLoginButton />
            <p className="text-xl font-medium">Or</p>
            <GoogleLoginButton />
        </div>
    );
};
export default LogInPage;
