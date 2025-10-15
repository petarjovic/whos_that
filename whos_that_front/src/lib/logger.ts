export const log = (msg: unknown) => {
    if (import.meta.env.DEV) console.trace(msg);
};

export const logError = (error: unknown) => {
    if (import.meta.env.DEV) console.error(error);
};
