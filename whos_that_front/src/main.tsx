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
        errorElement: <ErrorPage error={undefined} />, //fix this before prod
        children: [
            {
                path: "/",
                element: <App />,
            },
            { path: "/play-game", element: <GameStateManager newGame={true} /> },
            {
                path: "/play-game/:joinGameId",
                element: <GameStateManager newGame={false} />,
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
