import type { Request, Response, NextFunction } from "express";
import { nanoId21Schema } from "../config/zod/zodSchema.ts";
import { db } from "../config/connections.ts";
import { eq } from "drizzle-orm";
import * as schema from "../db/schema.ts";

export const validateGameId = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    const gameId = req.params.gameId;
    if (!gameId) {
        res.status(400).json({ message: "No game id given." });
        return;
    }
    const validate = nanoId21Schema.safeParse(gameId);
    if (!validate.success) {
        res.status(422).json({ message: "Invalid game id." });
        return;
    }
    next();
};

export const checkGameExists = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    const selectId = await db
        .select({ id: schema.games.id })
        .from(schema.games)
        .where(eq(schema.games.id, req.params.gameId));

    if (selectId.length < 1) {
        res.status(400).json({ message: "Game id does not exist." });
        return;
    }

    next();
};
