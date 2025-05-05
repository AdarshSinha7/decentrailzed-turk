import { Prisma, PrismaClient, TxnStatus } from "@prisma/client";
import { Router } from "express";
import jwt, { decode } from "jsonwebtoken";
import { workermidleware } from "../middleware";
import { TOTAL_DECIMALS} from "../config";
import { getNextTask } from "../db";
import { createSubmissionInput } from "../types";
import nacl from "tweetnacl";
import { Commitment, ComputeBudgetProgram, Connection, Keypair, PublicKey, sendAndConfirmTransaction, SystemProgram, Transaction } from "@solana/web3.js";
import dotenv from "dotenv";
import bs58 from "bs58";

dotenv.config();

const privateKey = process.env.SOLANA_PRIVATE_KEY!;

const keypair = Keypair.fromSecretKey(bs58.decode(privateKey));


const connection = new Connection(process.env.SOLANA_CONNECTION_URL!);


const TOTAL_SUBMISSIONS = 100;

const prismaClient = new PrismaClient();

prismaClient.$transaction(
    async (prisma) => {
      // Code running in a transaction...
    },
    {
      maxWait: 5000, // default: 2000
      timeout: 10000, // default: 5000
    }
)

const router = Router();

// //@ts-ignore
// router.post("/payout",workermidleware, async(req,res)=>{
//     //@ts-ignore
//     const userId: string = req.userId;
//     const worker = await prismaClient.worker.findFirst({
//         where: { id:Number(userId) }
//     })

//     if(!worker){
//         return res.status(403).json({
//             message:"User not found"
//         })
//     }
//     const address = worker.address;

//     //logic
//     //@solana/wen3.js
//     //new Transaction{
//     //  from:"ad"
//     //  to:"address"
//     //
//     //}
    

//     const transaction = new Transaction().add(
//         SystemProgram.transfer({
//           fromPubkey: new PublicKey(process.env.PARENT_WALLET_ADDRESS!),
//           toPubkey: new PublicKey(worker.address),
//           //lamports: 1000_1000_100 * worker.pending_amount / TOTAL_DECIMALS,
//           lamports: BigInt(worker.pending_amount) * BigInt(1000_1000_100) / BigInt(TOTAL_DECIMALS),
//         })
//       );

//       //const keypair = Keypair.fromSecretKey(decode(privateKey));

//       console.log(worker.address);
//       // TODO: There's a double spending problem here
//       // The user can request the withdrawal multiple times
//       // Can u figure out a way to fix it?
//       let signature = "";
//       try {
//           signature = await sendAndConfirmTransaction(
//               connection,
//               transaction,
//               [keypair],
//           );
      
//        } catch(e) {
//           return res.json({
//               message: "Transaction failed"
//           })
//        }
      
//       console.log(signature);  

//     //we should add a lock here
//     await prismaClient.$transaction(async tx=>{
//         await tx.worker.update({
//             where:{
//                 id: Number(userId)
//             },
//             data:{
//                 pending_amount: {
//                     decrement: worker.pending_amount
//                 },
//                 locked_amount:{
//                     increment: worker.pending_amount
//                 }
//             }
//         })

//         await tx.payouts.create({
//             data:{
//                 user_id:Number(userId),
//                 amount: worker.pending_amount,
//                 status:"Processing",
//                 signature: signature
//             }
//         })
//     })

//     //send the txn to the solana blockchain

//     res.json({
//         message: "Processing payout",
//         amount:worker.pending_amount
//     })

// })
// Replace the entire payout handler with this version tailored to your configuration

//@ts-ignore 
router.post("/payout", workermidleware, async (req, res) => {
    console.log("RUNNING UPDATED PAYOUT CODE - VERSION 2"); // Add this line
    try {
        //@ts-ignore
        const userId: string = req.userId;
        
        console.log("=============================================");
        console.log(`PAYOUT PROCESS STARTED for user: ${userId}`);
        console.log("=============================================");
        
        // Check for existing payout in progress
        const existingPayout = await prismaClient.payouts.findFirst({
            where: {
                user_id: Number(userId),
                status: "Processing"
            }
        });

        if (existingPayout) {
            console.log(`User ${userId} already has a payout in progress`);
            return res.status(409).json({
                message: "You already have a payout in progress",
                success: false
            });
        }

        const worker = await prismaClient.worker.findFirst({
            where: { id: Number(userId) }
        });

        if (!worker) {
            console.log(`Worker not found for user ${userId}`);
            return res.status(403).json({
                message: "User not found",
                success: false
            });
        }

        console.log("Worker found:", {
            id: worker.id,
            address: worker.address,
            pending_amount: worker.pending_amount,
            locked_amount: worker.locked_amount
        });

        if (!worker.pending_amount || worker.pending_amount <= 0) {
            console.log(`No pending amount for user ${userId}`);
            return res.status(400).json({
                message: "No pending amount to withdraw",
                success: false
            });
        }

        // IMPORTANT: Get keypair public key
        const keypairPublicKey = keypair.publicKey.toString();
        console.log("Keypair public key:", keypairPublicKey);
        
        // CRITICAL FIX: Derive the correct public key from your private key
        const derivedPublicKey = new PublicKey(keypair.publicKey);
        console.log("Derived public key:", derivedPublicKey.toString());
        
        // IMPORTANT: Check if keypair matches PARENT_WALLET_ADDRESS
        const parentWalletAddress = process.env.PARENT_WALLET_ADDRESS;
        console.log("Parent wallet address from env:", parentWalletAddress);
        console.log("Do they match?", keypairPublicKey === parentWalletAddress);
        
        // Calculate amount in lamports based on your specific TOTAL_DECIMALS setting
        // IMPORTANT: Standard is 1 SOL = 1,000,000,000 lamports
        const LAMPORTS_PER_SOL = 1_000_000_000;
        
        // Convert your application units to SOL first, then to lamports
        const payoutAmountSOL = worker.pending_amount / TOTAL_DECIMALS; // Convert to SOL
        const payoutAmountLamports = Math.floor(payoutAmountSOL * LAMPORTS_PER_SOL); // Convert to lamports
        
        console.log("Amount calculation:", {
            pending_amount: worker.pending_amount,
            total_decimals: TOTAL_DECIMALS,
            sol_amount: payoutAmountSOL,
            lamports: payoutAmountLamports
        });
        
        // Check wallet balance
        try {
            const walletBalance = await connection.getBalance(keypair.publicKey);
            console.log("Wallet balance:", {
                lamports: walletBalance,
                sol: walletBalance / LAMPORTS_PER_SOL
            });
            
            if (walletBalance < payoutAmountLamports) {
                console.log("INSUFFICIENT FUNDS!");
                return res.status(400).json({
                    message: "Insufficient funds in treasury",
                    success: false,
                    details: `Required: ${payoutAmountLamports / LAMPORTS_PER_SOL} SOL, Available: ${walletBalance / LAMPORTS_PER_SOL} SOL`
                });
            }
        } catch (error) {
            console.error("Error checking balance:", error);
            return res.status(500).json({
                message: "Failed to check wallet balance",
                success: false,
                error: error instanceof Error ? error.message : String(error)
            });
        }
        
        // Lock the funds to prevent double spending
        await prismaClient.$transaction(async tx => {
            await tx.worker.update({
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

            await tx.payouts.create({
                data: {
                    user_id: Number(userId),
                    amount: worker.pending_amount,
                    status: "Processing",
                    signature: ""
                }
            });
        });
        
        console.log("Funds locked, proceeding with transaction");
        
        // Get a fresh blockhash
        const { blockhash } = await connection.getLatestBlockhash('confirmed');
        
        // Create the transaction
        const transaction = new Transaction();
        
        // CRITICAL FIX: Use the keypair's public key as the source
        transaction.add(
            SystemProgram.transfer({
                fromPubkey: keypair.publicKey, // Must match the signer
                toPubkey: new PublicKey(worker.address),
                lamports: payoutAmountLamports,
            })
        );
        
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = keypair.publicKey;
        
        console.log("Transaction created:", {
            from: keypair.publicKey.toString(),
            to: worker.address,
            lamports: payoutAmountLamports,
            blockhash: blockhash
        });
        
        let signature = "";
        try {
            console.log("Sending transaction...");
            
            // Send with specific commitment level
            signature = await sendAndConfirmTransaction(
                connection,
                transaction,
                [keypair], // The signer
                {
                    commitment: 'confirmed',
                    preflightCommitment: 'confirmed',
                    skipPreflight: false
                }
            );
            
            console.log("TRANSACTION SUCCESSFUL!");
            console.log("Signature:", signature);
            
            // Update database with success
            await prismaClient.payouts.updateMany({
                where: {
                    user_id: Number(userId),
                    status: "Processing"
                },
                data: {
                    status: "Success",
                    signature: signature
                }
            });
            
            // Clear locked amount
            await prismaClient.worker.update({
                where: {
                    id: Number(userId)
                },
                data: {
                    locked_amount: {
                        decrement: worker.pending_amount
                    }
                }
            });
            
            return res.json({
                message: "Payout successful",
                success: true,
                signature,
                amount: payoutAmountSOL
            });
            
        } catch (error) {
            console.error("TRANSACTION ERROR:");
            console.error(error);
            
            if (error instanceof Error) {
                console.error("Error message:", error.message);
                console.error("Error stack:", error.stack);
            }
            
            // Revert locked funds
            await prismaClient.worker.update({
                where: {
                    id: Number(userId)
                },
                data: {
                    pending_amount: {
                        increment: worker.pending_amount
                    },
                    locked_amount: {
                        decrement: worker.pending_amount
                    }
                }
            });
            
            // Update payout record
            await prismaClient.payouts.updateMany({
                where: {
                    user_id: Number(userId),
                    status: "Processing"
                },
                data: {
                    status: "Failure"
                }
            });
            
            // Return detailed error information
            return res.status(400).json({
                message: "Transaction failed: " + (error instanceof Error ? error.message : String(error)),
                success: false,
                error: error instanceof Error ? error.message : String(error)
            });
        }
        
    } catch (error) {
        console.error("SERVER ERROR:", error);
        
        // Rollback if needed
        try {
            //@ts-ignore
            const userId = req.userId;
            const worker = await prismaClient.worker.findFirst({
                where: { id: Number(userId) }
            });
            
            if (worker && worker.locked_amount > 0) {
                await prismaClient.worker.update({
                    where: { id: Number(userId) },
                    data: {
                        pending_amount: { increment: worker.locked_amount },
                        locked_amount: { decrement: worker.locked_amount }
                    }
                });
            }
            
            await prismaClient.payouts.updateMany({
                where: {
                    user_id: Number(userId),
                    status: "Processing"
                },
                data: {
                    status: "Failure"
                }
            });
        } catch (rollbackError) {
            console.error("Failed to rollback:", rollbackError);
        }
        
        return res.status(500).json({
            message: "Server error: " + (error instanceof Error ? error.message : String(error)),
            success: false,
            error: error instanceof Error ? error.message : String(error)
        });
    }
});


router.get("/balance", workermidleware, async(req,res)=>{
    //@ts-ignore
    const userId: string = req.userId;
    const worker = await prismaClient.worker.findFirst({
        where:{
            id: Number(userId)
        }
    })
    res.json({
        pendingAmount: worker?.pending_amount,
        lockdAmount: worker?.locked_amount
    });
})



// // Extend the SubmissionWhereInput type to include `done`
// type ExtendedSubmissionWhereInput = Prisma.SubmissionWhereInput & {
//     done?: boolean;
//   };  

//@ts-ignore
router.post("/submission", workermidleware, async(req,res)=>{
    //@ts-ignore
    const userId = req.userId;
    const body = req.body;
    const parsedBody = createSubmissionInput.safeParse(body);

    if(parsedBody.success){
        
        const task = await getNextTask(Number(userId));
        if(!task || task?.id !== Number(parsedBody.data.taskId)){
            return res.status(411).json({
                message:"Incorrect task id"
            })
        }

        const amount = (Number(task.amount)/TOTAL_SUBMISSIONS).toString();

        const submission = await prismaClient.$transaction(async tx=>{
            const submission = await tx.submission.create({
                data:{
                    option_id: Number(parsedBody.data.selection),
                    worker_id: userId,
                    task_id: Number(parsedBody.data.taskId),
                    amount: Number(amount)
                }
            })
            await tx.worker.update({
                where:{
                    id: userId,
                },
                data:{
                    pending_amount:{
                        increment: Number(amount)
                    }
                }
            })

            return submission;
        })

        

        const nextTask = await getNextTask(Number(userId));
        res.json({
            nextTask,
            amount
        })

    }else{
        res.status(411).json({
            message: "Incorrect inputs"
        })
    }
    
    
})

router.get("/nextTask",workermidleware, async(req,res)=>{
    //@ts-ignore
    const userId: string = req.userId;

    const task = await getNextTask(Number(userId));

    if(!task){
        res.status(411).json({
            message: "No more task left to review"
        })
    }else{
        res.json({
            task
        })
    }
})


router.post("/signin",async(req,res)=>{
    //adding sign verification logic
    const { publicKey, signature } = req.body;
    const message = new TextEncoder().encode("Sign into mechanical turks as a worker");

    const result = nacl.sign.detached.verify(
        message,
        new Uint8Array(signature.data),
        new PublicKey(publicKey).toBytes(),
    );

    if (!result) {
         res.status(411).json({
            message: "Incorrect signature"
        })
        return
    }   



    //const user = await prismaClient.user.upsert   try upserting

    const existingUser = await prismaClient.worker.findFirst({
        where:{
            address: publicKey
        }
    })
    
    if(existingUser){
        const token = jwt.sign({
            userId: existingUser.id
        }, process.env.WORKER_JWT_SECRET!)
        res.json({
            token,
            amount: existingUser.pending_amount / TOTAL_DECIMALS
        })
    }else{
        const user = await prismaClient.worker.create({
            data:{
                address: publicKey,
                pending_amount: 0,
                locked_amount: 0 
            }
        })

        const token = jwt.sign({
            userId: user.id
        }, process.env.WORKER_JWT_SECRET!)
        res.json({
            token,
            amount: 0
        })
    }
});

export default router;