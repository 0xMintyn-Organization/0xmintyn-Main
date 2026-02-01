"use client";

import { useEffect, useState } from "react";
import { AllRolesProtected } from "@/components/RoleProtected";
import { Card, CardContent } from "@/components/ui/card";
import { marketplaceApi } from "@/lib/marketplaceApi";
import { Store, Users, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

type Contributor = {
  _id: string;
  skills?: string[];
  portfolio?: string;
  availability?: string;
  userId?: { firstName?: string; lastName?: string; email?: string };
};

function displayName(c: Contributor): string {
  const u = c.userId;
  if (!u || typeof u !== "object") return "Contributor";
  const name = [u.firstName, u.lastName].filter(Boolean).join(" ");
  return name || (u.email as string) || "Contributor";
}

export default function MarketplaceContributorsPage() {
  const [contributors, setContributors] = useState<Contributor[]>([]);
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

  return (
    <AllRolesProtected>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Store className="w-7 h-7 text-green-600" />
            Marketplace — Contributors
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            Browse contributors on the platform.
          </p>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Loading contributors…</p>
        ) : contributors.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Users className="w-16 h-16 text-zinc-300 dark:text-zinc-600 mb-4" />
              <h2 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                No contributors yet
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-md">
                Contributor profiles will appear here when they sign up. Browse startups in the meantime.
              </p>
              <Link
                href="/marketplace/startups"
                className="mt-4 text-sm text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
              >
                Go to Startups →
              </Link>
            </CardContent>
          </Card>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {contributors.map((c) => (
              <li key={c._id}>
                <Link href={`/marketplace/contributors/${c._id}`}>
                  <Card className="h-full hover:border-green-500/50 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h2 className="font-semibold text-foreground truncate">{displayName(c)}</h2>
                          {Array.isArray(c.skills) && c.skills.length > 0 && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {c.skills.slice(0, 3).join(", ")}
                              {c.skills.length > 3 ? "…" : ""}
                            </p>
                          )}
                          {c.availability && (
                            <p className="text-xs text-muted-foreground mt-2">{c.availability}</p>
                          )}
                        </div>
                        <ChevronRight className="w-5 h-5 shrink-0 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
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
