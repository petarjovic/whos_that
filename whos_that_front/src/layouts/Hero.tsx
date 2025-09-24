import { Link } from "react-router";
import { authClient } from "../lib/auth-client.ts";
import { useNavigate } from "react-router";
import { logOut } from "../logic/AuthActions.tsx";

const Hero = () => {
    const navigate = useNavigate();
    const {
        data: session,
        isPending, //loading state
        error, //error object
    } = authClient.useSession();

    const handleLogOut = async () => {
        const logOutResult = await logOut();
        if (logOutResult.error) {
            console.error(logOutResult.error);
        }
        void navigate("/");
    };

    return (
        <header className="bg-radial flex w-full items-center justify-between rounded-b-[40%] from-blue-400 to-blue-600 px-[12%]">
            <div className="w-1/3"></div>
            <h1 className="my-1 w-1/3 text-center">
                <Link
                    to={"/"}
                    id="title"
                    reloadDocument={true}
                    className="font-digitag cursor-pointer text-8xl font-bold tracking-wide text-amber-500 drop-shadow-[0_5px_5px_rgba(0,0,0,0.7)] hover:text-amber-600 active:translate-y-1"
                >
                    Who<span className="font-sedgwick align-sub tracking-tighter">&apos;</span>s
                    That ?
                </Link>
            </h1>
            <div className="flex w-1/3 justify-end">
                <h2>
                    <Link
                        to={session ? "/account" : "/sign-up"}
                        className="text-shadow-sm/25 hover:text-shadow-sm/90 text-xl font-bold text-white active:translate-y-0.5"
                    >
                        <span className="text-shadow-sm text-2xl">
                            {isPending ? "" : session ? "🙋‍♂️ " : "👤 "}
                        </span>
                        {isPending ? "" : (session?.user.displayUsername ?? "Sign Up")}
                    </Link>

                    <button
                        className="px-2.25 w-fill border-b-5 border-x-1 text-shadow-xs/40 active:border-b-1 active:shadow-2xs active:inset-shadow-md ml-10 cursor-pointer rounded-md border-cyan-600 bg-cyan-500 py-1 align-super text-xl font-bold text-white shadow-md hover:border-cyan-700 hover:bg-cyan-600 active:translate-y-[1px]"
                        onClick={() => {
                            if (!isPending && session) void handleLogOut();
                            else if (!isPending) void navigate("/login");
                        }}
                    >
                        {isPending ? "" : session ? "Log Out" : "Log In"}
                    </button>
                </h2>
            </div>
        </header>
    );
};

export default Hero;
