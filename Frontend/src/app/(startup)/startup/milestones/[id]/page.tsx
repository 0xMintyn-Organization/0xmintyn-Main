"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { marketplaceApi } from "@/lib/marketplaceApi";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Milestone = {
  _id: string;
  title: string;
  description?: string;
  amount: number;
  status: string;
  startupId?: unknown;
  assignedContributorId?: { _id: string; firstName?: string; lastName?: string; email?: string } | string;
  completedAt?: string;
  submittedAt?: string;
  paidAt?: string;
  rejectedAt?: string;
};

type Engagement = {
  _id: string;
  contributorId: { _id: string; firstName?: string; lastName?: string; email?: string } | string;
};

function getContributorName(c: Milestone["assignedContributorId"]): string {
  if (!c) return "—";
  if (typeof c === "string") return c;
  const n = [c.firstName, c.lastName].filter(Boolean).join(" ");
  return n || (c.email as string) || "—";
}

function getContributorId(c: Engagement["contributorId"]): string {
  if (!c) return "";
  return typeof c === "object" && c._id ? c._id : String(c);
}

export default function MilestoneDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const [milestone, setMilestone] = useState<Milestone | null>(null);
  const [engagements, setEngagements] = useState<Engagement[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [selectedContributorId, setSelectedContributorId] = useState<string>("");
  const { toast } = useToast();

  const load = async () => {
    if (!id) return;
    try {
      const [mRes, eRes] = await Promise.all([
        marketplaceApi.milestones.get(id),
        marketplaceApi.engagement.list(),
      ]);
      setMilestone(mRes.milestone as Milestone);
      setEngagements((eRes.engagements as Engagement[]) || []);
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

  const handleAssignAndProceed = async () => {
    if (!id || !selectedContributorId) {
      toast({ title: "Select a contributor", variant: "destructive" });
      return;
    }
    setUpdating(true);
    try {
      await marketplaceApi.milestones.patch(id, {
        assignedContributorId: selectedContributorId,
        status: "In Progress",
      });
      toast({ title: "Assigned & in progress", description: "Contributor can now see and complete this milestone." });
      load();
    } catch (e: unknown) {
      toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
    } finally {
      setUpdating(false);
    }
  };

  const handleSubmitForFunding = async () => {
    if (!id) return;
    setUpdating(true);
    try {
      await marketplaceApi.milestones.patch(id, { status: "Submitted" });
      toast({ title: "Submitted", description: "Milestone is with admin for approval or rejection." });
      load();
    } catch (e: unknown) {
      toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
    } finally {
      setUpdating(false);
    }
  };

  if (loading || !milestone) return <p className="text-muted-foreground">Loading…</p>;

  const isOpen = milestone.status === "Open";
  const isInProgress = milestone.status === "In Progress";
  const isCompleted = milestone.status === "Completed";
  const isSubmitted = milestone.status === "Submitted";
  const isPaid = milestone.status === "Paid";
  const isRejected = milestone.status === "Rejected";

  return (
    <div className="w-full">
      <div className="mb-4">
        <Link href="/startup/milestones" className="text-sm text-green-600 dark:text-green-400 hover:underline">
          ← Back to Milestones
        </Link>
      </div>
      <div className="rounded-lg border border-border bg-card p-6 mb-6">
        <h1 className="text-2xl font-bold text-foreground">{milestone.title}</h1>
        {milestone.description && <p className="text-muted-foreground mt-1">{milestone.description}</p>}
        <p className="mt-2 text-sm">
          Amount: {Number(milestone.amount).toLocaleString()} · Status: {milestone.status}
        </p>
        {milestone.assignedContributorId && (
          <p className="mt-1 text-sm text-muted-foreground">
            Assigned to: {getContributorName(milestone.assignedContributorId)}
          </p>
        )}

        {isOpen && (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-muted-foreground">Assign to a hired contributor and mark in progress.</p>
            <Select value={selectedContributorId} onValueChange={setSelectedContributorId}>
              <SelectTrigger className="w-full max-w-xs">
                <SelectValue placeholder="Select contributor" />
              </SelectTrigger>
              <SelectContent>
                {engagements.map((e) => (
                  <SelectItem key={e._id} value={getContributorId(e.contributorId)}>
                    {typeof e.contributorId === "object" && e.contributorId
                      ? [e.contributorId.firstName, e.contributorId.lastName].filter(Boolean).join(" ") || e.contributorId.email
                      : getContributorId(e.contributorId)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleAssignAndProceed} disabled={updating || !selectedContributorId}>
              {updating ? "Updating…" : "Assign & mark in progress"}
            </Button>
          </div>
        )}

        {isInProgress && (
          <p className="mt-4 text-sm text-muted-foreground">
            Contributor is working on this. They will mark it complete when done.
          </p>
        )}

        {isCompleted && (
          <div className="mt-4">
            <Button onClick={handleSubmitForFunding} disabled={updating}>
              {updating ? "Submitting…" : "Submit for funding"}
            </Button>
            <p className="text-xs text-muted-foreground mt-2">Submit to admin for approval. Then it will appear in Admin → Funding.</p>
          </div>
        )}

        {isSubmitted && (
          <p className="mt-4 text-sm text-muted-foreground">Waiting for admin to approve or reject funding.</p>
        )}

        {isPaid && <p className="mt-4 text-sm text-green-600 dark:text-green-400">Paid — funding released.</p>}
        {isRejected && <p className="mt-4 text-sm text-destructive">Rejected by admin.</p>}
      </div>
      <p className="text-sm text-muted-foreground">
        <Link href="/startup/hiring" className="text-green-600 dark:text-green-400 hover:underline">Hiring</Link>
        {" · "}
        <Link href="/startup/team" className="text-green-600 dark:text-green-400 hover:underline">Team</Link>
      </p>
    </div>
  );
}
