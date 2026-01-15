"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  initializeUbiProgram, 
  isUbiProgramInitialized, 
  registerUserForUBI,
  RPC_URL,
  UBI_PROGRAM_ID 
} from "@/utils/ubiContract";
import { AutoFundTreasury } from "@/components/admin/AutoFundTreasury";
import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import { 
  TOKEN_PROGRAM_ID, 
  getAssociatedTokenAddress, 
  getAccount, 
  createTransferInstruction,
  getMint
} from "@solana/spl-token";
import { MINTYN_MINT } from "@/utils/ubiContract";
import { useToast } from "@/hooks/use-toast";

export default function TestUBIPage() {
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [isInitialized, setIsInitialized] = useState<boolean | null>(null);
  const [authorityAddress, setAuthorityAddress] = useState<string | null>(null);
  const { toast } = useToast();

  // Get authority address from Phantom wallet
  useEffect(() => {
    const checkPhantom = async () => {
      if (typeof window !== "undefined" && (window as any).solana?.isPhantom) {
        const phantom = (window as any).solana;
        if (phantom.isConnected) {
          setAuthorityAddress(phantom.publicKey?.toString() || null);
        }
        
        // Listen for connection changes
        phantom.on("connect", () => {
          setAuthorityAddress(phantom.publicKey?.toString() || null);
        });
        
        phantom.on("disconnect", () => {
          setAuthorityAddress(null);
        });
      }
    };
    
    checkPhantom();
  }, []);

  const checkStatus = async () => {
    setChecking(true);
    try {
      const connection = new Connection(RPC_URL, "confirmed");
      const initialized = await isUbiProgramInitialized(connection);
      setIsInitialized(initialized);
      
      toast({
        title: initialized ? "✅ Program Initialized" : "❌ Not Initialized",
        description: initialized 
          ? "The UBI program is ready for user registration."
          : "The UBI program needs to be initialized first.",
      });
    } catch (error: any) {
      console.error("Error checking status:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setChecking(false);
    }
  };

  const handleInitialize = async () => {
    if (typeof window === "undefined" || !(window as any).solana?.isPhantom) {
      toast({
        title: "Phantom Required",
        description: "Please install Phantom wallet.",
        variant: "destructive",
      });
      return;
    }

    const phantom = (window as any).solana;
    if (!phantom.isConnected) {
      await phantom.connect();
    }

    const authorityAddress = phantom.publicKey.toString();
    setLoading(true);

    try {
      const signature = await initializeUbiProgram(authorityAddress, phantom);
      toast({
        title: "Success! 🎉",
        description: "UBI program initialized successfully!",
      });
      await checkStatus();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFundTreasury = async () => {
    if (typeof window === "undefined" || !(window as any).solana?.isPhantom) {
      toast({
        title: "Phantom Required",
        description: "Please install Phantom wallet.",
        variant: "destructive",
      });
      return;
    }

    const phantom = (window as any).solana;
    if (!phantom.isConnected) {
      await phantom.connect();
    }

    const authorityAddress = phantom.publicKey.toString();
    setLoading(true);

    try {
      const connection = new Connection(RPC_URL, "confirmed");
      const authorityPublicKey = new PublicKey(authorityAddress);
      
      // Derive treasury PDA
      const UBI_PROGRAM_SEED = Buffer.from("ubi_program");
      const TREASURY_SEED = Buffer.from("treasury");
      const [treasury] = PublicKey.findProgramAddressSync(
        [UBI_PROGRAM_SEED, TREASURY_SEED],
        UBI_PROGRAM_ID
      );

      // Get authority's token account
      const authorityTokenAccount = await getAssociatedTokenAddress(
        MINTYN_MINT,
        authorityPublicKey
      );

      // Check authority balance
      let balance = 0;
      let mintInfo;
      try {
        const authorityAccount = await getAccount(connection, authorityTokenAccount);
        mintInfo = await getMint(connection, MINTYN_MINT);
        balance = Number(authorityAccount.amount) / Math.pow(10, mintInfo.decimals);
        
        if (balance < 20) {
          toast({
            title: "Insufficient Balance",
            description: `You need at least 20 Mintyn tokens (enough for 1 user). Current balance: ${balance.toFixed(2)}`,
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
      } catch (e) {
        toast({
          title: "Error",
          description: "You don't have a Mintyn token account. You need Mintyn tokens first!",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Transfer amount: Use all available balance (or at least 20 tokens for 1 user)
      // Leave a small buffer for transaction fees
      const availableBalance = balance - 0.1; // Leave 0.1 token buffer
      const transferAmount = Math.max(
        Math.floor(availableBalance * Math.pow(10, mintInfo.decimals)),
        20_000_000_000 // Minimum 20 tokens (1 user)
      );
      
      const tokensToTransfer = transferAmount / Math.pow(10, mintInfo.decimals);
      const usersSupported = Math.floor(tokensToTransfer / 20);

      // Create transfer instruction
      const transferIx = createTransferInstruction(
        authorityTokenAccount, // from
        treasury, // to
        authorityPublicKey, // authority
        transferAmount, // amount
        [], // multiSigners
        TOKEN_PROGRAM_ID
      );

      const transaction = new Transaction().add(transferIx);
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = authorityPublicKey;

      const signedTx = await phantom.signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signedTx.serialize(), { 
        skipPreflight: true, 
        maxRetries: 3 
      });

      await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, "confirmed");

      // Check treasury balance
      const treasuryAccount = await getAccount(connection, treasury);
      const treasuryBalance = Number(treasuryAccount.amount) / Math.pow(10, mintInfo.decimals);

      toast({
        title: "Success! 🎉",
        description: `Treasury funded with ${tokensToTransfer.toFixed(2)} tokens! This is enough for ${usersSupported} user${usersSupported !== 1 ? 's' : ''}.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTestRegister = async () => {
    if (typeof window === "undefined" || !(window as any).solana?.isPhantom) {
      toast({
        title: "Phantom Required",
        description: "Please install Phantom wallet.",
        variant: "destructive",
      });
      return;
    }

    const phantom = (window as any).solana;
    if (!phantom.isConnected) {
      await phantom.connect();
    }

    const userAddress = phantom.publicKey.toString();
    setLoading(true);

    try {
      const signature = await registerUserForUBI(userAddress, phantom);
      toast({
        title: "Success! 🎉",
        description: "You've received 20 Mintyn tokens!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">UBI Program Test Page</h1>
      
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Program Status</CardTitle>
            <CardDescription>Check if the UBI program is initialized</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Program ID: <code className="text-xs">{UBI_PROGRAM_ID.toString()}</code>
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Network: <code className="text-xs">{RPC_URL.includes("devnet") ? "Devnet" : "Mainnet"}</code>
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={checkStatus} disabled={checking}>
                {checking ? "Checking..." : "Check Status"}
              </Button>
              {isInitialized !== null && (
                <div className={`px-4 py-2 rounded ${isInitialized ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                  {isInitialized ? "✅ Initialized" : "❌ Not Initialized"}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Initialize Program</CardTitle>
            <CardDescription>Initialize the UBI program (Authority only)</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleInitialize} 
              disabled={loading}
              className="w-full"
            >
              {loading ? "Initializing..." : "Initialize UBI Program"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fund Treasury</CardTitle>
            <CardDescription>Transfer Mintyn tokens to treasury (Required before users can claim)</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleFundTreasury} 
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {loading ? "Processing..." : "Fund Treasury (100 tokens)"}
            </Button>
            <p className="text-xs text-gray-500 mt-2">
              Note: You need Mintyn tokens in your wallet to fund the treasury
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Test User Registration</CardTitle>
            <CardDescription>Test claiming UBI tokens</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleTestRegister} 
              disabled={loading}
              className="w-full"
            >
              {loading ? "Processing..." : "Claim 20 Mintyn UBI"}
            </Button>
          </CardContent>
        </Card>

        <AutoFundTreasury authorityAddress={authorityAddress} />
      </div>
    </div>
  );
}

