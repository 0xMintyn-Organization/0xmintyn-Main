"use client";

import { useEffect, useState } from "react";
import { AllRolesProtected } from "@/components/RoleProtected";
import { marketplaceApi } from "@/lib/marketplaceApi";
import { Building2, Store, ArrowRight, Users, Sparkles } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

type Startup = {
  _id: string;
  companyName: string;
  description?: string;
  image?: string;
  fundingState?: string;
  aim?: string;
  positionsHiring?: string;
  personsNeeded?: number;
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
      <div className="w-full px-6 py-6 space-y-6">
        {/* Header – same spacing as Education Hub */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-3 tracking-tight">
              <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-green-500/15 text-green-600 dark:text-green-400">
                <Store className="w-6 h-6" />
              </span>
              Marketplace — Startups
            </h1>
            <p className="text-muted-foreground mt-2">
              Browse approved startups. Apply to join and contribute to their milestones.
            </p>
          </div>
          <Link
            href="/marketplace/contributors"
            className="text-sm font-medium text-green-600 dark:text-green-400 hover:underline shrink-0"
          >
            Browse Contributors →
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
        ) : startups.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-12 text-center">
            <div className="flex justify-center mb-4">
              <span className="flex items-center justify-center w-16 h-16 rounded-lg bg-muted text-muted-foreground">
                <Building2 className="w-8 h-8" />
              </span>
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-2">No startups yet</h2>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">
              Approved startup profiles will appear here. Check back later or browse contributors.
            </p>
            <Link
              href="/marketplace/contributors"
              className="inline-flex items-center gap-2 text-sm font-medium text-green-600 dark:text-green-400 hover:underline"
            >
              Go to Contributors
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {startups.map((s) => (
              <li key={s._id}>
                <Link href={`/marketplace/startups/${s._id}`} className="block h-full group">
                  <article className="h-full rounded-lg shadow-md bg-card dark:bg-zinc-800 border border-border overflow-hidden hover:shadow-xl transition-all duration-300">
                    {/* Card image – same h-48 as Education Hub */}
                    <div className="relative h-48 bg-gradient-to-br from-green-500/10 via-muted/50 to-muted overflow-hidden">
                      {s.image ? (
                        <img
                          src={s.image}
                          alt=""
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Building2 className="w-14 h-14 text-muted-foreground/60" />
                        </div>
                      )}
                      {s.fundingState && (
                        <span className="absolute top-2 left-2 rounded-full bg-green-900 text-white dark:bg-green-800 px-2 py-1 text-xs font-semibold">
                          {s.fundingState}
                        </span>
                      )}
                    </div>
                    <div className="p-4 space-y-3">
                      <h2 className="font-semibold text-lg text-foreground dark:text-white line-clamp-2 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                        {s.companyName}
                      </h2>
                      {s.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {s.description}
                        </p>
                      )}
                      {(s.aim || s.positionsHiring) && (
                        <div className="flex flex-wrap gap-2">
                          {s.aim && (
                            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted/80 rounded-md px-2 py-1">
                              <Sparkles className="w-3 h-3 shrink-0" />
                              <span className="truncate max-w-[140px]">{s.aim}</span>
                            </span>
                          )}
                          {s.positionsHiring && (
                            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted/80 rounded-md px-2 py-1">
                              <Users className="w-3 h-3 shrink-0" />
                              Hiring
                            </span>
                          )}
                        </div>
                      )}
                      <p className="flex items-center gap-1.5 text-sm font-medium text-green-600 dark:text-green-400 pt-1">
                        View details
                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                      </p>
                    </div>
                  </article>
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
