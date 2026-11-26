"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Menu } from "lucide-react";
import { navItems, secondaryNavItems } from "./Sidebar";

interface HeaderProps {
  onToggleSidebar?: () => void;
}

export function Header({ onToggleSidebar }: HeaderProps) {
  const pathname = usePathname();
  const allItems = [...navItems, ...secondaryNavItems];
  const currentNav = allItems.find((n) => n.href === pathname);
  const pageTitle = currentNav?.name || "Overview";

  return (
    <header className="h-16 border-b border-[#262626] bg-black/95 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Left: Mobile Menu Toggle & Page Title */}
      <div className="flex items-center gap-3 min-w-0">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="md:hidden flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-md border border-[#262626] bg-[#080808] text-[#929292] hover:text-white transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="flex items-center gap-2 min-w-0">
          <span className="hidden sm:inline-block text-xs font-mono text-[#929292] uppercase tracking-wider">
            ZecForage
          </span>
          <span className="hidden sm:inline-block text-[#262626] text-xs">/</span>
          <span className="text-sm font-medium text-white tracking-tight truncate">
            {pageTitle}
          </span>
        </div>
      </div>

      {/* Right: Guide Link & Local Preview Badge */}
      <div className="flex items-center gap-3 shrink-0">
        <Link
          href="/#developers"
          className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-[#262626] bg-transparent px-3 text-sm font-medium text-[#929292] hover:text-white hover:bg-neutral-900 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
        >
          <BookOpen className="w-4 h-4" />
          <span>Guide</span>
        </Link>

        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#080808] border border-[#262626] text-xs font-mono uppercase tracking-wider text-white">
          <span className="w-2 h-2 rounded-full bg-cyan-300" />
          <span>Local Preview</span>
        </div>
      </div>
    </header>
  );
}
