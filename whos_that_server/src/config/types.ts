//File of custom types, many shared with front-end
import * as zod from "./zod/zodSchema";
import { z } from "zod/v4";

// SocketIO event interfaces could not be inferred from Zod schema because SocketIO would break
export interface ServerToClientEvents {
    updateRoomState: (gameState: RoomState) => void;
    updateTurnOnly: (payload: { curTurn: string }) => void;
    opponentDisconnected: (gameState: RoomState) => void;
    errorMessage: (payload: { message: string }) => void;
}

export interface ClientToServerEvents {
    createRoom: (
        preset: string,
        numOfChars: number,
        ack: (id: string, response: SocketResponse) => void
    ) => void;
    joinRoom: (roomId: string) => void;
    passTurn: (roomId: string) => void;
    guess: (roomId: string, guessCorrectness: boolean) => void;
    chooseCharacter: (roomId: string, indexNum: number) => void;
    playAgain: (roomId: string) => void;
}

export type SocketResponse = z.infer<typeof zod.responseTypeSchema>;
export type RoomState = z.infer<typeof zod.roomStateSchema>;
export type EndState = z.infer<typeof zod.EndStateSchema>;
export type UserHasLiked = z.infer<typeof zod.userHasLikedSchema>;
export type CardDataId = z.infer<typeof zod.cardDataIdSchema>;
export type CardDataUrl = z.infer<typeof zod.cardDataUrlSchema>;
export type GameData = z.infer<typeof zod.gameDataSchema>;
export type CreateGameRequest = z.infer<typeof zod.createGameRequestSchema>;
export type CreateGameResponse = z.infer<typeof zod.createGameResponseSchema>;
export type IdPresetInfo = z.infer<typeof zod.IdPresetInfoSchema>;
export type UrlPresetInfo = z.infer<typeof zod.UrlPresetInfoSchema>;
export type PaginationInfo = z.infer<typeof zod.PaginationInfoSchema>;
export type SearchQuery = z.infer<typeof zod.searchQuerySchema>;
