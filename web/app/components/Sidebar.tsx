"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Settings } from "lucide-react";
import Image from "next/image";

export default function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <aside className="w-60 bg-white dark:bg-[#161617] border-r border-zinc-200 dark:border-zinc-800 min-h-screen fixed left-0 top-0 z-10">
      <div className="flex flex-col items-center pt-4">
        <h1 className="text-lg font-medium text-[#161617] dark:text-zinc-100">
          TSR
        </h1>
      </div>

      <nav className="p-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors text-sm ${
                    isActive
                      ? "bg-zinc-100 dark:bg-zinc-800 text-[#161617] dark:text-zinc-100"
                      : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
