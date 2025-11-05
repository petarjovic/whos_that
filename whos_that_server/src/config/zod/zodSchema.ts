import { z } from "zod";

export const nanoId21Schema = z.string().regex(/^[\w-]{21}$/i);
export const roomIdSchema = z.string().regex(/^[\w-]{6}$/i);

export const responseTypeSchema = z.object({
    success: z.boolean(),
    msg: z.string(),
});

export const gameStateTypeSchema = z.object({
    players: z.tuple([z.string(), z.string()]),
    cardIdsToGuess: z.tuple([z.number(), z.number()]),
    playAgainReqs: z.tuple([z.boolean(), z.boolean()]),
    preset: nanoId21Schema,
    numOfChars: z.number(),
});

const cardDataTypeSchema = z.object({
    name: z.string(),
    orderIndex: z.number(),
});

export const cardDataIdTypeSchema = cardDataTypeSchema.extend({
    gameItemId: nanoId21Schema,
});

export const cardDataUrlTypeSchema = cardDataTypeSchema.extend({
    imageUrl: z.string(),
});

export const gameDataTypeSchema = z.object({
    title: z.string(),
    cardData: z.array(cardDataUrlTypeSchema),
});

export const createGameRequestSchema = z.object({
    title: z.string().max(50),
    privacy: z.union([z.literal("public"), z.literal("private")]),
    namesAndFileTypes: z
        .array(
            z.object({
                type: z.enum(["image/jpeg", "image/png", "image/webp"]),
                name: z.string().max(50),
            })
        )
        .min(6)
        .max(50),
});

export const createGameResponseSchema = z.object({
    gameId: nanoId21Schema,
    gameItems: z.record(
        z.string(),
        z.object({
            signedUrl: z.string(),
            itemId: nanoId21Schema,
        })
    ),
});

export const createRoomParamsSchema = z.object({
    preset: nanoId21Schema,
    numOfChars: z.number().int().min(6).max(50),
});

export const PresetInfoSchema = z.array(
    z.object({
        title: z.string(),
        id: z.string(),
        author: z.string().nullable(),
        imageUrl: z.string(),
        isPublic: z.boolean(),
        numLikes: z.number(),
        userHasLiked: z.boolean().nullable(),
    })
);
