import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router";
import "./index.css";
import App from "./App.jsx";
import Game from "./game/Game.jsx";
import NotFoundPage from "./game/NotFoundPage.jsx";

const router = createBrowserRouter([
    { path: "/", element: <App /> },
    { path: "/play-game", element: <Game /> },
    { path: "*", element: <NotFoundPage /> },
]);

createRoot(document.getElementById("root")).render(
    <StrictMode>
        <RouterProvider router={router} />
    </StrictMode>
);
