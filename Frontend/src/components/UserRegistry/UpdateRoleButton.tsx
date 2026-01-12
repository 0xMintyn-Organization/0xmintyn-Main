"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { updateUserRole } from "@/utils/userRegistryContract";
import { Button } from "@/components/ui/button";
import { Loader2, UserCog } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface UpdateRoleButtonProps {
  userWalletAddress: string | null | undefined;
  currentRole?: string;
  onSuccess?: (signature: string) => void;
  variant?: "default" | "outline" | "ghost" | "link" | "destructive" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export function UpdateRoleButton({
  userWalletAddress,
  currentRole = "user",
  onSuccess,
  variant = "outline",
  size = "default",
  className = "",
}: UpdateRoleButtonProps) {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(currentRole);
  const [phantomAddress, setPhantomAddress] = useState<string | null>(null);
  const { toast } = useToast();

  // Check Phantom wallet connection
  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).solana?.isPhantom) {
      const provider = (window as any).solana;
      if (provider.isConnected) {
        setPhantomAddress(provider.publicKey?.toString() || null);
      }
    }
  }, []);

  const handleUpdateRole = async () => {
    const effectiveAddress = phantomAddress || userWalletAddress;

    if (!effectiveAddress) {
      toast({
        title: "Error",
        description: "Wallet address not found. Please connect your wallet.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedRole || selectedRole === currentRole) {
      toast({
        title: "No Change",
        description: "Please select a different role.",
        variant: "destructive",
      });
      return;
    }

    if (typeof window === "undefined" || !(window as any).solana?.isPhantom) {
      toast({
        title: "Phantom Wallet Required",
        description: "Please install Phantom wallet.",
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
      const signature = await updateUserRole(
        connectedAddress,
        phantomProvider,
        selectedRole
      );

      toast({
        title: "Success! 🎉",
        description: `Your role has been updated to ${selectedRole}.`,
      });

      if (onSuccess) {
        onSuccess(signature);
      }

      setOpen(false);
    } catch (error: any) {
      console.error("Error updating role:", error);

      let errorMessage = "Failed to update role. Please try again.";

      if (error.message?.includes("cancelled") || error.message?.includes("rejected")) {
        errorMessage = "Transaction was cancelled.";
      } else if (error.message?.includes("Invalid role")) {
        errorMessage = "Invalid role selected.";
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

  const effectiveAddress = phantomAddress || userWalletAddress;

  if (!effectiveAddress) {
    return null; // Don't show if wallet not connected
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <UserCog className="w-4 h-4 mr-2" />
          Update Role
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Your Role</DialogTitle>
          <DialogDescription>
            Change your role on the blockchain. This will update your on-chain account.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="currentRole">Current Role</Label>
            <div className="text-sm text-muted-foreground capitalize">
              {currentRole}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="newRole">New Role</Label>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger>
                <SelectValue placeholder="Select new role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="instructor">Instructor</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="influencer">Influencer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdateRole}
              disabled={loading || !selectedRole || selectedRole === currentRole}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Role"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

