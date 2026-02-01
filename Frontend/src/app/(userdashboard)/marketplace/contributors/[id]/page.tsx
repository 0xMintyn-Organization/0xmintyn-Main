"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { AllRolesProtected } from "@/components/RoleProtected";
import { marketplaceApi } from "@/lib/marketplaceApi";
import useAuth from "@/hooks/userAuth";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, User, Briefcase, MapPin, Link2, FileText, Sparkles, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type ContributorProfile = {
  _id: string;
  image?: string;
  headline?: string;
  bio?: string;
  experience?: string;
  location?: string;
  skills?: string[];
  portfolio?: string;
  availability?: string;
  linkedIn?: string;
  website?: string;
  github?: string;
  userId?: { _id?: string; firstName?: string; lastName?: string; email?: string };
};

function displayName(p: ContributorProfile): string {
  const u = p.userId;
  if (!u || typeof u !== "object") return "Contributor";
  const name = [u.firstName, u.lastName].filter(Boolean).join(" ");
  return name || (u.email as string) || "Contributor";
}

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

export default function MarketplaceContributorDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const { user } = useAuth();
  const marketplaceRole = (user as { marketplace_role?: string })?.marketplace_role;
  const [profile, setProfile] = useState<ContributorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await marketplaceApi.contributorProfile.getById(id);
        setProfile(res.profile as ContributorProfile);
      } catch (e: unknown) {
        toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    })();
  }, [id, toast]);

  if (loading) {
    return (
      <AllRolesProtected>
        <div className="w-full px-6 py-6 flex items-center justify-center min-h-[200px]">
          <p className="text-muted-foreground">Loading contributor…</p>
        </div>
      </AllRolesProtected>
    );
  }

  if (!profile) {
    return (
      <AllRolesProtected>
        <div className="w-full px-6 py-6 space-y-4">
          <p className="text-muted-foreground">Contributor not found.</p>
          <Link
            href="/marketplace/contributors"
            className="inline-flex items-center gap-2 text-sm font-medium text-green-600 dark:text-green-400 hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Contributors
          </Link>
        </div>
      </AllRolesProtected>
    );
  }

  const profileUser = profile.userId;
  const hasLinks = profile.linkedIn || profile.website || profile.github;

  return (
    <AllRolesProtected>
      <div className="w-full px-6 py-6 space-y-6">
        <Link
          href="/marketplace/contributors"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Contributors
        </Link>

        {/* Hero – same style as startup detail */}
        <div className="rounded-lg border border-border bg-card dark:bg-zinc-800 overflow-hidden shadow-md">
          <div className="flex flex-col sm:flex-row gap-0">
            <div className="relative w-full sm:w-72 sm:min-w-[18rem] h-48 sm:h-64 bg-gradient-to-br from-green-500/15 via-muted/50 to-muted">
              {profile.image ? (
                <img src={profile.image} alt="" className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Users className="w-16 h-16 text-muted-foreground/50" />
                </div>
              )}
            </div>
            <div className="flex-1 p-6 sm:p-8 flex flex-col justify-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                {displayName(profile)}
              </h1>
              {profile.headline && (
                <p className="text-muted-foreground font-medium">{profile.headline}</p>
              )}
              {profile.location && (
                <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />
                  {profile.location}
                </p>
              )}
              {profile.availability && (
                <p className="text-sm text-green-600 dark:text-green-400">{profile.availability}</p>
              )}
              {marketplaceRole === "startup" && profile.userId && typeof profile.userId === "object" && (profile.userId as { _id?: string })._id && (
                <div className="mt-4">
                  <Button asChild className="gap-2 bg-green-600 hover:bg-green-700">
                    <Link href={marketplaceRole === "startup" ? `/startup/messenger?with=${(profile.userId as { _id: string })._id}` : `/messenger?with=${(profile.userId as { _id: string })._id}`}>
                      <MessageSquare className="w-4 h-4" />
                      Message
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Details grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {profile.bio && (
              <div className="rounded-lg border border-border bg-card dark:bg-zinc-800 p-6 shadow-sm">
                <Section title="About" icon={User}>
                  <p className="text-foreground/90 whitespace-pre-wrap leading-relaxed">{profile.bio}</p>
                </Section>
              </div>
            )}
            {profile.experience && (
              <div className="rounded-lg border border-border bg-card dark:bg-zinc-800 p-6 shadow-sm">
                <Section title="Experience" icon={Briefcase}>
                  <p className="text-foreground/90 whitespace-pre-wrap leading-relaxed">{profile.experience}</p>
                </Section>
              </div>
            )}
            {Array.isArray(profile.skills) && profile.skills.length > 0 && (
              <div className="rounded-lg border border-border bg-card dark:bg-zinc-800 p-6 shadow-sm">
                <Section title="Skills" icon={Sparkles}>
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.map((s, i) => (
                      <span key={i} className="rounded-md bg-muted/80 px-2.5 py-1 text-sm text-foreground">
                        {s}
                      </span>
                    ))}
                  </div>
                </Section>
              </div>
            )}
            {profile.portfolio && (
              <div className="rounded-lg border border-border bg-card dark:bg-zinc-800 p-6 shadow-sm">
                <Section title="Portfolio / projects" icon={FileText}>
                  <p className="text-foreground/90 whitespace-pre-wrap leading-relaxed">{profile.portfolio}</p>
                </Section>
              </div>
            )}
          </div>
          <div className="space-y-6">
            {profile.availability && (
              <div className="rounded-lg border border-border bg-card dark:bg-zinc-800 p-6 shadow-sm">
                <Section title="Availability" icon={Briefcase}>
                  <p className="text-foreground">{profile.availability}</p>
                </Section>
              </div>
            )}
            {profileUser && typeof profileUser === "object" && (profileUser.firstName || profileUser.lastName || profileUser.email) && (
              <div className="rounded-lg border border-border bg-card dark:bg-zinc-800 p-6 shadow-sm">
                <Section title="Contact" icon={User}>
                  <p className="text-foreground">
                    {[profileUser.firstName, profileUser.lastName].filter(Boolean).join(" ")}
                    {profileUser.email ? (
                      <>
                        {" · "}
                        <a href={`mailto:${profileUser.email}`} className="text-green-600 dark:text-green-400 hover:underline">
                          {profileUser.email}
                        </a>
                      </>
                    ) : ""}
                  </p>
                </Section>
              </div>
            )}
            {hasLinks && (
              <div className="rounded-lg border border-border bg-card dark:bg-zinc-800 p-6 shadow-sm">
                <Section title="Links" icon={Link2}>
                  <div className="space-y-2">
                    {profile.linkedIn && (
                      <p>
                        <a href={profile.linkedIn} target="_blank" rel="noopener noreferrer" className="text-green-600 dark:text-green-400 hover:underline">
                          LinkedIn
                        </a>
                      </p>
                    )}
                    {profile.website && (
                      <p>
                        <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-green-600 dark:text-green-400 hover:underline">
                          Website
                        </a>
                      </p>
                    )}
                    {profile.github && (
                      <p>
                        <a href={profile.github} target="_blank" rel="noopener noreferrer" className="text-green-600 dark:text-green-400 hover:underline">
                          GitHub
                        </a>
                      </p>
                    )}
                  </div>
                </Section>
              </div>
            )}
          </div>
        </div>
      </div>
    </AllRolesProtected>
  );
}
