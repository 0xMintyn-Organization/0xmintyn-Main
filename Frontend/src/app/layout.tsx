"use client";

import SocialAuthProvider from "@/components/SocialAuth/SocialAuth";
import { Toaster } from "@/components/ui/toaster";
import ThemeProviderWrapper from "@/contexts/ThemeProviderWrapper";
import { SessionProvider } from "next-auth/react";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./Provider";
import { logEnvironmentInfo } from "@/utils/envCheck";
import { useEffect } from "react";

const inter = Inter({ 
  subsets: ['latin'], 
  variable: '--font-inter' 
});



export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  useEffect(() => {
    logEnvironmentInfo();
  }, []);

  return (
    <html lang="en">
      <body
        className={`${inter.className} antialiased bg-background text-foreground`}
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
