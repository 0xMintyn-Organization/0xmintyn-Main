/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
interface PhantomWalletButtonProps {
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export function PhantomWalletButton({ onConnect, onDisconnect }: PhantomWalletButtonProps) {
  const { toast } = useToast();

  const handleClick = () => {
    toast({ title: 'Wallet Integration Removed', description: 'Phantom wallet support has been removed from this application.', variant: 'default' });
    if (onConnect) onConnect();
  };

  return (
    <div className="space-y-3">
      <Button onClick={handleClick} variant="outline" className="w-full">
        Wallet Integration Removed
      </Button>
      <div className="text-xs text-slate-500">Phantom wallet functionality has been disabled. Contact admin for alternatives.</div>
    </div>
  );
}

// Export simple utils placeholder
export const phantomUtils = {
  signMessage: async () => { throw new Error('Phantom removed'); },
  getBalance: async () => 0,
  isConnected: () => false,
  getPublicKey: () => null,
};

