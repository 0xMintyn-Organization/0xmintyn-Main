"use client";

import { usePathname, useRouter } from "next/navigation";
import React, { useEffect } from "react";
import Spinner from "@/components/Spinner";
import useAuth from "./userAuth";
import { getOnboardingRedirectPath, isStartupUser } from "@/lib/onboarding";

interface ProtectedProps {
    children: React.ReactNode;
}

export default function Protected({ children }: ProtectedProps) {
    const { isLoading, isAuthenticated, user } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!isLoading && (!isAuthenticated || !user)) {
            router.replace("/login");
            return;
        }
        if (!isLoading && user && !pathname?.startsWith("/onboarding")) {
            const onboardingPath = getOnboardingRedirectPath(user);
            if (onboardingPath) {
                router.replace(onboardingPath);
                return;
            }
            // Startup users see only startup UI: redirect from main platform to /startup/dashboard
            if (isStartupUser(user) && !pathname?.startsWith("/startup")) {
                router.replace("/startup/dashboard");
            }
        }
    }, [isLoading, isAuthenticated, user, router, pathname]);

    if (isLoading) return <Spinner />;
    if (!isAuthenticated || !user) return <Spinner />;

    const onboardingPath = getOnboardingRedirectPath(user);
    if (onboardingPath && !pathname?.startsWith("/onboarding")) return <Spinner />;

    if (isStartupUser(user) && !pathname?.startsWith("/startup")) return <Spinner />;

    return <>{children}</>;
}