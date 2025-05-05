import { Connection, PublicKey, Transaction, SystemProgram } from "@solana/web3.js";

const connection = new Connection("https://api.mainnet-beta.solana.com");

const sendSol = async (receiver: string, amount: number) => {
    if (!window.solana || !window.solana.isPhantom) {
        console.log("Phantom wallet not found!");
        return;
    }

    try {
        const sender = window.solana.publicKey;
        const transaction = new Transaction().add(
            SystemProgram.transfer({
                fromPubkey: sender,
                toPubkey: new PublicKey(receiver),
                lamports: amount * 10 ** 9, // Convert SOL to lamports
            })
        );

        transaction.feePayer = sender;
        const { blockhash } = await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;

        const signedTransaction = await window.solana.signTransaction(transaction);
        const txId = await connection.sendRawTransaction(signedTransaction.serialize());

        console.log("Transaction sent: https://solscan.io/tx/" + txId);
    } catch (err) {
        console.error("Transaction failed:", err);
    }
};
export default sendSol;