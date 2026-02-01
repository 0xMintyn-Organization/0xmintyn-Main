"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import useAuth from "@/hooks/userAuth";
import { AllRolesProtected } from "@/components/RoleProtected";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { marketplaceApi } from "@/lib/marketplaceApi";
import { uploadFileToBackend } from "@/lib/uploadFileToBackend";
import {
  Send,
  ArrowLeft,
  Building2,
  Target,
  Users,
  Mail,
  DollarSign,
  Sparkles,
  FileText,
  Loader2,
  MessageSquare,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type StartupProfile = {
  _id: string;
  companyName: string;
  description?: string;
  image?: string;
  fundingState?: string;
  contact?: string;
  aim?: string;
  positionsHiring?: string;
  personsNeeded?: number;
  status?: string;
  userId?: {
    _id?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    startupName?: string;
    startupDescription?: string;
  };
};

type Milestone = {
  _id: string;
  title: string;
  description?: string;
  amount: number;
  status: string;
  createdAt?: string;
};

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
        <Icon className="w-4 h-4" />
        {title}
      </h2>
      <div className="text-foreground">{children}</div>
    </section>
  );
}

export default function MarketplaceStartupDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const { user } = useAuth();
  const marketplaceRole = (user as { marketplace_role?: string })?.marketplace_role;
  const [profile, setProfile] = useState<StartupProfile | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [milestonesLoading, setMilestonesLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [coverMessage, setCoverMessage] = useState("");
  const [cvUrl, setCvUrl] = useState<string | undefined>(undefined);
  const [monthlySalary, setMonthlySalary] = useState<string>("");
  const [uploadingCv, setUploadingCv] = useState(false);
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const cvInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await marketplaceApi.startupProfile.getById(id);
        setProfile(res.profile as StartupProfile);
      } catch (e: unknown) {
        toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    })();
  }, [id, toast]);

  useEffect(() => {
    if (!id || !profile) return;
    (async () => {
      setMilestonesLoading(true);
      try {
        const res = await marketplaceApi.startupProfile.getMilestones(id);
        setMilestones((res.milestones as Milestone[]) || []);
      } catch {
        setMilestones([]);
      } finally {
        setMilestonesLoading(false);
      }
    })();
  }, [id, profile]);

  if (loading) {
    return (
      <AllRolesProtected>
        <div className="w-full flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </AllRolesProtected>
    );
  }

  if (!profile) {
    return (
      <AllRolesProtected>
        <div className="w-full space-y-4">
          <p className="text-muted-foreground">Startup not found or not available.</p>
          <Link
            href="/marketplace/startups"
            className="inline-flex items-center gap-2 text-sm font-medium text-green-600 dark:text-green-400 hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Startups
          </Link>
        </div>
      </AllRolesProtected>
    );
  }

  const profileUser = profile.userId;
  const displayName =
    profile.companyName ||
    (profileUser &&
    typeof profileUser === "object" &&
    "startupName" in profileUser
      ? (profileUser.startupName as string)
      : "—");
  const startupUserId =
    profileUser && typeof profileUser === "object" && "_id" in profileUser
      ? (profileUser._id as string)
      : (profile.userId as unknown as string);

  const handleCvChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      toast({ title: "Invalid file", description: "Please upload a PDF file only (CV/resume).", variant: "destructive" });
      return;
    }
    setUploadingCv(true);
    try {
      const { url } = await uploadFileToBackend(file);
      setCvUrl(url);
      toast({ title: "CV uploaded", description: "Your CV has been attached to the application." });
    } catch (err) {
      toast({ title: "Upload failed", description: (err as Error).message, variant: "destructive" });
    } finally {
      setUploadingCv(false);
      if (cvInputRef.current) cvInputRef.current.value = "";
    }
  };

  const handleApply = async () => {
    if (!startupUserId) return;
    setApplying(true);
    try {
      const salaryNum = monthlySalary.trim() ? parseFloat(monthlySalary.trim()) : undefined;
      if (monthlySalary.trim() && (isNaN(salaryNum as number) || (salaryNum as number) < 0)) {
        toast({ title: "Invalid salary", description: "Please enter a valid non-negative number.", variant: "destructive" });
        setApplying(false);
        return;
      }
      await marketplaceApi.applications.create({
        startupId: startupUserId,
        coverMessage: coverMessage.trim() || undefined,
        cvUrl: cvUrl || undefined,
        monthlySalary: salaryNum,
      });
      toast({ title: "Applied", description: "Your application was sent to the startup." });
      setApplyDialogOpen(false);
      setCoverMessage("");
      setCvUrl(undefined);
      setMonthlySalary("");
    } catch (e: unknown) {
      toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
    } finally {
      setApplying(false);
    }
  };

  return (
    <AllRolesProtected>
      <div className="w-full px-6 py-6 space-y-6">
        {/* Back link */}
        <Link
          href="/marketplace/startups"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Startups
        </Link>

        {/* Hero – Education Hub style card */}
        <div className="rounded-lg border border-border bg-card dark:bg-zinc-800 overflow-hidden shadow-md">
          <div className="flex flex-col sm:flex-row gap-0">
            <div className="relative w-full sm:w-72 sm:min-w-[18rem] h-48 sm:h-64 bg-gradient-to-br from-green-500/15 via-muted/50 to-muted">
              {profile.image ? (
                <img
                  src={profile.image}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Building2 className="w-16 h-16 text-muted-foreground/50" />
                </div>
              )}
            </div>
            <div className="flex-1 p-6 sm:p-8 flex flex-col justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                    {displayName}
                  </h1>
                  {profile.fundingState && (
                    <span className="rounded-lg bg-green-500/15 text-green-700 dark:text-green-400 px-3 py-1 text-sm font-medium">
                      {profile.fundingState}
                    </span>
                  )}
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                {marketplaceRole === "contributor" && startupUserId && (
                  <>
                    <Button asChild variant="outline" className="gap-2">
                      <Link href={`/messenger?with=${startupUserId}`}>
                        <MessageSquare className="w-4 h-4" />
                        Message
                      </Link>
                    </Button>
                    <Dialog open={applyDialogOpen} onOpenChange={setApplyDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="gap-2 bg-green-600 hover:bg-green-700">
                          <Send className="w-4 h-4" />
                          Apply to this startup
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Apply to {displayName}</DialogTitle>
                          <DialogDescription>
                            Add a cover message and upload your CV. The startup will review your application.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-2">
                          <div className="space-y-2">
                            <Label htmlFor="cover">Cover message</Label>
                            <Input
                              id="cover"
                              placeholder="Introduce yourself and why you want to work with this startup"
                              value={coverMessage}
                              onChange={(e) => setCoverMessage(e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="monthlySalary">Expected monthly salary (optional)</Label>
                            <Input
                              id="monthlySalary"
                              type="number"
                              min={0}
                              step={1}
                              placeholder="e.g. 5000"
                              value={monthlySalary}
                              onChange={(e) => setMonthlySalary(e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>CV / Resume – PDF only (recommended)</Label>
                            <input
                              ref={cvInputRef}
                              type="file"
                              accept=".pdf,application/pdf"
                              onChange={handleCvChange}
                              className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-green-600 file:text-white file:text-sm file:font-medium file:cursor-pointer hover:file:bg-green-700"
                            />
                            {uploadingCv && <p className="text-xs text-muted-foreground">Uploading…</p>}
                            {cvUrl && <p className="text-xs text-green-600 dark:text-green-400">CV attached.</p>}
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setApplyDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleApply} disabled={applying}>
                            {applying ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                Sending…
                              </>
                            ) : (
                              "Send application"
                            )}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </>
                )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Details grid – same gap-6 as Education Hub */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {profile.description && (
              <div className="rounded-lg border border-border bg-card dark:bg-zinc-800 p-6 shadow-sm">
                <Section title="About" icon={FileText}>
                  <p className="text-foreground/90 whitespace-pre-wrap leading-relaxed">
                    {profile.description}
                  </p>
                </Section>
              </div>
            )}
            {profile.aim && (
              <div className="rounded-lg border border-border bg-card dark:bg-zinc-800 p-6 shadow-sm">
                <Section title="Aim / Vision" icon={Sparkles}>
                  <p className="text-foreground/90 whitespace-pre-wrap leading-relaxed">
                    {profile.aim}
                  </p>
                </Section>
              </div>
            )}
            {profile.positionsHiring && (
              <div className="rounded-lg border border-border bg-card dark:bg-zinc-800 p-6 shadow-sm">
                <Section title="Positions hiring" icon={Users}>
                  <p className="text-foreground/90 whitespace-pre-wrap leading-relaxed">
                    {profile.positionsHiring}
                  </p>
                </Section>
              </div>
            )}
          </div>
          <div className="space-y-6">
            {profile.personsNeeded != null && profile.personsNeeded > 0 && (
              <div className="rounded-lg border border-border bg-card dark:bg-zinc-800 p-6 shadow-sm">
                <Section title="Persons needed" icon={Users}>
                  <p className="text-foreground font-medium">{profile.personsNeeded}</p>
                </Section>
              </div>
            )}
            {profile.fundingState && (
              <div className="rounded-lg border border-border bg-card dark:bg-zinc-800 p-6 shadow-sm">
                <Section title="Funding" icon={DollarSign}>
                  <p className="text-foreground">{profile.fundingState}</p>
                </Section>
              </div>
            )}
            {profile.contact && (
              <div className="rounded-lg border border-border bg-card dark:bg-zinc-800 p-6 shadow-sm">
                <Section title="Contact" icon={Mail}>
                  <a
                    href={profile.contact.startsWith("mailto:") ? profile.contact : `mailto:${profile.contact}`}
                    className="text-green-600 dark:text-green-400 hover:underline"
                  >
                    {profile.contact}
                  </a>
                </Section>
              </div>
            )}
            {profileUser &&
              typeof profileUser === "object" &&
              (profileUser.firstName || profileUser.lastName || profileUser.email) && (
                <div className="rounded-lg border border-border bg-card dark:bg-zinc-800 p-6 shadow-sm">
                  <Section title="Team" icon={Building2}>
                    <p className="text-foreground">
                      {[profileUser.firstName, profileUser.lastName].filter(Boolean).join(" ")}
                      {profileUser.email ? ` · ${profileUser.email}` : ""}
                    </p>
                  </Section>
                </div>
              )}
          </div>
        </div>

        {/* Milestones – Education Hub style: gap-6, rounded-lg cards, p-4 space-y-3 */}
        <div className="rounded-lg border border-border bg-card dark:bg-zinc-800 overflow-hidden shadow-md">
          <div className="px-6 py-4 border-b border-border bg-muted/30">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Target className="w-5 h-5 text-green-600 dark:text-green-400" />
              Milestones
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Open and in-progress milestones for this startup.
            </p>
          </div>
          <div className="p-6">
            {milestonesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : milestones.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No open milestones at the moment. Apply to the startup to get involved.
              </p>
            ) : (
              <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {milestones.map((m) => (
                  <li
                    key={m._id}
                    className="rounded-lg border border-border bg-background/80 dark:bg-zinc-800/80 p-4 space-y-3 shadow-sm hover:shadow-md hover:border-green-500/30 transition-all duration-300"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1 space-y-2">
                        <h3 className="font-semibold text-foreground">{m.title}</h3>
                        {m.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {m.description}
                          </p>
                        )}
                        <p className="text-sm font-medium text-green-600 dark:text-green-400">
                          {Number(m.amount).toLocaleString()}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                          m.status === "Open"
                            ? "bg-green-500/15 text-green-700 dark:text-green-400"
                            : "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                        }`}
                      >
                        {m.status}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </AllRolesProtected>
  );
}
