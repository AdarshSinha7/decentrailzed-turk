"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.workermidleware = exports.authMiddlewareee = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function authMiddlewareee(req, res, next) {
    var _a;
    const authHeader = (_a = req.headers["authorization"]) !== null && _a !== void 0 ? _a : "";
    try {
        const decoded = jsonwebtoken_1.default.verify(authHeader, process.env.JWT_SECRET);
        //@ts-ignore
        if (decoded.userId) {
            //@ts-ignore
            req.userId = decoded.userId; // Attach userId to the request object
            next(); // Call next to pass control to the next middleware
        }
        else {
            res.status(403).json({
                message: "You are not logged in",
            }); // Send response without returning it
        }
    }
    catch (e) {
        res.status(403).json({
            message: "You are not logged in",
        }); // Send response without returning it
    }
}
exports.authMiddlewareee = authMiddlewareee;
function workermidleware(req, res, next) {
    var _a;
    const authHeader = (_a = req.headers["authorization"]) !== null && _a !== void 0 ? _a : "";
    try {
        const decoded = jsonwebtoken_1.default.verify(authHeader, process.env.WORKER_JWT_SECRET);
        //@ts-ignore
        if (decoded.userId) {
            //@ts-ignore
            req.userId = decoded.userId; // Attach userId to the request object
            next(); // Call next to pass control to the next middleware
        }
        else {
            res.status(403).json({
                message: "You are not logged in",
            }); // Send response without returning it
        }
    }
    catch (e) {
        res.status(403).json({
            message: "You are not logged in",
        }); // Send response without returning it
    }
}
exports.workermidleware = workermidleware;
