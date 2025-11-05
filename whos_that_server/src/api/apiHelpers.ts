import { DeleteObjectsCommand, CopyObjectCommand } from "@aws-sdk/client-s3";
import { CreateInvalidationCommand } from "@aws-sdk/client-cloudfront";
import { sql, eq, not } from "drizzle-orm";
import { db, s3, S3_BUCKET_NAME, USE_CLOUDFRONT, cloudFront } from "../config/connections.ts";
import type { CardDataIdType, CardDataUrlType } from "../config/types.ts";
import * as schema from "../db/schema.ts";
import { nanoid } from "nanoid";
import env from "../config/zod/zodEnvSchema.ts";

export const constructS3ImageKey = (
    isPublic: boolean,
    gameId: string,
    gameItemId: string
): string => {
    const privacyStr = isPublic ? "public" : "private";
    return `premadeGames/${privacyStr}/${gameId}/${gameItemId}`;
};

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

export const cardDataIdToUrl = (
    cardDataIdList: CardDataIdType[],
    isPublic: boolean,
    gameId: string
): CardDataUrlType[] => {
    return cardDataIdList.map(({ name, orderIndex, gameItemId }) => {
        return {
            name,
            orderIndex,
            imageUrl: constructImageUrl(isPublic, gameId, gameItemId),
        };
    });
};

export async function getGameWithItems(gameId: string) {
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

export async function deleteImagesFromBucketAndCF(
    gameId: string,
    isPublic: boolean,
    imageIds: string[]
) {
    if (imageIds.length > 0 && imageIds[0]) {
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

export async function switchPrivacySettings(
    gameId: string,
    oldIsPublic: boolean,
    newIsPublic: boolean,
    imageIds: string[]
) {
    if (imageIds.length > 0 && imageIds[0]) {
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
            deleteImagesFromBucketAndCF(gameId, oldIsPublic, imageIds);
        }
    }
}
