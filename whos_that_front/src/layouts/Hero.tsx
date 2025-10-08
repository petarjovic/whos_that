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
        <header className="bg-radial h-30 flex w-full items-center justify-between rounded-b-[40%] from-blue-400 to-blue-600 to-80% px-[12%]">
            <div className="w-1/4 shrink"></div>
            <h1 className="mt-2 w-fit grow text-center">
                <Link
                    to={"/"}
                    id="title"
                    reloadDocument={true}
                    className="font-digitag text-shadow-md/100 cursor-pointer text-9xl font-semibold leading-none tracking-wide text-orange-300 hover:text-orange-400"
                >
                    W<span />
                    ho
                    <span className="font-sedgwick align-sub leading-none tracking-tighter">
                        &apos;
                    </span>
                    s T
                    <span />
                    hat ?
                </Link>
            </h1>
            <div className="flex w-1/4 shrink justify-end">
                <h2 className="inline-block">
                    <Link
                        to={session ? "/account" : "/sign-up"}
                        className="text-shadow-sm/25 align-sub text-2xl font-bold text-white hover:text-blue-100"
                    >
                        <span className="text-shadow-sm text-2xl">
                            {isPending ? "" : session ? "🙋‍♂️ " : "👤 "}
                        </span>
                        <button className="cursor-pointer hover:underline active:translate-y-0.5">
                            {isPending ? "" : (session?.user.displayUsername ?? "Sign Up")}
                        </button>
                    </Link>

                    <button
                        className="px-2.25 w-fill border-b-5 border-x-1 text-shadow-xs/40 active:border-b-1 active:shadow-2xs active:inset-shadow-md duration-2 ml-10 cursor-pointer rounded-md border-cyan-500 bg-cyan-400 py-1 text-2xl font-bold text-white shadow-md transition-all hover:border-cyan-600 hover:bg-cyan-500 active:translate-y-[1px]"
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
