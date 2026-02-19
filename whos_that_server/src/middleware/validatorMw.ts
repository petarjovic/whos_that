import type { Request, Response, NextFunction } from "express";
import { nanoId21Schema } from "../config/zod/zodSchema.ts";
import { db } from "../config/connections.ts";
import { eq } from "drizzle-orm";
import * as schema from "../db/schema.ts";

/**
 * Middleware to validate game ID fromat using Zod
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const validateGameId = (req: Request, res: Response, next: NextFunction): void => {
    const gameId = req.params.gameId;
    // Check if game ID exists in params
    if (!gameId) {
        res.status(400).json({ message: "No game id given." });
        return;
    }

    //Validate format
    const validate = nanoId21Schema.safeParse(gameId);
    if (!validate.success) {
        res.status(422).json({ message: "Invalid game id." });
        return;
    }
    next();
};

/**
 * Middleware to verify game exists in database by querying gameId
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const checkGameExists = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    const gameId = Array.isArray(req.params.gameId) ? req.params.gameId[0] : req.params.gameId; //idk whats up with this check something happened and now TS thinks gameId could be string[] ? This is fine for now

    const selectId = await db
        .select({ id: schema.games.id })
        .from(schema.games)
        .where(eq(schema.games.id, gameId));

    if (selectId.length < 1) {
        res.status(400).json({ message: "Game id does not exist." });
        return;
    }

    next();
};
