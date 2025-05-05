// "use client";
// import {
//     WalletDisconnectButton,
//     WalletMultiButton
// } from '@solana/wallet-adapter-react-ui';
// import { useWallet } from '@solana/wallet-adapter-react';
// import { useEffect, useState } from 'react';
// import axios from 'axios';
// import { BACKEND_URL } from '@/utils';

// export const Appbar = () => {
//     const { publicKey , signMessage} = useWallet();
//     const [balance, setBalance] = useState(0);

//     async function signAndSend() {
//         if (!publicKey) {
//             return;
//         }
//         const message = new TextEncoder().encode("Sign into mechanical turks as a worker");
//         const signature = await signMessage?.(message);
//         console.log(signature)
//         console.log(publicKey)
//         const response = await axios.post(`${BACKEND_URL}/v1/worker/signin`, {
//             signature,
//             publicKey: publicKey?.toString()
//         });

//         setBalance(response.data.amount)

//         localStorage.setItem("token", response.data.token);
//     }

//     useEffect(() => {
//         signAndSend()
//     }, [publicKey]);

//     return <div className="flex justify-between border-b pb-2 pt-2">
//         <div className="text-2xl pl-4 flex justify-center pt-2">
//             Turkify
//         </div>
//         <div className="text-xl pr-4 flex" >
//             <button onClick={() => {
//                 axios.post(`${BACKEND_URL}/v1/worker/payout`, {
                    
//                 }, {
//                     headers: {
//                         "Authorization": localStorage.getItem("token")
//                     }
//                 })
//             }} className="m-2 mr-4 text-white bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-300 font-medium rounded-full text-sm px-5 py-2.5 me-2 dark:bg-gray-800 dark:hover:bg-gray-700 dark:focus:ring-gray-700 dark:border-gray-700">Pay me out ({balance}) SOL</button>
//             {publicKey  ? <WalletDisconnectButton /> : <WalletMultiButton />}
//         </div>
//     </div>
// }
// "use client";
// import {
//     WalletDisconnectButton,
//     WalletMultiButton
// } from '@solana/wallet-adapter-react-ui';
// import { useWallet } from '@solana/wallet-adapter-react';
// import { useEffect, useState } from 'react';
// import axios from 'axios';
// import { BACKEND_URL } from '@/utils';

// export const Appbar = () => {
//     const { publicKey, signMessage } = useWallet();
//     const [balance, setBalance] = useState(0);
//     const [hasMounted, setHasMounted] = useState(false);

//     useEffect(() => {
//         setHasMounted(true);
//     }, []);

//     useEffect(() => {
//         const signAndSend = async () => {
//             if (!publicKey || !signMessage) return;

//             try {
//                 const message = new TextEncoder().encode("Sign into mechanical turks as a worker");
//                 const signature = await signMessage(message);

//                 const response = await axios.post(`${BACKEND_URL}/v1/worker/signin`, {
//                     signature,
//                     publicKey: publicKey.toString()
//                 });

//                 setBalance(response.data.amount);
//                 localStorage.setItem("token", response.data.token);
//             } catch (err) {
//                 console.error("Sign in error:", err);
//             }
//         };

//         if (hasMounted) {
//             signAndSend();
//         }
//     }, [publicKey, signMessage, hasMounted]);

//     if (!hasMounted) return null; // Prevent SSR mismatch

//     return (
//         <div className="flex justify-between border-b pb-2 pt-2">
//             <div className="text-2xl pl-4 flex justify-center pt-2">
//                 Turkify
//             </div>
//             <div className="text-xl pr-4 flex">
//                 <button
//                     onClick={() => {
//                         axios.post(`${BACKEND_URL}/v1/worker/payout`, {}, {
//                             headers: {
//                                 "Authorization": localStorage.getItem("token")
//                             }
//                         });
//                     }}
//                     className="m-2 mr-4 text-white bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-300 font-medium rounded-full text-sm px-5 py-2.5 me-2 dark:bg-gray-800 dark:hover:bg-gray-700 dark:focus:ring-gray-700 dark:border-gray-700"
//                 >
//                     Pay me out ({balance}) SOL
//                 </button>
//                 {publicKey ? <WalletDisconnectButton /> : <WalletMultiButton />}
//             </div>
//         </div>
//     );
// };
"use client";

import {
    WalletDisconnectButton,
    WalletMultiButton
} from '@solana/wallet-adapter-react-ui';
import { useWallet } from '@solana/wallet-adapter-react';
import { useEffect, useState } from 'react';
import axios, { AxiosError } from 'axios';
import { BACKEND_URL } from '@/utils';

interface ApiResponse {
    amount?: number;
    token?: string;
    message?: string;
    success?: boolean;
    signature?: string;
    error?: string;
    details?: string;
}

interface ApiErrorResponse {
    message?: string;
    error?: string;
    success?: boolean;
    details?: string;
}

export const Appbar = () => {
    const { publicKey, signMessage } = useWallet();
    const [balance, setBalance] = useState(0);
    const [hasMounted, setHasMounted] = useState(false);
    const [isPayoutLoading, setIsPayoutLoading] = useState(false);
    const [payoutError, setPayoutError] = useState<string | null>(null);
    const [payoutSuccess, setPayoutSuccess] = useState(false);
    const [debugInfo, setDebugInfo] = useState<string | null>(null);
    const [transactionLogs, setTransactionLogs] = useState<string[]>([]);
    const [showAdvancedDebug, setShowAdvancedDebug] = useState(false);

    useEffect(() => {
        setHasMounted(true);
    }, []);

    useEffect(() => {
        const signAndSend = async () => {
            if (!publicKey || !signMessage) return;

            try {
                const message = new TextEncoder().encode("Sign into mechanical turks as a worker");
                const signature = await signMessage(message);

                const response = await axios.post<ApiResponse>(`${BACKEND_URL}/v1/worker/signin`, {
                    signature,
                    publicKey: publicKey.toString()
                });

                if (response.data.amount !== undefined) {
                    setBalance(response.data.amount);
                }
                if (response.data.token) {
                    localStorage.setItem("token", response.data.token);
                }
            } catch (err) {
                console.error("Sign in error:", err);
                addToLogs("Sign in error: " + (err instanceof Error ? err.message : String(err)));
            }
        };

        if (hasMounted) {
            signAndSend();
        }
    }, [publicKey, signMessage, hasMounted]);

    const addToLogs = (message: string) => {
        setTransactionLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
    };

    const handlePayout = async () => {
        if (!publicKey) return;
        
        setIsPayoutLoading(true);
        setPayoutError(null);
        setPayoutSuccess(false);
        setDebugInfo(null);
        setTransactionLogs([]);

        addToLogs("Starting payout process...");
        addToLogs(`Wallet address: ${publicKey.toString()}`);
        addToLogs(`Balance to withdraw: ${balance} SOL`);

        try {
            console.log("Initiating payout request");
            
            // First, verify the token is available
            const token = localStorage.getItem("token");
            if (!token) {
                const tokenError = "Authentication token not found. Please reconnect your wallet.";
                addToLogs(`Error: ${tokenError}`);
                throw new Error(tokenError);
            }
            
            addToLogs("Token verified, sending payout request to backend...");
            
            // Request the backend to initiate payout
            const response = await axios.post<ApiResponse>(`${BACKEND_URL}/v1/worker/payout`, {
                publicKey: publicKey.toString()
            }, {
                headers: {
                    "Authorization": token
                }
            });

            console.log("Payout response:", response.data);
            addToLogs(`Received response from server. Status: ${response.status}`);
            addToLogs(`Response data: ${JSON.stringify(response.data)}`);
            
            // Check for errors even in 200 response
            if (response.data.success === false || 
                (response.data.message && response.data.message.toLowerCase().includes('fail')) ||
                response.data.error) {
                
                // Handle error in 200 response
                const errorMsg = response.data.message || response.data.error || "Transaction failed";
                const errorDetails = response.data.details || '';
                
                addToLogs(`Error detected in response: ${errorMsg}`);
                if (errorDetails) addToLogs(`Error details: ${errorDetails}`);
                
                setPayoutError(errorMsg);
                
                // Enhanced error display with details if available
                setDebugInfo(`
                    <div>
                        <p><strong>Transaction Failed</strong></p>
                        <p>Error: ${errorMsg}</p>
                        ${errorDetails ? `<p>Details: ${errorDetails}</p>` : ''}
                        <p>Please check with your administrator or try again later.</p>
                    </div>
                `);
                return;
            }
            
            // Handle successful transaction
            if (response.data.success === true) {
                addToLogs("Transaction marked as successful by server");
                
                if (response.data.signature) {
                    console.log("Transaction signature:", response.data.signature);
                    addToLogs(`Transaction signature: ${response.data.signature}`);
                    
                    // Generate explorer links
                    const explorerUrl = `https://explorer.solana.com/tx/${response.data.signature}`;
                    const mainnetUrl = `https://solscan.io/tx/${response.data.signature}`;
                    const devnetUrl = `https://solscan.io/tx/${response.data.signature}?cluster=devnet`;
                    
                    setDebugInfo(`
                        <div>
                            <p><strong>Transaction Successful!</strong></p>
                            <p>Signature: ${response.data.signature}</p>
                            <p>View transaction on:</p>
                            <ul class="list-disc ml-5">
                                <li><a href="${explorerUrl}" target="_blank" rel="noopener noreferrer" class="text-blue-500 underline">
                                    Solana Explorer
                                </a></li>
                                <li><a href="${mainnetUrl}" target="_blank" rel="noopener noreferrer" class="text-blue-500 underline">
                                    Solscan (Mainnet)
                                </a></li>
                                <li><a href="${devnetUrl}" target="_blank" rel="noopener noreferrer" class="text-blue-500 underline">
                                    Solscan (Devnet)
                                </a></li>
                            </ul>
                        </div>
                    `);
                }
                
                setPayoutSuccess(true);
                setBalance(0); // Update balance after successful payout
                setTimeout(() => setPayoutSuccess(false), 10000);
            } else {
                // Handle ambiguous response (no explicit success/failure)
                const msg = response.data.message || "Transaction processing";
                addToLogs(`Response status unclear: ${msg}`);
                setDebugInfo(`
                    <div>
                        <p><strong>Transaction Status</strong></p>
                        <p>${msg}</p>
                        <p>Please check your wallet for the transaction to confirm if it completed successfully.</p>
                    </div>
                `);
            }
        } catch (error) {
            // Handle network errors and Axios exceptions
            console.error("Payout error:", error);
            addToLogs("Caught exception during payout process");
            
            let errorMessage = "Network error. Please try again.";
            let errorDetails = "";
            
            if (axios.isAxiosError(error)) {
                const axiosError = error as AxiosError<ApiErrorResponse>;
                
                if (axiosError.response?.data) {
                    // Access the response data properly
                    errorMessage = axiosError.response.data.message || 
                                  axiosError.response.data.error || 
                                  axiosError.message || 
                                  errorMessage;
                    
                    errorDetails = JSON.stringify(axiosError.response.data, null, 2);
                    addToLogs(`HTTP Error: ${axiosError.response.status} - ${errorMessage}`);
                } else if (axiosError.request) {
                    // Request was made but no response received
                    errorMessage = "No response from server. The transaction might still be processing.";
                    errorDetails = "Request timeout or no response";
                    
                    addToLogs("Error: Request timeout or no response received");
                    
                    // Show a suggestion to check the wallet
                    errorMessage += " Please check your wallet for recent transactions.";
                } else {
                    // Error in setting up the request
                    errorMessage = "Failed to make request: " + axiosError.message;
                    addToLogs(`Request setup error: ${axiosError.message}`);
                }
                
                // Check if server is unreachable
                if (axiosError.code === 'ECONNREFUSED' || !axiosError.response) {
                    errorMessage = "Cannot connect to server. Please try again later.";
                    addToLogs("Error: Cannot connect to server");
                }
            } else if (error instanceof Error) {
                // Handle standard JavaScript Error objects
                errorMessage = error.message;
                errorDetails = error.stack || "";
                addToLogs(`JavaScript error: ${error.message}`);
                if (error.stack) {
                    addToLogs(`Stack trace: ${error.stack}`);
                }
            }
            
            setPayoutError(errorMessage);
            if (errorDetails) {
                setDebugInfo(`
                    <div>
                        <p><strong>Transaction Failed</strong></p>
                        <p>Error: ${errorMessage}</p>
                        <p>Technical Details:</p>
                        <pre class="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-32">${errorDetails}</pre>
                    </div>
                `);
            }
        } finally {
            setIsPayoutLoading(false);
            addToLogs("Payout process completed");
        }
    };

    const toggleAdvancedDebug = () => {
        setShowAdvancedDebug(!showAdvancedDebug);
    };

    if (!hasMounted) return null; // Prevent SSR mismatch

    return (
        <div className="flex flex-col w-full">
            <div className="flex justify-between border-b pb-2 pt-2">
                <div className="text-2xl pl-4 flex justify-center pt-2">
                    Turkify
                </div>
                <div className="text-xl pr-4 flex flex-col items-end">
                    <div className="flex items-center">
                        <button
                            onClick={handlePayout}
                            disabled={isPayoutLoading || balance <= 0}
                            className={`m-2 mr-4 text-white font-medium rounded-full text-sm px-5 py-2.5 me-2 
                                ${isPayoutLoading 
                                    ? 'bg-gray-400 cursor-not-allowed' 
                                    : balance <= 0
                                        ? 'bg-gray-400 cursor-not-allowed'
                                        : 'bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-300'}`}
                        >
                            {isPayoutLoading ? "Processing..." : `Pay me out (${balance}) SOL`}
                        </button>
                        {publicKey ? <WalletDisconnectButton /> : <WalletMultiButton />}
                    </div>
                    {payoutError && (
                        <div className="text-red-500 text-sm mr-6 max-w-md">
                            <span className="font-bold">Error:</span> {payoutError}
                        </div>
                    )}
                    {payoutSuccess && (
                        <div className="text-green-500 text-sm mr-6">
                            <span className="font-bold">Success!</span> Payout completed successfully.
                        </div>
                    )}
                    {debugInfo && (
                        <div 
                            className="text-gray-600 text-xs mr-6 mt-1 max-w-md overflow-hidden"
                            dangerouslySetInnerHTML={{ __html: debugInfo }}
                        />
                    )}
                    <button 
                        onClick={toggleAdvancedDebug}
                        className="text-gray-500 text-xs mt-2 underline"
                    >
                        {showAdvancedDebug ? "Hide Technical Details" : "Show Technical Details"}
                    </button>
                    
                    {/* Advanced debugging logs */}
                    {showAdvancedDebug && transactionLogs.length > 0 && (
                        <div className="bg-gray-100 p-3 rounded mt-2 max-w-md text-xs">
                            <h3 className="font-bold text-gray-700 mb-1">Transaction Logs:</h3>
                            <div className="max-h-40 overflow-y-auto">
                                {transactionLogs.map((log, index) => (
                                    <div key={index} className="text-gray-800 mb-1">{log}</div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};