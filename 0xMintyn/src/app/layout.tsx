"use client";

import SocialAuthProvider from "@/components/SocialAuth/SocialAuth";
import { Toaster } from "@/components/ui/toaster";
import ThemeProviderWrapper from "@/contexts/ThemeProviderWrapper";
import { SessionProvider } from "next-auth/react";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./Provider";

const inter = Inter({ 
  subsets: ['latin'], 
  variable: '--font-inter' 
});



export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.className} antialiased dark:text-white bg-gray-100 dark:bg-zinc-900`}
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
