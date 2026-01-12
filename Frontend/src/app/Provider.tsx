"use client";
import { store } from "@/redux/store";
import React, { ReactNode, useEffect } from "react";
import { Provider } from "react-redux";
import { AuthProvider } from "@/contexts/AuthContext";
import { AutoLogoutProvider } from "@/components/AutoLogoutProvider";

interface Props {
    children: ReactNode;
}

export const Providers = ({ children }: Props) => {
    // Defer Solana check to avoid blocking initial render
    useEffect(() => {
        // Use requestIdleCallback for non-critical checks
        const checkSolana = () => {
            if (typeof window !== 'undefined' && window.solana?.isPhantom) {
                console.log("Phantom wallet detected!");
            }
        };

        if (typeof window !== 'undefined') {
            if ('requestIdleCallback' in window) {
                requestIdleCallback(checkSolana, { timeout: 2000 });
            } else {
                // Fallback for browsers without requestIdleCallback
                setTimeout(checkSolana, 100);
            }
        }
    }, []);

    return (
        <Provider store={store}>
            <AuthProvider>
                <AutoLogoutProvider>
                    {children}
                </AutoLogoutProvider>
            </AuthProvider>
        </Provider>
    );
};