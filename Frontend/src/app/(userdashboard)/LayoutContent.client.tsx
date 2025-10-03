// LayoutContent.tsx
'use client';

import Header from "@/components/Header/Header";
import DynamicHeader from "@/components/Header/DynamicHeader";
import DesktopSidebar from "@/components/Sidebar/DesktopSidebar";
import { MarketplaceProvider } from "@/contexts/MarketplaceContext";
import { useSidebar } from "@/contexts/SidebarContext";
import { usePathname } from 'next/navigation';

export default function LayoutContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar();
  const pathname = usePathname();
  
  // Check if we're on marketplace pages
  const isMarketplace = pathname?.includes('/marketplace');

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
        {/* Dynamic Header - shows different content based on page */}
        {isMarketplace ? (
          <MarketplaceProvider>
            <DynamicHeader />
            {/* Page Children */}
            <main>
              {children}
            </main>
          </MarketplaceProvider>
        ) : (
          <>
            <div className="sticky top-0 z-30 bg-background shadow-sm border-b border-border px-4 py-2">
              <Header />
            </div>
            {/* Page Children */}
            <main className="p-6 mt-4">
              {children}
            </main>
          </>
        )}
      </div>
    </div>
  );
}