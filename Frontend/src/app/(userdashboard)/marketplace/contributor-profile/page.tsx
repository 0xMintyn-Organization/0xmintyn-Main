"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import useAuth from "@/hooks/userAuth";
import { marketplaceApi } from "@/lib/marketplaceApi";
import { uploadFileToBackend } from "@/lib/uploadFileToBackend";
import { AllRolesProtected } from "@/components/RoleProtected";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PaymentMethodSection } from "@/components/marketplace/PaymentMethodSection";
import type { PaymentMethodStored } from "@/lib/marketplaceApi";
import { User, ImagePlus, Edit3, X, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

type Profile = {
  _id?: string;
  image?: string;
  headline?: string;
  bio?: string;
  experience?: string;
  location?: string;
  skills?: string[];
  portfolio?: string;
  availability?: string;
  linkedIn?: string;
  website?: string;
  github?: string;
  paymentMethod?: PaymentMethodStored;
};

export default function ContributorProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const marketplaceRole = (user as { marketplace_role?: string })?.marketplace_role;
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [image, setImage] = useState("");
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [experience, setExperience] = useState("");
  const [location, setLocation] = useState("");
  const [skillsStr, setSkillsStr] = useState("");
  const [portfolio, setPortfolio] = useState("");
  const [availability, setAvailability] = useState("");
  const [linkedIn, setLinkedIn] = useState("");
  const [website, setWebsite] = useState("");
  const [github, setGithub] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodStored | undefined>(undefined);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (user != null && marketplaceRole !== "contributor") {
      router.replace("/marketplace/startups");
    }
  }, [user, marketplaceRole, router]);

  useEffect(() => {
    if (marketplaceRole !== "contributor") {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const res = await marketplaceApi.contributorProfile.get();
        const p = (res.profile as Profile) || {};
        setProfile(p);
        setImage(p.image ?? "");
        setHeadline(p.headline ?? "");
        setBio(p.bio ?? "");
        setExperience(p.experience ?? "");
        setLocation(p.location ?? "");
        setSkillsStr(Array.isArray(p.skills) ? p.skills.join(", ") : "");
        setPortfolio(p.portfolio ?? "");
        setAvailability(p.availability ?? "");
        setLinkedIn(p.linkedIn ?? "");
        setWebsite(p.website ?? "");
        setGithub(p.github ?? "");
        setPaymentMethod(p.paymentMethod ?? undefined);
      } catch (e: unknown) {
        toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    })();
  }, [marketplaceRole, toast]);

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
    const skills = skillsStr
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    try {
      await marketplaceApi.contributorProfile.put({
        image: image.trim() || undefined,
        headline: headline.trim(),
        bio: bio.trim(),
        experience: experience.trim(),
        location: location.trim(),
        skills,
        portfolio: portfolio.trim(),
        availability: availability.trim(),
        linkedIn: linkedIn.trim() || undefined,
        website: website.trim() || undefined,
        github: github.trim() || undefined,
        paymentMethod: paymentMethod?.methodType ? paymentMethod : undefined,
      });
      toast({ title: "Saved", description: "Contributor profile updated." });
      setEditing(false);
      const res = await marketplaceApi.contributorProfile.get();
      const next = (res.profile as Profile) || null;
      setProfile(next);
      if (next?.paymentMethod) setPaymentMethod(next.paymentMethod);
    } catch (e: unknown) {
      toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
    }
  };

  if (user != null && marketplaceRole !== "contributor") {
    return null;
  }
  if (marketplaceRole !== "contributor") {
    return (
      <AllRolesProtected>
        <div className="w-full px-6 py-6 space-y-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-3 tracking-tight">
            <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-green-500/15 text-green-600 dark:text-green-400">
              <User className="w-6 h-6" />
            </span>
            Contributor profile
          </h1>
          <div className="rounded-lg border border-border bg-card dark:bg-zinc-800 p-8 text-center text-muted-foreground shadow-sm">
            Only contributors have a contributor profile. Register as a contributor to edit your profile here.
            <div className="mt-4">
              <Link href="/marketplace/startups" className="text-sm text-green-600 dark:text-green-400 hover:underline">
                Browse Startups →
              </Link>
            </div>
          </div>
        </div>
      </AllRolesProtected>
    );
  }

  if (loading) {
    return (
      <AllRolesProtected>
        <div className="w-full px-6 py-6 flex items-center justify-center min-h-[200px]">
          <p className="text-muted-foreground">Loading profile…</p>
        </div>
      </AllRolesProtected>
    );
  }

  const displayImage = image || profile?.image;

  return (
    <AllRolesProtected>
      <div className="w-full px-6 py-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-3 tracking-tight">
              <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-green-500/15 text-green-600 dark:text-green-400">
                <User className="w-6 h-6" />
              </span>
              My contributor profile
            </h1>
            <p className="text-muted-foreground mt-2">
              Define yourself for startups: photo, headline, bio, skills, portfolio, availability, and links. Visible when you apply.
            </p>
          </div>
          {!editing ? (
            <div className="flex gap-2 shrink-0">
              <Button onClick={() => setEditing(true)} className="gap-2 bg-green-600 hover:bg-green-700">
                <Edit3 className="w-4 h-4" />
                Edit profile
              </Button>
              <Link href="/marketplace/my-applications">
                <Button variant="outline" className="gap-2">My applications →</Button>
              </Link>
            </div>
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

        <div className="rounded-lg border border-border bg-card dark:bg-zinc-800 overflow-hidden shadow-md">
          <div className="p-6 space-y-6">
            {/* Image */}
            <div className="space-y-2">
              <Label className="text-muted-foreground">Photo / avatar</Label>
              {editing ? (
                <div className="flex items-center gap-4">
                  {displayImage ? (
                    <img src={displayImage} alt="You" className="w-20 h-20 rounded-xl object-cover border border-border" />
                  ) : (
                    <div className="w-20 h-20 rounded-xl border border-dashed border-border flex items-center justify-center bg-muted/50">
                      <User className="w-10 h-10 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={handleImageSelect} />
                    <Button type="button" variant="outline" size="sm" disabled={uploadingImage} onClick={() => fileInputRef.current?.click()}>
                      {uploadingImage ? "Uploading…" : <><ImagePlus className="w-4 h-4 mr-2" /> Upload image</>}
                    </Button>
                    <p className="text-xs text-muted-foreground mt-1">Max 5MB · Cloudinary</p>
                  </div>
                </div>
              ) : (
                displayImage ? (
                  <img src={displayImage} alt="You" className="w-20 h-20 rounded-xl object-cover border border-border" />
                ) : (
                  <p className="text-muted-foreground">—</p>
                )
              )}
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-muted-foreground">Headline</Label>
                {editing ? (
                  <Input value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="e.g. Full-stack developer" />
                ) : (
                  <p className="text-foreground">{profile?.headline || "—"}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Location</Label>
                {editing ? (
                  <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Remote, NYC" />
                ) : (
                  <p className="text-foreground">{profile?.location || "—"}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-muted-foreground">Bio / About me</Label>
              {editing ? (
                <Textarea value={bio} onChange={(e) => setBio(e.target.value)} className="min-h-[100px]" placeholder="Introduce yourself to startups" />
              ) : (
                <p className="text-foreground whitespace-pre-wrap">{profile?.bio || "—"}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-muted-foreground">Experience</Label>
              {editing ? (
                <Textarea value={experience} onChange={(e) => setExperience(e.target.value)} className="min-h-[80px]" placeholder="e.g. 5 years, Senior dev at X" />
              ) : (
                <p className="text-foreground whitespace-pre-wrap">{profile?.experience || "—"}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-muted-foreground">Skills (comma-separated)</Label>
              {editing ? (
                <Input value={skillsStr} onChange={(e) => setSkillsStr(e.target.value)} placeholder="e.g. React, Node.js, Design" />
              ) : (
                <p className="text-foreground">{Array.isArray(profile?.skills) && profile.skills.length > 0 ? profile.skills.join(", ") : "—"}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-muted-foreground">Portfolio / projects</Label>
              {editing ? (
                <Textarea value={portfolio} onChange={(e) => setPortfolio(e.target.value)} className="min-h-[80px]" placeholder="Link or description of your work" />
              ) : (
                <p className="text-foreground whitespace-pre-wrap">{profile?.portfolio || "—"}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-muted-foreground">Availability</Label>
              {editing ? (
                <Input value={availability} onChange={(e) => setAvailability(e.target.value)} placeholder="e.g. 10 hrs/week, Full-time" />
              ) : (
                <p className="text-foreground">{profile?.availability || "—"}</p>
              )}
            </div>

            <PaymentMethodSection
              value={paymentMethod ?? profile?.paymentMethod}
              editing={editing}
              onChange={(next) => setPaymentMethod(next as PaymentMethodStored)}
              label="Payment method (receive & send)"
            />

            <div className="grid gap-6 sm:grid-cols-3">
              <div className="space-y-2">
                <Label className="text-muted-foreground">LinkedIn</Label>
                {editing ? (
                  <Input value={linkedIn} onChange={(e) => setLinkedIn(e.target.value)} placeholder="https://linkedin.com/in/..." />
                ) : (
                  <p className="text-foreground truncate">{profile?.linkedIn ? <a href={profile.linkedIn} target="_blank" rel="noopener noreferrer" className="text-green-600 dark:text-green-400 hover:underline">{profile.linkedIn}</a> : "—"}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Website</Label>
                {editing ? (
                  <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://..." />
                ) : (
                  <p className="text-foreground truncate">{profile?.website ? <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-green-600 dark:text-green-400 hover:underline">{profile.website}</a> : "—"}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">GitHub</Label>
                {editing ? (
                  <Input value={github} onChange={(e) => setGithub(e.target.value)} placeholder="https://github.com/..." />
                ) : (
                  <p className="text-foreground truncate">{profile?.github ? <a href={profile.github} target="_blank" rel="noopener noreferrer" className="text-green-600 dark:text-green-400 hover:underline">{profile.github}</a> : "—"}</p>
                )}
              </div>
            </div>

            {editing && (
              <div className="flex gap-2 pt-2 border-t border-border">
                <Button onClick={handleSave} className="gap-2 bg-green-600 hover:bg-green-700">
                  <Check className="w-4 h-4" />
                  Save changes
                </Button>
                <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
              </div>
            )}
          </div>
        </div>

        <p className="text-sm text-muted-foreground">
          <Link href="/marketplace/my-applications" className="text-green-600 dark:text-green-400 hover:underline">
            My applications →
          </Link>
        </p>
      </div>
    </AllRolesProtected>
  );
}
