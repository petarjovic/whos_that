//File of custom types, many shared with front-end
import * as zod from "./zod/zodSchema";
import { z } from "zod/v4";

// SocketIO event interfaces could not be inferred from Zod schema because SocketIO would break
export interface ServerToClientEvents {
    updateRoomState: (gameState: RoomState) => void;
    opponentDisconnected: (gameState: RoomState) => void;
    errorMessage: (data: { message: string }) => void;
}

export interface ClientToServerEvents {
    createRoom: (
        preset: string,
        numOfChars: number,
        ack: (id: string, response: ResponseType) => void
    ) => void;
    joinRoom: (roomId: string, ack: (gameData: RoomState, response: ResponseType) => void) => void;
    guess: (roomId: string, guessCorrectness: boolean) => void;
    chooseCharacter: (roomId: string, indexNum: number) => void;
    playAgain: (roomId: string) => void;
}

export type ResponseType = z.infer<typeof zod.responseTypeSchema>;
export type RoomState = z.infer<typeof zod.roomStateSchema>;
export type EndState = z.infer<typeof zod.endStateSchema>;
export type CardDataIdType = z.infer<typeof zod.cardDataIdTypeSchema>;
export type CardDataUrlType = z.infer<typeof zod.cardDataUrlTypeSchema>;
export type GameDataType = z.infer<typeof zod.gameDataTypeSchema>;
export type CreateGameRequest = z.infer<typeof zod.createGameRequestSchema>;
export type CreateGameResponse = z.infer<typeof zod.createGameResponseSchema>;
export type IdPresetInfo = z.infer<typeof zod.IdPresetInfoSchema>;
export type UrlPresetInfo = z.infer<typeof zod.UrlPresetInfoSchema>;
export type PaginationInfo = z.infer<typeof zod.PaginationInfoSchema>;
export type SearchQuery = z.infer<typeof zod.searchQuerySchema>;
