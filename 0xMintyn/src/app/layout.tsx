"use client";

import { Toaster } from "@/components/ui/toaster";
import ThemeProviderWrapper from "@/contexts/ThemeProviderWrapper";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./Provider";
import SocialAuthProvider from "@/components/SocialAuth/SocialAuth";
import { SessionProvider } from "next-auth/react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased dark:text-white bg-gray-100 dark:bg-zinc-900`}
      >
        <ThemeProviderWrapper>
          <Providers>
          <SessionProvider >
          <SocialAuthProvider>
            {children}
            <Toaster />

          </SocialAuthProvider>
          </SessionProvider>
          </Providers>
        </ThemeProviderWrapper>
      </body>
    </html>
  );
}
