'use client';
import SidebarContent from './SidebarContent';
import { useRole } from '@/hooks/useRole';
import { useState, useEffect } from 'react';
import { ChevronLeft, Sparkles, LayoutDashboard, GraduationCap, Vote, Settings, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSidebar } from '@/contexts/SidebarContext';

// Get collapsed nav items based on role
const getCollapsedNavItems = (userRole: string) => {
  const publicItems = [
    { href: "/dashboard", icon: LayoutDashboard },
    { href: "/educationhub", icon: GraduationCap },
    { href: "/governance", icon: Vote },
    { href: "/settings", icon: Settings },
    { href: "/profile", icon: User }
  ];
  
  return publicItems.slice(0, 5);
};

function DesktopSidebar() {
  const { isCollapsed, setIsCollapsed } = useSidebar();
  const [isHovered, setIsHovered] = useState(false);
  const pathname = usePathname();
  const { user } = useRole();

  // Auto-expand on hover when collapsed
    // useEffect(() => {
    //   if (isCollapsed && isHovered) {
    //     const timer = setTimeout(() => {
    //       setIsCollapsed(false);
    //     }, 300);
    //     return () => clearTimeout(timer);
    //   }
    // }, [isCollapsed, isHovered, setIsCollapsed]);

  return (
    <>
      <aside
        id="desktopSidebar"
        className={`
          fixed left-0 z-30 flex-shrink-0 hidden lg:block
          transition-all duration-300 ease-in-out
          ${isCollapsed ? 'w-20' : 'w-72'}
          h-screen
        `}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Collapse Toggle Button */}
       <div className="relative">
  <Button
    variant="ghost"
    size="icon"
    onClick={() => setIsCollapsed(!isCollapsed)}
    className={`
      absolute right-[-14px] top-8 z-50 
      w-7 h-7 rounded-full 
      bg-white dark:bg-gray-800 
      border border-gray-200 dark:border-gray-700
      shadow-md hover:shadow-lg
      transition-all duration-300
      ${isCollapsed ? 'rotate-180' : ''}
    `}
    style={{
      overflow: 'visible',
    }}
  >
    <ChevronLeft className="w-4 h-4 text-gray-700 dark:text-white" />
  </Button>
</div>
        {/* Sidebar Content with Collapse Animation */}
        <div className={`
          h-full overflow-hidden
          ${isCollapsed ? 'opacity-0' : 'opacity-100'}
          transition-opacity duration-300
        `}>
          <SidebarContent />
        </div>

        {/* Collapsed State Icons */}
        {isCollapsed && (
          <div className="absolute inset-0 flex flex-col items-center py-6 space-y-4">
            <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-green-700 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            
            {/* Collapsed Nav Icons */}
            <nav className="flex-1 flex flex-col items-center space-y-2 mt-8">
              {getCollapsedNavItems(user?.role || 'user').map(({ icon: Icon, href }) => (
                <Link
                  key={href}
                  href={href}
                  className={`
                    p-3 rounded-xl transition-all duration-200
                    ${pathname === href 
                      ? "bg-green-600 text-white shadow-lg" 
                      : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                </Link>
              ))}
            </nav>
          </div>
        )}
      </aside>

     
    </>
  );
}

export default DesktopSidebar;