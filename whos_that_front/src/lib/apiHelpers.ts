import type { ServerResponse } from "./types.ts";
import env from "./zodEnvSchema.ts";

/**
 * Handles user liking and unliking games
 */
export const likeGame = async (gameId: string): Promise<void> => {
    //Request to like game on server
    const response = await fetch(`${env.VITE_SERVER_URL}/api/likeGame/${gameId}`, {
        credentials: "include",
        method: "PUT",
    });
    if (!response.ok) {
        const errorData = (await response.json()) as ServerResponse;
        throw new Error(errorData.message ?? "Failed to like game.");
    }
    return;
};
