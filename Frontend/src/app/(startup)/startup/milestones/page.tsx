"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Target, Loader2 } from "lucide-react";
import { marketplaceApi } from "@/lib/marketplaceApi";
import { stripeApi } from "@/lib/stripeApi";
import { StripeConnectOnboarding } from "@/components/marketplace/StripeConnectOnboarding";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

type Milestone = {
  _id: string;
  title: string;
  description?: string;
  amount: number;
  status: string;
  createdAt: string;
};

const STATUS_COLORS: Record<string, string> = {
  Open: "bg-zinc-100 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-300",
  "In Progress": "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  Completed: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  Submitted: "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300",
  Paid: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  Rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

export default function StartupMilestonesPage() {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [stripeOk, setStripeOk] = useState<boolean | null>(null);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    stripeApi
      .getStatus()
      .then((res) => setStripeOk(res.connected && res.chargesEnabled && res.payoutsEnabled))
      .catch(() => setStripeOk(false));
  }, []);

  const load = async () => {
    try {
      const res = await marketplaceApi.milestones.list();
      setMilestones((res.milestones as Milestone[]) || []);
    } catch (e: unknown) {
      toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(amount);
    if (!title.trim()) {
      toast({ title: "Error", description: "Title is required", variant: "destructive" });
      return;
    }
    if (isNaN(amt) || amt < 0) {
      toast({ title: "Error", description: "Amount must be a non-negative number", variant: "destructive" });
      return;
    }
    setCreating(true);
    try {
      await marketplaceApi.milestones.create({
        title: title.trim(),
        description: description.trim() || undefined,
        amount: amt,
      });
      toast({ title: "Created", description: "Milestone created." });
      setTitle("");
      setDescription("");
      setAmount("");
      setShowForm(false);
      load();
    } catch (err: unknown) {
      toast({ title: "Error", description: (err as Error).message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  if (loading || stripeOk === null) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!stripeOk) {
    return (
      <div className="w-full">
        <div className="max-w-lg mx-auto">
          <div className="bg-card rounded-xl border border-border p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-full bg-amber-100 dark:bg-amber-900/30">
                <Target className="w-8 h-8 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Connect your bank account to create milestones</h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  You must complete Stripe onboarding before you can create milestones. This ensures you can receive funding when admin approves completed work.
                </p>
              </div>
            </div>
            <div className="border-t border-border pt-6">
              <StripeConnectOnboarding label="Receive milestone funding" className="text-base" />
            </div>
            <p className="mt-6 text-xs text-muted-foreground">
              After connecting, refresh this page to create milestones.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-foreground">Milestones</h1>
        <Button onClick={() => setShowForm(!showForm)} variant={showForm ? "outline" : "default"}>
          {showForm ? "Cancel" : "New milestone"}
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="rounded-lg border border-border bg-card p-4 mb-6 space-y-4">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Description (optional)</Label>
            <Input placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Amount</Label>
            <Input type="number" min={0} step={0.01} placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} required />
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={creating}>{creating ? "Creating…" : "Create"}</Button>
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </form>
      )}

      {milestones.length === 0 ? (
        <p className="text-muted-foreground rounded-xl border border-dashed border-border bg-card p-8 text-center">No milestones yet. Create one to get started.</p>
      ) : (
        <ul className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {milestones.map((m) => (
            <li key={m._id} className="rounded-xl border border-border bg-card p-4 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-semibold text-foreground">{m.title}</h2>
                {m.description && <p className="text-sm text-muted-foreground">{m.description}</p>}
                <p className="text-sm mt-1">Amount: {Number(m.amount).toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-1 rounded-full ${STATUS_COLORS[m.status] || "bg-muted"}`}>{m.status}</span>
                <Link href={`/startup/milestones/${m._id}`}>
                  <Button variant="outline" size="sm">View</Button>
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
