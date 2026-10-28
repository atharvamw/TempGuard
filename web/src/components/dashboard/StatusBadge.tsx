import React from "react";
import { DeviceFreshnessStatus } from "@/types/telemetry";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: DeviceFreshnessStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  switch (status) {
    case "live":
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800",
            className
          )}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Live
        </span>
      );

    case "delayed":
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800",
            className
          )}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
          Delayed
        </span>
      );

    case "stale":
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-50 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300 border border-orange-200 dark:border-orange-800",
            className
          )}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
          Device Offline
        </span>
      );

    case "awaiting_first_reading":
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800",
            className
          )}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
          Awaiting First Reading
        </span>
      );

    case "service_unavailable":
    default:
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800",
            className
          )}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
          Service Unavailable
        </span>
      );
  }
}
