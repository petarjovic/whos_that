import { Link } from "react-router";

const NotFoundPage = () => {
    return (
        <>
            <h1 className="my-20 text-2xl font-bold">Page Not Found ❌</h1>
            <Link to={"/"}>
                <button className="w-fill h-15 border-b-9 border-x-1 text-shadow-xs active:shadow-2xs active:inset-shadow-md mx-4 cursor-pointer rounded-md border-blue-600 bg-blue-500 px-4 text-2xl font-bold text-neutral-100 shadow-md hover:border-blue-700 hover:bg-blue-600 active:translate-y-[1px] active:border-none">
                    Home Page
                </button>
            </Link>
        </>
    );
};

export default NotFoundPage;
