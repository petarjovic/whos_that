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
        <header className="flex items-center justify-between w-full px-[12%] rounded-b-[40%] bg-radial from-blue-400 to-blue-600">
            <div className="w-1/3"></div>
            <h1 className="w-1/3 my-1 text-center">
                <Link
                    to={"/"}
                    id="title"
                    className="font-digitag text-8xl font-bold text-amber-500 hover:text-amber-600 cursor-pointer drop-shadow-[0_5px_5px_rgba(0,0,0,0.7)] tracking-wide active:translate-y-1"
                >
                    Who<span className="font-sedgwick align-sub tracking-tighter">&apos;</span>s
                    That ?
                </Link>
            </h1>
            <div className="flex justify-end w-1/3">
                <h2>
                    <Link
                        to={session ? "/account" : "/sign-up"}
                        className=" text-xl font-bold text-white text-shadow-sm/25 hover:text-shadow-sm/90 active:translate-y-0.5"
                    >
                        <span className="text-shadow-sm text-2xl">
                            {isPending ? "" : !session ? "👤 " : "🙋‍♂️ "}
                        </span>
                        {isPending ? "" : session?.user.displayUsername ?? "Sign Up"}
                    </Link>

                    <button
                        className="ml-10 px-2.25 w-fill py-1 text-xl text-white font-bold border-b-5 border-x-1 border-cyan-600 bg-cyan-500 hover:bg-cyan-600 hover:border-cyan-700 rounded-md cursor-pointer shadow-md text-shadow-xs/40 active:border-b-1 active:translate-y-[1px] active:shadow-2xs active:inset-shadow-md align-super "
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
