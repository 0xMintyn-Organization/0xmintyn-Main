"use client";

import { useEffect, useState } from "react";
import useAuth from "@/hooks/userAuth";
import { marketplaceApi } from "@/lib/marketplaceApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

type Profile = {
  companyName?: string;
  description?: string;
  fundingState?: string;
  contact?: string;
  status?: string;
};

export default function StartupProfilePage() {
  const { user } = useAuth();
  const u = user as { startupName?: string; startupDescription?: string; email?: string };
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [description, setDescription] = useState("");
  const [fundingState, setFundingState] = useState("");
  const [contact, setContact] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    (async () => {
      try {
        const res = await marketplaceApi.startupProfile.get();
        const p = (res.profile as Profile) || {};
        setProfile(p);
        setCompanyName(p.companyName ?? u?.startupName ?? "");
        setDescription(p.description ?? u?.startupDescription ?? "");
        setFundingState(p.fundingState ?? "");
        setContact(p.contact ?? "");
      } catch {
        setCompanyName(u?.startupName ?? "");
        setDescription(u?.startupDescription ?? "");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSave = async () => {
    try {
      await marketplaceApi.startupProfile.put({
        companyName: companyName.trim(),
        description: description.trim(),
        fundingState: fundingState.trim(),
        contact: contact.trim(),
      });
      toast({ title: "Saved", description: "Profile updated." });
      setEditing(false);
      const res = await marketplaceApi.startupProfile.get();
      setProfile((res.profile as Profile) || null);
    } catch (e: unknown) {
      toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
    }
  };

  if (loading) return <p className="text-muted-foreground">Loading profile…</p>;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-foreground mb-2">Startup Profile</h1>
      <p className="text-muted-foreground mb-6">Your startup details. Edit and save to update.</p>
      <div className="rounded-lg border border-border bg-card p-6 space-y-4">
        <div>
          <label className="text-sm font-medium text-muted-foreground">Company name</label>
          {editing ? (
            <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="mt-1" />
          ) : (
            <p className="text-foreground">{profile?.companyName || u?.startupName || "—"}</p>
          )}
        </div>
        <div>
          <label className="text-sm font-medium text-muted-foreground">Description</label>
          {editing ? (
            <Input value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1" />
          ) : (
            <p className="text-foreground">{profile?.description || u?.startupDescription || "—"}</p>
          )}
        </div>
        <div>
          <label className="text-sm font-medium text-muted-foreground">Funding state</label>
          {editing ? (
            <Input value={fundingState} onChange={(e) => setFundingState(e.target.value)} className="mt-1" placeholder="e.g. Pre-seed" />
          ) : (
            <p className="text-foreground">{profile?.fundingState || "—"}</p>
          )}
        </div>
        <div>
          <label className="text-sm font-medium text-muted-foreground">Contact</label>
          {editing ? (
            <Input value={contact} onChange={(e) => setContact(e.target.value)} className="mt-1" placeholder="Email or phone" />
          ) : (
            <p className="text-foreground">{profile?.contact || u?.email || "—"}</p>
          )}
        </div>
        <div className="pt-2">
          {editing ? (
            <div className="flex gap-2">
              <Button onClick={handleSave}>Save</Button>
              <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
            </div>
          ) : (
            <Button variant="outline" onClick={() => setEditing(true)}>Edit profile</Button>
          )}
        </div>
      </div>
    </div>
  );
}
