import { requireAdmin } from "../middleware/authMw.ts";
import type { Express } from "express";
import { db } from "../config/connections.ts";
import { eq, not } from "drizzle-orm";
import * as schema from "../db/schema.ts";
import {
    getPrivacySettingAndImageIds,
    deleteImagesFromBucketAndCF,
    switchPrivacySettings,
} from "./apiHelpers.ts";
import { checkGameExists, validateGameId } from "../middleware/validatorMw.ts";
import { invalidateInAllCaches } from "./cache.ts";

/**
 * Sets up admin-only API routes for the Express application
 * @param app - Express application instance
 */
export function setupAdminRoutes(app: Express) {
    /**
     * Switches game privacy between public and private (admin override)
     * @returns Success status
     */
    app.put(
        "/api/admin/switchPrivacy/:gameId",
        requireAdmin,
        validateGameId,
        checkGameExists,
        async (req, res) => {
            const gameId = req.params.gameId;

            try {
                const gameWithItems = await getPrivacySettingAndImageIds(gameId);

                // Update privacy setting in db
                await db
                    .update(schema.games)
                    .set({
                        isPublic: not(schema.games.isPublic),
                    })
                    .where(eq(schema.games.id, gameId));

                // Move images in S3 between public/private folders
                const [{ isPublic, imageIds }] = gameWithItems;
                const newIsPublic = !isPublic;

                void switchPrivacySettings(gameId, isPublic, newIsPublic, imageIds);

                //del cache
                invalidateInAllCaches(gameId);

                console.log(`Admin switched privacy setting of game:`, gameId);
                return res.status(200).send();
                //Error handling ↓
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

    /**
     * Deletes a game and all associated images from S3 (admin override)
     * @returns Success message
     */
    app.delete(
        "/api/admin/deleteGame/:gameId",
        requireAdmin,
        validateGameId,
        checkGameExists,
        async (req, res) => {
            const gameId = req.params.gameId;
            try {
                const gameWithItems = await getPrivacySettingAndImageIds(gameId);

                // Delete game from db
                await db.delete(schema.games).where(eq(schema.games.id, gameId));

                // Delete images from S3 and CloudFront
                const [{ isPublic, imageIds }] = gameWithItems;
                await deleteImagesFromBucketAndCF(gameId, isPublic, imageIds);

                //del cache
                invalidateInAllCaches(gameId);

                console.log(`Admin deleted game:`, gameId);
                res.status(200).json({ message: `Deleted game: ${gameId}` });
                //Error handling ↓
            } catch (error) {
                console.error(`Error when admin attemped to delete game: ${gameId}:\n`, error);
                return res.status(500).json({
                    message: `Internal Server Error while attempting to delete game: ${gameId}.`,
                });
            }
        }
    );
}
