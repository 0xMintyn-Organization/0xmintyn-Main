"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { WalletConnectionStep } from "@/components/Registration/WalletConnectionStep";
import { useToast } from "@/hooks/use-toast";
import useAuth from "@/hooks/userAuth";
import Spinner from "@/components/Spinner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";

export default function ConnectWalletPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [walletConnected, setWalletConnected] = useState(false);
  const [isSavingWallet, setIsSavingWallet] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  // Check if user already has wallet
  useEffect(() => {
    if (user?.walletAddress) {
      setWalletConnected(true);
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    }
  }, [user, router]);

  const handleWalletConnected = async (walletAddress: string, walletProvider: string) => {
    setIsSavingWallet(true);
    setSaveStatus("Saving wallet to your account...");
    
    try {
      // Save wallet to backend
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_URI}update-wallet-address`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            walletAddress,
            walletProvider,
          }),
        }
      );

      if (response.ok) {
        setSaveStatus("Wallet saved successfully!");
        setWalletConnected(true);
        
        toast({
          title: "Wallet Connected!",
          description: "Your wallet has been successfully linked to your account",
          variant: "default",
        });
        
        // Redirect to dashboard after successful connection
        setTimeout(() => {
          router.push("/dashboard");
        }, 1500);
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to save wallet address");
      }
    } catch (error: any) {
      console.error("Error saving wallet:", error);
      setSaveStatus(null);
      setIsSavingWallet(false);
      
      toast({
        title: "Error",
        description: error.message || "Failed to save wallet address. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  if (walletConnected || user?.walletAddress) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-green-200 dark:border-green-800">
          <CardHeader>
            <CardTitle className="text-green-900 dark:text-green-100">Wallet Already Connected</CardTitle>
            <CardDescription>Redirecting to dashboard...</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-4">
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle>Connect Your Wallet</CardTitle>
            <CardDescription>
              To access the UBI platform, you need to connect your Solana wallet.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-900 dark:text-blue-100 font-medium mb-2">
                💡 Before connecting:
              </p>
              <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1 list-disc list-inside">
                <li>Click the <strong>Phantom extension icon</strong> in your browser toolbar</li>
                <li><strong>Sign in</strong> to your wallet or <strong>create a new one</strong></li>
                <li>Make sure Phantom is <strong>unlocked</strong></li>
              </ul>
            </div>
            
            {isSavingWallet && saveStatus && (
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600 dark:text-blue-400" />
                  <p className="text-sm text-blue-700 dark:text-blue-300">{saveStatus}</p>
                </div>
              </div>
            )}
            
            <WalletConnectionStep
              onWalletConnected={handleWalletConnected}
              onError={(error) => {
                // Only show toast for actual errors, not status messages
                // WalletConnectionStep now handles status messages internally
                if (error && !error.includes("Initializing") && !error.includes("Connecting") && !error.includes("Verifying")) {
                  toast({
                    title: "Connection Error",
                    description: error,
                    variant: "destructive",
                  });
                }
              }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

