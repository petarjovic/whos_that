import type { Request, Response, NextFunction } from "express";
import { auth } from "../config/auth.ts";
import { fromNodeHeaders } from "better-auth/node";

export const requireAdmin = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const session = await auth.api.getSession({
            headers: fromNodeHeaders(req.headers),
        });

        if (!session) {
            res.status(401).json({ message: "Unauthorized." });
            return;
        }

        if (session.user.role !== "admin") {
            res.status(403).json({ message: "Forbidden." });
            return;
        }

        next();
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
