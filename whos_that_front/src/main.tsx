import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import GameStateManager from "./logic/GameStateManager.tsx";
import { createBrowserRouter, RouterProvider } from "react-router";
import ShowPremadeGamesPage from "./pages/ShowPremadeGamesPage.tsx";
import ReactModal from "react-modal";
import "./index.css";
import HomePage from "./pages/HomePage.tsx";
import NotFoundPage from "./pages/NotFoundPage.tsx";
import Layout from "./layouts/Layout.tsx";
import ErrorPage from "./pages/ErrorPage.tsx";
import GameTypePage from "./pages/GameTypePage.tsx";
import CreateCustomGamePage from "./pages/CustomGamePage.tsx";
// import SignUpPage from "./pages/SignUpPage.tsx";
// import SignInPage from "./pages/SignInPage.tsx";
import AccountPage from "./pages/AccountPage.tsx";
import SetUsernamePage from "./pages/SetUsernamePage.tsx";
import LogInPage from "./pages/LogInPage.tsx";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage.tsx";

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
            {
                path: "/create-game",
                element: <GameTypePage />,
            },
            {
                path: "/create-game/new",
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
                path: "/premade-games",
                element: <ShowPremadeGamesPage myGames={false} />,
            },
            {
                path: "/my-games",
                element: <ShowPremadeGamesPage myGames={true} />,
            },
            {
                path: "/account",
                element: <AccountPage />,
            },
            {
                path: "/log-in",
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
            // { path: "/privacy", element: <PrivacyPolicyPage /> },
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

