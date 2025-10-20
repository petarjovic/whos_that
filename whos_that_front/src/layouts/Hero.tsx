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
        <header className="bg-linear-to-b h-30 border-b-10 flex w-full items-center justify-center rounded-b-[40%] border-blue-600 from-blue-400 to-blue-500 to-60% px-[12%] shadow-lg">
            <div className="w-3/10"></div>
            <h1 className="w-4/10 mt-2 text-center">
                <Link
                    to={"/"}
                    id="title"
                    reloadDocument={true}
                    className="font-digitag text-shadow-md/85 cursor-pointer whitespace-pre-wrap text-9xl font-bold tracking-wide text-orange-300 hover:text-amber-600"
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
            <div className="w-3/10">
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
                            className="px-2.25 border-b-5 border-x-1 text-shadow-xs/40 active:border-b-1 active:shadow-2xs active:inset-shadow-md hover:shadow-sm/20 duration-15 shadow-md/20 ml-10 h-11 w-fit cursor-pointer rounded-md border-cyan-600 bg-cyan-500 py-1 text-2xl font-bold text-white transition-all hover:border-cyan-700 hover:bg-cyan-600 hover:text-gray-200 active:translate-y-[1px]"
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
