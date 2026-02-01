"use client";

import { useEffect, useState } from "react";
import { AllRolesProtected } from "@/components/RoleProtected";
import { marketplaceApi } from "@/lib/marketplaceApi";
import useAuth from "@/hooks/userAuth";
import { Store, Users, ChevronRight, BadgeCheck } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

type Contributor = {
  _id: string;
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
  userId?: { _id?: string; firstName?: string; lastName?: string; email?: string };
};

type Application = {
  _id: string;
  contributorId: { _id: string } | string;
  status: string;
};

function displayName(c: Contributor): string {
  const u = c.userId;
  if (!u || typeof u !== "object") return "Contributor";
  const name = [u.firstName, u.lastName].filter(Boolean).join(" ");
  return name || (u.email as string) || "Contributor";
}

function getContributorUserId(c: Contributor): string | null {
  const u = c.userId;
  if (!u) return null;
  if (typeof u === "object" && u && "_id" in u) return String((u as { _id: string })._id);
  return typeof u === "string" ? u : null;
}

export default function MarketplaceContributorsPage() {
  const { user } = useAuth();
  const marketplaceRole = (user as { marketplace_role?: string })?.marketplace_role;
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    (async () => {
      try {
        const res = await marketplaceApi.contributorProfile.list();
        setContributors((res.contributors as Contributor[]) || []);
      } catch (e: unknown) {
        toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    })();
  }, [toast]);

  useEffect(() => {
    if (marketplaceRole !== "startup") return;
    (async () => {
      try {
        const res = await marketplaceApi.applications.list();
        setApplications((res.applications as Application[]) || []);
      } catch {
        setApplications([]);
      }
    })();
  }, [marketplaceRole]);

  const hiredContributorIds = new Set(
    applications
      .filter((a) => a.status === "accepted")
      .map((a) => String(typeof a.contributorId === "object" && a.contributorId?._id ? a.contributorId._id : a.contributorId))
  );

  return (
    <AllRolesProtected>
      <div className="w-full px-6 py-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-3 tracking-tight">
              <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-green-500/15 text-green-600 dark:text-green-400">
                <Users className="w-6 h-6" />
              </span>
              Marketplace — Contributors
            </h1>
            <p className="text-muted-foreground mt-2">
              Browse contributors on the platform.
            </p>
          </div>
          <Link
            href="/marketplace/startups"
            className="text-sm font-medium text-green-600 dark:text-green-400 hover:underline shrink-0"
          >
            Browse Startups →
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-lg bg-card border border-border overflow-hidden animate-pulse">
                <div className="h-48 bg-muted" />
                <div className="p-4 space-y-3">
                  <div className="h-5 bg-muted rounded w-2/3" />
                  <div className="h-4 bg-muted rounded w-full" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : contributors.length === 0 ? (
          <div className="rounded-lg border border-border bg-card dark:bg-zinc-800 p-12 text-center shadow-sm">
            <div className="flex justify-center mb-4">
              <span className="flex items-center justify-center w-16 h-16 rounded-lg bg-muted text-muted-foreground">
                <Users className="w-8 h-8" />
              </span>
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-2">No contributors yet</h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
              Contributor profiles will appear here when they sign up. Browse startups in the meantime.
            </p>
            <Link
              href="/marketplace/startups"
              className="inline-flex items-center gap-2 text-sm font-medium text-green-600 dark:text-green-400 hover:underline"
            >
              Go to Startups
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {contributors.map((c) => (
              <li key={c._id}>
                <Link href={`/marketplace/contributors/${c._id}`} className="block h-full group">
                  <article className="h-full rounded-lg shadow-md bg-card dark:bg-zinc-800 border border-border overflow-hidden hover:shadow-xl transition-all duration-300">
                    <div className="relative h-48 bg-gradient-to-br from-green-500/10 via-muted/50 to-muted overflow-hidden">
                      {c.image ? (
                        <img src={c.image} alt="" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Users className="w-14 h-14 text-muted-foreground/60" />
                        </div>
                      )}
                      {marketplaceRole === "startup" && hiredContributorIds.has(getContributorUserId(c) ?? "") && (
                        <span className="absolute top-2 right-2">
                          <Badge className="bg-green-600 text-white gap-1 shadow-md">
                            <BadgeCheck className="w-3.5 h-3.5" />
                            Hired
                          </Badge>
                        </span>
                      )}
                      {c.headline && (
                        <span className="absolute bottom-2 left-2 right-2 rounded bg-black/60 backdrop-blur px-2 py-1 text-xs font-medium text-white line-clamp-1">
                          {c.headline}
                        </span>
                      )}
                    </div>
                    <div className="p-4 space-y-3">
                      <h2 className="font-semibold text-lg text-foreground line-clamp-2 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                        {displayName(c)}
                      </h2>
                      {c.headline && !c.image && (
                        <p className="text-sm text-muted-foreground line-clamp-1">{c.headline}</p>
                      )}
                      {Array.isArray(c.skills) && c.skills.length > 0 && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {c.skills.slice(0, 3).join(", ")}
                          {c.skills.length > 3 ? "…" : ""}
                        </p>
                      )}
                      {c.availability && (
                        <p className="text-xs text-muted-foreground">{c.availability}</p>
                      )}
                      <p className="flex items-center gap-1.5 text-sm font-medium text-green-600 dark:text-green-400 pt-1">
                        View details
                        <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                      </p>
                    </div>
                  </article>
                </Link>
              </li>
            ))}
          </ul>
        )}

        <p className="text-sm text-muted-foreground">
          <Link href="/marketplace/startups" className="text-green-600 dark:text-green-400 hover:underline">
            Browse Startups →
          </Link>
        </p>
      </div>
    </AllRolesProtected>
  );
}
