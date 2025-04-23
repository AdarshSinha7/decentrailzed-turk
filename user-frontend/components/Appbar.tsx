// "use client";
// import {
//     WalletDisconnectButton,
//     WalletMultiButton
// } from '@solana/wallet-adapter-react-ui';
// import { useWallet } from '@solana/wallet-adapter-react';
// import { useEffect } from 'react';
// import axios from 'axios';
// import { BACKEND_URL } from '@/utils';

// export const Appbar = () => {
//     const { publicKey , signMessage} = useWallet();

//     async function signAndSend() {
//         if (!publicKey) {
//             return;
//         }
//         const message = new TextEncoder().encode("Sign into mechanical turks");
//         const signature = await signMessage?.(message);
//         console.log(signature)
//         console.log(publicKey)
//         const response = await axios.post(`${BACKEND_URL}/v1/user/signin`, {
//             signature,
//             publicKey: publicKey?.toString()
//         });

//         localStorage.setItem("token", response.data.token);
//     }

//     useEffect(() => {
//         signAndSend()
//     }, [publicKey]);

//     return <div className="flex justify-between border-b pb-2 pt-2">
//         <div className="text-2xl pl-4 flex justify-center pt-3">
//             Turkify
//         </div>
//         <div className="text-xl pr-4 pb-2">
//             {publicKey  ? <WalletDisconnectButton /> : <WalletMultiButton />}
//         </div>
//     </div>
// }
"use client";

import {
    WalletDisconnectButton,
    WalletMultiButton
} from '@solana/wallet-adapter-react-ui';
import { useWallet } from '@solana/wallet-adapter-react';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { BACKEND_URL } from '@/utils';

export const Appbar = () => {
    const { publicKey, signMessage } = useWallet();
    const [hasMounted, setHasMounted] = useState(false);

    useEffect(() => {
        setHasMounted(true);
    }, []);

    useEffect(() => {
        const signAndSend = async () => {
            if (!publicKey || !signMessage) return;

            const message = new TextEncoder().encode("Sign into mechanical turks");
            try {
                const signature = await signMessage(message);
                const response = await axios.post(`${BACKEND_URL}/v1/user/signin`, {
                    signature,
                    publicKey: publicKey.toString()
                });

                localStorage.setItem("token", response.data.token);
                console.log("Signed in:", response.data);
            } catch (error) {
                console.error("Signature failed:", error);
            }
        };

        if (hasMounted) {
            signAndSend();
        }
    }, [publicKey, signMessage, hasMounted]);

    if (!hasMounted) return null; // Prevent SSR mismatch

    return (
        <div className="flex justify-between border-b pb-2 pt-2">
            <div className="text-2xl pl-4 flex justify-center pt-3">
                Turkify
            </div>
            <div className="text-xl pr-4 pb-2">
                {publicKey ? <WalletDisconnectButton /> : <WalletMultiButton />}
            </div>
        </div>
    );
};
