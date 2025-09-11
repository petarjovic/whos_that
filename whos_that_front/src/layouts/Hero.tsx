import { Link } from "react-router";

const Hero = () => {
    return (
        <header className="rounded-b-[50%] bg-radial from-blue-400 to-blue-600 w-full border-b-5 border-blue-900 ">
            <h1 className="mt-3 mb-5 text-center">
                <Link
                    to={"/"}
                    reloadDocument={true} //maybe not needed??
                    id="title"
                    className="font-digitag text-8xl font-bold text-amber-500 hover:text-amber-600 cursor-pointer drop-shadow-[0_5px_5px_rgba(0,0,0,0.7)]"
                >
                    Guess the Guy
                </Link>
                <Link
                    to={"/sign-up"}
                    reloadDocument={true} //maybe not needed??
                    className="absolute right-40 top-11 text-2xl font-bold text-white text-shadow-sm/25 hover:text-shadow-sm/90 active:translate-y-0.5"
                >
                    <span className="text-shadow-none text-2xl">👤</span> Sign Up
                </Link>
            </h1>
        </header>
    );
};

export default Hero;
