import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import GameStateManager from "./logic/GameStateManger.tsx";
import { createBrowserRouter, RouterProvider } from "react-router";
import ReactModal from "react-modal";
import "./index.css";
import HomePage from "./pages/HomePage.tsx";
import NotFoundPage from "./pages/NotFoundPage.tsx";
import Layout from "./layouts/Layout.tsx";
import ErrorPage from "./pages/ErrorPage.tsx";
import GameTypePage from "./pages/GameTypePage.tsx";
import CreateCustomGamePage from "./pages/CustomGamePage.tsx";
import * as Actions from "./logic/Actions.tsx";

ReactModal.setAppElement("#root");

const router = createBrowserRouter([
    {
        path: "/",
        element: <Layout />,
        children: [
            {
                path: "/",
                element: <HomePage />,
                errorElement: <ErrorPage error={undefined} />, //improve before prod
            },
            {
                path: "/create-game",
                element: <GameTypePage />,
                errorElement: <ErrorPage error={undefined} />, //improve before prod
            },
            {
                path: "/create-game/new",
                element: <CreateCustomGamePage />,
                errorElement: <ErrorPage error={undefined} />, //improve before prod
                children: [
                    {
                        path: "/create-game/new/uploadImageAction",
                        action: Actions.uploadImageAction,
                    },
                ],
            },
            {
                path: "/play-game",
                element: <GameStateManager newGame={true} />,
                errorElement: <ErrorPage error={undefined} />, //improve before prod
            },
            {
                path: "/play-game/:joinGameId",
                element: <GameStateManager newGame={false} />,
                errorElement: <ErrorPage error={undefined} />, //improve before prod
            },
            { path: "*", element: <NotFoundPage /> },
        ],
    },
]);

const rootElement = document.getElementById("root");
if (!rootElement) {
    throw new Error("Failed to find root element, DOM rapture has occured.");
}

createRoot(rootElement).render(
    <StrictMode>
        <RouterProvider router={router} />
    </StrictMode>
);
