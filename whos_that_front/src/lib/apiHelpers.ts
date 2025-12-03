import env from "./zodEnvSchema.ts";

/**
 * Handles user liking and unliking games
 */
export const likeGame = async (gameId: string): Promise<Response> => {
    //Request to like game on server
    return await fetch(`${env.VITE_SERVER_URL}/api/likeGame/${gameId}`, {
        credentials: "include",
        method: "PUT",
    });
};
