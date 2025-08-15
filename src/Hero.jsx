import { Link } from "react-router";

const Hero = () => {
    return (
        <header className="w-full border-b-3 border-black">
            <Link to={"/"}>
                <h1
                    id="title"
                    className="text-6xl font-bold mt-8 text-center text-red-800 cursor-pointer"
                >
                    Guess the Guy
                </h1>
            </Link>
        </header>
    );
};

export default Hero;
