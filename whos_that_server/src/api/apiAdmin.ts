import { requireAdmin } from "../middleware/authMw.ts";
import type { Express } from "express";
import { db } from "../config/connections.ts";
import { eq, not, and } from "drizzle-orm";
import * as schema from "../db/schema.ts";
import * as authSchema from "../db/auth-schema.ts";
import {
    getGameWithItems,
    deleteImagesFromBucketAndCF,
    switchPrivacySettings,
    constructImageUrl,
} from "./apiHelpers.ts";
import { checkGameExists, validateGameId } from "../middleware/validatorMw.ts";
import type { PresetInfo } from "../config/types.ts";

export function setupAdminRoutes(app: Express) {
    app.get("/api/admin/listAllGames", requireAdmin, async (req, res) => {
        try {
            const allGamesInfo = await db
                .select({
                    id: schema.games.id,
                    title: schema.games.title,
                    isPublic: schema.games.isPublic,
                    author: authSchema.user.displayUsername,
                    coverImageId: schema.gameItems.id,
                })
                .from(schema.games)
                .leftJoin(authSchema.user, eq(authSchema.user.id, schema.games.userId))
                .leftJoin(
                    schema.gameItems,
                    and(
                        eq(schema.gameItems.gameId, schema.games.id),
                        eq(schema.gameItems.orderIndex, 0)
                    )
                );

            const allGamesInfoUrl: PresetInfo = allGamesInfo.map(
                ({ id, title, isPublic, author, coverImageId }) => {
                    return {
                        id,
                        title,
                        author,
                        isPublic,
                        imageUrl: constructImageUrl(isPublic, id, coverImageId ?? ""),
                    };
                }
            );

            return res.status(200).send(allGamesInfoUrl);
        } catch (error) {
            console.error("Error when admin attempted to list all games:\n", error);
            return res.status(500).json({
                message: "Internal Server Error while attempting to list all games.",
            });
        }
    });

    app.put(
        "/api/admin/switchPrivacy/:gameId",
        requireAdmin,
        validateGameId,
        checkGameExists,
        async (req, res) => {
            const gameId = req.params.gameId;

            try {
                const gameWithItems = await getGameWithItems(gameId);

                await db
                    .update(schema.games)
                    .set({
                        isPublic: not(schema.games.isPublic),
                    })
                    .where(eq(schema.games.id, gameId));

                const [{ isPublic, imageIds }] = gameWithItems;
                const newIsPublic = !isPublic;

                void switchPrivacySettings(gameId, isPublic, newIsPublic, imageIds);

                console.log(`Admin switched privacy setting of game:`, gameId);
                return res.status(200).send();
            } catch (error) {
                console.error(
                    `Error when admin attempted to switch privacy setting of game: ${gameId}:\n`,
                    error
                );
                return res.status(500).json({
                    message: `Internal Server Error while attempting to switch privacy setting of game: ${gameId}.`,
                });
            }
        }
    );

    app.delete(
        "/api/admin/deleteGame/:gameId",
        requireAdmin,
        validateGameId,
        checkGameExists,
        async (req, res) => {
            const gameId = req.params.gameId;
            try {
                const gameWithItems = await getGameWithItems(gameId);

                await db.delete(schema.games).where(eq(schema.games.id, gameId));

                console.log(`Admin deleted game:`, gameId);
                res.status(200).json({ message: `Deleted game: ${gameId}` });

                const [{ isPublic, imageIds }] = gameWithItems;
                await deleteImagesFromBucketAndCF(gameId, isPublic, imageIds);
            } catch (error) {
                console.error(`Error when admin attemped to delete game: ${gameId}:\n`, error);
                return res.status(500).json({
                    message: `Internal Server Error while attempting to delete game: ${gameId}.`,
                });
            }
        }
    );
}
