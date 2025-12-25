"use client";

import SocialAuthProvider from "@/components/SocialAuth/SocialAuth";
import { Toaster } from "@/components/ui/toaster";
import ThemeProviderWrapper from "@/contexts/ThemeProviderWrapper";
import { FontSizeProvider } from "@/contexts/FontSizeContext";
import { TextToSpeechProvider } from "@/contexts/TextToSpeechContext";
import { GlobalTextSelection } from "@/components/TextToSpeech/GlobalTextSelection";
import { SessionProvider } from "next-auth/react";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./Provider";
import { logEnvironmentInfo } from "@/utils/envCheck";
import { useEffect } from "react";
import { SocketProvider } from "@/contexts/SocketContext";

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
          <FontSizeProvider>
            <TextToSpeechProvider>
                <Providers>
                  <SessionProvider >
                    <SocialAuthProvider>
                      <SocketProvider>
                        {children}
                        <Toaster />
                        <GlobalTextSelection />
                      </SocketProvider>
                    </SocialAuthProvider>
                  </SessionProvider>
                </Providers>
            </TextToSpeechProvider>
          </FontSizeProvider>
        </ThemeProviderWrapper>
      </body>
    </html>
  );
}
