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
            <header className="relative flex flex-col items-center justify-center border-b border-zinc-900 py-2.25 sm:pt-1 sm:pb-5 lg:pt-2">
                {/* Site title */}
                <p className="z-1 text-sm leading-none text-neutral-700 sm:text-base">
                    The Classic Character Elimination Game
                </p>
                <div className="z-1 h-0 w-9/10 border-t border-zinc-900"></div>
                <div className="flex w-9/10 justify-between">
                    <GiSherlockHolmes className="float-left scale-420 rotate-1 transform text-neutral-800 max-sm:mt-5 sm:mt-7.25 sm:scale-600 lg:mt-7.5" />
                    <h1 className="w-fit pt-5">
                        <Link
                            to={"/"}
                            id="title"
                            reloadDocument={true} //forces reload just in case
                            className="font-digitag text-wide cursor-pointer leading-0 font-bold text-orange-300 text-shadow-sm/50 hover:text-orange-400 max-sm:text-[4rem] sm:relative sm:top-1.25 sm:text-8xl sm:tracking-wide lg:top-1.5"
                        >
                            <>
                                {/* Spans are for improved spacing + styling */}
                                W<span />
                                ho
                                <span className="font-sedgwick tracking-tightest relative top-5 right-1.25 sm:top-6 sm:right-1.5">
                                    &apos;
                                </span>
                                <span className="font-digitag relative top-1 right-3 sm:right-4">
                                    s
                                </span>
                                T
                                <span />
                                hat
                                <span className="font-digitag relative top-0.75 leading-0 tracking-tighter text-red-400 max-sm:text-[4.8rem] sm:text-[7rem]">
                                    ?
                                </span>
                            </>
                        </Link>
                    </h1>
                    <GiSherlockHolmes className="float-right scale-420 -rotate-1 transform text-neutral-800 max-sm:mt-5 max-sm:scale-x-[-4.2] sm:mt-7.25 sm:scale-600 sm:scale-x-[-6] lg:mt-7.5" />
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
                    <div className="relative top-1 flex items-center justify-end gap-2 xl:absolute xl:top-15 xl:right-2/10">
                        <Link
                            to={session ? "/account" : "/login"}
                            className="cursor-pointer text-lg leading-none font-medium text-zinc-800 italic hover:underline"
                        >
                            {session?.user.displayUsername ?? ""}
                        </Link>
                        <button
                            type="button"
                            className={`bg-red-400 ${session ? "rounded px-1 py-0.5 text-sm font-normal grayscale-10 lg:px-1.75 lg:py-1" : "px-2 py-1.25 lg:px-2.5 lg:py-1.5 lg:text-base"} cursor-pointer font-medium text-white hover:scale-101 hover:bg-red-600 active:scale-99 xl:text-base`}
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
