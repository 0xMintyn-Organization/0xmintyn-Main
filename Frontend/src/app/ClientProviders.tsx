"use client";

import { useEffect } from "react";
import SocialAuthProvider from "@/components/SocialAuth/SocialAuth";
import { Toaster } from "@/components/ui/toaster";
import ThemeProviderWrapper from "@/contexts/ThemeProviderWrapper";
import { FontSizeProvider } from "@/contexts/FontSizeContext";
import { TextToSpeechProvider } from "@/contexts/TextToSpeechContext";
import { SessionProvider } from "next-auth/react";
import { Providers } from "./Provider";
import { logEnvironmentInfo } from "@/utils/envCheck";
import { GlobalTextSelection } from "@/components/TextToSpeech/GlobalTextSelection";

export default function ClientProviders({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  useEffect(() => {
    logEnvironmentInfo();
  }, []);

  return (
    <ThemeProviderWrapper>
      <FontSizeProvider>
        <TextToSpeechProvider>
          <Providers>
            <SessionProvider 
              basePath="/api/auth"
              refetchInterval={0}
              refetchOnWindowFocus={false}
            >
              <SocialAuthProvider>
                {children}
                <Toaster />
                <GlobalTextSelection />
              </SocialAuthProvider>
            </SessionProvider>
          </Providers>
        </TextToSpeechProvider>
      </FontSizeProvider>
    </ThemeProviderWrapper>
  );
}
