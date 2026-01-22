"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { registerUserForUBI, isUserRegistered, RPC_URL } from "@/utils/ubiContract";
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

  // Check if user is already registered on mount and when wallet address changes
  useEffect(() => {
    // Use userWalletAddress from props (browser-wallet connection removed)
    const effectiveAddress = userWalletAddress || null;
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
      // Our ubiContract functions are now stubbed; call safely without requiring Connection/PublicKey
      const registered = await isUserRegistered(null as any, null as any, addressToCheck as any);
      setIsRegistered(registered);
    } catch (error) {
      console.error("Error checking registration:", error);
      setIsRegistered(false);
    } finally {
      setChecking(false);
    }
  };

  const handleClaimUBI = async () => {
    // Wallet-based claiming removed from UI. Direct claiming via browser wallet has been disabled.
    toast({
      title: "Action Disabled",
      description: "Wallet-based claiming via browser wallets was removed. Please use backend or admin flow to claim UBI.",
      variant: "destructive",
    });
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

