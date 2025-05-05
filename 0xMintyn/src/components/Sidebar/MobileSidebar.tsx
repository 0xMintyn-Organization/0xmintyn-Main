import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import SidebarContent from "./SidebarContent";

export default function MobileSidebar() {
  return (
    <Sheet>
      {/* Button to open sidebar */}
      <SheetTrigger className="p-2 bg-white dark:bg-zinc-800 text-green-900 dark:text-gray-300 lg:hidden">
        <Menu className="w-6 h-6" />
      </SheetTrigger>

      {/* Sidebar Drawer */}
      <SheetContent side="left" className="w-64 p-4">
        {/* title and description for screen readers */}
        <SheetHeader>
            <SheetTitle>Community Hub Menu</SheetTitle>
            <SheetDescription>Navigation Menu for Oxmintyn Community Hub</SheetDescription>
        </SheetHeader>
        <SidebarContent />
      </SheetContent>
    </Sheet>
  );
}
