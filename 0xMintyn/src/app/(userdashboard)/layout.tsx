import Header from "@/components/Header/Header";
import DesktopSidebar from "@/components/Sidebar/DesktopSidebar";
import ThemeProviderWrapper from "@/contexts/ThemeProviderWrapper";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Oxmintyn",
  description: "Universal Basic Income Platform",
};

export default function UserDasboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // <html lang="en">
      <div
        className={`${geistSans.variable} ${geistMono.variable} antialiased dark:text-white bg-gray-100 dark:bg-zinc-900`}
      >

        <ThemeProviderWrapper>
          <Header />
          <DesktopSidebar />
          <main className="lg:ml-[260px] mt-[48px] ">
            {children}
          </main>
        </ThemeProviderWrapper>
      </div>
    // </html>
  );
}
