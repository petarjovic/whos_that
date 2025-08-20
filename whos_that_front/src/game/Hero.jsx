import { Link } from "react-router";

const Hero = () => {
    return (
        <header className="rounded-b-[50%] bg-radial from-blue-400 to-blue-600 w-full border-b-5 border-blue-900">
            <h1 className="mt-8 text-center h-fit w-fit m-auto">
                <Link
                    to={"/"}
                    reloadDocument={true}
                    id="title"
                    className="text-8xl font-bold text-amber-500 hover:text-amber-600 cursor-pointer drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)]"
                >
                    Guess the Guy
                </Link>
            </h1>
        </header>
    );
};

export default Hero;
