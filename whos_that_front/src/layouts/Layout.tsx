import { Outlet } from "react-router";
import Hero from "./Hero.tsx";

const Layout = () => {
    return (
        <>
            <div
                id="flexContainer"
                className="flex min-h-screen w-full flex-col items-center justify-start bg-gradient-to-b from-cyan-400 to-cyan-600 to-90% bg-fixed"
            >
                <Hero />
                <Outlet />
            </div>
        </>
    );
};
export default Layout;
