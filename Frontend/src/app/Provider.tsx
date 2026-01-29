"use client";
import { store } from "@/redux/store";
import React, { ReactNode } from "react";
import { Provider } from "react-redux";
import { AuthProvider } from "@/contexts/AuthContext";
import { AutoLogoutProvider } from "@/components/AutoLogoutProvider";

interface Props {
    children: ReactNode;
}


export const Providers = ({ children }: Props) => {

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