export type ResponseType = {
    success: boolean;
    msg: string;
};

export type GameIdMapType = {
    [gameId: string]: GameStateType;
};

export type GameStateType = {
    players: [string, string];
    cardIdsToGuess: [number, number];
    playAgainReqs: [boolean, boolean];
    preset: string;
};

export interface ServerToClientEvents {
    playerJoined: (gameState: GameStateType) => void;
    recieveOppGuess: (winLose: boolean) => void;
    opponentDisconnted: (gameState: GameStateType) => void;
    playAgainConfirmed: (gameState: GameStateType) => void;
    errorMessage: (error: { message: string }) => void;
}

export interface ClientToServerEvents {
    createGame: (preset: string, ack: (gameId: string, response: ResponseType) => void) => void;
    joinGame: (
        gameId: string,
        ack: (gameData: GameStateType, response: ResponseType) => void
    ) => void;
    guess: (gameId: string, guessCorrectness: boolean) => void;
    playAgain: (gameId: string) => void;
}
