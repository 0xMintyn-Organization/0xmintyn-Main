import ThemeProviderWrapper from "@/contexts/ThemeProviderWrapper";
import type { Metadata } from "next";
import "../globals.css";
import { SidebarProvider } from "@/contexts/SidebarContext";
import LayoutContent from "./LayoutContent.client";
import Protected from "@/hooks/useProtected";

export const metadata: Metadata = {
  title: "0xMintyn",
  description: "Universal Basic Income Platform",
};

export default function UserDasboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ThemeProviderWrapper>
      <Protected>
        <SidebarProvider>
          <LayoutContent>{children}</LayoutContent>
        </SidebarProvider>
      </Protected>
    </ThemeProviderWrapper>
  );
}
