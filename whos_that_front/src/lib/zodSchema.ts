import { z } from "zod";

export const winLoseFlagTypeSchema = z.boolean().nullable();

export const endStateTypeSchema = z.enum([
    "",
    "correctGuess",
    "wrongGuess",
    "oppCorrectGuess",
    "oppWrongGuess",
]);

export const serverResponseSchema = z.object({
    message: z.string(),
});

export const socialSignInProvidersSchema = z.literal("discord");

export const acceptedImageTypesSchema = z.enum([
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/heic",
    "image/heif",
]);

