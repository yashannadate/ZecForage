import React from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  badge?: string;
  badgeIcon?: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  badge,
  badgeIcon: BadgeIcon,
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-800 pb-6",
        className
      )}
    >
      <div className="space-y-2 max-w-3xl">
        {badge && (
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#080808] text-cyan-300 border border-neutral-800 text-xs font-mono font-normal uppercase tracking-wider">
            {BadgeIcon && <BadgeIcon className="w-4 h-4 text-cyan-300" />}
            <span>{badge}</span>
          </div>
        )}
        <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-white flex items-center gap-3">
          {title}
        </h1>
        <p className="text-sm font-normal text-[#929292] leading-relaxed">
          {description}
        </p>
      </div>

      {actions && (
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}
