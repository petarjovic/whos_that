import type { Request, Response, NextFunction } from "express";
import { auth } from "../config/auth.ts";
import { fromNodeHeaders } from "better-auth/node";

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
        console.error("Admin verification middleware error:\n", error);
        res.status(500).json({ message: "Internal server error." });
        return;
    }
};

// export const requireSession = async (
//     req: Request,
//     res: Response,
//     next: NextFunction
// ): Promise<void> => {
//     try {
//         const session = await auth.api.getSession({
//             headers: fromNodeHeaders(req.headers),
//         });

//         if (!session) {
//             res.status(401).json({ message: "Unauthorized." });
//             return;
//         }

//         next();
//     } catch (error) {
//         console.error("Session verification middleware error:\n", error);
//         res.status(500).json({ message: "Internal server error." });
//         return;
//     }
// };
