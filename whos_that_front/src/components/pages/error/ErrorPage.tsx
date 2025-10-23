import { Link, useRouteError, isRouteErrorResponse } from "react-router";
import chalkOutline from "@client/assets/ChalkOutline.svg";
import Hero from "../../layout/Hero.tsx";
import { useSearchParams } from "react-router";
import { logError } from "../../../lib/logger.ts";

const ErrorPage = ({ error }: { error?: unknown }) => {
    let errorMessage = "";

    const routeError = useRouteError();
    const [searchParams] = useSearchParams();
    const searchParamError = searchParams.get("error");

    if (routeError) logError(routeError);
    if (error) logError(error);
    if (searchParamError) logError(searchParamError);

    if (error instanceof Error) {
        errorMessage = error.message;
    } else if (isRouteErrorResponse(routeError)) {
        errorMessage = routeError.status.toString() + ": " + routeError.statusText;
    } else if (routeError instanceof Error) {
        errorMessage = routeError.message;
    } else if (searchParamError) {
        errorMessage = searchParamError;
    }

    return (
        <div className="flex min-h-screen w-full flex-col items-center justify-start bg-gradient-to-b from-cyan-400 to-cyan-600 to-90% bg-fixed">
            {/* eslint-disable-next-line unicorn/no-null */}
            <Hero session={null} isPending={false} showUserInfo={false} />
            <div className="text-shadow-xs/100 mt-15 mx-auto text-center text-2xl text-white">
                <img
                    src={chalkOutline}
                    alt="Error image"
                    className="rotate-15 mb-15 mx-auto"
                    width={325}
                    height={300}
                />
                <h1 className="mb-5 text-5xl text-red-800">Something Went Wrong</h1>
                <h2>Oh No! {errorMessage}</h2>
                <Link to={"/"}>
                    <button className="w-fill h-18 border-b-9 border-x-1 text-shadow-xs/40 active:shadow-2xs shadow-sm/20 hover:shadow-xs duration-15 mt-[2vh] cursor-pointer rounded-md border-blue-600 bg-blue-500 px-4 py-1 text-2xl font-bold text-neutral-100 transition-all hover:border-blue-700 hover:bg-blue-600 active:translate-y-[1px] active:border-none">
                        Take Me Home
                    </button>
                </Link>
            </div>
        </div>
    );
};
export default ErrorPage;
