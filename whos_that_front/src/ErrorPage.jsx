import { Link } from "react-router";

const ErrorPage = ({ error }) => {
    //let error = useRouteError();
    console.error(error);

    return (
        <>
            <h1 className="my-20 font-bold text-2xl">
                Oh No! There was some sort of error 😞 The server might be down or the spagetthi
                code might be acting up. Click below to maybe restart. ❌
            </h1>
            <Link to={"/"}>
                <button className="mt-[2vh] border-2 border-zinc-950 text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-bold  text-sm px-4 py-2 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800">
                    Home Page
                </button>
            </Link>
        </>
    );
};
export default ErrorPage;
