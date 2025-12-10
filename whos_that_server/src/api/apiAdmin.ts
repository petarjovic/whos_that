import { requireAdmin } from "../middleware/authMw.ts";
import type { Express } from "express";
import { db, USE_CLOUDFRONT } from "../config/connections.ts";
import { eq, not, and } from "drizzle-orm";
import * as schema from "../db/schema.ts";
import * as authSchema from "../db/auth-schema.ts";
import {
    getPrivacySettingAndImageIds,
    deleteImagesFromBucketAndCF,
    switchPrivacySettings,
    constructImageUrl,
} from "./apiHelpers.ts";
import { getSignedUrl as getSignedCFUrl } from "@aws-sdk/cloudfront-signer";
import { checkGameExists, validateGameId } from "../middleware/validatorMw.ts";
import type { UrlPresetInfo } from "../config/types.ts";
import env from "../config/zod/zodEnvSchema.ts";
import { delGameDataCache } from "./cache.ts";

/**
 * Sets up admin-only API routes for the Express application
 * @param app - Express application instance
 */
export function setupAdminRoutes(app: Express) {
    /**
     * Retrieves all games (public and private) for admin review
     * @route GET /api/admin/listAllGames
     * @returns List of all games with cover images and metadata
     */
    app.get("/api/admin/listAllGames", requireAdmin, async (req, res) => {
        try {
            // Query all games with author and cover image
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

            // Populate response object with data for all games
            const allGamesInfoUrl: UrlPresetInfo[] = allGamesInfo.map(
                ({ id, title, isPublic, author, coverImageId }) => {
                    const imageUrl = constructImageUrl(isPublic, id, coverImageId!);
                    const signedUrlParams = {
                        url: imageUrl,
                        dateLessThan: new Date(Date.now() + 1000 * 60 * 60 * 24),
                        privateKey: env.AWS_CF_PRIV_KEY,
                        keyPairId: env.AWS_CF_KEY_PAIR_ID,
                    };
                    return {
                        id,
                        title,
                        author,
                        isPublic,
                        numLikes: -1,
                        userHasLiked: null,
                        imageUrl:
                            isPublic || !USE_CLOUDFRONT
                                ? imageUrl
                                : getSignedCFUrl(signedUrlParams),
                    };
                }
            );

            return res.status(200).send(allGamesInfoUrl);
            //Error handling ↓
        } catch (error) {
            console.error("Error when admin attempted to list all games:\n", error);
            return res.status(500).json({
                message: "Internal Server Error while attempting to list all games.",
            });
        }
    });

    /**
     * Switches game privacy between public and private (admin override)
     * @route PUT /api/admin/switchPrivacy/:gameId
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
                delGameDataCache(gameId);

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
     * @route DELETE /api/admin/deleteGame/:gameId
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
                delGameDataCache(gameId);

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
