//Zod validation for various types, shared with front-end code
//Types are determined by inferring from this schema (except for Socket.IO event types)
import { z } from "zod/v4";

export const nanoId21Schema = z.nanoid();
export const roomIdSchema = z.string().regex(/^[\w-]{6}$/i);
export const socketIdSchema = z.string().regex(/^[\w-]{20}$/);

export const searchQuerySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(50),
    q: z.string().optional(),
    sort: z.enum(["likes", "newest", "trending"]).default("trending"),
    priv: z.enum(["public", "private", "both"]).default("public"),
});

//Socket response not htttp
export const responseTypeSchema = z.object({
    success: z.boolean(),
    msg: z.string(),
});

export const EndStateSchema = z.record(socketIdSchema, z.boolean().nullable());

export const roomStateSchema = z
    .object({
        id: z.union([roomIdSchema, z.literal("")]),
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
    gameItemId: z.nanoid(),
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
                name: z.string().trim().min(1).max(25),
            })
        )
        .min(6)
        .max(36)
        .refine(
            (items) =>
                new Set(items.map((item) => item.name.toLowerCase().trim())).size === items.length,
            {
                message: "All character names must be unique.",
            }
        ),
});

export const createGameResponseSchema = z.object({
    gameId: z.nanoid(),
    gameItems: z.record(
        z.string(),
        z.object({
            signedUrl: z.string(),
            itemId: z.nanoid(),
        })
    ),
});

export const createRoomParamsSchema = z.object({
    gameId: z.nanoid(),
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
    imageId: z.nanoid(),
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

export const feedbackSchema = z.object({
    type: z.enum(["Bug", "FeatureReq", "Other"]),
    message: z.string().min(1).max(2000),
    url: z.url().optional(),
    userAgent: z.string().max(500).optional(),
});

// ── Daily-related schemas ────────────────────────────────────────────────────────────
export const dailyGameInfoSchema = z.object({
    gameId: z.nanoid(),
    orderIndex: z.number().int(),
});

export const dailyQuestionSchema = z.object({
    question: z.string().min(5).max(200),
});

export const aiGuessRequestSchema = z.object({
    sessionId: z.nanoid(),
    guess: z.string().min(1).max(100),
});

export const aiScheduleDailyRequestSchema = z.object({
    name: z.string().min(1).max(100),
    wikiText: z.string().min(1).max(100000),
    gameId: z.nanoid(),
    scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD"),
});

export const aiDailyResponseSchema = z.object({
    sessionId: z.nanoid(),
    gameId: z.nanoid(),
    date: z.string(),
});

export const aiAskResponseSchema = z.object({
    answer: z.string(),
    questionsRemaining: z.number().int(),
});

export const aiGuessResponseSchema = z.object({
    correct: z.boolean(),
    characterName: z.string(),
    questionsUsed: z.number().int(),
});
