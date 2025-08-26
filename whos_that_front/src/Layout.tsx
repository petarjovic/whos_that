import { Outlet } from "react-router";
import Hero from "./game/Hero.js";

const Layout = () => {
    return (
        <>
            <div
                id="flexContainer"
                className="flex flex-col items-center justify-start bg-gradient-to-b to-cyan-500 from-cyan-400 bg-fixed min-h-screen w-full"
            >
                <Hero />
                <Outlet />
            </div>
        </>
    );
};
export default Layout;
