"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { AllRolesProtected } from "@/components/RoleProtected";
import { Card, CardContent } from "@/components/ui/card";
import { marketplaceApi } from "@/lib/marketplaceApi";
import { Store, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type ContributorProfile = {
  _id: string;
  skills?: string[];
  portfolio?: string;
  availability?: string;
  userId?: { firstName?: string; lastName?: string; email?: string };
};

function displayName(p: ContributorProfile): string {
  const u = p.userId;
  if (!u || typeof u !== "object") return "Contributor";
  const name = [u.firstName, u.lastName].filter(Boolean).join(" ");
  return name || (u.email as string) || "Contributor";
}

export default function MarketplaceContributorDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [profile, setProfile] = useState<ContributorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await marketplaceApi.contributorProfile.getById(id);
        setProfile(res.profile as ContributorProfile);
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
        <p className="text-muted-foreground">Loading contributor…</p>
      </AllRolesProtected>
    );
  }

  if (!profile) {
    return (
      <AllRolesProtected>
        <div className="space-y-4">
          <p className="text-muted-foreground">Contributor not found.</p>
          <Link href="/marketplace/contributors" className="text-sm text-green-600 dark:text-green-400 hover:underline">
            ← Back to Contributors
          </Link>
        </div>
      </AllRolesProtected>
    );
  }

  const user = profile.userId;

  return (
    <AllRolesProtected>
      <div className="space-y-6 max-w-2xl">
        <div>
          <Link href="/marketplace/contributors" className="text-sm text-green-600 dark:text-green-400 hover:underline">
            ← Back to Contributors
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <Users className="w-7 h-7 text-green-600" />
          <h1 className="text-2xl font-bold text-foreground">{displayName(profile)}</h1>
        </div>

        <Card>
          <CardContent className="p-6 space-y-4">
            {user && typeof user === "object" && (user.firstName || user.lastName || user.email) && (
              <div>
                <h2 className="text-sm font-medium text-muted-foreground">Contact</h2>
                <p className="text-foreground">
                  {[user.firstName, user.lastName].filter(Boolean).join(" ")}
                  {user.email ? ` · ${user.email}` : ""}
                </p>
              </div>
            )}
            {Array.isArray(profile.skills) && profile.skills.length > 0 && (
              <div>
                <h2 className="text-sm font-medium text-muted-foreground">Skills</h2>
                <p className="text-foreground">{profile.skills.join(", ")}</p>
              </div>
            )}
            {profile.availability && (
              <div>
                <h2 className="text-sm font-medium text-muted-foreground">Availability</h2>
                <p className="text-foreground">{profile.availability}</p>
              </div>
            )}
            {profile.portfolio && (
              <div>
                <h2 className="text-sm font-medium text-muted-foreground">Portfolio</h2>
                <p className="text-foreground whitespace-pre-wrap">{profile.portfolio}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AllRolesProtected>
  );
}
