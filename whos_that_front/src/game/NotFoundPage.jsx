import { Link } from "react-router";

const NotFoundPage = () => {
    return (
        <div className="flex flex-col items-center justify-start py-[25vh] min-h-screen min-w-screen">
            <h1 className="font-medium text-2xl">Page Not Found ❌</h1>
            <Link to={"/"}>
                <button className="mt-[2vh] border-2 border-zinc-950 text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium  text-sm px-4 py-2 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800">
                    Home Page
                </button>
            </Link>
        </div>
    );
};

export default NotFoundPage;
