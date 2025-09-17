"use client";
import { store } from "@/redux/store";
import React, { ReactNode, useEffect } from "react";
import { Provider } from "react-redux";

interface Props {
    children: ReactNode;
}


export const Providers = ({ children }: Props) => {
    useEffect(() => {
        if (window.solana && window.solana.isPhantom) {
            console.log("Phantom wallet detected!");
        } else {
            console.log("Phantom wallet not found. Please install it.");
        }
    }, []);

    return <Provider store={store}>{children}</Provider>;
};