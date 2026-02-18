/**
 * LIVE BADGE - Real-time Indicator
 *
 * Shows pulsing green dot with "Live" text
 * Indicates real-time data updates
 *
 * Usage:
 *   <LiveBadge />
 *   <LiveBadge label="Live Updates" />
 */

"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface LiveBadgeProps {
  label?: string;
  className?: string;
}

/**
 * Live Badge Component
 *
 * Pulsing green dot with "Live" text
 * Uses CSS animation for smooth pulse (no Framer Motion issues)
 */
export function LiveBadge({ label = "Live", className }: LiveBadgeProps) {
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      {/* Pulsing dot - uses CSS animation instead of Framer Motion */}
      <span className="live-dot relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
      </span>
      <span className="text-xs text-gray-500 font-medium">{label}</span>
    </div>
  );
}

/**
 * Compact Live Badge (smaller, for tight spaces)
 */
export function LiveBadgeCompact({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <span className="live-dot relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
      </span>
    </div>
  );
}

/**
 * Status Badge with live indicator
 */
interface StatusBadgeProps {
  status: "live" | "updating" | "offline";
  label?: string;
  className?: string;
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const statusConfig = {
    live: {
      color: "bg-green-500",
      pingColor: "bg-green-400",
      textColor: "text-green-700",
      bgColor: "bg-green-50",
      label: label || "Live",
    },
    updating: {
      color: "bg-yellow-500",
      pingColor: "bg-yellow-400",
      textColor: "text-yellow-700",
      bgColor: "bg-yellow-50",
      label: label || "Updating...",
    },
    offline: {
      color: "bg-gray-400",
      pingColor: "bg-gray-300",
      textColor: "text-gray-600",
      bgColor: "bg-gray-100",
      label: label || "Offline",
    },
  };

  const config = statusConfig[status];

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 px-2 py-1 rounded-full",
        config.bgColor,
        className
      )}
    >
      {status === "live" && (
        <span className="live-dot relative flex h-2 w-2">
          <span
            className={cn(
              "absolute inline-flex h-full w-full animate-ping rounded-full",
              config.pingColor,
              "opacity-75"
            )}
          />
          <span
            className={cn(
              "relative inline-flex rounded-full h-2 w-2",
              config.color
            )}
          />
        </span>
      )}
      {status === "updating" && (
        <span className="relative flex h-2 w-2">
          <span
            className={cn(
              "animate-spin absolute inline-flex rounded-full h-2 w-2 border-2",
              config.color,
              "border-t-transparent"
            )}
          />
        </span>
      )}
      {status === "offline" && (
        <span
          className={cn("inline-flex rounded-full h-2 w-2", config.color)}
        />
      )}
      <span className={cn("text-xs font-medium", config.textColor)}>
        {config.label}
      </span>
    </div>
  );
}
