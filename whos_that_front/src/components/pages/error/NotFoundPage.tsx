import { Link } from "react-router";
import whiteHatSpy from "@client/assets/404ErrorMan.webp";

const NotFoundPage = () => {
    return (
        <div className="flex w-full flex-col items-center justify-start bg-gradient-to-b from-cyan-400 to-cyan-600 to-90% bg-fixed">
            <div className="text-shadow-xs/100 m-auto mt-10 text-center text-2xl text-white">
                <img src={whiteHatSpy} alt="Not Found Image" className="mx-auto mb-10" />
                <h1 className="mb-5 text-5xl text-red-800">
                    404 <span className="text-white">Page Not Found</span>
                </h1>
                <Link to={"/"}>
                    <button className="w-fill h-18 border-b-9 border-x-1 text-shadow-xs active:shadow-2xs active:inset-shadow-md mt-[2vh] cursor-pointer rounded-md border-blue-600 bg-blue-500 px-4 py-1 text-2xl font-bold text-neutral-100 shadow-md hover:border-blue-700 hover:bg-blue-600 active:translate-y-[1px] active:border-none">
                        Take Me Home
                    </button>
                </Link>
            </div>
        </div>
    );
};

export default NotFoundPage;
