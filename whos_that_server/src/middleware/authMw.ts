import type { Request, Response, NextFunction } from "express";
import { auth } from "../config/auth.ts";
import { fromNodeHeaders } from "better-auth/node";
import { logger } from "../config/logger.ts";

/**
 * Middleware to verify user is authenticated and has admin role
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const requireAdmin = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        // Verify user is logged in
        const session = await auth.api.getSession({
            headers: fromNodeHeaders(req.headers),
        });
        if (!session) {
            res.status(401).json({ message: "Unauthorized." });
            return;
        }

        // Verify user has admin role
        if (session.user.role !== "admin") {
            res.status(403).json({ message: "Forbidden." });
            return;
        }

        next();
        //Error handling ↓
    } catch (error) {
        logger.error({ error }, "Error: admin verification middleware error.");
        res.status(500).json({ message: "Internal server error." });
        return;
    }
};
