export type winLoseFlagType = boolean | null;

export type EndStateType = "" | "correctGuess" | "wrongGuess" | "oppCorrectGuess" | "oppWrongGuess";

export interface ServerUploadResponse {
    success: boolean;
    fileId: string;
    url: string;
}

export interface ServerErrorResponse {
    message: string;
}
