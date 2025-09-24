export interface ResponseType {
    success: boolean;
    msg: string;
}

export interface GameStateType {
    players: [string, string];
    cardIdsToGuess: [number, number];
    playAgainReqs: [boolean, boolean];
    preset: string;
    numOfChars: number;
}

export interface CardDataType {
    imageUrl: string;
    name: string;
    orderIndex: number;
}

export interface ServerToClientEvents {
    playerJoined: (gameState: GameStateType) => void;
    recieveOppGuess: (winLose: boolean) => void;
    opponentDisconnted: (gameState: GameStateType) => void;
    playAgainConfirmed: (gameState: GameStateType) => void;
    errorMessage: (error: { message: string }) => void;
}

export interface ClientToServerEvents {
    createGame: (
        preset: string,
        numOfChars: number,
        ack: (gameId: string, response: ResponseType) => void
    ) => void;
    joinGame: (
        gameId: string,
        ack: (gameData: GameStateType, response: ResponseType) => void
    ) => void;
    guess: (gameId: string, guessCorrectness: boolean) => void;
    playAgain: (gameId: string) => void;
}

export interface CreateGameRequest {
    title: string;
    privacy: "public" | "private";
    user: string;
    names: string[];
}
