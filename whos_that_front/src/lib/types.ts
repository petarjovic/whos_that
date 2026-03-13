import { z } from "zod";
import * as zod from "./zodSchema.ts";

export type winLoseFlagType = z.infer<typeof zod.winLoseFlagTypeSchema>;

export type ServerResponse = z.infer<typeof zod.serverResponseSchema>;

export type SocialSignInProviders = z.infer<typeof zod.socialSignInProvidersSchema>;

export type ChatMessage = z.infer<typeof zod.chatMessageSchema>;

export type DailyProgress = z.infer<typeof zod.dailyProgressSchema>;
