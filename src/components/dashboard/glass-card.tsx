/**
 * Glass Card
 *
 * Glassmorphism card component for modern UI.
 */

import { HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "subtle" | "strong";
  gradient?: string;
}

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, variant = "default", gradient, children, ...props }, ref) => {
    const bgStyles = {
      default: "rgba(255, 255, 255, 0.7)",
      subtle: "rgba(255, 255, 255, 0.5)",
      strong: "rgba(255, 255, 255, 0.9)",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "backdrop-blur-md border border-white/30 rounded-2xl shadow-sm",
          className
        )}
        style={{
          background: gradient || bgStyles[variant],
        }}
        {...props}
      >
        {children}
      </div>
    );
  }
);

GlassCard.displayName = "GlassCard";

// ============================================================================
// DASHBOARD CARD (default card for bento grids)
// ============================================================================

interface DashboardCardProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  gradient?: string;
}

export const DashboardCard = forwardRef<HTMLDivElement, DashboardCardProps>(
  ({ className, title, subtitle, action, gradient, children, ...props }, ref) => {
    return (
      <GlassCard
        ref={ref}
        className={cn("p-6 h-full flex flex-col", className)}
        gradient={gradient}
        {...props}
      >
        {(title || action) && (
          <div className="flex items-start justify-between mb-4">
            <div>
              {title && <h3 className="font-semibold text-gray-900">{title}</h3>}
              {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
            </div>
            {action && <div className="flex-shrink-0 ml-2">{action}</div>}
          </div>
        )}
        <div className="flex-1">{children}</div>
      </GlassCard>
    );
  }
);

DashboardCard.displayName = "DashboardCard";

// ============================================================================
// STAT CARD (for metrics and KPIs)
// ============================================================================

interface StatCardProps {
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  className?: string;
  onClick?: () => void;
}

export function StatCard({
  label,
  value,
  change,
  changeLabel = "from last month",
  icon,
  trend = "neutral",
  className,
  onClick,
}: StatCardProps) {
  const trendColors = {
    up: "text-green-600",
    down: "text-red-600",
    neutral: "text-gray-500",
  };

  return (
    <GlassCard
      className={cn(
        "p-6 h-full flex flex-col justify-between",
        onClick && "cursor-pointer hover:shadow-md transition-shadow",
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{label}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        {icon && <div className="text-gray-400">{icon}</div>}
      </div>

      {change !== undefined && (
        <div className="mt-4 flex items-center gap-1">
          <span className={cn("text-sm font-medium", trendColors[trend])}>
            {trend === "up" && "+"}
            {change}%
          </span>
          <span className="text-sm text-gray-500">{changeLabel}</span>
        </div>
      )}
    </GlassCard>
  );
}
