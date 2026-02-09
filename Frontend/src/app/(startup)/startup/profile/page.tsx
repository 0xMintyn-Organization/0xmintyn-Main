"use client";

import { useEffect, useState, useRef } from "react";
import useAuth from "@/hooks/userAuth";
import { marketplaceApi } from "@/lib/marketplaceApi";
import { uploadFileToBackend } from "@/lib/uploadFileToBackend";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { StripeConnectOnboarding } from "@/components/marketplace/StripeConnectOnboarding";
import { ImagePlus, Building2, Target, Users, Mail, Edit3, X, Check } from "lucide-react";

type Profile = {
  companyName?: string;
  description?: string;
  image?: string;
  fundingState?: string;
  contact?: string;
  aim?: string;
  positionsHiring?: string;
  personsNeeded?: number;
  status?: string;
};

function Field({ label, children, icon: Icon }: { label: string; children: React.ReactNode; icon?: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2">
        {Icon && <Icon className="w-3.5 h-3.5" />}
        {label}
      </label>
      <div className="text-foreground">{children}</div>
    </div>
  );
}

export default function StartupProfilePage() {
  const { user } = useAuth();
  const u = user as { startupName?: string; startupDescription?: string; email?: string; startupImageUrl?: string };
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [fundingState, setFundingState] = useState("");
  const [contact, setContact] = useState("");
  const [aim, setAim] = useState("");
  const [positionsHiring, setPositionsHiring] = useState("");
  const [personsNeeded, setPersonsNeeded] = useState<number>(0);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    (async () => {
      try {
        const res = await marketplaceApi.startupProfile.get();
        const p = (res.profile as Profile) || {};
        setProfile(p);
        setCompanyName(p.companyName ?? u?.startupName ?? "");
        setDescription(p.description ?? u?.startupDescription ?? "");
        setImage(p.image ?? u?.startupImageUrl ?? "");
        setFundingState(p.fundingState ?? "");
        setContact(p.contact ?? "");
        setAim(p.aim ?? "");
        setPositionsHiring(p.positionsHiring ?? "");
        setPersonsNeeded(typeof p.personsNeeded === "number" ? p.personsNeeded : 0);
      } catch {
        setCompanyName(u?.startupName ?? "");
        setDescription(u?.startupDescription ?? "");
        setImage(u?.startupImageUrl ?? "");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Error", description: "Please upload an image file", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Error", description: "Image should be less than 5MB", variant: "destructive" });
      return;
    }
    setUploadingImage(true);
    try {
      const { url } = await uploadFileToBackend(file);
      setImage(url);
      toast({ title: "Image uploaded", description: "Save profile to keep the change." });
    } catch (err) {
      toast({ title: "Upload failed", description: (err as Error).message, variant: "destructive" });
    } finally {
      setUploadingImage(false);
      e.target.value = "";
    }
  };

  const handleSave = async () => {
    try {
      await marketplaceApi.startupProfile.put({
        companyName: companyName.trim(),
        description: description.trim(),
        image: image.trim() || undefined,
        fundingState: fundingState.trim(),
        contact: contact.trim(),
        aim: aim.trim(),
        positionsHiring: positionsHiring.trim(),
        personsNeeded: personsNeeded >= 0 ? personsNeeded : 0,
      });
      toast({ title: "Saved", description: "Profile updated." });
      setEditing(false);
      const res = await marketplaceApi.startupProfile.get();
      const next = (res.profile as Profile) || null;
      setProfile(next);
    } catch (e: unknown) {
      toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center py-12">
        <div className="animate-pulse flex flex-col gap-3 w-full max-w-md">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-32 bg-muted rounded" />
        </div>
      </div>
    );
  }

  const displayImage = image || profile?.image || u?.startupImageUrl;
  const displayName = profile?.companyName || u?.startupName || "—";

  return (
    <div className="w-full">
      {/* Header: title + edit */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">Startup Profile</h1>
          <p className="text-muted-foreground mt-1 text-sm">Your startup details. Edit to add image, description, aim, and hiring info.</p>
        </div>
        {!editing ? (
          <Button onClick={() => setEditing(true)} className="shrink-0 gap-2 bg-green-600 hover:bg-green-700">
            <Edit3 className="w-4 h-4" />
            Edit profile
          </Button>
        ) : (
          <div className="flex gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={() => setEditing(false)} className="gap-2">
              <X className="w-4 h-4" />
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} className="gap-2 bg-green-600 hover:bg-green-700">
              <Check className="w-4 h-4" />
              Save
            </Button>
          </div>
        )}
      </div>

      {/* Card: full width, no extra side margin */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        {/* Hero: image + company name */}
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 p-4 sm:p-6 border-b border-border bg-muted/30">
          <div className="flex items-start gap-4">
            {editing ? (
              <>
                {displayImage ? (
                  <img src={displayImage} alt="Company" className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl object-cover border-2 border-border shadow-inner" />
                ) : (
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl border-2 border-dashed border-border flex items-center justify-center bg-background/80">
                    <Building2 className="w-10 h-10 text-muted-foreground" />
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={handleImageSelect} />
                  <Button type="button" variant="outline" size="sm" disabled={uploadingImage} onClick={() => fileInputRef.current?.click()} className="gap-2 w-fit">
                    {uploadingImage ? "Uploading…" : <><ImagePlus className="w-4 h-4" /> Upload image</>}
                  </Button>
                  <span className="text-xs text-muted-foreground">Max 5MB · Cloudinary</span>
                </div>
              </>
            ) : (
              displayImage ? (
                <img src={displayImage} alt="Company" className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl object-cover border border-border shadow-inner" />
              ) : (
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl border border-border flex items-center justify-center bg-muted/50">
                  <Building2 className="w-10 h-10 text-muted-foreground" />
                </div>
              )
            )}
            <div className="min-w-0 flex-1">
              <Field label="Company name" icon={Building2}>
                {editing ? (
                  <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="bg-background border-border" placeholder="Company name" />
                ) : (
                  <p className="font-semibold text-lg text-foreground">{displayName}</p>
                )}
              </Field>
            </div>
          </div>
        </div>

        {/* Content grid */}
        <div className="p-4 sm:p-6 space-y-6">
          <Field label="Description" icon={Target}>
            {editing ? (
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-[100px] bg-background border-border resize-y" placeholder="Describe your startup, product, and mission." />
            ) : (
              <p className="text-foreground/90 whitespace-pre-wrap leading-relaxed">{profile?.description || u?.startupDescription || "—"}</p>
            )}
          </Field>

          <Field label="Aim / Vision" icon={Target}>
            {editing ? (
              <Textarea value={aim} onChange={(e) => setAim(e.target.value)} className="min-h-[80px] bg-background border-border resize-y" placeholder="Your startup's goal or vision" />
            ) : (
              <p className="text-foreground/90 whitespace-pre-wrap leading-relaxed">{profile?.aim || "—"}</p>
            )}
          </Field>

          <Field label="Positions you are hiring" icon={Users}>
            {editing ? (
              <Textarea value={positionsHiring} onChange={(e) => setPositionsHiring(e.target.value)} className="min-h-[80px] bg-background border-border resize-y" placeholder="e.g. Frontend Developer, Backend Developer, Product Manager" />
            ) : (
              <p className="text-foreground/90 whitespace-pre-wrap">{profile?.positionsHiring || "—"}</p>
            )}
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Field label="How many persons needed" icon={Users}>
              {editing ? (
                <Input type="number" min={0} value={personsNeeded === 0 ? "" : personsNeeded} onChange={(e) => setPersonsNeeded(e.target.value === "" ? 0 : parseInt(e.target.value, 10) || 0)} className="w-28 bg-background border-border" placeholder="0" />
              ) : (
                <p className="text-foreground">{profile?.personsNeeded ?? personsNeeded ?? "—"}</p>
              )}
            </Field>
            <Field label="Funding state" icon={Target}>
              {editing ? (
                <Input value={fundingState} onChange={(e) => setFundingState(e.target.value)} className="bg-background border-border" placeholder="e.g. Pre-seed" />
              ) : (
                <p className="text-foreground">{profile?.fundingState || "—"}</p>
              )}
            </Field>
          </div>

          <Field label="Contact" icon={Mail}>
            {editing ? (
              <Input value={contact} onChange={(e) => setContact(e.target.value)} className="bg-background border-border" placeholder="Email or phone" />
            ) : (
              <p className="text-foreground">{profile?.contact || u?.email || "—"}</p>
            )}
          </Field>

          <div className="space-y-1.5">
            <StripeConnectOnboarding label="Receive milestone funding" />
          </div>

          {/* Actions at bottom when editing */}
          {editing && (
            <div className="flex gap-2 pt-2 border-t border-border">
              <Button onClick={handleSave} className="gap-2 bg-green-600 hover:bg-green-700">
                <Check className="w-4 h-4" />
                Save changes
              </Button>
              <Button variant="outline" onClick={() => setEditing(false)} className="gap-2">
                <X className="w-4 h-4" />
                Cancel
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
