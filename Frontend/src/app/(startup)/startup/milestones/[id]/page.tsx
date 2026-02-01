"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { marketplaceApi } from "@/lib/marketplaceApi";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

type Milestone = {
  _id: string;
  title: string;
  description?: string;
  amount: number;
  status: string;
  assignedContributorId?: unknown;
  startupId?: unknown;
  completedAt?: string;
  paidAt?: string;
};

export default function MilestoneDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const [milestone, setMilestone] = useState<Milestone | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const { toast } = useToast();

  const load = async () => {
    if (!id) return;
    try {
      const mRes = await marketplaceApi.milestones.get(id);
      setMilestone(mRes.milestone as Milestone);
    } catch (e: unknown) {
      toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
      router.push("/startup/milestones");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const handleMarkComplete = async () => {
    if (!id) return;
    setUpdating(true);
    try {
      await marketplaceApi.milestones.patch(id, { status: "Completed" });
      toast({ title: "Marked complete", description: "Milestone is now completed. Admin can approve funding." });
      load();
    } catch (e: unknown) {
      toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
    } finally {
      setUpdating(false);
    }
  };

  if (loading || !milestone) return <p className="text-muted-foreground">Loading…</p>;

  const canMarkInProgress = milestone.status === "Open";
  const canMarkComplete = milestone.status === "In Progress";

  const handleMarkInProgress = async () => {
    if (!id) return;
    setUpdating(true);
    try {
      await marketplaceApi.milestones.patch(id, { status: "In Progress" });
      toast({ title: "Started", description: "Milestone is now in progress." });
      load();
    } catch (e: unknown) {
      toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-4">
        <Link href="/startup/milestones" className="text-sm text-green-600 dark:text-green-400 hover:underline">
          ← Back to Milestones
        </Link>
      </div>
      <div className="rounded-lg border border-border bg-card p-6 mb-6">
        <h1 className="text-2xl font-bold text-foreground">{milestone.title}</h1>
        {milestone.description && <p className="text-muted-foreground mt-1">{milestone.description}</p>}
        <p className="mt-2 text-sm">Amount: {Number(milestone.amount).toLocaleString()} · Status: {milestone.status}</p>
        {canMarkInProgress && (
          <div className="mt-4">
            <Button onClick={handleMarkInProgress} disabled={updating}>
              {updating ? "Updating…" : "Mark in progress"}
            </Button>
          </div>
        )}
        {canMarkComplete && (
          <div className="mt-4">
            <Button onClick={handleMarkComplete} disabled={updating}>
              {updating ? "Updating…" : "Mark complete"}
            </Button>
            <p className="text-xs text-muted-foreground mt-2">Completed milestones are visible to admin for funding approval.</p>
          </div>
        )}
      </div>
      <p className="text-sm text-muted-foreground">
        <Link href="/startup/hiring" className="text-green-600 dark:text-green-400 hover:underline">Hiring</Link> – manage contributor applications to your startup.
      </p>
    </div>
  );
}
