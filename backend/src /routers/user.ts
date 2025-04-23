import nacl from "tweetnacl";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { PrismaClient } from "@prisma/client";
import { Router } from "express";
import jwt from "jsonwebtoken";
import {  TOTAL_DECIMALS } from "../config";
import { authMiddlewareee } from "../middleware";
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");
import { createPresignedPost } from '@aws-sdk/s3-presigned-post'
import { createTaskInput } from "../types";
import { forEachChild } from "typescript";
import { Connection, PublicKey } from "@solana/web3.js";
import dotenv from "dotenv";
dotenv.config();



const connection = new Connection(process.env.SOLANA_CONNECTION_URL!);


const PARENT_WALLET_ADDRESS = process.env.PARENT_WALLET_ADDRESS;
    

const DEFAULT_TITLE = "Select the most likable/clickable image ";

const s3Client = new S3Client({
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
    region: process.env.AWS_REGION!,
});


const router = Router();

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


router.get("/task", authMiddlewareee, async (req, res): Promise<void> => {
        // @ts-ignore
        const taskId: string = req.query.taskId;
        // @ts-ignore
        const userId: string = req.userId;

        console.log({
            user_id:Number(userId),
            id:Number(taskId)
        })

        // Fetch task details
        const taskDetails = await prismaClient.task.findFirst({
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
        const responses = await prismaClient.submission.findMany({
            where: {
                task_id: Number(taskId)
            },
            include: {
                option: true
            }
        });

        // Prepare result
        const result: Record<string, {
            count: number;
            option: {
                imageUrl: string;
            };
        }> = {};

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

    }
);


router.post("/task",authMiddlewareee,async (req, res): Promise<void> => {
      //@ts-ignore
      // Get userId from middleware
      const userId = req.userId; // Ensure userId is attached in middleware
  
      // Validate inputs using Zod
      const body = req.body;


      const parseData = createTaskInput.safeParse(body);

      const user = await prismaClient.user.findFirst({
        where: {
            id: userId
        }
    })
      
      if (!parseData.success) {
        res.status(411).json({ message: "You've sent the wrong inputs" });
        return;
      }

      const transaction = await connection.getTransaction(parseData.data.signature, {
        maxSupportedTransactionVersion: 1
      });

      console.log(transaction);
      

      if ((transaction?.meta?.postBalances[1] ?? 0) - (transaction?.meta?.preBalances[1] ?? 0) !== 100000000) {
         res.status(411).json({
            message: "Transaction signature/amount incorrect"
        });
        return;
    }

      if (transaction?.transaction.message.getAccountKeys().get(1)?.toString() !== PARENT_WALLET_ADDRESS) {
           res.status(411).json({
              message: "Transaction sent to wrong address"
          });
          return;
      }

      if (transaction?.transaction.message.getAccountKeys().get(0)?.toString() !== user?.address) {
        res.status(411).json({
           message: "Transaction sent to wrong address"
        });
         return;
      }

      
      let response = await prismaClient.$transaction(async tx => {

        const response = await tx.task.create({
            data: {
                title: parseData.data.title ?? DEFAULT_TITLE,
                amount: 0.1 * TOTAL_DECIMALS,
                //TODO: Signature should be unique in the table else people can reuse a signature
                signature: parseData.data.signature,
                user_id: userId
            }
        });
  
          // Create related options
          await tx.option.createMany({
            data: parseData.data.options.map(x => ({
                image_url: x.imageUrl,
                task_id: response.id
            }))
        })

        return response;

    })
  
    res.json({
      id: response.id
  })

})
  


router.get("/presignedUrl",authMiddlewareee , async (req,res )=>{
    //@ts-ignore
    const userId = req.userId;
    
    // const command = new PutObjectCommand({
    //     Bucket: "decentralized-turkk",
    //     Key: `turk/${userId}/${Math.random()}/image.png`,
    //     ContentType:"img/jpeg"
    //   })
      
    const { url, fields } = await createPresignedPost(s3Client, {
        Bucket: process.env.AWS_BUCKET_NAME!,
        Key: `turk/${userId}/${Math.random()}/image.jpg`,
        Conditions: [
          ['content-length-range', 0, 5 * 1024 * 1024] // 5 MB max
        ],
        Expires: 3600
    });
      
      console.log({url,fields})

      res.json({
        preSignedUrl: url,
        fields
      })
})


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
router.post("/signin", async (req, res) => {
    const { publicKey, signature } = req.body;
    const message = new TextEncoder().encode("Sign into mechanical turks");

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

    const existingUser = await prismaClient.user.findFirst({
        where: {
            address: publicKey
        }
    })

    if (existingUser) {
        const token = jwt.sign({
            userId: existingUser.id
        }, process.env.JWT_SECRET!)

        res.json({
            token
        })
    } else {
        const user = await prismaClient.user.create({
            data: {
                address: publicKey,
            }
        })

        const token = jwt.sign({
            userId: user.id
        }, process.env.JWT_SECRET!)

        res.json({
            token
        })
    }
});


export default router;