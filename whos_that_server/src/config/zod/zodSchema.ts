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

export const serverToClientEventsSchema = z.object({
    playerJoined: z.function({ input: [gameStateTypeSchema], output: z.void() }),
    recieveOppGuess: z.function({ input: [z.boolean()], output: z.void() }),
    opponentDisconnted: z.function({ input: [gameStateTypeSchema], output: z.void() }),
    playAgainConfirmed: z.function({ input: [gameStateTypeSchema], output: z.void() }),
    errorMessage: z.function({
        input: [
            z.object({
                message: z.string(),
            }),
        ],
        output: z.void(),
    }),
});

export const clientToServerEventsSchema = z.object({
    createGame: z.function({
        input: [
            z.string(),
            z.number(),
            z.function({ input: [z.string(), responseTypeSchema], output: z.void() }),
        ],
        output: z.void(),
    }),
    joinGame: z.function({
        input: [
            z.string(),
            z.function({ input: [gameStateTypeSchema, responseTypeSchema], output: z.void() }),
        ],
        output: z.void(),
    }),
    guess: z.function({ input: [z.string(), z.boolean()], output: z.void() }),
    playAgain: z.function({ input: [z.string()], output: z.void() }),
});

export const createGameRequestSchema = z.object({
    title: z.string().min(5).max(20),
    privacy: z.union([z.literal("public"), z.literal("private")]),
    namesAndFileTypes: z
        .array(
            z.object({
                type: z.enum(["image/jpeg", "image/png", "image/webp"]),
                name: z.string().min(5).max(20),
            })
        )
        .min(6)
        .max(50),
});

export const createGameResponseSchema = z.record(
    z.string(),
    z.object({
        signedUrl: z.string(),
        itemId: nanoId21Schema,
    })
);

export const createGameInputSchema = z.object({
    preset: nanoId21Schema,
    numOfChars: z.number().int().min(6).max(50),
});
