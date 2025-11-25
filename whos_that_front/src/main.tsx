import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import GameStateManager from "./components/game/GameStateManager.tsx";
import { createBrowserRouter, RouterProvider } from "react-router";
import MyGamesPage from "./components/pages/MyGamesPage.tsx";
import ReactModal from "react-modal";
import "./index.css";
import HomePage from "./components/pages/HomePage.tsx";
import NotFoundPage from "./components/pages/error/NotFoundPage.tsx";
import Layout from "./components/layout/Layout.tsx";
import ErrorPage from "./components/pages/error/ErrorPage.tsx";
import SearchPage from "./components/pages/SearchPage.tsx";
import CreateCustomGamePage from "./components/pages/CustomGamePage.tsx";
import AccountPage from "./components/pages/AccountPage.tsx";
import SetUsernamePage from "./components/pages/SetUsernamePage.tsx";
import LogInPage from "./components/auth/LogInPage.tsx";
import AdminPage from "./components/pages/AdminPage.tsx";

ReactModal.setAppElement("#root");

const router = createBrowserRouter([
    {
        path: "/",
        element: <Layout />,
        errorElement: <ErrorPage />,
        children: [
            {
                path: "/",
                element: <HomePage />,
            },
            // {
            //     path: "/create-game",
            //     element: <GameTypePage />,
            // },
            {
                path: "/create-game",
                element: <CreateCustomGamePage />,
            },
            {
                path: "/play-game",
                element: <GameStateManager isNewGame={true} />,
            },
            {
                path: "/play-game/:joinGameId",
                element: <GameStateManager isNewGame={false} />,
            },
            {
                path: "/search",
                element: <SearchPage />,
            },
            {
                path: "/my-games",
                element: <MyGamesPage />,
            },
            {
                path: "/account",
                element: <AccountPage />,
            },
            {
                path: "/login",
                element: <LogInPage />,
            },
            // {
            //     path: "/sign-up",
            //     element: <SignUpPage />,
            // },
            {
                path: "/set-username",
                element: <SetUsernamePage />,
            },
            { path: "/admin", element: <AdminPage /> },
            { path: "*", element: <NotFoundPage /> },
        ],
    },
    {
        path: "/error",
        element: <ErrorPage />,
    },
]);

const rootElement = document.querySelector("#root");
if (!rootElement) {
    throw new Error("Failed to find root element, DOM rapture has occured.");
}

createRoot(rootElement).render(
    <StrictMode>
        <RouterProvider router={router} />
    </StrictMode>
);
