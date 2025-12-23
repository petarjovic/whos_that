import { Link } from "react-router";
import whiteHatSpy from "@client/assets/404ErrorMan.webp";

/**
 * 404 Page for all unmatched routes
 */
const NotFoundPage = () => {
    return (
        <div className="flex w-full flex-col items-center justify-start from-cyan-400 to-cyan-600 to-90% bg-fixed pb-5">
            <div className="mx-auto mt-10 text-center text-2xl text-white">
                <div className="border border-neutral-400 bg-neutral-300 px-20 max-md:py-1 max-sm:w-19/20 md:py-3">
                    <img src={whiteHatSpy} alt="Not Found Image" className="mx-auto" />
                </div>
                <h1 className="my-5 font-semibold text-red-800 max-md:text-3xl md:text-4xl">
                    404 <span className="font-normal text-black">Page Not Found</span>
                </h1>
                <Link to={"/"}>
                    <button className="w-fill mt-[2vh] h-16 cursor-pointer rounded-md border-x border-b-9 border-blue-600 bg-blue-500 px-3 py-1 text-2xl font-bold text-neutral-100 shadow-sm/20 shadow-md transition-all duration-15 text-shadow-xs hover:border-blue-700 hover:bg-blue-600 hover:shadow-xs active:-translate-y-px active:border-none active:shadow-2xs">
                        Take Me Home
                    </button>
                </Link>
            </div>
        </div>
    );
};

export default NotFoundPage;
