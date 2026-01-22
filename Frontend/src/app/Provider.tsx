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
    useEffect(() => {
        // Phantom integration removed; no wallet detection performed
        console.log("Wallet integration disabled in this build");
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