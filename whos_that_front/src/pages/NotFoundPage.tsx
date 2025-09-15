import { Link } from "react-router";

const NotFoundPage = () => {
    return (
        <>
            <h1 className="my-20 font-bold text-2xl">Page Not Found ❌</h1>
            <Link to={"/"}>
                <button className="mx-4 px-4 w-fill h-15 text-2xl text-neutral-100 font-bold border-b-9 border-x-1 border-blue-600 bg-blue-500 hover:bg-blue-600 hover:border-blue-700 rounded-md cursor-pointer shadow-md text-shadow-xs active:border-none active:translate-y-[1px] active:shadow-2xs  active:inset-shadow-md">
                    Home Page
                </button>
            </Link>
        </>
    );
};

export default NotFoundPage;
