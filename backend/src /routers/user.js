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
const tweetnacl_1 = __importDefault(require("tweetnacl"));
const client_1 = require("@prisma/client");
const express_1 = require("express");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../config");
const middleware_1 = require("../middleware");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");
const s3_presigned_post_1 = require("@aws-sdk/s3-presigned-post");
const types_1 = require("../types");
const web3_js_1 = require("@solana/web3.js");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const connection = new web3_js_1.Connection(process.env.SOLANA_CONNECTION_URL);
const PARENT_WALLET_ADDRESS = process.env.PARENT_WALLET_ADDRESS;
const DEFAULT_TITLE = "Select the most likable/clickable image ";
const s3Client = new S3Client({
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
    region: process.env.AWS_REGION,
});
const router = (0, express_1.Router)();
const prismaClient = new client_1.PrismaClient();
prismaClient.$transaction((prisma) => __awaiter(void 0, void 0, void 0, function* () {
    // Code running in a transaction...
}), {
    maxWait: 5000,
    timeout: 10000, // default: 5000
});
router.get("/task", middleware_1.authMiddlewareee, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // @ts-ignore
    const taskId = req.query.taskId;
    // @ts-ignore
    const userId = req.userId;
    console.log({
        user_id: Number(userId),
        id: Number(taskId)
    });
    // Fetch task details
    const taskDetails = yield prismaClient.task.findFirst({
        where: {
            user_id: Number(userId),
            id: Number(taskId)
        },
        include: {
            options: true
        }
    });
    // If no task is found, return an error response and exit
    if (!taskDetails) {
        res.status(411).json({
            message: "You don't have access to this task"
        });
        return; // Ensure the function exits here
    }
    // Fetch submission responses
    const responses = yield prismaClient.submission.findMany({
        where: {
            task_id: Number(taskId)
        },
        include: {
            option: true
        }
    });
    // Prepare result
    const result = {};
    // Populate result with initial counts
    taskDetails.options.forEach(option => {
        result[option.id] = {
            count: 0,
            option: {
                imageUrl: option.image_url
            }
        };
    });
    // Update counts based on responses
    responses.forEach(r => {
        result[r.option_id].count++;
    });
    // Return final response
    res.json({
        result,
    });
}));
router.post("/task", middleware_1.authMiddlewareee, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f;
    //@ts-ignore
    // Get userId from middleware
    const userId = req.userId; // Ensure userId is attached in middleware
    // Validate inputs using Zod
    const body = req.body;
    const parseData = types_1.createTaskInput.safeParse(body);
    const user = yield prismaClient.user.findFirst({
        where: {
            id: userId
        }
    });
    if (!parseData.success) {
        res.status(411).json({ message: "You've sent the wrong inputs" });
        return;
    }
    const transaction = yield connection.getTransaction(parseData.data.signature, {
        maxSupportedTransactionVersion: 1
    });
    console.log(transaction);
    if (((_b = (_a = transaction === null || transaction === void 0 ? void 0 : transaction.meta) === null || _a === void 0 ? void 0 : _a.postBalances[1]) !== null && _b !== void 0 ? _b : 0) - ((_d = (_c = transaction === null || transaction === void 0 ? void 0 : transaction.meta) === null || _c === void 0 ? void 0 : _c.preBalances[1]) !== null && _d !== void 0 ? _d : 0) !== 100000000) {
        res.status(411).json({
            message: "Transaction signature/amount incorrect"
        });
        return;
    }
    if (((_e = transaction === null || transaction === void 0 ? void 0 : transaction.transaction.message.getAccountKeys().get(1)) === null || _e === void 0 ? void 0 : _e.toString()) !== PARENT_WALLET_ADDRESS) {
        res.status(411).json({
            message: "Transaction sent to wrong address"
        });
        return;
    }
    if (((_f = transaction === null || transaction === void 0 ? void 0 : transaction.transaction.message.getAccountKeys().get(0)) === null || _f === void 0 ? void 0 : _f.toString()) !== (user === null || user === void 0 ? void 0 : user.address)) {
        res.status(411).json({
            message: "Transaction sent to wrong address"
        });
        return;
    }
    let response = yield prismaClient.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        var _g;
        const response = yield tx.task.create({
            data: {
                title: (_g = parseData.data.title) !== null && _g !== void 0 ? _g : DEFAULT_TITLE,
                amount: 0.1 * config_1.TOTAL_DECIMALS,
                //TODO: Signature should be unique in the table else people can reuse a signature
                signature: parseData.data.signature,
                user_id: userId
            }
        });
        // Create related options
        yield tx.option.createMany({
            data: parseData.data.options.map(x => ({
                image_url: x.imageUrl,
                task_id: response.id
            }))
        });
        return response;
    }));
    res.json({
        id: response.id
    });
}));
router.get("/presignedUrl", middleware_1.authMiddlewareee, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    //@ts-ignore
    const userId = req.userId;
    // const command = new PutObjectCommand({
    //     Bucket: "decentralized-turkk",
    //     Key: `turk/${userId}/${Math.random()}/image.png`,
    //     ContentType:"img/jpeg"
    //   })
    const { url, fields } = yield (0, s3_presigned_post_1.createPresignedPost)(s3Client, {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `turk/${userId}/${Math.random()}/image.jpg`,
        Conditions: [
            ['content-length-range', 0, 5 * 1024 * 1024] // 5 MB max
        ],
        Expires: 3600
    });
    console.log({ url, fields });
    res.json({
        preSignedUrl: url,
        fields
    });
}));
//signin with wallet
// router.post("/signin",async(req,res)=>{
//     const {publicKey, signature} = req.body;
//     //const signedString = "Sign into mechanical turks";
//     const message = new TextEncoder().encode("Sign into mechanical turks");
//     const result = nacl.sign.detached.verify(
//       message,
//       new Uint8Array(signature.data),
//       new PublicKey(publicKey).toBytes(),
//     );
//     if(!result){
//         return res.status(411).json({
//             message: "Incorrect signature"
//         })
//     }
//     //console.log(result);
//     //adding sign verification logic
//    // const hardcodedwalletAddress = "C55VpJudhF8hJdPPCFJf5CNrzga5fsCyMPntp7uhzss8";
//     //const user = await prismaClient.user.upsert   try upserting
//     // const existingUser = await prismaClient.user.findFirst({
//     //     where:{
//     //         address: hardcodedwalletAddress
//     //     }
//     // })
//     const existingUser = await prismaClient.user.findFirst({
//       where:{
//           address: publicKey
//       }
//   })
//     if(existingUser){
//         const token = jwt.sign({
//             userId: existingUser.id
//         }, JWT_SECRET)
//         res.json({
//             token
//         })
//     }else{
//         const user = await prismaClient.user.create({
//             data:{
//                 address: publicKey,
//             }
//         })
//         const token = jwt.sign({
//             userId: user.id
//         }, JWT_SECRET)
//         res.json({
//             token
//         })
//     }
// });
router.post("/signin", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { publicKey, signature } = req.body;
    const message = new TextEncoder().encode("Sign into mechanical turks");
    const result = tweetnacl_1.default.sign.detached.verify(message, new Uint8Array(signature.data), new web3_js_1.PublicKey(publicKey).toBytes());
    if (!result) {
        res.status(411).json({
            message: "Incorrect signature"
        });
        return;
    }
    const existingUser = yield prismaClient.user.findFirst({
        where: {
            address: publicKey
        }
    });
    if (existingUser) {
        const token = jsonwebtoken_1.default.sign({
            userId: existingUser.id
        }, process.env.JWT_SECRET);
        res.json({
            token
        });
    }
    else {
        const user = yield prismaClient.user.create({
            data: {
                address: publicKey,
            }
        });
        const token = jsonwebtoken_1.default.sign({
            userId: user.id
        }, process.env.JWT_SECRET);
        res.json({
            token
        });
    }
}));
exports.default = router;
