"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

// ============================================================================
// MOBILE CARD COMPONENT
// ============================================================================
// Adaptive card component that:
// - Shows in 2-column grid on mobile (information-dense)
// - Shows in 4-column grid on desktop
// - Touch-friendly (44px min touch targets)
// - Supports icons, gradients, and actions
// ============================================================================

export interface MobileCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle?: string;
  description?: string;
  icon?: LucideIcon | React.ReactNode;
  iconColor?: string;
  iconBackgroundColor?: string;
  action?: React.ReactNode;
  gradient?: string;
  badge?: string;
  badgeColor?: string;
  onClick?: () => void;
  href?: string;
  compact?: boolean;
}

const MobileCard = React.forwardRef<HTMLDivElement, MobileCardProps>(
  (
    {
      title,
      subtitle,
      description,
      icon: Icon,
      iconColor = "rgb(249 115 22)",
      iconBackgroundColor = "rgb(254 243 242)",
      action,
      gradient,
      badge,
      badgeColor = "bg-orange-100 text-orange-700",
      onClick,
      href,
      compact = false,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const Component = href ? "a" : onClick ? "button" : "div";
    const baseProps = href
      ? { href, onClick: undefined as any }
      : { onClick, href: undefined as any };

    return (
      <Component
        ref={ref}
        className={cn(
          // Base styles
          "group relative flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4",
          // Hover effect
          "hover:shadow-md hover:border-gray-300",
          "transition-all duration-200",
          // Focus styles for keyboard navigation
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2",
          // Gradient background if provided
          gradient && "bg-gradient-to-br from-orange-50 to-red-50 border-orange-100",
          className
        )}
        {...baseProps}
        {...props}
      >
        {/* Badge */}
        {badge && (
          <span
            className={cn(
              "absolute -top-2 -right-2 px-2 py-0.5 text-xs font-medium rounded-full",
              badgeColor
            )}
          >
            {badge}
          </span>
        )}

        {/* Header with icon and title */}
        <div className="flex items-start gap-3">
          {/* Icon */}
          {Icon && (
            <div
              className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
              style={{
                backgroundColor: iconBackgroundColor,
              }}
            >
              {typeof Icon === "function" ? (
                <Icon className="w-5 h-5" style={{ color: iconColor }} strokeWidth={2} />
              ) : (
                Icon
              )}
            </div>
          )}

          {/* Title and subtitle */}
          <div className="flex-1 min-w-0">
            <h3
              className={cn(
                "font-semibold text-gray-900",
                compact ? "text-sm" : "text-base"
              )}
            >
              {title}
            </h3>
            {subtitle && (
              <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
            )}
          </div>

          {/* Action button */}
          {action && <div className="flex-shrink-0">{action}</div>}
        </div>

        {/* Description */}
        {description && !compact && (
          <p className="text-sm text-gray-600 line-clamp-2">{description}</p>
        )}

        {/* Additional content */}
        {children && (
          <div className="pt-2 border-t border-gray-100">{children}</div>
        )}

        {/* Chevron indicator for clickable cards */}
        {(onClick || href) && (
          <div className="absolute right-4 bottom-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <svg
              className="w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        )}
      </Component>
    );
  }
);
MobileCard.displayName = "MobileCard";

// ============================================================================
// MOBILE CARD GRID
// ============================================================================

export interface MobileCardGridProps extends React.HTMLAttributes<HTMLDivElement> {
  columns?: {
    mobile?: 1 | 2;
    tablet?: 2 | 3;
    desktop?: 3 | 4;
  };
  gap?: string;
}

const MobileCardGrid = React.forwardRef<HTMLDivElement, MobileCardGridProps>(
  ({ columns = { mobile: 2, tablet: 3, desktop: 4 }, gap = "gap-3 md:gap-4 lg:gap-6", className, children, ...props }, ref) => {
    const gridCols = cn(
      columns.mobile === 1 && "grid-cols-1",
      columns.mobile === 2 && "grid-cols-2",
      columns.tablet === 2 && "md:grid-cols-2",
      columns.tablet === 3 && "md:grid-cols-3",
      columns.desktop === 3 && "lg:grid-cols-3",
      columns.desktop === 4 && "lg:grid-cols-4"
    );

    return (
      <div
        ref={ref}
        className={cn("grid", gridCols, gap, className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
MobileCardGrid.displayName = "MobileCardGrid";

// ============================================================================
// STATS CARD (for dashboards)
// ============================================================================

export interface StatsCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeType?: "increase" | "decrease" | "neutral";
  icon?: LucideIcon;
  iconColor?: string;
  iconBackgroundColor?: string;
  gradient?: string;
  className?: string;
}

const StatsCard = React.forwardRef<HTMLDivElement, StatsCardProps>(
  (
    {
      title,
      value,
      change,
      changeType = "neutral",
      icon: Icon,
      iconColor = "rgb(249 115 22)",
      iconBackgroundColor = "rgb(254 243 242)",
      gradient,
      className,
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative overflow-hidden rounded-xl border border-gray-200 bg-white p-4",
          "hover:shadow-md transition-shadow duration-200",
          gradient && "bg-gradient-to-br from-orange-50 to-red-50 border-orange-100",
          className
        )}
      >
        {/* Background gradient decoration */}
        {gradient && (
          <div
            className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-10"
            style={{ background: gradient }}
          />
        )}

        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>

            {change !== undefined && (
              <div className="flex items-center gap-1 mt-2">
                {changeType === "increase" && (
                  <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                )}
                {changeType === "decrease" && (
                  <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                )}
                <span
                  className={cn(
                    "text-sm font-medium",
                    changeType === "increase" && "text-emerald-600",
                    changeType === "decrease" && "text-red-600",
                    changeType === "neutral" && "text-gray-500"
                  )}
                >
                  {change > 0 ? "+" : ""}{change}%
                </span>
                <span className="text-sm text-gray-400 ml-1">vs last month</span>
              </div>
            )}
          </div>

          {Icon && (
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{
                backgroundColor: iconBackgroundColor,
              }}
            >
              <Icon className="w-5 h-5" style={{ color: iconColor }} strokeWidth={2} />
            </div>
          )}
        </div>
      </div>
    );
  }
);
StatsCard.displayName = "StatsCard";

// ============================================================================
// QUICK ACTION CARD (for dashboards)
// ============================================================================

export interface QuickActionCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  iconColor?: string;
  onClick: () => void;
  className?: string;
}

const QuickActionCard = React.forwardRef<HTMLButtonElement, QuickActionCardProps>(
  ({ title, description, icon: Icon, iconColor = "rgb(249 115 22)", onClick, className }, ref) => {
    return (
      <button
        ref={ref}
        onClick={onClick}
        className={cn(
          "group relative flex flex-col items-center justify-center gap-3 p-4 rounded-xl border border-gray-200 bg-white",
          "hover:shadow-md hover:border-orange-200",
          "active:scale-95",
          "transition-all duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2",
          className
        )}
      >
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center transition-colors group-hover:bg-gray-50"
          style={{ backgroundColor: `${iconColor}15` }}
        >
          <Icon className="w-6 h-6" style={{ color: iconColor }} strokeWidth={2} />
        </div>
        <div className="text-center">
          <p className="font-semibold text-gray-900 text-sm">{title}</p>
          <p className="text-xs text-gray-500 mt-0.5">{description}</p>
        </div>
      </button>
    );
  }
);
QuickActionCard.displayName = "QuickActionCard";

export { MobileCard, MobileCardGrid, StatsCard, QuickActionCard };

// ============================================================================
// USAGE EXAMPLE
// ============================================================================
/*
import { MobileCard, MobileCardGrid, StatsCard, QuickActionCard } from "@/components/ui/mobile-card";
import { BookOpen, Users, TrendingUp } from "lucide-react";

export function Example() {
  return (
    <>
      // Basic card grid
      <MobileCardGrid>
        <MobileCard
          title="Mathematics"
          subtitle="Class 10A"
          description="Advanced calculus and algebra"
          icon={BookOpen}
          badge="New"
        />
        <MobileCard
          title="Physics"
          subtitle="Class 10B"
          description="Mechanics and thermodynamics"
          icon={BookOpen}
        />
      </MobileCardGrid>

      // Stats card
      <StatsCard
        title="Total Students"
        value="1,234"
        change={12}
        changeType="increase"
        icon={Users}
      />

      // Quick action card
      <QuickActionCard
        title="Add Homework"
        description="Create new assignment"
        icon={TrendingUp}
        onClick={() => console.log("clicked")}
      />
    </>
  );
}
*/
