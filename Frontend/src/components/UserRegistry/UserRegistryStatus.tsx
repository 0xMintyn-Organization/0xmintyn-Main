"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Connection, PublicKey } from "@solana/web3.js";
import { getUserAccount, RPC_URL } from "@/utils/userRegistryContract";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle2, XCircle, Calendar, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";

interface UserRegistryStatusProps {
  userWalletAddress: string | null | undefined;
  className?: string;
}

export function UserRegistryStatus({
  userWalletAddress,
  className = "",
}: UserRegistryStatusProps) {
  const [loading, setLoading] = useState(true);
  const [userAccount, setUserAccount] = useState<{
    userWallet: PublicKey;
    platformUserId: string;
    registeredAt: number;
    updatedAt: number;
  } | null>(null);
  const [phantomAddress, setPhantomAddress] = useState<string | null>(null);
  const { toast } = useToast();

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
            fetchUserAccount(addr || null);
          });

          provider.on("disconnect", () => {
            setPhantomAddress(null);
            setUserAccount(null);
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

  useEffect(() => {
    const effectiveAddress = phantomAddress || userWalletAddress;
    if (effectiveAddress) {
      fetchUserAccount(effectiveAddress);
    } else {
      setLoading(false);
      setUserAccount(null);
    }
  }, [userWalletAddress, phantomAddress]);

  const fetchUserAccount = async (walletAddress: string | null) => {
    if (!walletAddress) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const connection = new Connection(RPC_URL, "confirmed");
      const userWallet = new PublicKey(walletAddress);
      const account = await getUserAccount(connection, userWallet);
      setUserAccount(account);
    } catch (error) {
      console.error("Error fetching user account:", error);
      setUserAccount(null);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    const effectiveAddress = phantomAddress || userWalletAddress;
    if (effectiveAddress) {
      fetchUserAccount(effectiveAddress);
    }
  };


  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!userAccount) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Blockchain Registration</CardTitle>
          <CardDescription>
            Your wallet is not registered on the blockchain yet.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <XCircle className="w-8 h-8 text-muted-foreground" />
            <p className="ml-2 text-muted-foreground">Not Registered</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Blockchain Registration</CardTitle>
            <CardDescription>Your on-chain user account information</CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
          <CheckCircle2 className="w-5 h-5 text-green-500" />
          <span className="font-medium">Registered on Blockchain</span>
        </div>

        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Platform User ID:</span>
            <span className="text-sm font-mono">
              {userAccount.platformUserId.slice(0, 8)}...
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Wallet Address:</span>
            <span className="text-sm font-mono">
              {userAccount.userWallet.toString().slice(0, 6)}...
              {userAccount.userWallet.toString().slice(-4)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Registered:</span>
            </div>
            <span className="text-sm">
              {formatDistanceToNow(new Date(userAccount.registeredAt * 1000), {
                addSuffix: true,
              })}
            </span>
          </div>

          {userAccount.updatedAt !== userAccount.registeredAt && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Last Updated:</span>
              <span className="text-sm">
                {formatDistanceToNow(new Date(userAccount.updatedAt * 1000), {
                  addSuffix: true,
                })}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

