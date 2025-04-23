"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const express_1 = require("express");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const middleware_1 = require("../middleware");
const config_1 = require("../config");
const db_1 = require("../db");
const types_1 = require("../types");
const tweetnacl_1 = __importDefault(require("tweetnacl"));
const web3_js_1 = require("@solana/web3.js");
const dotenv_1 = __importDefault(require("dotenv"));
const bs58_1 = __importDefault(require("bs58"));
dotenv_1.default.config();
const privateKey = process.env.SOLANA_PRIVATE_KEY;
const keypair = web3_js_1.Keypair.fromSecretKey(bs58_1.default.decode(privateKey));
const connection = new web3_js_1.Connection(process.env.SOLANA_CONNECTION_URL);
const TOTAL_SUBMISSIONS = 100;
const prismaClient = new client_1.PrismaClient();
prismaClient.$transaction((prisma) => __awaiter(void 0, void 0, void 0, function* () {
    // Code running in a transaction...
}), {
    maxWait: 5000,
    timeout: 10000, // default: 5000
});
const router = (0, express_1.Router)();
//@ts-ignore
router.post("/payout", middleware_1.workermidleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    //@ts-ignore
    const userId = req.userId;
    const worker = yield prismaClient.worker.findFirst({
        where: { id: Number(userId) }
    });
    if (!worker) {
        return res.status(403).json({
            message: "User not found"
        });
    }
    const address = worker.address;
    //logic
    //@solana/wen3.js
    //new Transaction{
    //  from:"ad"
    //  to:"address"
    //
    //}
    const transaction = new web3_js_1.Transaction().add(web3_js_1.SystemProgram.transfer({
        fromPubkey: new web3_js_1.PublicKey(process.env.PARENT_WALLET_ADDRESS),
        toPubkey: new web3_js_1.PublicKey(worker.address),
        //lamports: 1000_1000_100 * worker.pending_amount / TOTAL_DECIMALS,
        lamports: BigInt(worker.pending_amount) * BigInt(10001000100) / BigInt(config_1.TOTAL_DECIMALS),
    }));
    //const keypair = Keypair.fromSecretKey(decode(privateKey));
    console.log(worker.address);
    // TODO: There's a double spending problem here
    // The user can request the withdrawal multiple times
    // Can u figure out a way to fix it?
    let signature = "";
    try {
        signature = yield (0, web3_js_1.sendAndConfirmTransaction)(connection, transaction, [keypair]);
    }
    catch (e) {
        return res.json({
            message: "Transaction failed"
        });
    }
    console.log(signature);
    //we should add a lock here
    yield prismaClient.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        yield tx.worker.update({
            where: {
                id: Number(userId)
            },
            data: {
                pending_amount: {
                    decrement: worker.pending_amount
                },
                locked_amount: {
                    increment: worker.pending_amount
                }
            }
        });
        yield tx.payouts.create({
            data: {
                user_id: Number(userId),
                amount: worker.pending_amount,
                status: "Processing",
                signature: signature
            }
        });
    }));
    //send the txn to the solana blockchain
    res.json({
        message: "Processing payout",
        amount: worker.pending_amount
    });
}));
router.get("/balance", middleware_1.workermidleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    //@ts-ignore
    const userId = req.userId;
    const worker = yield prismaClient.worker.findFirst({
        where: {
            id: Number(userId)
        }
    });
    res.json({
        pendingAmount: worker === null || worker === void 0 ? void 0 : worker.pending_amount,
        lockdAmount: worker === null || worker === void 0 ? void 0 : worker.locked_amount
    });
}));
// // Extend the SubmissionWhereInput type to include `done`
// type ExtendedSubmissionWhereInput = Prisma.SubmissionWhereInput & {
//     done?: boolean;
//   };  
//@ts-ignore
router.post("/submission", middleware_1.workermidleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    //@ts-ignore
    const userId = req.userId;
    const body = req.body;
    const parsedBody = types_1.createSubmissionInput.safeParse(body);
    if (parsedBody.success) {
        const task = yield (0, db_1.getNextTask)(Number(userId));
        if (!task || (task === null || task === void 0 ? void 0 : task.id) !== Number(parsedBody.data.taskId)) {
            return res.status(411).json({
                message: "Incorrect task id"
            });
        }
        const amount = (Number(task.amount) / TOTAL_SUBMISSIONS).toString();
        const submission = yield prismaClient.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            const submission = yield tx.submission.create({
                data: {
                    option_id: Number(parsedBody.data.selection),
                    worker_id: userId,
                    task_id: Number(parsedBody.data.taskId),
                    amount: Number(amount)
                }
            });
            yield tx.worker.update({
                where: {
                    id: userId,
                },
                data: {
                    pending_amount: {
                        increment: Number(amount)
                    }
                }
            });
            return submission;
        }));
        const nextTask = yield (0, db_1.getNextTask)(Number(userId));
        res.json({
            nextTask,
            amount
        });
    }
    else {
        res.status(411).json({
            message: "Incorrect inputs"
        });
    }
}));
router.get("/nextTask", middleware_1.workermidleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    //@ts-ignore
    const userId = req.userId;
    const task = yield (0, db_1.getNextTask)(Number(userId));
    if (!task) {
        res.status(411).json({
            message: "No more task left to review"
        });
    }
    else {
        res.json({
            task
        });
    }
}));
router.post("/signin", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    //adding sign verification logic
    const { publicKey, signature } = req.body;
    const message = new TextEncoder().encode("Sign into mechanical turks as a worker");
    const result = tweetnacl_1.default.sign.detached.verify(message, new Uint8Array(signature.data), new web3_js_1.PublicKey(publicKey).toBytes());
    if (!result) {
        res.status(411).json({
            message: "Incorrect signature"
        });
        return;
    }
    //const user = await prismaClient.user.upsert   try upserting
    const existingUser = yield prismaClient.worker.findFirst({
        where: {
            address: publicKey
        }
    });
    if (existingUser) {
        const token = jsonwebtoken_1.default.sign({
            userId: existingUser.id
        }, process.env.WORKER_JWT_SECRET);
        res.json({
            token,
            amount: existingUser.pending_amount / config_1.TOTAL_DECIMALS
        });
    }
    else {
        const user = yield prismaClient.worker.create({
            data: {
                address: publicKey,
                pending_amount: 0,
                locked_amount: 0
            }
        });
        const token = jsonwebtoken_1.default.sign({
            userId: user.id
        }, process.env.WORKER_JWT_SECRET);
        res.json({
            token,
            amount: 0
        });
    }
}));
exports.default = router;
