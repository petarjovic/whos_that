export const log = (msg: unknown) => {
    if (Boolean(import.meta.env.DEV)) console.trace(msg);
};

export const logError = (error: unknown) => {
    if (Boolean(import.meta.env.DEV)) console.error(error);
};
