"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Connection, PublicKey } from "@solana/web3.js";
import {
  registerUserForUBI,
  isUserRegistered,
  RPC_URL,
  NETWORK,
} from "@/utils/ubiContract";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, Gift } from "lucide-react";

interface ClaimUBIButtonProps {
  userWalletAddress: string | null | undefined;
  onSuccess?: (signature: string) => void;
  variant?: "default" | "outline" | "ghost" | "link" | "destructive" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  showStatus?: boolean;
}

export function ClaimUBIButton({
  userWalletAddress,
  onSuccess,
  variant = "default",
  size = "default",
  className = "",
  showStatus = true,
}: ClaimUBIButtonProps) {
  const [loading, setLoading] = useState(false);
  const [isRegistered, setIsRegistered] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);
  const [phantomAddress, setPhantomAddress] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Check Phantom wallet connection directly
  useEffect(() => {
    const checkPhantomConnection = async () => {
      if (typeof window !== "undefined" && (window as any).solana?.isPhantom) {
        try {
          const provider = (window as any).solana;
          if (provider.isConnected) {
            const address = provider.publicKey?.toString();
            setPhantomAddress(address || null);
          } else {
            setPhantomAddress(null);
          }
          
          // Listen for connection changes
          provider.on("connect", () => {
            const addr = provider.publicKey?.toString();
            setPhantomAddress(addr || null);
          });
          
          provider.on("disconnect", () => {
            setPhantomAddress(null);
          });
        } catch (error) {
          console.error("Error checking Phantom connection:", error);
          setPhantomAddress(null);
        }
      } else {
        setPhantomAddress(null);
      }
    };
    
    checkPhantomConnection();
  }, []);

  // Check if user is already registered on mount and when wallet address changes
  useEffect(() => {
    // Use Phantom address if available, otherwise use userWalletAddress from props
    const effectiveAddress = phantomAddress || userWalletAddress;
    if (effectiveAddress) {
      checkRegistrationStatus(effectiveAddress);
    } else {
      setChecking(false);
      setIsRegistered(null);
    }
    
    // Timeout to prevent stuck in "Checking..." state
    const timeout = setTimeout(() => {
      if (checking) {
        console.warn("Registration check timed out, showing button anyway");
        setChecking(false);
      }
    }, 5000); // 5 second timeout
    
    return () => clearTimeout(timeout);
  }, [userWalletAddress, phantomAddress]);

  const checkRegistrationStatus = async (walletAddress?: string) => {
    const addressToCheck = walletAddress || phantomAddress || userWalletAddress;
    
    if (!addressToCheck) {
      setChecking(false);
      setIsRegistered(null);
      return;
    }

    try {
      const connection = new Connection(RPC_URL, "confirmed");
      const userPublicKey = new PublicKey(addressToCheck);

      // No wallet needed for checking registration status
      const registered = await isUserRegistered(
        connection,
        null, // Wallet not needed for manual account fetching
        userPublicKey
      );
      setIsRegistered(registered);
    } catch (error) {
      console.error("Error checking registration:", error);
      // On error, assume not registered so user can try to claim
      setIsRegistered(false);
    } finally {
      setChecking(false);
    }
  };

  const handleClaimUBI = async () => {
    // Use Phantom address if available, otherwise use userWalletAddress from props
    const effectiveAddress = phantomAddress || userWalletAddress;
    
    if (!effectiveAddress) {
      toast({
        title: "Error",
        description: "Wallet address not found. Please connect your wallet.",
        variant: "destructive",
      });
      return;
    }

    // Check if Phantom is installed
    if (typeof window === "undefined" || !(window as any).solana?.isPhantom) {
      toast({
        title: "Phantom Wallet Required",
        description: "Please install Phantom wallet to claim UBI tokens.",
        variant: "destructive",
      });
      return;
    }

    const phantomProvider = (window as any).solana;

    // Check if wallet is connected
    if (!phantomProvider.isConnected) {
      try {
        await phantomProvider.connect();
        // Update phantom address after connection
        const addr = phantomProvider.publicKey?.toString();
        setPhantomAddress(addr || null);
      } catch (error: any) {
        toast({
          title: "Connection Failed",
          description: error.message || "Please connect your Phantom wallet.",
          variant: "destructive",
        });
        return;
      }
    }

    // Get the currently connected address
    const connectedAddress = phantomProvider.publicKey?.toString();
    
    // Verify connected wallet matches (either from props or Phantom)
    if (connectedAddress !== effectiveAddress) {
      toast({
        title: "Wallet Mismatch",
        description: userWalletAddress 
          ? "Please connect the wallet linked to your account."
          : "Connected wallet doesn't match. Please reconnect.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const signature = await registerUserForUBI(
        connectedAddress, // Use the actually connected address
        phantomProvider
      );

      toast({
        title: "Success! 🎉",
        description: "You've received 20 Mintyn tokens!",
      });

      if (onSuccess) {
        onSuccess(signature);
      }

      // Refresh registration status
      await checkRegistrationStatus(connectedAddress);
    } catch (error: any) {
      console.error("Error claiming UBI:", error);

      let errorMessage = "Failed to claim UBI tokens. Please try again.";

      if (error.message?.includes("already received") || error.message?.includes("already registered")) {
        errorMessage = "You have already received your UBI tokens!";
        setIsRegistered(true);
      } else if (error.message?.includes("insufficient")) {
        errorMessage = "Treasury has insufficient balance. Please contact support.";
      } else if (error.message?.includes("cancelled") || error.message?.includes("rejected")) {
        errorMessage = "Transaction was cancelled.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <Button disabled variant={variant} size={size} className={className}>
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        Checking...
      </Button>
    );
  }

  if (isRegistered && showStatus) {
    return (
      <Button
        disabled
        variant="secondary"
        size={size}
        className={`${className} bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900 dark:text-green-200`}
      >
        <CheckCircle2 className="w-4 h-4 mr-2" />
        UBI Already Claimed
      </Button>
    );
  }

  // Use Phantom address if available, otherwise use userWalletAddress from props
  const effectiveAddress = phantomAddress || userWalletAddress;
  
  if (!effectiveAddress) {
    return (
      <Button disabled variant={variant} size={size} className={className}>
        Connect Wallet First
      </Button>
    );
  }

  return (
    <Button
      onClick={handleClaimUBI}
      disabled={loading || !effectiveAddress}
      variant={variant}
      size={size}
      className={className}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Processing...
        </>
      ) : (
        <>
          <Gift className="w-4 h-4 mr-2" />
          Claim 20 Mintyn UBI
        </>
      )}
    </Button>
  );
}

