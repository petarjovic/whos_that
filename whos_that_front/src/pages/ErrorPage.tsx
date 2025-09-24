import { Link, useRouteError } from "react-router";

const ErrorPage = ({ error = null }: { error: unknown }) => {
    const routeError = useRouteError();
    if (error === null && routeError) {
        console.error(routeError);
    } else if (error !== null) {
        console.error(error);
    } else {
        console.error(
            "I have no idea how this state could be reached. Panic. All possible errors:",
            routeError,
            error
        );
    }

    return (
        <>
            <h1 className="my-20 text-2xl font-bold">
                Oh No! There was some sort of error 😞 The server might be down or the spagetthi
                code might be acting up. Click below to maybe restart. ❌
            </h1>
            <Link to={"/"}>
                <button className="w-fill h-18 border-b-9 border-x-1 text-shadow-xs active:shadow-2xs active:inset-shadow-md mt-[2vh] cursor-pointer rounded-md border-blue-600 bg-blue-500 px-4 py-1 text-2xl font-bold text-neutral-100 shadow-md hover:border-blue-700 hover:bg-blue-600 active:translate-y-[1px] active:border-none">
                    Home Page
                </button>
            </Link>
        </>
    );
};
export default ErrorPage;
