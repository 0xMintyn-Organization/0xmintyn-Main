// LayoutContent.tsx
'use client';

import Header from "@/components/Header/Header";
import DesktopSidebar from "@/components/Sidebar/DesktopSidebar";
import { useSidebar } from "@/contexts/SidebarContext";

export default function LayoutContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar();

  return (
    <div className="antialiased dark:text-white bg-gray-100 dark:bg-zinc-900 min-h-screen flex flex-col lg:flex-row">
      
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
        {/* Header now goes inside main wrapper */}
        <div className="sticky top-0 z-30 bg-white dark:bg-zinc-800 shadow-sm border-b border-zinc-200 dark:border-zinc-700 px-4 py-2">
          <Header />
        </div>

        {/* Page Children */}
        <main className="p-6 mt-4">
          {children}
        </main>
      </div>
    </div>
  );
}