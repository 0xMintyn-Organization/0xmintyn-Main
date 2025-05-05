/* eslint-disable @typescript-eslint/no-explicit-any */
import { setWalletAddress } from "@/redux/features/auth/authSlice";
import {
    Connection,
    PublicKey
} from "@solana/web3.js";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";

declare global {
    interface Window {
        solana?: any;
    }
}

const SOLANA_NETWORK = "https://api.mainnet-beta.solana.com";

const ConnectAccount = () => {
    const [publicKey, setPublicKey] = useState<string | null>(null);
    const [balance, setBalance] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const dispatch = useDispatch();

    const getWalletBalance = async (wallet: PublicKey) => {
        try {
            const connection = new Connection(SOLANA_NETWORK);
            const lamports = await connection.getBalance(wallet);
            setBalance(lamports / 10 ** 9);
        } catch (err) {
            console.error("Failed to fetch balance:", err);
            setError("Unable to fetch balance");
        }
    };

    useEffect(() => {
        autoConnectWallet();
    }, []);

  

    const autoConnectWallet = async () => {
        if (window.solana?.isPhantom) {
            try {
                const response = await window.solana.connect({ onlyIfTrusted: true });
                const wallet = response.publicKey.toString();
                setPublicKey(wallet);
                dispatch(setWalletAddress({ walletAddress: wallet }));
                localStorage.setItem("phantom_wallet", wallet);
            } catch {
                console.warn("Auto-connect skipped.");
            }
        }
    };

    const connectPhantomWallet = async () => {
        if (!window.solana?.isPhantom) {
            setError("Phantom wallet not found. Please install it.");
            return;
        }

        try {
            setLoading(true);
            const response = await window.solana.connect();
            const wallet = response.publicKey.toString();
            setPublicKey(wallet);
            dispatch(setWalletAddress({ walletAddress: wallet }));
            localStorage.setItem("phantom_wallet", wallet);
            setError(null);
        } catch (err) {
            console.error("Connection failed:", err);
            setError("Wallet connection failed.");
        } finally {
            setLoading(false);
        }
    };

    const disconnectWallet = async () => {
        if (window.solana?.isConnected) {
            await window.solana.disconnect();
            setPublicKey(null);
            setBalance(null);
            localStorage.removeItem("phantom_wallet");
            dispatch(setWalletAddress({ walletAddress: null }));
            console.log("Wallet disconnected.");
        }
    };

    return (
        <div style={{ padding: "1rem", fontFamily: "monospace" }}>
            {!publicKey ? (
                <button onClick={connectPhantomWallet} disabled={loading}>
                    {loading ? "Connecting..." : "Connect Phantom Wallet"}
                </button>
            ) : (
                <>
                    <p>
                        <strong>Connected Wallet:</strong><br />
                        {publicKey.slice(0, 6)}...{publicKey.slice(-4)}
                    </p>

                    {balance !== null && (
                        <p>
                            <strong>Balance:</strong> {balance.toFixed(4)} SOL{" "}
                            <button
                                onClick={() =>
                                    getWalletBalance(new PublicKey(publicKey!))
                                }
                                style={{ marginLeft: "10px" }}
                            >
                                🔄 Refresh
                            </button>
                        </p>
                    )}

                    <button onClick={disconnectWallet}>Disconnect</button>
                </>
            )}

            {error && <p style={{ color: "red" }}>{error}</p>}
        </div>
    );
};

export default ConnectAccount;
