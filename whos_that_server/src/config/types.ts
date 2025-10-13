import * as zod from "./zod/zodSchema.ts";
import z from "zod";

export type ResponseType = z.infer<typeof zod.responseTypeSchema>;
export type GameStateType = z.infer<typeof zod.gameStateTypeSchema>;
export type CardDataIdType = z.infer<typeof zod.cardDataIdTypeSchema>;
export type CardDataUrlType = z.infer<typeof zod.cardDataUrlTypeSchema>;
export type GameDataType = z.infer<typeof zod.gameDataTypeSchema>;
export type ServerToClientEvents = z.infer<typeof zod.serverToClientEventsSchema>;
export type ClientToServerEvents = z.infer<typeof zod.clientToServerEventsSchema>;
export type CreateGameRequest = z.infer<typeof zod.createGameRequestSchema>;
export type CreateGameResponse = z.infer<typeof zod.createGameResponseSchema>;
