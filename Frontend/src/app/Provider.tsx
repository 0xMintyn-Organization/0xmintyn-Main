"use client";
import { store } from "@/redux/store";
import React, { ReactNode, useEffect } from "react";
import { Provider } from "react-redux";
import { AuthProvider } from "@/contexts/AuthContext";
import { BlockchainProvider } from "@/contexts/BlockchainProvider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";

interface Props {
    children: ReactNode;
}

// Create a client
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            retry: 3,
            refetchOnWindowFocus: false,
        },
    },
});

export const Providers = ({ children }: Props) => {
    useEffect(() => {
        if (window.solana && window.solana.isPhantom) {
            console.log("Phantom wallet detected!");
        } else {
            console.log("Phantom wallet not found. Please install it.");
        }
    }, []);

    return (
        <QueryClientProvider client={queryClient}>
            <Provider store={store}>
                <BlockchainProvider>
                    <AuthProvider>
                        {children}
                        <Toaster
                            position="top-right"
                            toastOptions={{
                                duration: 4000,
                                style: {
                                    background: '#363636',
                                    color: '#fff',
                                },
                                success: {
                                    duration: 3000,
                                    iconTheme: {
                                        primary: '#4ade80',
                                        secondary: '#fff',
                                    },
                                },
                                error: {
                                    duration: 5000,
                                    iconTheme: {
                                        primary: '#ef4444',
                                        secondary: '#fff',
                                    },
                                },
                            }}
                        />
                    </AuthProvider>
                </BlockchainProvider>
            </Provider>
        </QueryClientProvider>
    );
};