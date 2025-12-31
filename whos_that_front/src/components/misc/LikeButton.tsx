import { useBetterAuthSession } from "../../lib/hooks.ts";
import env from "../../lib/zodEnvSchema";
import { logError } from "../../lib/logger";
import { useState } from "react";
import { FaHeart } from "react-icons/fa6";
import { serverResponseSchema } from "../../lib/zodSchema.ts";
import { useNavigate } from "react-router";

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
    const nav = useNavigate();
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
                    const errorData = serverResponseSchema.safeParse(await response.json());
                    setErrorMsg(errorData.data?.message ?? "Failed to like game.");
                }
                if (liked && likeNumber > 0) setLikeNumber((prev) => prev - 1);
                else if (likeNumber >= 0) setLikeNumber((prev) => prev + 1);
                setLiked((prev) => !prev);
                return;
            } catch (error) {
                logError(error);
                setErrorMsg(error instanceof Error ? error.message : "Failed to like game.");
            }
        } else {
            void nav("/login");
        }
    };

    if (errorMsg) throw new Error(errorMsg);
    return (
        <button
            className="flex cursor-pointer items-center align-sub text-sm font-medium whitespace-pre-wrap"
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                void handleLikeGame(id);
            }}
            title={liked ? "Unlike Game" : "Like Game"}
        >
            {likeNumber >= 0 ? likeNumber : ""}
            <FaHeart
                size={size === "S" ? "1.4em" : "2em"}
                className={`${
                    liked ? "text-red-600" : "text-zinc-500"
                } md:mb-px ${likeNumber >= 0 ? "ml-0.5" : ""} align-middle leading-none transition-transform hover:scale-120 hover:text-red-400 active:scale-90 max-md:mb-0.5 max-md:text-base`}
            />
        </button>
    );
};
export default LikeButton;
