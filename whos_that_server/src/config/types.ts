import * as zod from "./zod/zodSchema";
import { z } from "zod";

export type ResponseType = z.infer<typeof zod.responseTypeSchema>;
export type GameStateType = z.infer<typeof zod.gameStateTypeSchema>;
export type CardDataIdType = z.infer<typeof zod.cardDataIdTypeSchema>;
export type CardDataUrlType = z.infer<typeof zod.cardDataUrlTypeSchema>;
export type GameDataType = z.infer<typeof zod.gameDataTypeSchema>;
export interface ServerToClientEvents {
    playerJoined: (gameData: GameStateType) => void;
    receiveOppGuess: (oppGuess: boolean) => void;
    opponentDisconnted: (gameData: GameStateType) => void;
    playAgainConfirmed: (gameData: GameStateType) => void;
    errorMessage: (data: { message: string }) => void;
}

export interface ClientToServerEvents {
    createGame: (
        preset: string,
        numOfChars: number,
        ack: (id: string, response: ResponseType) => void
    ) => void;
    joinGame: (
        roomId: string,
        ack: (gameData: GameStateType, response: ResponseType) => void
    ) => void;
    guess: (roomId: string, guessCorrectness: boolean) => void;
    playAgain: (roomId: string) => void;
}

export type CreateGameRequest = z.infer<typeof zod.createGameRequestSchema>;
export type CreateGameResponse = z.infer<typeof zod.createGameResponseSchema>;
export type PresetInfo = z.infer<typeof zod.PresetInfoSchema>;
