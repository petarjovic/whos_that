export type winLoseFlagType = boolean | null;

export type EndStateType = "" | "correctGuess" | "wrongGuess" | "oppCorrectGuess" | "oppWrongGuess";

export interface ServerResponse {
    message: string;
}

export type SocialSignInProviders = "discord";
