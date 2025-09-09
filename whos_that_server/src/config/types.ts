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
};

export interface ServerToClientEvents {
    //gameCreated: (data: [string, GameStateType]) => void;
    playerJoined: (gameState: GameStateType) => void;
    // playerCannotJoinGame: (data: { gameId: string; serverPlayers: [string, string] }) => void;
    recieveOppGuess: (winLose: boolean) => void;
    opponentDisconnted: (gameState: GameStateType) => void;
    playAgainConfirmed: (gameState: GameStateType) => void;
    errorMessage: (error: { message: string }) => void;
}

export interface ClientToServerEvents {
    createGame: (ack: (gameId: string, response: ResponseType) => void) => void;
    joinGame: (
        gameId: string,
        ack: (gameData: GameStateType, response: ResponseType) => void
    ) => void;
    guess: (gameId: string, guessCorrectness: boolean) => void;
    playAgain: (gameId: string) => void;
}
