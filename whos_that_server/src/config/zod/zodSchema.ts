//Zod validation for various types, shared with front-end code
//Types are determined by inferring from this schema (except for Socket.IO event types)
import { z } from "zod/v4";

export const nanoId21Schema = z.string().regex(/^[\w-]{21}$/i);
export const roomIdSchema = z.string().regex(/^[\w-]{6}$/i);
export const socketIdSchema = z.string().regex(/^[\w-]{20}$/);

export const searchQuerySchema = z.object({
    q: z.string().max(100).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(30),
    sort: z.enum(["likes", "newest"]),
});

//Socket response not htttp
export const responseTypeSchema = z.object({
    success: z.boolean(),
    msg: z.string(),
});

export const EndStateSchema = z.record(socketIdSchema, z.boolean().nullable());

export const roomStateSchema = z
    .object({
        id: z.union([socketIdSchema, z.literal("")]),
        gameId: z.union([socketIdSchema, z.literal("")]),
        numOfChars: z.number(),
        players: z.array(socketIdSchema).max(2),
        curTurn: z.union([socketIdSchema, z.literal("")]),
        playAgainReqs: z.record(socketIdSchema, z.boolean()),
        cardIdsToGuess: z.record(socketIdSchema, z.number()),
        endState: EndStateSchema,
    })
    //Ensures all player/socket ids are in players array
    .refine((rs) => {
        const keys = [
            ...Object.keys(rs.playAgainReqs),
            ...Object.keys(rs.cardIdsToGuess),
            ...Object.keys(rs.endState),
        ];
        return (
            keys.every((k) => rs.players.includes(k)) &&
            (rs.players.includes(rs.curTurn) || rs.curTurn === "")
        );
    });

const cardDataTypeSchema = z.object({
    name: z.string(),
    orderIndex: z.number().int(),
});

export const cardDataIdSchema = cardDataTypeSchema.extend({
    gameItemId: nanoId21Schema,
});

export const cardDataUrlSchema = cardDataTypeSchema.extend({
    imageUrl: z.url(),
});

export const gameDataSchema = z.object({
    title: z.string(),
    cardData: z.array(cardDataUrlSchema),
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
    gameId: nanoId21Schema,
    numOfChars: z.number().int().min(6).max(50),
});

export const userHasLikedSchema = z.boolean().nullable();

const PresetInfoSchema = z.object({
    id: z.string(),
    title: z.string(),
    author: z.string().nullable(),
    isPublic: z.boolean(),
    numLikes: z.number(),
    userHasLiked: userHasLikedSchema,
});

export const IdPresetInfoSchema = PresetInfoSchema.extend({
    imageId: nanoId21Schema,
});

export const UrlPresetInfoSchema = PresetInfoSchema.extend({
    imageUrl: z.url(),
});

export const UrlPresetInfoListSchema = z.array(UrlPresetInfoSchema);

export const PaginationInfoSchema = z.object({
    page: z.number(),
    limit: z.number(),
    totalCount: z.number(),
    totalPages: z.number(),
});

export const SearchResponseSchema = z.object({
    games: UrlPresetInfoListSchema,
    pagination: PaginationInfoSchema,
});
