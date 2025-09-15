import { Outlet } from "react-router";
import Hero from "./Hero.tsx";

const Layout = () => {
    return (
        <>
            <div
                id="flexContainer"
                className="flex flex-col items-center justify-start bg-gradient-to-b to-cyan-600 from-cyan-500 bg-fixed min-h-screen w-full"
            >
                <Hero />
                <Outlet />
            </div>
        </>
    );
};
export default Layout;
