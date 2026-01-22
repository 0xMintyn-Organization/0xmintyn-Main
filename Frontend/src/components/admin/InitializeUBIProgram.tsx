"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { initializeUbiProgram, isUbiProgramInitialized } from "@/utils/ubiContract";

interface InitializeUBIProgramProps {
  authorityAddress: string | null | undefined;
}

export function InitializeUBIProgram({ authorityAddress }: InitializeUBIProgramProps) {
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const { toast } = useToast();

  // Check initialization status
  const checkInitialization = async () => {
    try {
      // ubiContract is stubbed; call safely without a real connection
      const initialized = await isUbiProgramInitialized(null as any);
      setIsInitialized(initialized);
    } catch (error) {
      console.error("Error checking initialization:", error);
      setIsInitialized(false);
    } finally {
      setChecking(false);
    }
  };

  // Check on mount and when authority address changes
  useEffect(() => {
    checkInitialization();
  }, [authorityAddress]);

  const handleInitialize = async () => {
    if (!authorityAddress) {
      toast({
        title: "Error",
        description: "Authority address not found. Please connect your wallet.",
        variant: "destructive",
      });
      return;
    }

    // Wallet-based initialization removed. Use backend/admin scripts instead.
    toast({
      title: "Action Disabled",
      description: "On-chain initialization via Phantom has been removed. Use server admin scripts instead.",
      variant: "destructive",
    });
  };

  if (checking) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>UBI Program Initialization</CardTitle>
          <CardDescription>Checking initialization status...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isInitialized) {
    return (
      <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            UBI Program Status
          </CardTitle>
          <CardDescription>Program initialization status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-medium">UBI Program is initialized and ready</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Users can now register and claim their UBI tokens.
            </p>
            <Button
              onClick={checkInitialization}
              variant="outline"
              size="sm"
              className="mt-2"
            >
              Refresh Status
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-yellow-600" />
          Initialize UBI Program
        </CardTitle>
        <CardDescription>
          The UBI program must be initialized before users can register
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-start gap-2 text-yellow-700 dark:text-yellow-400">
            <AlertCircle className="w-5 h-5 mt-0.5" />
            <div>
              <p className="font-medium">Program Not Initialized</p>
              <p className="text-sm mt-1">
                The UBI program needs to be initialized by the authority before users can claim tokens.
              </p>
            </div>
          </div>

          {authorityAddress ? (
            <div className="space-y-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Authority Address: <code className="text-xs">{authorityAddress}</code>
              </p>
              <Button
                onClick={handleInitialize}
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Initializing...
                  </>
                ) : (
                  "Initialize UBI Program"
                )}
              </Button>
            </div>
          ) : (
            <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-md">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Please connect the authority wallet to initialize the program.
              </p>
            </div>
          )}

          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-md">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
              What happens when you initialize:
            </p>
            <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1 list-disc list-inside">
              <li>Creates the UBI program state account (PDA)</li>
              <li>Creates the treasury token account (PDA)</li>
              <li>Sets the mint address and UBI amount (20 tokens)</li>
              <li>Enables user registration</li>
            </ul>
            <p className="text-xs text-blue-700 dark:text-blue-500 mt-3">
              Note: After initialization, you'll need to fund the treasury with Mintyn tokens
              for distribution to users.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

