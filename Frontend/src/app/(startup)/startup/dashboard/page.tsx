"use client";

import Link from "next/link";
import useAuth from "@/hooks/userAuth";
import { Button } from "@/components/ui/button";
import { User, Target, Users, DollarSign } from "lucide-react";

export default function StartupDashboardPage() {
  const { user } = useAuth();
  const startupName = (user as { startupName?: string })?.startupName || "your startup";

  const links = [
    { name: "Profile", href: "/startup/profile", icon: User, description: "View and edit your startup profile." },
    { name: "Milestones", href: "/startup/milestones", icon: Target, description: "Create milestones and mark them complete for funding." },
    { name: "Hiring", href: "/startup/hiring", icon: Users, description: "Review and accept contributor applications to your startup." },
    { name: "Funding received", href: "/startup/funding", icon: DollarSign, description: "View payments received for completed milestones." },
  ];

  return (
    <div className="w-full">
      <h1 className="text-2xl font-bold text-foreground mb-2">Startup Dashboard</h1>
      <p className="text-muted-foreground mb-6">
        Welcome, {startupName}. Manage your milestones and hiring from here.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {links.map(({ name, href, icon: Icon, description }) => (
          <Link key={href} href={href}>
            <div className="rounded-lg border border-border bg-card p-4 hover:bg-muted/50 transition-colors h-full">
              <h2 className="font-semibold text-foreground mb-1 flex items-center gap-2">
                <Icon className="w-5 h-5" />
                {name}
              </h2>
              <p className="text-sm text-muted-foreground">{description}</p>
              <Button variant="link" className="p-0 h-auto mt-2 text-green-600 dark:text-green-400">
                Go to {name} →
              </Button>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
