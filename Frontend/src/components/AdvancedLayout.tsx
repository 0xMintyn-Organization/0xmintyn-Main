"use client";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { useState } from "react";
import AdvancedSidebar from "./AdvancedSidebar";

interface AdvancedLayoutProps {
  children: React.ReactNode;
}

export default function AdvancedLayout({ children }: AdvancedLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-900">
      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white dark:bg-zinc-800 border-r border-gray-200 dark:border-zinc-700">
          <AdvancedSidebar />
        </div>
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <AdvancedSidebar />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Top Navigation Bar */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
            <span className="sr-only">Open sidebar</span>
          </Button>

          {/* Separator */}
          <div className="h-6 w-px bg-gray-200 dark:bg-zinc-700 lg:hidden" />

          {/* Page Title */}
          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1 items-center">
              <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-200 dark:text-white">
                {/* Page title will be set by individual pages */}
              </h1>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
