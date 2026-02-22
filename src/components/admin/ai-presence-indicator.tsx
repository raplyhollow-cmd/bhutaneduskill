"use client";

/**
 * AI PRESENCE INDICATOR
 *
 * Shows that Kaze (the AI Sentinel) is online and monitoring.
 * Features a pulse animation to indicate "alive" status.
 */

import { cn } from "@/lib/utils";
import { Activity, Cpu } from "lucide-react";

interface AIPresenceIndicatorProps {
  status?: "online" | "processing" | "offline";
  className?: string;
  showLabel?: boolean;
}

export function AIPresenceIndicator({
  status = "online",
  className,
  showLabel = true,
}: AIPresenceIndicatorProps) {
  const statusConfig = {
    online: {
      color: "rgb(6 182 212)", // cyan-500
      label: "ONLINE",
      animation: "animate-pulse",
    },
    processing: {
      color: "rgb(245 158 11)", // amber-500
      label: "PROCESSING",
      animation: "animate-spin",
    },
    offline: {
      color: "rgb(107 114 128)", // gray-500
      label: "OFFLINE",
      animation: "",
    },
  };

  const config = statusConfig[status];

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {/* Pulse ring */}
      <div className="relative">
        <div className={cn(
          "absolute inset-0 rounded-full opacity-75",
          status === "online" && "animate-ping bg-cyan-500/30",
        )} style={{ animationDuration: "2s" }} />
        <div className={cn(
          "relative w-10 h-10 rounded-full flex items-center justify-center",
          "border-2 transition-colors duration-300"
        )} style={{ borderColor: config.color, backgroundColor: `${config.color}10` }}>
          {status === "processing" ? (
            <Cpu className={cn("w-5 h-5", config.animation)} style={{ color: config.color }} />
          ) : (
            <Activity className={cn("w-5 h-5", status === "online" ? "animate-pulse" : "")} style={{ color: config.color }} />
          )}
        </div>
      </div>

      {showLabel && (
        <div className="flex flex-col">
          <span className="text-xs font-black tracking-widest" style={{ color: config.color }}>
            KAZE // AI SENTINEL
          </span>
          <span className="text-[10px] font-mono text-ceramic-dimmed">
            {config.label}
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * Compact version for headers
 */
export function AIPresenceIndicatorCompact({ status = "online" }: { status?: "online" | "processing" | "offline" }) {
  const config = {
    online: "bg-cyan-500",
    processing: "bg-amber-500",
    offline: "bg-gray-500",
  }[status];

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <div className={cn(
          "absolute inset-0 rounded-full opacity-75",
          status === "online" && "animate-ping bg-cyan-500/50"
        )} />
        <div className={cn("w-2 h-2 rounded-full relative z-10", config)} />
      </div>
      <span className="text-[10px] font-mono text-ceramic-dimmed">KAZE</span>
    </div>
  );
}
