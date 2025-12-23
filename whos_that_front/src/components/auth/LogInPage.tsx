import GoogleLoginButton from "./GoogleLoginButton";
import DiscordLoginButton from "./DiscordLoginButton";

/**
 * Login page offering SSO via Discord and Google
 */
const LogInPage = () => {
    return (
        <div className="m-auto flex flex-col items-center justify-center gap-5 border-7 border-double bg-neutral-50 px-10 pt-6 pb-7 text-center text-5xl shadow-xs/60">
            <h2 className="font-bold">Log In</h2>
            <DiscordLoginButton />
            <p className="text-xl font-medium">Or</p>
            <GoogleLoginButton />
        </div>
    );
};
export default LogInPage;
