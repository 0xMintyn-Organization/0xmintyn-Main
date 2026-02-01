"use client";

import Protected from "@/hooks/useProtected";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Protected>{children}</Protected>;
}
