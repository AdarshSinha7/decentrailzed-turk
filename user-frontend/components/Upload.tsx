// "use client";
// import { PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
// import { UploadImage } from "@/components/UploadImage";
// import { BACKEND_URL } from "@/utils";
// import axios from "axios";
// import { useRouter } from "next/navigation";
// import { useState } from "react";
// import { useWallet, useConnection } from '@solana/wallet-adapter-react';

// export const Upload = () => {
//     const [images, setImages] = useState<string[]>([]);
//     const [title, setTitle] = useState("");
//     const [txSignature, setTxSignature] = useState("");
//     const { publicKey, sendTransaction } = useWallet();
//     const { connection } = useConnection();
//     const router = useRouter();

//     // async function onSubmit() {
//     //     const response = await axios.post(`${BACKEND_URL}/v1/user/task`, {
//     //         options: images.map(image => ({
//     //             imageUrl: image,
//     //         })),
//     //         title,
//     //         signature: txSignature
//     //     }, {
//     //         headers: {
//     //             "Authorization": localStorage.getItem("token"),
//     //             "Content-Type": "application/json"
//     //         }
//     //     })

//     //     router.push(`/task/${response.data.id}`)
//     // }
//     async function onSubmit() {
//       // Create the data object
//       const requestData = {
//           options: images.map(image => ({
//               imageUrl: image,
//           })),
//           title,
//           signature: txSignature
//       };
      
//       try {
//           const response = await axios.post(
//               `${BACKEND_URL}/v1/user/task`, 
//               requestData, 
//               {
//                   headers: {
//                       "Authorization": localStorage.getItem("token"),
//                       "Content-Type": "application/json"
//                   }
//               }
//           );
          
//           router.push(`/task/${response.data.id}`);
//       } catch (error) {
//           console.error("Error submitting task:", error);
//           // Handle error appropriately
//       }
//   }
//     async function makePayment() {
//         try {
//           // Create the transaction
//           const transaction = new Transaction().add(
//             SystemProgram.transfer({
//               fromPubkey: publicKey!,
//               toPubkey: new PublicKey("32n9L9S2UfFhU2NViNGaaZ2dbg3hBSi1XKrsYu8KFKXz"),
//               lamports: 100000000,
//             })
//           );
      
//           // Get the latest blockhash
//           const { blockhash } = await connection.getLatestBlockhash();
//           transaction.recentBlockhash = blockhash;
//           transaction.feePayer = publicKey!;
      
//           // Send the transaction
//           const signature = await sendTransaction(transaction, connection);
//           console.log("Transaction sent with signature:", signature);
      
//           // Wait a reasonable time for the transaction to process
//           // instead of using confirmTransaction which uses signatureSubscribe
//           await new Promise(resolve => setTimeout(resolve, 5000));
      
//           // Optional: Check if transaction exists using getTransaction (doesn't use signatureSubscribe)
//           try {
//             const tx = await connection.getTransaction(signature);
//             if (tx) {
//               console.log("Transaction confirmed on-chain");
//             } else {
//               console.log("Transaction may still be processing");
//             }
//           } catch (checkError) {
//             console.log("Could not check transaction status, but likely succeeded");
//           }
      
//           // Set the signature regardless - since we know transfers are working
//           setTxSignature(signature);
//         } catch (error) {
//           console.error("Error sending transaction:", error);
//         }
//       }
//     // async function makePayment() {

//     //     const transaction = new Transaction().add(
//     //         SystemProgram.transfer({
//     //             fromPubkey: publicKey!,
//     //             toPubkey: new PublicKey("32n9L9S2UfFhU2NViNGaaZ2dbg3hBSi1XKrsYu8KFKXz"),
//     //             lamports: 100000000,
//     //         })
//     //     );

//     //     const {
//     //         context: { slot: minContextSlot },
//     //         value: { blockhash, lastValidBlockHeight }
//     //     } = await connection.getLatestBlockhashAndContext();

//     //     const signature = await sendTransaction(transaction, connection, { minContextSlot });

//     //     await connection.confirmTransaction({ blockhash, lastValidBlockHeight, signature });
//     //     setTxSignature(signature);
//     // }

//     return <div className="flex justify-center">
//         <div className="max-w-screen-lg w-full">
//             <div className="text-2xl text-left pt-20 w-full pl-4">
//                 Create a task
//             </div>

//             <label className="pl-4 block mt-2 text-md font-medium text-gray-900 text-black">Task details</label>

//             <input onChange={(e) => {
//                 setTitle(e.target.value);
//             }} type="text" id="first_name" className="ml-4 mt-1 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" placeholder="What is your task?" required />

//             <label className="pl-4 block mt-8 text-md font-medium text-gray-900 text-black">Add Images</label>
//             <div className="flex justify-center pt-4 max-w-screen-lg">
//             {images.map((image, index) => (
//   <UploadImage
//     key={image + index} // Combines URL and index to ensure uniqueness
//     image={image}
//     onImageAdded={(imageUrl) => {
//       setImages(i => [...i, imageUrl]);
//     }}
//   />
// ))}
//             </div>

//         <div className="ml-4 pt-2 flex justify-center">
//             <UploadImage onImageAdded={(imageUrl) => {
//                 setImages(i => [...i, imageUrl]);
//             }} />
//         </div>

//         <div className="flex justify-center">
//             <button onClick={txSignature ? onSubmit : makePayment} type="button" className="mt-4 text-white bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-300 font-medium rounded-full text-sm px-5 py-2.5 me-2 mb-2 dark:bg-gray-800 dark:hover:bg-gray-700 dark:focus:ring-gray-700 dark:border-gray-700">
//                 {txSignature ? "Submit Task" : "Pay 0.1 SOL"}
//             </button>
//         </div>
        
//       </div>
//     </div>
// }
// "use client";
// import { PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
// import { UploadImage } from "@/components/UploadImage";
// import { BACKEND_URL } from "@/utils";
// import axios, { AxiosError } from "axios";
// import { useRouter } from "next/navigation";
// import { useState } from "react";
// import { useWallet, useConnection } from '@solana/wallet-adapter-react';

// export const Upload = () => {
//     const [images, setImages] = useState<string[]>([]);
//     const [title, setTitle] = useState("");
//     const [txSignature, setTxSignature] = useState("");
//     const [isSubmitting, setIsSubmitting] = useState(false);
//     const [error, setError] = useState("");
//     const { publicKey, sendTransaction } = useWallet();
//     const { connection } = useConnection();
//     const router = useRouter();

//     async function onSubmit() {
//         // Check if we have the required data
//         const token = localStorage.getItem("token");
//         if (!token) {
//             setError("Authorization token not found");
//             return;
//         }

//         if (!txSignature) {
//             setError("Transaction signature not found");
//             await makePayment();
//             return;
//         }

//         // Create the data object
//         const requestData = {
//             options: images.map(image => ({
//                 imageUrl: image,
//             })),
//             title,
//             signature: txSignature
//         };
        
//         setIsSubmitting(true);
//         setError("");
        
//         try {
//             console.log("Submitting with data:", requestData);
            
//             const response = await axios({
//                 method: 'post',
//                 url: `${BACKEND_URL}/v1/user/task`,
//                 data: requestData,
//                 headers: {
//                     "Authorization": token,
//                     "Content-Type": "application/json"
//                 }
//             });
            
//             console.log("Success response:", response.data);
//             router.push(`/task/${response.data.id}`);
//         } catch (err) {
//             console.error("Error submitting task:", err);
//             // Type guard to check if error is an Axios error
//             const error = err as AxiosError;
//             // Log more details about the error
//             if (error.response) {
//                 console.error("Error response:", error.response.data);
//                 console.error("Status:", error.response.status);
//                 setError(`Submission failed: ${error.response.status} - ${error.response.statusText}`);
//             } else {
//                 setError("Failed to submit task. Please try again.");
//             }
//         } finally {
//             setIsSubmitting(false);
//         }
//     }

//     async function makePayment() {
//         setIsSubmitting(true);
//         setError("");
        
//         try {
//             // Create the transaction
//             const transaction = new Transaction().add(
//                 SystemProgram.transfer({
//                     fromPubkey: publicKey!,
//                     toPubkey: new PublicKey("32n9L9S2UfFhU2NViNGaaZ2dbg3hBSi1XKrsYu8KFKXz"),
//                     lamports: 100000000,
//                 })
//             );
        
//             // Get the latest blockhash
//             const { blockhash } = await connection.getLatestBlockhash();
//             transaction.recentBlockhash = blockhash;
//             transaction.feePayer = publicKey!;
        
//             // Send the transaction
//             const signature = await sendTransaction(transaction, connection);
//             console.log("Transaction sent with signature:", signature);
        
//             // Wait a reasonable time for the transaction to process
//             // instead of using confirmTransaction which uses signatureSubscribe
//             await new Promise(resolve => setTimeout(resolve, 5000));
        
//             // Optional: Check if transaction exists using getTransaction (doesn't use signatureSubscribe)
//             try {
//                 const tx = await connection.getTransaction(signature);
//                 if (tx) {
//                     console.log("Transaction confirmed on-chain");
//                 } else {
//                     console.log("Transaction may still be processing");
//                 }
//             } catch (checkError) {
//                 console.log("Could not check transaction status, but likely succeeded");
//             }
        
//             // Set the signature regardless - since we know transfers are working
//             setTxSignature(signature);
//         } catch (err) {
//             console.error("Error sending transaction:", err);
//             setError("Payment failed. Please try again.");
//         } finally {
//             setIsSubmitting(false);
//         }
//     }

//     // Explicit handler for the button click
//     const handleButtonClick = async () => {
//         if (isSubmitting) return; // Prevent multiple submissions
        
//         if (!txSignature) {
//             await makePayment();
//         } else {
//             await onSubmit();
//         }
//     };

//     return <div className="flex justify-center">
//         <div className="max-w-screen-lg w-full">
//             <div className="text-2xl text-left pt-20 w-full pl-4">
//                 Create a task
//             </div>

//             <label className="pl-4 block mt-2 text-md font-medium text-gray-900 text-black">Task details</label>

//             <input onChange={(e) => {
//                 setTitle(e.target.value);
//             }} type="text" id="first_name" className="ml-4 mt-1 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" placeholder="What is your task?" required />

//             <label className="pl-4 block mt-8 text-md font-medium text-gray-900 text-black">Add Images</label>
//             <div className="flex justify-center pt-4 max-w-screen-lg">
//                 {images.map((image, index) => (
//                     <UploadImage
//                         key={image + index} // Combines URL and index to ensure uniqueness
//                         image={image}
//                         onImageAdded={(imageUrl) => {
//                             setImages(i => [...i, imageUrl]);
//                         }}
//                     />
//                 ))}
//             </div>

//             <div className="ml-4 pt-2 flex justify-center">
//                 <UploadImage onImageAdded={(imageUrl) => {
//                     setImages(i => [...i, imageUrl]);
//                 }} />
//             </div>

//             {error && (
//                 <div className="text-red-500 text-center mt-2">
//                     {error}
//                 </div>
//             )}

//             <div className="flex justify-center">
//                 <button 
//                     onClick={handleButtonClick}
//                     disabled={isSubmitting} 
//                     type="button" 
//                     className={`mt-4 text-white bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-300 font-medium rounded-full text-sm px-5 py-2.5 me-2 mb-2 dark:bg-gray-800 dark:hover:bg-gray-700 dark:focus:ring-gray-700 dark:border-gray-700 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
//                 >
//                     {isSubmitting ? 'Processing...' : (txSignature ? "Submit Task" : "Pay 0.1 SOL")}
//                 </button>
//             </div>
//         </div>
//     </div>
// }
"use client";
import { PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import { UploadImage } from "@/components/UploadImage";
import { BACKEND_URL } from "@/utils";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useWallet, useConnection } from '@solana/wallet-adapter-react';

export const Upload = () => {
    const [images, setImages] = useState<string[]>([]);
    const [title, setTitle] = useState("");
    const [txSignature, setTxSignature] = useState("");
    const [txConfirmed, setTxConfirmed] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    const { publicKey, sendTransaction } = useWallet();
    const { connection } = useConnection();
    const router = useRouter();

    // Monitor transaction confirmation
    useEffect(() => {
        if (!txSignature) return;
        
        let cancelled = false;
        
        const checkTransaction = async () => {
            try {
                console.log("Checking transaction confirmation...");
                const tx = await connection.getTransaction(txSignature);
                
                if (tx && !cancelled) {
                    console.log("Transaction confirmed!");
                    setTxConfirmed(true);
                } else if (!cancelled) {
                    // Try again in 2 seconds
                    setTimeout(checkTransaction, 2000);
                }
            } catch (err) {
                console.log("Error checking transaction:", err);
                if (!cancelled) {
                    // Try again in 2 seconds
                    setTimeout(checkTransaction, 2000);
                }
            }
        };
        
        checkTransaction();
        
        return () => {
            cancelled = true;
        };
    }, [txSignature, connection]);

    async function handleSubmitTask() {
        const token = localStorage.getItem("token");
        if (!token) {
            setError("Authorization token not found");
            return;
        }

        if (!txSignature) {
            setError("Transaction signature not found");
            return;
        }
        
        if (!txConfirmed) {
            setError("Please wait for transaction confirmation before submitting");
            return;
        }

        setIsSubmitting(true);
        setError("");
        
        try {
            // Create the data object
            const requestData = {
                options: images.map(image => ({
                    imageUrl: image,
                })),
                title,
                signature: txSignature
            };
            
            console.log("Submitting with data:", requestData);
            
            // Use the Fetch API
            const response = await fetch(`${BACKEND_URL}/v1/user/task`, {
                method: 'POST',
                headers: {
                    "Authorization": token,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(requestData)
            });
            
            if (!response.ok) {
                let errorText = await response.text();
                try {
                    // Try to parse error as JSON
                    const errorJson = JSON.parse(errorText);
                    errorText = errorJson.message || errorText;
                } catch (e) {
                    // Keep as text if not valid JSON
                }
                throw new Error(`Server error: ${errorText}`);
            }
            
            const data = await response.json();
            console.log("Success response:", data);
            
            // Only redirect after successful submission
            router.push(`/task/${data.id}`);
        } catch (err) {
            console.error("Error submitting task:", err);
            setError(`Submission failed: ${err instanceof Error ? err.message : String(err)}`);
        } finally {
            setIsSubmitting(false);
        }
    }

    async function makePayment() {
        if (!publicKey) {
            setError("Wallet not connected");
            return;
        }
        
        setIsSubmitting(true);
        setError("");
        setTxConfirmed(false);
        
        try {
            // Create the transaction
            const transaction = new Transaction().add(
                SystemProgram.transfer({
                    fromPubkey: publicKey,
                    toPubkey: new PublicKey("32n9L9S2UfFhU2NViNGaaZ2dbg3hBSi1XKrsYu8KFKXz"),
                    lamports: 100000000, // 0.1 SOL
                })
            );
        
            // Get the latest blockhash
            const { blockhash } = await connection.getLatestBlockhash();
            transaction.recentBlockhash = blockhash;
            transaction.feePayer = publicKey;
        
            // Send the transaction
            const signature = await sendTransaction(transaction, connection);
            console.log("Transaction sent with signature:", signature);
            setTxSignature(signature);
            
            // Confirmation will be handled by useEffect
            setError("Payment sent! Waiting for blockchain confirmation...");
            
        } catch (err) {
            console.error("Error sending transaction:", err);
            setError(`Payment failed: ${err instanceof Error ? err.message : String(err)}`);
        } finally {
            setIsSubmitting(false);
        }
    }

    // Button click handler
    const handleButtonClick = async () => {
        if (isSubmitting) return;
        
        if (!txSignature) {
            await makePayment();
        } else if (txConfirmed) {
            await handleSubmitTask();
        } else {
            setError("Please wait for transaction confirmation before submitting");
        }
    };

    // Validate if the form can be submitted
    const isValid = title.trim() !== "" && images.length > 0;

    // Determine button text
    const getButtonText = () => {
        if (isSubmitting) return 'Processing...';
        if (!txSignature) return 'Pay 0.1 SOL';
        if (!txConfirmed) return 'Waiting for confirmation...';
        return 'Submit Task';
    };

    return (
        <div className="flex justify-center">
            <div className="max-w-screen-lg w-full">
                <div className="text-2xl text-left pt-20 w-full pl-4">
                    Create a task
                </div>

                <label className="pl-4 block mt-2 text-md font-medium text-gray-900 text-black">
                    Task details
                </label>

                <input 
                    onChange={(e) => setTitle(e.target.value)} 
                    value={title}
                    type="text" 
                    id="task_title" 
                    className="ml-4 mt-1 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" 
                    placeholder="What is your task?" 
                    required 
                />

                <label className="pl-4 block mt-8 text-md font-medium text-gray-900 text-black">
                    Add Images
                </label>
                
                <div className="flex justify-center pt-4 max-w-screen-lg">
                    {images.map((image, index) => (
                        <UploadImage
                            key={`${image}-${index}`}
                            image={image}
                            onImageAdded={(imageUrl) => {
                                setImages(i => [...i, imageUrl]);
                            }}
                        />
                    ))}
                </div>

                <div className="ml-4 pt-2 flex justify-center">
                    <UploadImage 
                        onImageAdded={(imageUrl) => {
                            setImages(i => [...i, imageUrl]);
                        }} 
                    />
                </div>

                {error && (
                    <div className={`text-center mt-2 p-2 rounded ${error.includes('Payment sent') ? 'text-blue-700 bg-blue-50' : 'text-red-500 bg-red-50'}`}>
                        {error}
                    </div>
                )}

                {txSignature && !txConfirmed && (
                    <div className="text-center mt-2">
                        <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" role="status">
                            <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">Loading...</span>
                        </div>
                        <span className="ml-2">Waiting for transaction confirmation...</span>
                    </div>
                )}

                <div className="flex justify-center mt-4">
                    <button 
                        onClick={handleButtonClick}
                        disabled={isSubmitting || (txSignature && !txConfirmed) || !isValid} 
                        type="button" 
                        className={`text-white bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-300 font-medium rounded-full text-sm px-5 py-2.5 me-2 mb-2 dark:bg-gray-800 dark:hover:bg-gray-700 dark:focus:ring-gray-700 dark:border-gray-700 ${(isSubmitting || (txSignature && !txConfirmed) || !isValid) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {getButtonText()}
                    </button>
                </div>
            </div>
        </div>
    );
}