"use client";

import { usePathname, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import Spinner from "@/components/Spinner";
import useAuth from "./userAuth";
import { getOnboardingRedirectPath, isStartupUser } from "@/lib/onboarding";
import { getStartupViewMode } from "@/lib/startupViewMode";

interface ProtectedProps {
    children: React.ReactNode;
}

export default function Protected({ children }: ProtectedProps) {
    const { isLoading, isAuthenticated, user } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [startupViewMode, setStartupViewMode] = useState<"startup" | "normal">(() => getStartupViewMode());

    useEffect(() => {
        setStartupViewMode(getStartupViewMode());
    }, [pathname]);

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
            // Startup users: redirect to startup hub only when view mode is "startup"
            if (isStartupUser(user) && getStartupViewMode() === "startup" && !pathname?.startsWith("/startup")) {
                router.replace("/startup/dashboard");
            }
        }
    }, [isLoading, isAuthenticated, user, router, pathname]);

    if (isLoading) return <Spinner />;
    if (!isAuthenticated || !user) return <Spinner />;

    const onboardingPath = getOnboardingRedirectPath(user);
    if (onboardingPath && !pathname?.startsWith("/onboarding")) return <Spinner />;

    const viewingAsNormal = isStartupUser(user) && startupViewMode === "normal";
    if (isStartupUser(user) && !pathname?.startsWith("/startup") && !viewingAsNormal) return <Spinner />;

    return <>{children}</>;
}