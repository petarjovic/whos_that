import type { AuthData } from "../lib/auth-client";
import { useNavigate, Link } from "react-router";
import { authClient } from "../lib/auth-client";

interface HeroProps extends AuthData {
    showUserInfo?: boolean;
}

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
        <header className="bg-radial h-30 shadow-lg/20 flex w-full items-center justify-between rounded-b-[40%] from-blue-400 from-20% to-blue-600 to-70% px-[12%]">
            <div className="w-1/4 shrink"></div>
            <h1 className="mt-2 w-fit grow text-center">
                <Link
                    to={"/"}
                    id="title"
                    reloadDocument={true}
                    className="font-digitag text-shadow-md/85 cursor-pointer whitespace-pre-wrap text-9xl font-bold tracking-wide text-amber-500 hover:text-amber-600"
                >
                    <>
                        W<span />
                        ho
                        <span className="font-sedgwick align-sub leading-none tracking-tighter">
                            &apos;
                        </span>
                        s T
                        <span />
                        hat<span className="font-digitag tracking-tighter">?</span>
                    </>
                </Link>
            </h1>
            <div className="flex w-fit grow justify-end">
                {showUserInfo ? (
                    <h2 className="items-center-safe flex justify-end">
                        <Link
                            to={session ? "/account" : "/log-in"}
                            className="text-shadow-sm/25 align-sub text-2xl font-bold text-white hover:text-blue-100"
                        >
                            <span className="text-shadow-sm text-3xl">
                                {isPending ? "" : session ? "🙋‍♂️ " : "👤 "}
                            </span>
                            <button
                                type="button"
                                className="inline-block cursor-pointer hover:underline"
                            >
                                {session?.user.displayUsername ?? ""}
                            </button>
                        </Link>

                        <button
                            type="button"
                            className="px-2.25 border-b-5 border-x-1 text-shadow-xs/40 active:border-b-1 active:shadow-2xs active:inset-shadow-md duration-2 ml-10 h-11 w-fit cursor-pointer rounded-md border-cyan-600 bg-cyan-500 py-1 text-2xl font-bold text-white shadow-md transition-all hover:border-cyan-700 hover:bg-cyan-600 active:translate-y-[1px]"
                            onClick={() => {
                                if (!isPending && session) void handleLogOut();
                                else if (!isPending) void navigate("/log-in");
                            }}
                        >
                            {isPending ? "" : session ? "Log Out" : "Sign Up / Log In"}
                        </button>
                    </h2>
                ) : (
                    <></>
                )}
            </div>
        </header>
    );
};
export default Hero;
