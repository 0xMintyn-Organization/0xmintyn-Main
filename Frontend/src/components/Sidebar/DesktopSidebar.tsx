'use client';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/contexts/SidebarContext';
import { useRole } from '@/hooks/useRole';
import { ChevronLeft, GraduationCap, LayoutDashboard, Settings, User, Vote } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import SidebarContent from './SidebarContent';

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
          overflow-visible
          pr-2
        `}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Collapse Toggle Button */}
        <div className="absolute -right-1 top-8 z-50">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`
              w-8 h-8 rounded-full 
              bg-white dark:bg-gray-800 
              border-2 border-gray-300 dark:border-gray-600
              shadow-lg hover:shadow-xl
              transition-all duration-300
              hover:scale-110
              hover:bg-gray-50 dark:hover:bg-gray-700
              ${isCollapsed ? 'rotate-180' : ''}
            `}
            style={{
              overflow: 'visible',
            }}
          >
            <ChevronLeft className="w-4 h-4 text-gray-800 dark:text-gray-200" />
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
            <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden">
              <img 
                src="/logo.png" 
                alt="0xMintyn Logo" 
                className="w-full h-full object-contain"
              />
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