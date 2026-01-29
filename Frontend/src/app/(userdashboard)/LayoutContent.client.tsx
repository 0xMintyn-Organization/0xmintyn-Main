// LayoutContent.tsx
'use client';

import Header from "@/components/Header/Header";
import DesktopSidebar from "@/components/Sidebar/DesktopSidebar";
import { useSidebar } from "@/contexts/SidebarContext";

export default function LayoutContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar();

  return (
    <div className="antialiased bg-background text-foreground min-h-screen flex flex-col lg:flex-row">
      
      {/* Sidebar (Hidden in mobile) */}
      <DesktopSidebar />

      {/* Main Content Area */}
      <div
        className={`
          flex flex-col flex-1
          transition-all duration-300
          ${isCollapsed ? 'lg:ml-20' : 'lg:ml-72'}
        `}
      >
        <div className="sticky top-0 z-30 bg-background shadow-sm border-b border-border px-4 py-2">
          <Header />
        </div>
        {/* Page Children */}
        <main className="w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
