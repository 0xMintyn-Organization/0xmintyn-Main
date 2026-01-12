"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, TrendingUp, AlertCircle, CheckCircle2 } from "lucide-react";
import {
  fundTreasury,
  autoFundTreasury,
  getTreasuryStatus,
  getTreasuryBalance,
  getSupportedUsers,
} from "@/utils/treasuryManager";
import { PublicKey } from "@solana/web3.js";

interface AutoFundTreasuryProps {
  authorityAddress: string | null | undefined;
}

export function AutoFundTreasury({ authorityAddress }: AutoFundTreasuryProps) {
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [status, setStatus] = useState<any>(null);
  const [amount, setAmount] = useState("1000000"); // Default 1M
  const [targetBalance, setTargetBalance] = useState("1000000"); // Default 1M target
  const { toast } = useToast();

  // Check treasury status on mount
  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    setChecking(true);
    try {
      const treasuryStatus = await getTreasuryStatus();
      setStatus(treasuryStatus);
    } catch (error) {
      console.error("Error checking status:", error);
    } finally {
      setChecking(false);
    }
  };

  const handleManualFund = async () => {
    if (!authorityAddress) {
      toast({
        title: "Error",
        description: "Authority address not found",
        variant: "destructive",
      });
      return;
    }

    if (typeof window === "undefined" || !(window as any).solana?.isPhantom) {
      toast({
        title: "Phantom Required",
        description: "Please install Phantom wallet",
        variant: "destructive",
      });
      return;
    }

    const phantom = (window as any).solana;
    if (!phantom.isConnected) {
      await phantom.connect();
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const authorityPublicKey = new PublicKey(authorityAddress);
      const signature = await fundTreasury(authorityPublicKey, amountNum, phantom);
      
      toast({
        title: "Success! 🎉",
        description: `Transferred ${amountNum.toLocaleString()} tokens to treasury`,
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

  const handleAutoFund = async () => {
    if (!authorityAddress) {
      toast({
        title: "Error",
        description: "Authority address not found",
        variant: "destructive",
      });
      return;
    }

    if (typeof window === "undefined" || !(window as any).solana?.isPhantom) {
      toast({
        title: "Phantom Required",
        description: "Please install Phantom wallet",
        variant: "destructive",
      });
      return;
    }

    const phantom = (window as any).solana;
    if (!phantom.isConnected) {
      await phantom.connect();
    }

    const targetNum = parseFloat(targetBalance);
    if (isNaN(targetNum) || targetNum <= 0) {
      toast({
        title: "Invalid Target",
        description: "Please enter a valid target balance",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const authorityPublicKey = new PublicKey(authorityAddress);
      const signature = await autoFundTreasury(authorityPublicKey, targetNum, phantom);
      
      if (signature) {
        toast({
          title: "Success! 🎉",
          description: `Treasury auto-funded to ${targetNum.toLocaleString()} tokens`,
        });
      } else {
        toast({
          title: "No Funding Needed",
          description: "Treasury already has sufficient balance",
        });
      }
      
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

  if (checking) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Automated Treasury Management</CardTitle>
          <CardDescription>Loading treasury status...</CardDescription>
        </CardHeader>
        <CardContent>
          <Loader2 className="w-4 h-4 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  const statusColor =
    status?.status === "HEALTHY"
      ? "text-green-600"
      : status?.status === "MEDIUM"
      ? "text-yellow-600"
      : "text-red-600";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Automated Treasury Management</CardTitle>
        <CardDescription>Fund and monitor the UBI treasury automatically</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Display */}
        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Current Status</h3>
          <div className="space-y-1 text-sm">
            <p>
              <strong>Balance:</strong> {status?.currentBalance?.toLocaleString() || 0} tokens
            </p>
            <p>
              <strong>Supported Users:</strong> {status?.supportedUsers?.toLocaleString() || 0}
            </p>
            <p>
              <strong>Status:</strong>{" "}
              <span className={statusColor}>{status?.status || "UNKNOWN"}</span>
            </p>
            <p className="text-xs text-gray-500">{status?.recommendation}</p>
          </div>
        </div>

        {/* Manual Funding */}
        <div className="space-y-2">
          <Label htmlFor="amount">Manual Fund Amount (tokens)</Label>
          <Input
            id="amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="1000000"
          />
          <Button
            onClick={handleManualFund}
            disabled={loading || !authorityAddress}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Funding...
              </>
            ) : (
              <>
                <TrendingUp className="w-4 h-4 mr-2" />
                Fund Treasury ({parseFloat(amount || "0").toLocaleString()} tokens)
              </>
            )}
          </Button>
        </div>

        {/* Auto-Funding */}
        <div className="space-y-2">
          <Label htmlFor="target">Auto-Fund Target Balance (tokens)</Label>
          <Input
            id="target"
            type="number"
            value={targetBalance}
            onChange={(e) => setTargetBalance(e.target.value)}
            placeholder="1000000"
          />
          <p className="text-xs text-gray-500">
            Will automatically transfer tokens to reach this balance
          </p>
          <Button
            onClick={handleAutoFund}
            disabled={loading || !authorityAddress}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Auto-Funding...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Auto-Fund to {parseFloat(targetBalance || "0").toLocaleString()} tokens
              </>
            )}
          </Button>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setAmount("100000");
              handleManualFund();
            }}
            disabled={loading}
          >
            Fund 100K
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setAmount("500000");
              handleManualFund();
            }}
            disabled={loading}
          >
            Fund 500K
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setAmount("1000000");
              handleManualFund();
            }}
            disabled={loading}
          >
            Fund 1M
          </Button>
        </div>

        {!authorityAddress && (
          <p className="text-sm text-gray-500">
            Connect your authority wallet to fund the treasury
          </p>
        )}
      </CardContent>
    </Card>
  );
}


