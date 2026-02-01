"use client";

import { AllRolesProtected } from "@/components/RoleProtected";
import { Card, CardContent } from "@/components/ui/card";
import { Store, Target } from "lucide-react";
import Link from "next/link";

export default function MarketplaceMilestonesPage() {
  return (
    <AllRolesProtected>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Store className="w-7 h-7 text-green-600" />
          Marketplace — Milestones
        </h1>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Target className="w-16 h-16 text-zinc-300 dark:text-zinc-600 mb-4" />
            <h2 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
              Apply to startups, not milestones
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-md">
              Milestones are defined by startups and marked complete by them. There is no public milestone list. To work with a startup, apply to the startup from the Startups page.
            </p>
            <Link
              href="/marketplace/startups"
              className="mt-4 text-sm text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
            >
              Browse Startups →
            </Link>
          </CardContent>
        </Card>
      </div>
    </AllRolesProtected>
  );
}
