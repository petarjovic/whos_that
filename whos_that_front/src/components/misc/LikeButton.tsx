import { useBetterAuthSession } from "../../lib/hooks.ts";
import env from "../../lib/zodEnvSchema";
import type { ServerResponse } from "../../lib/types";
import { logError } from "../../lib/logger";
import { useState } from "react";
import { FaHeart } from "react-icons/fa6";

const LikeButton = ({
    id,
    userHasLiked,
    numLikes,
    size = "S",
}: {
    id: string;
    userHasLiked: boolean | null;
    numLikes: number;
    size?: "S" | "L";
}) => {
    const { session, isPending } = useBetterAuthSession();
    const [liked, setLiked] = useState(userHasLiked);
    const [likeNumber, setLikeNumber] = useState(numLikes);
    const [errorMsg, setErrorMsg] = useState("");

    /**
     * Handles user liking and unliking games, does nothing if user not logged in
     */
    const handleLikeGame = async (gameId: string) => {
        if (session && !isPending) {
            try {
                const response = await fetch(`${env.VITE_SERVER_URL}/api/likeGame/${gameId}`, {
                    credentials: "include",
                    method: "PUT",
                });
                if (!response.ok) {
                    //REDO THIS
                    const errorData = (await response.json()) as ServerResponse;
                    throw new Error(errorData.message ?? "Failed to like game.");
                }
                if (liked && likeNumber > 0) setLikeNumber((prev) => prev - 1);
                else if (likeNumber >= 0) setLikeNumber((prev) => prev + 1);
                setLiked((prev) => !prev);
                return;
            } catch (error) {
                logError(error);
                setErrorMsg(error instanceof Error ? error.message : "Failed to like game.");
            }
        }
    };

    if (errorMsg) throw new Error(errorMsg);
    return (
        <button
            className="flex cursor-pointer items-center whitespace-pre-wrap align-sub"
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleLikeGame(id);
            }}
            title={liked ? "Unlike Game" : "Like Game"}
        >
            {likeNumber !== -1 ? likeNumber : ""}
            <FaHeart
                size={size === "S" ? "1.35em" : "2em"}
                className={`${
                    liked ? "text-red-500" : "text-zinc-500"
                } mb-px ${numLikes !== null ? "ml-0.5" : ""} align-middle leading-none transition-transform hover:text-red-300 max-md:text-xl`}
            />
        </button>
    );
};
export default LikeButton;
