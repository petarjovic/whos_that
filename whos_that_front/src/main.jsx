import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import GameStateManager from "./game/GameStateManger.jsx";
import { createBrowserRouter, RouterProvider } from "react-router";
import "./index.css";
import App from "./App.jsx";
import NotFoundPage from "./NotFoundPage.jsx";
import Layout from "./Layout.jsx";

const router = createBrowserRouter([
    {
        path: "/",
        element: <Layout />,
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

createRoot(document.getElementById("root")).render(
    <StrictMode>
        <RouterProvider router={router} />
    </StrictMode>
);
