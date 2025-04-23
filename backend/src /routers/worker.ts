import { Prisma, PrismaClient } from "@prisma/client";
import { Router } from "express";
import jwt, { decode } from "jsonwebtoken";
import { workermidleware } from "../middleware";
import { TOTAL_DECIMALS} from "../config";
import { getNextTask } from "../db";
import { createSubmissionInput } from "../types";
import nacl from "tweetnacl";
import { Connection, Keypair, PublicKey, sendAndConfirmTransaction, SystemProgram, Transaction } from "@solana/web3.js";
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

//@ts-ignore
router.post("/payout",workermidleware, async(req,res)=>{
    //@ts-ignore
    const userId: string = req.userId;
    const worker = await prismaClient.worker.findFirst({
        where: { id:Number(userId) }
    })

    if(!worker){
        return res.status(403).json({
            message:"User not found"
        })
    }
    const address = worker.address;

    //logic
    //@solana/wen3.js
    //new Transaction{
    //  from:"ad"
    //  to:"address"
    //
    //}
    

    const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: new PublicKey(process.env.PARENT_WALLET_ADDRESS!),
          toPubkey: new PublicKey(worker.address),
          //lamports: 1000_1000_100 * worker.pending_amount / TOTAL_DECIMALS,
          lamports: BigInt(worker.pending_amount) * BigInt(1000_1000_100) / BigInt(TOTAL_DECIMALS),
        })
      );

      //const keypair = Keypair.fromSecretKey(decode(privateKey));

      console.log(worker.address);
      // TODO: There's a double spending problem here
      // The user can request the withdrawal multiple times
      // Can u figure out a way to fix it?
      let signature = "";
      try {
          signature = await sendAndConfirmTransaction(
              connection,
              transaction,
              [keypair],
          );
      
       } catch(e) {
          return res.json({
              message: "Transaction failed"
          })
       }
      
      console.log(signature);  

    //we should add a lock here
    await prismaClient.$transaction(async tx=>{
        await tx.worker.update({
            where:{
                id: Number(userId)
            },
            data:{
                pending_amount: {
                    decrement: worker.pending_amount
                },
                locked_amount:{
                    increment: worker.pending_amount
                }
            }
        })

        await tx.payouts.create({
            data:{
                user_id:Number(userId),
                amount: worker.pending_amount,
                status:"Processing",
                signature: signature
            }
        })
    })

    //send the txn to the solana blockchain

    res.json({
        message: "Processing payout",
        amount:worker.pending_amount
    })

})


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