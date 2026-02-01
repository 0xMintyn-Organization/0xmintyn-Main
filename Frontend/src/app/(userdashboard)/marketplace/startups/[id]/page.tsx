"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import useAuth from "@/hooks/userAuth";
import { AllRolesProtected } from "@/components/RoleProtected";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { marketplaceApi } from "@/lib/marketplaceApi";
import { Store, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type StartupProfile = {
  _id: string;
  companyName: string;
  description?: string;
  fundingState?: string;
  contact?: string;
  status?: string;
  userId?: { _id?: string; firstName?: string; lastName?: string; email?: string; startupName?: string; startupDescription?: string };
};

export default function MarketplaceStartupDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const { user } = useAuth();
  const marketplaceRole = (user as { marketplace_role?: string })?.marketplace_role;
  const [profile, setProfile] = useState<StartupProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [coverMessage, setCoverMessage] = useState("");
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await marketplaceApi.startupProfile.getById(id);
        setProfile(res.profile as StartupProfile);
      } catch (e: unknown) {
        toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    })();
  }, [id, toast]);

  if (loading) {
    return (
      <AllRolesProtected>
        <p className="text-muted-foreground">Loading startup…</p>
      </AllRolesProtected>
    );
  }

  if (!profile) {
    return (
      <AllRolesProtected>
        <div className="space-y-4">
          <p className="text-muted-foreground">Startup not found or not available.</p>
          <Link href="/marketplace/startups" className="text-sm text-green-600 dark:text-green-400 hover:underline">
            ← Back to Startups
          </Link>
        </div>
      </AllRolesProtected>
    );
  }

  const profileUser = profile.userId;
  const displayName = profile.companyName || (profileUser && typeof profileUser === "object" && "startupName" in profileUser ? (profileUser.startupName as string) : "—");
  const startupUserId = profileUser && typeof profileUser === "object" && "_id" in profileUser ? (profileUser._id as string) : (profile.userId as unknown as string);

  const handleApply = async () => {
    if (!startupUserId) return;
    setApplying(true);
    try {
      await marketplaceApi.applications.create({ startupId: startupUserId, coverMessage: coverMessage.trim() || undefined });
      toast({ title: "Applied", description: "Your application was sent to the startup." });
      setApplyDialogOpen(false);
      setCoverMessage("");
    } catch (e: unknown) {
      toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
    } finally {
      setApplying(false);
    }
  };

  return (
    <AllRolesProtected>
      <div className="space-y-6 max-w-2xl">
        <div>
          <Link href="/marketplace/startups" className="text-sm text-green-600 dark:text-green-400 hover:underline">
            ← Back to Startups
          </Link>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Store className="w-7 h-7 text-green-600" />
          <h1 className="text-2xl font-bold text-foreground">{displayName}</h1>
          {marketplaceRole === "contributor" && startupUserId && (
            <Dialog open={applyDialogOpen} onOpenChange={setApplyDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Send className="w-4 h-4 mr-1" />
                  Apply to this startup
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Apply to {displayName}</DialogTitle>
                  <DialogDescription>Send a short message (optional).</DialogDescription>
                </DialogHeader>
                <div className="grid gap-2 py-2">
                  <Label htmlFor="cover">Cover message</Label>
                  <Input
                    id="cover"
                    placeholder="Introduce yourself and why you want to work with this startup"
                    value={coverMessage}
                    onChange={(e) => setCoverMessage(e.target.value)}
                  />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setApplyDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleApply} disabled={applying}>{applying ? "Sending…" : "Send application"}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <Card>
          <CardContent className="p-6 space-y-4">
            <div>
              <h2 className="text-sm font-medium text-muted-foreground">Company name</h2>
              <p className="text-foreground">{profile.companyName || "—"}</p>
            </div>
            {profile.description && (
              <div>
                <h2 className="text-sm font-medium text-muted-foreground">Description</h2>
                <p className="text-foreground whitespace-pre-wrap">{profile.description}</p>
              </div>
            )}
            {profile.fundingState && (
              <div>
                <h2 className="text-sm font-medium text-muted-foreground">Funding state</h2>
                <p className="text-foreground">{profile.fundingState}</p>
              </div>
            )}
            {profile.contact && (
              <div>
                <h2 className="text-sm font-medium text-muted-foreground">Contact</h2>
                <p className="text-foreground">{profile.contact}</p>
              </div>
            )}
            {profileUser && typeof profileUser === "object" && (profileUser.firstName || profileUser.lastName || profileUser.email) && (
              <div>
                <h2 className="text-sm font-medium text-muted-foreground">Team</h2>
                <p className="text-foreground">
                  {[profileUser.firstName, profileUser.lastName].filter(Boolean).join(" ")}
                  {profileUser.email ? ` · ${profileUser.email}` : ""}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AllRolesProtected>
  );
}
