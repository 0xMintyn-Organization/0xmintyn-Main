"use client";

import { useEffect, useState } from "react";
import { AllRolesProtected } from "@/components/RoleProtected";
import { Card, CardContent } from "@/components/ui/card";
import { marketplaceApi } from "@/lib/marketplaceApi";
import { Building2, Store, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

type Startup = {
  _id: string;
  companyName: string;
  description?: string;
  fundingState?: string;
  status?: string;
  userId?: { startupName?: string; firstName?: string; lastName?: string };
};

export default function MarketplaceStartupsPage() {
  const [startups, setStartups] = useState<Startup[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    (async () => {
      try {
        const res = await marketplaceApi.startupProfile.list();
        setStartups((res.startups as Startup[]) || []);
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
            Marketplace — Startups
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            Browse approved startups on the platform.
          </p>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Loading startups…</p>
        ) : startups.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Building2 className="w-16 h-16 text-zinc-300 dark:text-zinc-600 mb-4" />
              <h2 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                No startups yet
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-md">
                Approved startup profiles will appear here. Check back later or browse contributors.
              </p>
              <Link
                href="/marketplace/contributors"
                className="mt-4 text-sm text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
              >
                Go to Contributors →
              </Link>
            </CardContent>
          </Card>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {startups.map((s) => (
              <li key={s._id}>
                <Link href={`/marketplace/startups/${s._id}`}>
                  <Card className="h-full hover:border-green-500/50 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h2 className="font-semibold text-foreground truncate">{s.companyName}</h2>
                          {s.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{s.description}</p>
                          )}
                          {s.fundingState && (
                            <p className="text-xs text-muted-foreground mt-2">{s.fundingState}</p>
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
          <Link href="/marketplace/contributors" className="text-green-600 dark:text-green-400 hover:underline">
            Browse Contributors →
          </Link>
        </p>
      </div>
    </AllRolesProtected>
  );
}
