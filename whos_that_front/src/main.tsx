import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import GameStateManager from "./game/GameStateManger.js";
import { createBrowserRouter, RouterProvider } from "react-router";
import "./index.css";
import App from "./App.js";
import NotFoundPage from "./NotFoundPage.js";
import Layout from "./Layout.js";
import ErrorPage from "./ErrorPage.js";

const router = createBrowserRouter([
    {
        path: "/",
        element: <Layout />,
        children: [
            {
                path: "/",
                element: <App />,
                errorElement: <ErrorPage error={undefined} />, //improve before prod
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
