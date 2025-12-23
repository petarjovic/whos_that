import { Link, useRouteError, isRouteErrorResponse } from "react-router";
import chalkOutline from "@client/assets/ChalkOutline.svg";
import Hero from "../../layout/Hero.tsx";
import { useSearchParams } from "react-router";
import { logError } from "../../../lib/logger.ts";

/**
 * Generic error page that catches errors from multiple sources:
 * - Errors thrown in components
 * - URL search param errors (from OAuth redirects)
 * - Note: Error prop is now deprecated
 */
const ErrorPage = ({ error }: { error?: unknown }) => {
    let errorMessage = "";

    // Check all possible error sources
    const routeError = useRouteError();
    const [searchParams] = useSearchParams();
    const searchParamError = searchParams.get("error");

    if (routeError) logError(routeError);
    if (error) logError(error);
    if (searchParamError) logError(searchParamError);

    // Extract user-friendly error message from various error types
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
        <div className="flex min-h-screen w-full flex-col items-center justify-start bg-neutral-200 to-90% bg-fixed bg-repeat">
            <Hero session={null} isPending={false} showUserInfo={false} />
            <div className="mx-auto mt-15 text-center text-2xl text-shadow-2xs/100">
                <div className="mx-auto mb-1 border border-neutral-400 bg-neutral-300 px-20 pb-3 max-sm:w-19/20">
                    <img
                        src={chalkOutline}
                        alt="Error image"
                        className="mx-auto rotate-15"
                        width={325}
                        height={300}
                    />
                </div>
                <h1 className="mb-5 text-red-800 max-md:text-3xl md:text-4xl">
                    Something Went Wrong
                </h1>
                <h2>Oh No! {errorMessage}</h2>
                <Link to={"/"}>
                    <button className="w-fill mt-[2vh] h-16 cursor-pointer rounded-md border-x border-b-9 border-blue-600 bg-blue-500 px-3 py-1 text-2xl font-bold text-neutral-100 shadow-sm/20 transition-all duration-15 text-shadow-xs/40 hover:border-blue-700 hover:bg-blue-600 hover:shadow-xs active:translate-y-px active:border-none active:shadow-2xs">
                        Take Me Home
                    </button>
                </Link>
            </div>
        </div>
    );
};
export default ErrorPage;
