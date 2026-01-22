"use client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface WalletConnectionStepProps {
  onWalletConnected: (walletAddress: string, walletProvider: string) => void;
  onError?: (error: string) => void;
}

export function WalletConnectionStep({ onWalletConnected }: WalletConnectionStepProps) {
  const { toast } = useToast();

  const handleContinue = () => {
    // Wallet UI removed — continue registration without a connected browser wallet.
    toast({ title: "Wallet step skipped", description: "Browser-wallet connection was removed from this flow." });
    onWalletConnected("", "none");
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">Browser-wallet (Phantom) connection has been removed. Wallet interactions are handled server-side or via other integrations.</p>
      <Button onClick={handleContinue}>Continue</Button>
    </div>
  );
}


