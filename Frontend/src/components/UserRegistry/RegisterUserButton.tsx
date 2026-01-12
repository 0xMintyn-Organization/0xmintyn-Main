"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { PublicKey } from "@solana/web3.js";
import {
  registerUser,
  isUserRegistered,
  getUserAccount,
  RPC_URL,
} from "@/utils/userRegistryContract";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, UserPlus, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface RegisterUserButtonProps {
  userWalletAddress: string | null | undefined;
  platformUserId?: string; // MongoDB user ID
  onSuccess?: (signature: string) => void;
  variant?: "default" | "outline" | "ghost" | "link" | "destructive" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  showStatus?: boolean;
}

export function RegisterUserButton({
  userWalletAddress,
  platformUserId,
  onSuccess,
  variant = "default",
  size = "default",
  className = "",
  showStatus = true,
}: RegisterUserButtonProps) {
  const [loading, setLoading] = useState(false);
  const [isRegistered, setIsRegistered] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);
  const [phantomAddress, setPhantomAddress] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [platformId, setPlatformId] = useState(platformUserId || "");
  const { toast } = useToast();

  // Check Phantom wallet connection
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

  // Check registration status
  useEffect(() => {
    const effectiveAddress = phantomAddress || userWalletAddress;
    if (effectiveAddress) {
      checkRegistrationStatus(effectiveAddress);
    } else {
      setChecking(false);
      setIsRegistered(null);
    }

    const timeout = setTimeout(() => {
      if (checking) {
        setChecking(false);
      }
    }, 5000);

    return () => clearTimeout(timeout);
  }, [userWalletAddress, phantomAddress]);

  const checkRegistrationStatus = async (walletAddress: string) => {
    try {
      const registered = await isUserRegistered(walletAddress);
      setIsRegistered(registered);
    } catch (error) {
      console.error("Error checking registration:", error);
      setIsRegistered(false);
    } finally {
      setChecking(false);
    }
  };

  const handleRegister = async () => {
    const effectiveAddress = phantomAddress || userWalletAddress;

    if (!effectiveAddress) {
      toast({
        title: "Error",
        description: "Wallet address not found. Please connect your wallet.",
        variant: "destructive",
      });
      return;
    }

    if (!platformId.trim()) {
      toast({
        title: "Error",
        description: "Please enter your platform user ID.",
        variant: "destructive",
      });
      return;
    }

    if (typeof window === "undefined" || !(window as any).solana?.isPhantom) {
      toast({
        title: "Phantom Wallet Required",
        description: "Please install Phantom wallet to register on blockchain.",
        variant: "destructive",
      });
      return;
    }

    const phantomProvider = (window as any).solana;

    if (!phantomProvider.isConnected) {
      try {
        await phantomProvider.connect();
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

    const connectedAddress = phantomProvider.publicKey?.toString();

    if (connectedAddress !== effectiveAddress) {
      toast({
        title: "Wallet Mismatch",
        description: "Please connect the wallet linked to your account.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const signature = await registerUser(
        connectedAddress,
        phantomProvider,
        platformId
      );

      toast({
        title: "Success! 🎉",
        description: "You've been registered on the blockchain!",
      });

      if (onSuccess) {
        onSuccess(signature);
      }

      setOpen(false);
      await checkRegistrationStatus(connectedAddress);
    } catch (error: any) {
      console.error("Error registering user:", error);

      let errorMessage = "Failed to register. Please try again.";

      if (error.message?.includes("already registered") || error.message?.includes("already in use")) {
        errorMessage = "You are already registered on the blockchain!";
        setIsRegistered(true);
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
        Registered on Blockchain
      </Button>
    );
  }

  const effectiveAddress = phantomAddress || userWalletAddress;

  if (!effectiveAddress) {
    return (
      <Button disabled variant={variant} size={size} className={className}>
        <AlertCircle className="w-4 h-4 mr-2" />
        Connect Wallet First
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <UserPlus className="w-4 h-4 mr-2" />
          Register on Blockchain
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Register on Blockchain</DialogTitle>
          <DialogDescription>
            Register your wallet on the Solana blockchain to link it with your account.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="platformId">Platform User ID</Label>
            <Input
              id="platformId"
              value={platformId}
              onChange={(e) => setPlatformId(e.target.value)}
              placeholder="Enter your MongoDB user ID"
              disabled={!!platformUserId}
            />
            {platformUserId && (
              <p className="text-xs text-muted-foreground">
                Using your account ID: {platformUserId}
              </p>
            )}
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRegister} disabled={loading || !platformId}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Registering...
                </>
              ) : (
                "Register"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

