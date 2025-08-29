import { Link, useRouteError } from "react-router";

const ErrorPage = ({ error = null }: { error: unknown }) => {
    const routeError = useRouteError();
    if (error === null && routeError) {
        console.error(routeError);
    } else if (error !== null) {
        console.error(error);
    } else {
        console.error(
            "I have no idea how this state could be reached. Panic. All possible errors: ",
            routeError,
            error
        );
    }

    return (
        <>
            <h1 className="my-20 font-bold text-2xl">
                Oh No! There was some sort of error 😞 The server might be down or the spagetthi
                code might be acting up. Click below to maybe restart. ❌
            </h1>
            <Link to={"/"}>
                <button className="mt-[2vh] px-4 py-1 w-fill h-18 text-2xl text-neutral-100 font-bold border-b-9 border-x-1 border-blue-600 bg-blue-500 hover:bg-blue-600 hover:border-blue-700 rounded-md cursor-pointer shadow-md text-shadow-xs active:border-none active:translate-y-[1px] active:shadow-2xs  active:inset-shadow-md ">
                    Home Page
                </button>
            </Link>
        </>
    );
};
export default ErrorPage;
