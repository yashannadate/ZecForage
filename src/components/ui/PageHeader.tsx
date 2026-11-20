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
        "flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-surface-border pb-6",
        className
      )}
    >
      <div className="space-y-1.5 max-w-3xl">
        {badge && (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-surface-elevated text-primary-300 border border-surface-border text-xs font-mono font-medium">
            {BadgeIcon && <BadgeIcon className="w-3.5 h-3.5 text-primary-400" />}
            <span>{badge}</span>
          </div>
        )}
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-3">
          {title}
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
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
