import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";


export function authMiddlewareee(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers["authorization"] ?? "";

    try {
        const decoded = jwt.verify(authHeader, process.env.JWT_SECRET!) ;
        //@ts-ignore
        if (decoded.userId) {
            //@ts-ignore
            req.userId = decoded.userId; // Attach userId to the request object
            next(); // Call next to pass control to the next middleware
        } else {
            res.status(403).json({
                message: "You are not logged in",
            }); // Send response without returning it
        }
    } catch (e) {
            res.status(403).json({
            message: "You are not logged in",
        }); // Send response without returning it
    }
}

export function workermidleware(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers["authorization"] ?? "";

    try {
        const decoded = jwt.verify(authHeader, process.env.WORKER_JWT_SECRET!) ;
        //@ts-ignore
        if (decoded.userId) {
            //@ts-ignore
            req.userId = decoded.userId; // Attach userId to the request object
            next(); // Call next to pass control to the next middleware
        } else {
            res.status(403).json({
                message: "You are not logged in",
            }); // Send response without returning it
        }
    } catch (e) {
            res.status(403).json({
            message: "You are not logged in",
        }); // Send response without returning it
    }
}
