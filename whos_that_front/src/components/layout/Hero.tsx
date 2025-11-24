import type { AuthData } from "../../lib/auth/auth-client";
import { useNavigate, Link } from "react-router";
import { authClient } from "../../lib/auth/auth-client";
import { GiSherlockHolmes } from "react-icons/gi";

interface HeroProps extends AuthData {
    showUserInfo?: boolean;
}

/**
 * Header component with site title and user authentication controls
 * showUserInfo can be disabled for error pages
 */
const Hero = ({ session, isPending, showUserInfo = true }: HeroProps) => {
    const navigate = useNavigate();

    const handleLogOut = async () => {
        const logOutResult = await authClient.signOut();
        if (logOutResult.error) {
            if (logOutResult.error instanceof Error) throw logOutResult.error;
            else throw new Error("Error logging out.");
        }
        void navigate("/");
    };

    return (
        <div className="w-[92dvw]">
            <header className="py-2.25 relative flex flex-col items-center justify-center border-b border-zinc-900 sm:pb-5 sm:pt-1 lg:pt-2">
                {/* Site title */}
                <p className="z-1 text-sm leading-none text-neutral-700 sm:text-base">
                    The Classic Character Elimination Game
                </p>
                <div className="w-9/10 z-1 h-0 border-t border-zinc-900"></div>
                <div className="w-9/10 flex justify-between">
                    <GiSherlockHolmes className="scale-420 sm:scale-600 sm:mt-7.25 lg:mt-7.5 float-left rotate-1 transform text-neutral-700 max-sm:mt-5" />
                    <h1 className="w-fit pt-5">
                        <Link
                            to={"/"}
                            id="title"
                            reloadDocument={true} //forces reload just in case
                            className="font-digitag text-shadow-sm/50 leading-0 text-wide sm:top-1.25 cursor-pointer font-bold text-orange-300 hover:text-orange-400 max-sm:text-[4rem] sm:relative sm:text-8xl sm:tracking-wide lg:top-1.5"
                        >
                            <>
                                {/* Spans are for improved spacing + styling */}
                                W<span />
                                ho
                                <span className="font-sedgwick tracking-tightest right-1.25 relative top-5 sm:right-1.5 sm:top-6">
                                    &apos;
                                </span>
                                <span className="font-digitag relative right-3 top-1 sm:right-4">
                                    s
                                </span>
                                T
                                <span />
                                hat
                                <span className="font-digitag leading-0 top-0.75 relative tracking-tighter text-red-400 max-sm:text-[4.8rem] sm:text-[7rem]">
                                    ?
                                </span>
                            </>
                        </Link>
                    </h1>
                    <GiSherlockHolmes className="scale-420 sm:scale-600 sm:mt-7.25 lg:mt-7.5 float-right -rotate-1 transform text-neutral-700 max-sm:mt-5 max-sm:scale-x-[-4.2] sm:scale-x-[-6]" />
                </div>
                {/* User authentication info and controls */}
            </header>
            <div
                className={`flex w-full ${session ? "justify-around" : "justify-center"} text-sm text-neutral-600`}
            >
                <div className="z-1 sm:text-base">
                    {new Date().toLocaleString("en-US", {
                        dateStyle: "long",
                    })}
                </div>
                {showUserInfo ? (
                    <div className="xl:right-2/10 xl:top-15 relative top-1 flex items-center justify-end gap-2 xl:absolute">
                        <Link
                            to={session ? "/account" : "/login"}
                            className="cursor-pointer text-lg font-medium italic leading-none text-zinc-800 hover:underline"
                        >
                            {session?.user.displayUsername ?? ""}
                        </Link>
                        <button
                            type="button"
                            className={`bg-red-400 ${session ? "lg:px-1.75 grayscale-10 rounded px-1 py-0.5 text-sm font-normal lg:py-1" : "py-1.25 px-2 lg:px-2.5 lg:py-1.5 lg:text-base"} cursor-pointer font-medium text-white hover:bg-red-600 xl:text-base`}
                            onClick={() => {
                                if (!isPending && session) void handleLogOut();
                                else if (!isPending) void navigate("/login");
                            }}
                        >
                            {isPending ? "" : session ? "Log Out" : "Sign Up / Log In"}
                        </button>
                    </div>
                ) : (
                    <></>
                )}
            </div>
        </div>
    );
};
export default Hero;
