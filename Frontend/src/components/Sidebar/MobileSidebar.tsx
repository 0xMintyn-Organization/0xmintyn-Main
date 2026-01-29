import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import SidebarContent from "./SidebarContent";

export default function MobileSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {/* Animated Menu Button */}
      <SheetTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          className="relative p-2 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl shadow-md lg:hidden transition-all duration-200 hover:scale-105"
        >
          <div className="relative">
            <Menu className={`w-6 h-6 transition-all duration-300 ${open ? 'rotate-90 opacity-0' : 'rotate-0 opacity-100'}`} />
            <X className={`w-6 h-6 absolute top-0 left-0 transition-all duration-300 ${open ? 'rotate-0 opacity-100' : '-rotate-90 opacity-0'}`} />
          </div>
          
          {/* Notification Dot */}
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
        </Button>
      </SheetTrigger>

      {/* Enhanced Sidebar Drawer */}
      <SheetContent 
        side="left" 
        className="w-72 p-0 border-r border-gray-200 dark:border-gray-700 overflow-hidden"
      >
        {/* Hidden header for accessibility */}
        <SheetHeader className="sr-only">
          <SheetTitle>Community Hub Menu</SheetTitle>
          <SheetDescription>Navigation Menu for Equalmint Community Hub</SheetDescription>
        </SheetHeader>
        
        {/* Gradient overlay at top */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-green-600/10 to-transparent pointer-events-none" />
        
        <SidebarContent />
      </SheetContent>
    </Sheet>
  );
}