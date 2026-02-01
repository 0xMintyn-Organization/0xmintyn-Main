"use client";

import { useEffect, useState } from "react";
import useAuth from "@/hooks/userAuth";
import { marketplaceApi } from "@/lib/marketplaceApi";
import { AllRolesProtected } from "@/components/RoleProtected";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Store, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

type Profile = {
  _id?: string;
  skills?: string[];
  portfolio?: string;
  availability?: string;
};

export default function ContributorProfilePage() {
  const { user } = useAuth();
  const marketplaceRole = (user as { marketplace_role?: string })?.marketplace_role;
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [skillsStr, setSkillsStr] = useState("");
  const [portfolio, setPortfolio] = useState("");
  const [availability, setAvailability] = useState("");
  const { toast } = useToast();

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
        setSkillsStr(Array.isArray(p.skills) ? p.skills.join(", ") : "");
        setPortfolio(p.portfolio ?? "");
        setAvailability(p.availability ?? "");
      } catch (e: unknown) {
        toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    })();
  }, [marketplaceRole, toast]);

  const handleSave = async () => {
    const skills = skillsStr
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    try {
      await marketplaceApi.contributorProfile.put({
        skills,
        portfolio: portfolio.trim(),
        availability: availability.trim(),
      });
      toast({ title: "Saved", description: "Contributor profile updated." });
      setEditing(false);
      const res = await marketplaceApi.contributorProfile.get();
      setProfile((res.profile as Profile) || null);
    } catch (e: unknown) {
      toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
    }
  };

  if (marketplaceRole !== "contributor") {
    return (
      <AllRolesProtected>
        <div className="space-y-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Store className="w-7 h-7 text-green-600" />
            Contributor profile
          </h1>
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Only contributors have a contributor profile. Register or switch to a contributor account to edit your skills and availability here.
              <div className="mt-4">
                <Link href="/marketplace/startups" className="text-sm text-green-600 dark:text-green-400 hover:underline">
                  Browse Startups →
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </AllRolesProtected>
    );
  }

  if (loading) return <p className="text-muted-foreground">Loading profile…</p>;

  return (
    <AllRolesProtected>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <User className="w-7 h-7 text-green-600" />
            My contributor profile
          </h1>
          <p className="text-muted-foreground mt-1">Skills, portfolio, and availability. Visible to startups when you apply.</p>
        </div>

        <Card>
          <CardContent className="p-6 space-y-4">
            <div>
              <Label className="text-muted-foreground">Skills (comma-separated)</Label>
              {editing ? (
                <Input
                  value={skillsStr}
                  onChange={(e) => setSkillsStr(e.target.value)}
                  placeholder="e.g. React, Node.js, Design"
                  className="mt-1"
                />
              ) : (
                <p className="text-foreground mt-1">{Array.isArray(profile?.skills) && profile.skills.length > 0 ? profile.skills.join(", ") : "—"}</p>
              )}
            </div>
            <div>
              <Label className="text-muted-foreground">Portfolio / bio</Label>
              {editing ? (
                <Input
                  value={portfolio}
                  onChange={(e) => setPortfolio(e.target.value)}
                  placeholder="Link or short bio"
                  className="mt-1"
                />
              ) : (
                <p className="text-foreground mt-1 whitespace-pre-wrap">{profile?.portfolio || "—"}</p>
              )}
            </div>
            <div>
              <Label className="text-muted-foreground">Availability</Label>
              {editing ? (
                <Input
                  value={availability}
                  onChange={(e) => setAvailability(e.target.value)}
                  placeholder="e.g. 10 hrs/week, Full-time"
                  className="mt-1"
                />
              ) : (
                <p className="text-foreground mt-1">{profile?.availability || "—"}</p>
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
          </CardContent>
        </Card>

        <p className="text-sm text-muted-foreground">
          <Link href="/marketplace/my-applications" className="text-green-600 dark:text-green-400 hover:underline">
            My applications →
          </Link>
        </p>
      </div>
    </AllRolesProtected>
  );
}
