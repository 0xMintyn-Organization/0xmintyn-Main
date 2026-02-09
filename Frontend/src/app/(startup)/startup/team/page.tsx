"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { marketplaceApi } from "@/lib/marketplaceApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Users, DollarSign, Send, Target, Calendar, Edit3, BarChart3 } from "lucide-react";

type Engagement = {
  _id: string;
  contributorId: { _id: string; firstName?: string; lastName?: string; email?: string } | string;
  startDate: string;
  endDate?: string | null;
  agreedSalary: number;
  status: string;
  note?: string;
};

type Application = {
  _id: string;
  contributorId: { _id: string; email?: string; firstName?: string; lastName?: string } | string;
  status: string;
  monthlySalary?: number;
};

type Payout = {
  _id: string;
  contributorId: { _id: string; firstName?: string; lastName?: string; email?: string };
  amount: number;
  note?: string;
  paidAt?: string;
  createdAt: string;
};

type Analytics = {
  totalPaidToContributors?: number;
  payoutsCount?: number;
  engagementsCount?: number;
  byContributor?: { contributorId: string; totalPaid: number; count: number }[];
};

function getContributorName(c: Engagement["contributorId"] | Application["contributorId"]): string {
  if (typeof c !== "object" || !c) return "—";
  const first = "firstName" in c ? (c.firstName as string) : "";
  const last = "lastName" in c ? (c.lastName as string) : "";
  const email = "email" in c ? (c.email as string) : "";
  return [first, last].filter(Boolean).join(" ") || email || "—";
}

function getContributorId(c: Engagement["contributorId"] | Application["contributorId"]): string {
  if (typeof c !== "object" || !c || !("_id" in c)) return "";
  return c._id as string;
}

function formatDate(d: string | undefined | null): string {
  if (!d) return "—";
  return new Date(d).toISOString().slice(0, 10);
}

export default function StartupTeamPage() {
  const [engagements, setEngagements] = useState<Engagement[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [sendOpen, setSendOpen] = useState(false);
  const [selectedContributor, setSelectedContributor] = useState<{ id: string; name: string } | null>(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editingEngagement, setEditingEngagement] = useState<Engagement | null>(null);
  const [setupContributor, setSetupContributor] = useState<Application | null>(null);
  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");
  const [editSalary, setEditSalary] = useState("");
  const [savingEngagement, setSavingEngagement] = useState(false);
  const { toast } = useToast();

  const load = async () => {
    try {
      const [engRes, appRes, payRes, anaRes] = await Promise.all([
        marketplaceApi.engagement.list(),
        marketplaceApi.applications.list(),
        marketplaceApi.contributorPayout.list(),
        marketplaceApi.engagement.analytics(),
      ]);
      setEngagements((engRes.engagements as Engagement[]) || []);
      setApplications((appRes.applications as Application[]) || []);
      setPayouts((payRes.payouts as Payout[]) || []);
      setAnalytics((anaRes.analytics as Analytics) ?? null);
    } catch (e: unknown) {
      toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const hired = applications.filter((a) => a.status === "accepted");
  const engagementContributorIds = new Set(engagements.map((e) => getContributorId(e.contributorId)));
  const hiredWithoutEngagement = hired.filter((a) => !engagementContributorIds.has(getContributorId(a.contributorId)));
  const totalPaidOut = analytics?.totalPaidToContributors ?? payouts.reduce((s, p) => s + Number(p.amount), 0);

  const openSendSalary = (eng: Engagement) => {
    setSelectedContributor({ id: getContributorId(eng.contributorId), name: getContributorName(eng.contributorId) });
    setAmount("");
    setNote("");
    setSendOpen(true);
  };

  const handleSendSalary = async () => {
    if (!selectedContributor) return;
    const amt = Number(amount);
    if (isNaN(amt) || amt <= 0) {
      toast({ title: "Error", description: "Enter a valid amount", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      await marketplaceApi.contributorPayout.create({
        contributorId: selectedContributor.id,
        amount: amt,
        note: note.trim() || undefined,
      });
      toast({ title: "Paid", description: "Funds transferred to contributor's connected account via Stripe." });
      setSendOpen(false);
      setSelectedContributor(null);
      load();
    } catch (e: unknown) {
      toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const openEditEngagement = (eng: Engagement) => {
    setSetupContributor(null);
    setEditingEngagement(eng);
    setEditStart(formatDate(eng.startDate));
    setEditEnd(eng.endDate ? formatDate(eng.endDate) : "");
    setEditSalary(String(eng.agreedSalary ?? 0));
  };

  const handleSaveEngagement = async () => {
    const cid = editingEngagement ? getContributorId(editingEngagement.contributorId) : setupContributor ? getContributorId(setupContributor.contributorId) : "";
    if (!cid) return;
    setSavingEngagement(true);
    try {
      await marketplaceApi.engagement.put({
        contributorId: cid,
        startDate: editStart || undefined,
        endDate: editEnd || null,
        agreedSalary: editSalary === "" ? undefined : Number(editSalary),
      });
      toast({ title: "Saved", description: setupContributor ? "Engagement created." : "Engagement updated." });
      setEditingEngagement(null);
      setSetupContributor(null);
      load();
    } catch (e: unknown) {
      toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
    } finally {
      setSavingEngagement(false);
    }
  };

  const openSetupEngagement = (app: Application) => {
    setEditingEngagement(null);
    setSetupContributor(app);
    setEditStart(new Date().toISOString().slice(0, 10));
    setEditEnd("");
    setEditSalary(String(app.monthlySalary ?? 0));
  };

  const getPayoutsForContributor = (contributorId: string) =>
    payouts.filter((p) => String(p.contributorId?._id) === contributorId);
  const getTotalPaidForContributor = (contributorId: string) =>
    getPayoutsForContributor(contributorId).reduce((s, p) => s + Number(p.amount), 0);

  if (loading) return <p className="text-muted-foreground">Loading…</p>;

  return (
    <div className="w-full space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Users className="w-7 h-7" />
          Team
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage engagements: start/end dates, salary, send payouts, and analytics.
        </p>
      </div>

      {/* Analytics summary */}
      <section>
        <h2 className="font-semibold text-foreground mb-3 flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Analytics
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">Total paid to contributors</p>
            <p className="text-2xl font-bold text-foreground mt-1">{Number(totalPaidOut).toLocaleString()}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">Payouts recorded</p>
            <p className="text-2xl font-bold text-foreground mt-1">{analytics?.payoutsCount ?? payouts.length}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">Active engagements</p>
            <p className="text-2xl font-bold text-foreground mt-1">{engagements.filter((e) => e.status === "active").length}</p>
          </div>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          <Link href="/startup/funding" className="text-green-600 dark:text-green-400 hover:underline">Funding & money →</Link>
        </p>
      </section>

      {/* Engagements (deep management) */}
      <section>
        <h2 className="font-semibold text-foreground mb-3 flex items-center gap-2">
          <Users className="w-5 h-5" />
          Engagements
        </h2>
        {engagements.length === 0 && hired.length === 0 ? (
          <p className="text-muted-foreground rounded-lg border border-border bg-card p-6 text-center">
            No one hired yet. Accept applications from the <Link href="/startup/hiring" className="text-green-600 dark:text-green-400 hover:underline">Hiring</Link> page.
          </p>
        ) : hiredWithoutEngagement.length > 0 ? (
          <div className="space-y-3 mb-4">
            <p className="text-sm text-muted-foreground">Set up engagement for newly accepted contributors:</p>
            <ul className="space-y-2">
              {hiredWithoutEngagement.map((a) => (
                <li key={a._id} className="rounded-lg border border-border bg-card p-3 flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium">{getContributorName(a.contributorId)}</span>
                  <Button size="sm" onClick={() => openSetupEngagement(a)} className="bg-green-600 hover:bg-green-700">
                    Set up engagement (start date, salary)
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {engagements.length > 0 ? (
          <ul className="space-y-4">
            {engagements.map((eng) => {
              const cid = getContributorId(eng.contributorId);
              const paidToThis = getTotalPaidForContributor(cid);
              const payoutsThis = getPayoutsForContributor(cid);
              return (
                <li key={eng._id} className="rounded-xl border border-border bg-card overflow-hidden">
                  <div className="p-4 border-b border-border bg-muted/30 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-foreground">{getContributorName(eng.contributorId)}</p>
                      <p className="text-xs text-muted-foreground capitalize">{eng.status}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link href="/startup/milestones">
                        <Button variant="outline" size="sm" className="gap-1.5">
                          <Target className="w-4 h-4" />
                          View milestones
                        </Button>
                      </Link>
                      <Button size="sm" variant="outline" className="gap-1.5" onClick={() => openEditEngagement(eng)}>
                        <Edit3 className="w-4 h-4" />
                        Edit
                      </Button>
                      <Button size="sm" className="gap-1.5 bg-green-600 hover:bg-green-700" onClick={() => openSendSalary(eng)}>
                        <Send className="w-4 h-4" />
                        Send salary
                      </Button>
                    </div>
                  </div>
                  <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Start date
                      </p>
                      <p className="font-medium text-foreground">{formatDate(eng.startDate)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">End date</p>
                      <p className="font-medium text-foreground">{formatDate(eng.endDate)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        Agreed salary
                      </p>
                      <p className="font-medium text-foreground">{Number(eng.agreedSalary ?? 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Total paid (this contributor)</p>
                      <p className="font-medium text-foreground">{paidToThis.toLocaleString()}</p>
                    </div>
                  </div>
                  {payoutsThis.length > 0 && (
                    <div className="px-4 pb-4">
                      <p className="text-xs text-muted-foreground mb-2">Payout history</p>
                      <ul className="space-y-1">
                        {payoutsThis.slice(0, 5).map((p) => (
                          <li key={p._id} className="flex justify-between text-sm">
                            <span className="text-muted-foreground">{p.note || "Payout"}</span>
                            <span className="font-medium">{Number(p.amount).toLocaleString()}</span>
                          </li>
                        ))}
                        {payoutsThis.length > 5 && (
                          <li className="text-xs text-muted-foreground">+{payoutsThis.length - 5} more</li>
                        )}
                      </ul>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        ) : null}
      </section>

      {/* Send salary dialog */}
      <Dialog open={sendOpen} onOpenChange={setSendOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pay contributor</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Transfer funds to <strong>{selectedContributor?.name}</strong> via Stripe. Both you and the contributor must have connected bank accounts. Funds are pulled from your milestone funding.
          </p>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input
                type="number"
                min={0.01}
                step={0.01}
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Note (optional)</Label>
              <Input placeholder="e.g. March salary, Milestone X" value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSendOpen(false)}>Cancel</Button>
            <Button onClick={handleSendSalary} disabled={submitting} className="bg-green-600 hover:bg-green-700">
              {submitting ? "Processing…" : "Pay via Stripe"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit / Set up engagement dialog */}
      <Dialog open={!!editingEngagement || !!setupContributor} onOpenChange={() => { setEditingEngagement(null); setSetupContributor(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{setupContributor ? "Set up engagement" : "Edit engagement"}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {editingEngagement && getContributorName(editingEngagement.contributorId)}
            {setupContributor && getContributorName(setupContributor.contributorId)}
          </p>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Start date</Label>
              <Input type="date" value={editStart} onChange={(e) => setEditStart(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>End date (optional)</Label>
              <Input type="date" value={editEnd} onChange={(e) => setEditEnd(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Agreed salary (e.g. monthly)</Label>
              <Input
                type="number"
                min={0}
                step={0.01}
                placeholder="0"
                value={editSalary}
                onChange={(e) => setEditSalary(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditingEngagement(null); setSetupContributor(null); }}>Cancel</Button>
            <Button onClick={handleSaveEngagement} disabled={savingEngagement} className="bg-green-600 hover:bg-green-700">
              {savingEngagement ? "Saving…" : setupContributor ? "Create engagement" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
