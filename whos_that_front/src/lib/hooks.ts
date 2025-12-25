import { useOutletContext } from "react-router";
import type { AuthData } from "./auth/auth-client";
import env from "./zodEnvSchema";
import { serverResponseSchema } from "./zodSchema";
import { logError } from "./logger";

//Get auth/session data from layout context throughout frontend
export function useBetterAuthSession(): AuthData {
    return useOutletContext<AuthData>();
}

//Fetch whether or not current user has liked a game
//Should only be called after a session check, but api does handle no session
export const fetchLikeInfo = async (gameId: string): Promise<boolean | null> => {
    try {
        const response: Response = await fetch(
            `${env.VITE_SERVER_URL}/api/userHasLiked/${gameId}`,
            { method: "GET", credentials: "include" }
        );

        if (!response.ok) {
            const errorData = serverResponseSchema.parse(await response.json());
            throw new Error(errorData.message || "Getting like data failed.");
        } else {
            return Boolean(await response.json()); //Boolean wrap is just-in-case
        }
    } catch (error) {
        logError(error);
        return null; //assume user not signed-in/session corruption
    }
};
