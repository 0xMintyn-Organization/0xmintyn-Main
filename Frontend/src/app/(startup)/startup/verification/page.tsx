"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function StartupVerificationPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/startup/milestones");
  }, [router]);

  return (
    <div className="max-w-4xl mx-auto">
      <p className="text-muted-foreground">Redirecting to Milestones…</p>
    </div>
  );
}
