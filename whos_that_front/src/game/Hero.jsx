import { Link } from "react-router";

const Hero = () => {
    return (
        <header className="w-full border-b-3 border-black">
            <Link to={"/"}>
                <h1
                    id="title"
                    className="text-8xl font-bold mt-8 text-center text-amber-500 cursor-pointer drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)]
"
                >
                    Guess the Guy
                </h1>
            </Link>
        </header>
    );
};

export default Hero;
