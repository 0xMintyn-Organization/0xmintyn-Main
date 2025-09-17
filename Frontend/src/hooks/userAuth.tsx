"use client";

import { useLoadUserQuery } from "@/redux/features/api/apiSlice";

export default function useAuth() {
    const { data, isLoading } = useLoadUserQuery(undefined, {});
    const user = data?.user || null;
    const isAuthenticated = !!user;

    return { user, isAuthenticated, isLoading };
}