"use client"; // Needed for `usePathname`
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { name: "Dashboard", href: "/dashboard" },
  { name: "Marketplace", href: "/marketplace" },
  { name: "Education Hub", href: "/educationhub" },
  { name: "Exchange", href: "/exchange" },
  { name: "Governance", href: "/governance" },
  { name: "My Profile", href: "/myprofile" },
  { name: "Settings", href: "/settings" },
  { name: "Users", href: "/users" },

];

export default function Sidebar() {
  const pathname = usePathname(); // Get current route

  return (
      <ul className="fixed left-0 w-64 h-screen overflow-y-auto dark:bg-zinc-800 dark:text-white p-5 shadow-md shadow-top">
        {/* <h2 className="text-xl font-semibold mb-6 text-heading">OXMINTYN Community Hub</h2> */}
        <li className="space-y-1">
          {navItems.map(({ name, href }) => (
            <Link
              key={name}
              href={href}
              className={`flex items-center gap-3 p-3 rounded-lg ${
                pathname === href ? "bg-green-900 text-white" : "hover:bg-green-500 hover:bg-opacity-20"
              }`}
            >
              {name}
            </Link>
          ))}
        </li>
      </ul>
  );
}
