import { Link } from "react-router";
import Hero from "./Hero.jsx";

const App = () => {
    return (
        <div
            id="flexContainer"
            className="flex flex-col items-center justify-start bg-gradient-to-br to-blue-500 from-cyan-200 bg-fixed min-h-screen w-full"
        >
            <Hero />
            <main>
                <Link to={"/play-game"}>
                    <button className="mt-30 bg-blue-500 font-bold text-white border-2 border-zinc-950 py-2 px-4">
                        Play Game
                    </button>
                </Link>
            </main>
        </div>
    );
};

export default App;
