"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { marketplaceApi } from "@/lib/marketplaceApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

type Milestone = {
  _id: string;
  title: string;
  description?: string;
  amount: number;
  status: string;
  assignedContributorId?: unknown;
  createdAt: string;
};

const STATUS_COLORS: Record<string, string> = {
  Open: "bg-zinc-100 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-300",
  "In Progress": "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  Completed: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  Paid: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
};

export default function StartupMilestonesPage() {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const { toast } = useToast();

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
      await marketplaceApi.milestones.create({ title: title.trim(), description: description.trim() || undefined, amount: amt });
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

  if (loading) {
    return <p className="text-muted-foreground">Loading milestones…</p>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-foreground">Milestones</h1>
        <Button onClick={() => setShowForm(!showForm)} variant={showForm ? "outline" : "default"}>
          {showForm ? "Cancel" : "New milestone"}
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="rounded-lg border border-border bg-card p-4 mb-6 space-y-3">
          <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          <Input placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} />
          <Input type="number" min={0} step={0.01} placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} required />
          <div className="flex gap-2">
            <Button type="submit" disabled={creating}>{creating ? "Creating…" : "Create"}</Button>
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </form>
      )}

      {milestones.length === 0 ? (
        <p className="text-muted-foreground">No milestones yet. Create one to get started.</p>
      ) : (
        <ul className="space-y-3">
          {milestones.map((m) => (
            <li key={m._id} className="rounded-lg border border-border bg-card p-4 flex flex-wrap items-center justify-between gap-2">
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
