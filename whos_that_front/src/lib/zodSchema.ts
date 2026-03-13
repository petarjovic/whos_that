//Zod schemas for validation, frontend types are inferred from this
import { z } from "zod";

export const winLoseFlagTypeSchema = z.boolean().nullable();

export const serverResponseSchema = z.object({
    message: z.string(),
});

export const socialSignInProvidersSchema = z.enum(["discord", "google"]);

export const acceptedImageTypesSchema = z.enum([
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/heic",
    "image/heif",
]);

export const chatMessageSchema = z.object({
    isUser: z.boolean(),
    msg: z.string(),
});

export const dailyProgressSchema = z.object({
    date: z.string(),
    messages: z.array(chatMessageSchema),
    numQuestionsLeft: z.number(),
    guessState: z.object({
        isWinner: z.boolean().optional(),
    }),
});

