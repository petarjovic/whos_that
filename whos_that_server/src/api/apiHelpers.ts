import { DeleteObjectsCommand, CopyObjectCommand } from "@aws-sdk/client-s3";
import { CreateInvalidationCommand } from "@aws-sdk/client-cloudfront";
import { sql, eq, not } from "drizzle-orm";
import { db, s3, S3_BUCKET_NAME, USE_CLOUDFRONT, cloudFront } from "../config/connections.ts";
import type { CardDataId, CardDataUrl } from "../config/types.ts";
import * as schema from "../db/schema.ts";
import { nanoid } from "nanoid";
import env from "../config/zod/zodEnvSchema.ts";

/**
 * Constructs the S3 object key for a game image
 * @param isPublic - Whether the game is public or private
 * @param gameId - The game ID
 * @param gameItemId - The game item (image) ID
 * @returns S3 object key path
 */
export const constructS3ImageKey = (
    isPublic: boolean,
    gameId: string,
    gameItemId: string
): string => {
    const privacyStr = isPublic ? "public" : "private";
    return `premadeGames/${privacyStr}/${gameId}/${gameItemId}`;
};

/**
 * Constructs the full URL for a game image
 * @param isPublic - Whether the game is public or private
 * @param gameId - The game ID
 * @param gameItemId - The game item (image) ID
 * @returns Full image URL
 */
export const constructImageUrl = (
    isPublic: boolean,
    gameId: string,
    gameItemId: string
): string => {
    if (USE_CLOUDFRONT) {
        return `https://${env.AWS_CF_DOMAIN}/` + constructS3ImageKey(isPublic, gameId, gameItemId);
    } else {
        return (
            `https://${S3_BUCKET_NAME}.s3.${env.AWS_BUCKET_REGION}.amazonaws.com/` +
            constructS3ImageKey(isPublic, gameId, gameItemId)
        );
    }
};

/**
 * Converts character data lists with Ids to character data lists with Urls
 * @param gameId - The game ID
 * @param cardDataIdList - Array of card data with item IDs {name, orderIndex, imageId}[]
 * @param isPublic - Whether the game is public or private
 * @returns Array of card data with image URLs {name, orderIndex, imageUrl}[]
 */
export const cardDataIdToUrl = (
    gameId: string,
    isPublic: boolean,
    cardDataIdList: CardDataId[]
): CardDataUrl[] => {
    return cardDataIdList.map(({ name, orderIndex, gameItemId }) => {
        return {
            name,
            orderIndex,
            imageUrl: constructImageUrl(isPublic, gameId, gameItemId),
        };
    });
};

/**
 * Retrieves game's privacy setting and all associated image IDs
 * @param gameId - The game ID
 * @returns Array with game privacy status and image IDs
 */
export async function getPrivacySettingAndImageIds(gameId: string) {
    return await db
        .select({
            isPublic: schema.games.isPublic,
            imageIds: sql<string[]>`array_agg(${schema.gameItems.id})`,
        })
        .from(schema.games)
        .leftJoin(schema.gameItems, eq(schema.gameItems.gameId, schema.games.id))
        .where(eq(schema.games.id, gameId))
        .groupBy(schema.games.id);
}

/**
 * Deletes game's images from S3 bucket and invalidates CloudFront cache
 * @param gameId - The game ID
 * @param isPublic - Whether the game is public or private
 * @param imageIds - Array of image IDs to delete
 */
export async function deleteImagesFromBucketAndCF(
    gameId: string,
    isPublic: boolean,
    imageIds: string[]
) {
    if (imageIds.length > 0 && imageIds[0]) {
        // Delete images from S3
        const delS3ObjsCommand = new DeleteObjectsCommand({
            Bucket: S3_BUCKET_NAME,
            Delete: {
                Objects: imageIds.map((id) => ({
                    Key: constructS3ImageKey(isPublic, gameId, id),
                })),
            },
        });
        const s3DeleteResult = await s3.send(delS3ObjsCommand);
        if (s3DeleteResult.Errors) {
            console.error(
                "S3 batch delete had errors! There are likely orphaned items in S3 bucket:\n",
                s3DeleteResult.Errors
            );
        }

        // Invalidate CloudFront cache
        if (USE_CLOUDFRONT) {
            const cFCacheInvalidationCommand = new CreateInvalidationCommand({
                DistributionId: env.AWS_CF_DISTRIBUTION_ID,
                InvalidationBatch: {
                    CallerReference: nanoid(),
                    Paths: {
                        Quantity: 1,
                        Items: [`/premadeGames/${isPublic ? "public" : "private"}/${gameId}/*`],
                    },
                },
            });
            try {
                await cloudFront.send(cFCacheInvalidationCommand);
            } catch (cfError) {
                console.error("CloudFront cache invalidation failed:", cfError);
            }
        }
    }
}

/**
 * Moves game images between public and private folders in S3
 * @param gameId - The game ID
 * @param oldIsPublic - Current privacy status
 * @param newIsPublic - New privacy status
 * @param imageIds - Array of image IDs to move
 */
export async function switchPrivacySettings(
    gameId: string,
    oldIsPublic: boolean,
    newIsPublic: boolean,
    imageIds: string[]
) {
    if (imageIds.length > 0 && imageIds[0]) {
        // Copy images to new folder
        const s3ImageCopyingPromises = imageIds.map((imageId) => {
            const oldKey = constructS3ImageKey(oldIsPublic, gameId, imageId);
            const newKey = constructS3ImageKey(newIsPublic, gameId, imageId);
            return s3.send(
                new CopyObjectCommand({
                    Bucket: S3_BUCKET_NAME,
                    CopySource: `${S3_BUCKET_NAME}/${oldKey}`,
                    Key: newKey,
                })
            );
        });

        const copyResults = await Promise.allSettled(s3ImageCopyingPromises);

        // Attempt rollback if any copy operation failed
        if (copyResults.some((p) => p.status === "rejected")) {
            await s3.send(
                new DeleteObjectsCommand({
                    Bucket: S3_BUCKET_NAME,
                    Delete: {
                        Objects: imageIds.map((id) => ({
                            Key: constructS3ImageKey(newIsPublic, gameId, id),
                        })),
                    },
                })
            );
            await db
                .update(schema.games)
                .set({
                    isPublic: not(schema.games.isPublic),
                })
                .where(eq(schema.games.id, gameId));
            throw new Error("Not all copy operations succeeded, rollback was attempted.");
        } else {
            // Delete old images after successful copy
            await deleteImagesFromBucketAndCF(gameId, oldIsPublic, imageIds);
        }
    }
}
