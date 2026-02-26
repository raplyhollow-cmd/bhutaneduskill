"use client";

import { cn } from "@/lib/utils";
import { ReactNode } from "react";
import { motion } from "framer-motion";

/**
 * Mobile-Optimized Card Component
 *
 * A card component designed specifically for mobile devices with:
 * - Touch-friendly sizing (min 44px tap targets)
 * - Responsive grid layouts
 * - Subtle animations
 * - Bottom padding for mobile navigation
 *
 * Usage:
 *   <MobileCard>
 *     <MobileCardHeader>
 *       <MobileCardTitle>Title</MobileCardTitle>
 *     </MobileCardHeader>
 *     <MobileCardContent>Content</MobileCardContent>
 *   </MobileCard>
 */

interface MobileCardProps {
  children: ReactNode;
  className?: string;
  variant?: "default" | "compact" | "featured";
  noPadding?: boolean;
  onClick?: () => void;
}

export function MobileCard({
  children,
  className,
  variant = "default",
  noPadding = false,
  onClick,
}: MobileCardProps) {
  const CardComponent = onClick ? motion.div : "div";
  const motionProps = onClick ? {
    whileHover: { scale: 1.01 },
    whileTap: { scale: 0.99 },
    transition: { type: "spring", stiffness: 400, damping: 20 },
  } : {};

  return (
    <CardComponent
      onClick={onClick}
      className={cn(
        "bg-white rounded-xl border border-gray-200 shadow-sm",
        "overflow-hidden",
        variant === "compact" && "rounded-lg",
        variant === "featured" && "shadow-md border-gray-300",
        onClick && "cursor-pointer active:scale-[0.99] transition-transform",
        className
      )}
      {...motionProps}
    >
      {children}
    </CardComponent>
  );
}

interface MobileCardHeaderProps {
  children: ReactNode;
  className?: string;
  variant?: "default" | "gradient" | "solid";
  gradient?: string;
}

export function MobileCardHeader({
  children,
  className,
  variant = "default",
  gradient,
}: MobileCardHeaderProps) {
  return (
    <div
      className={cn(
        "px-4 py-3 sm:px-5 sm:py-4",
        variant === "default" && "border-b border-gray-100",
        variant === "gradient" && gradient,
        variant === "solid" && "bg-gray-50",
        className
      )}
    >
      {children}
    </div>
  );
}

interface MobileCardTitleProps {
  children: ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function MobileCardTitle({
  children,
  className,
  size = "md",
}: MobileCardTitleProps) {
  return (
    <h3
      className={cn(
        "font-semibold text-gray-900",
        size === "sm" && "text-sm",
        size === "md" && "text-base",
        size === "lg" && "text-lg sm:text-xl",
        className
      )}
    >
      {children}
    </h3>
  );
}

interface MobileCardDescriptionProps {
  children: ReactNode;
  className?: string;
}

export function MobileCardDescription({
  children,
  className,
}: MobileCardDescriptionProps) {
  return (
    <p
      className={cn(
        "text-sm text-gray-500 mt-1",
        className
      )}
    >
      {children}
    </p>
  );
}

interface MobileCardContentProps {
  children: ReactNode;
  className?: string;
  noPadding?: boolean;
}

export function MobileCardContent({
  children,
  className,
  noPadding = false,
}: MobileCardContentProps) {
  return (
    <div
      className={cn(
        !noPadding && "px-4 py-3 sm:px-5 sm:py-4",
        className
      )}
    >
      {children}
    </div>
  );
}

interface MobileCardFooterProps {
  children: ReactNode;
  className?: string;
}

export function MobileCardFooter({
  children,
  className,
}: MobileCardFooterProps) {
  return (
    <div
      className={cn(
        "px-4 py-3 sm:px-5 sm:py-4 border-t border-gray-100",
        "flex items-center gap-2",
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * Mobile Stat Card - A specialized card for displaying statistics
 * Optimized for mobile with touch-friendly layout
 */
interface MobileStatCardProps {
  label: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon?: ReactNode;
  trend?: "up" | "down" | "flat";
  onClick?: () => void;
  className?: string;
}

export function MobileStatCard({
  label,
  value,
  change,
  changeType = "neutral",
  icon,
  trend,
  onClick,
  className,
}: MobileStatCardProps) {
  return (
    <MobileCard onClick={onClick} className={cn("min-h-[100px]", className)}>
      <MobileCardContent className="flex items-center gap-3">
        {icon && (
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
            {icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm text-gray-500 mb-1">{label}</p>
          <p className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
            {value}
          </p>
          {change && (
            <p
              className={cn(
                "text-xs mt-1",
                changeType === "positive" && "text-green-600",
                changeType === "negative" && "text-red-600",
                changeType === "neutral" && "text-gray-500"
              )}
            >
              {change}
            </p>
          )}
        </div>
        {trend && (
          <div
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center",
              trend === "up" && "bg-green-100 text-green-600",
              trend === "down" && "bg-red-100 text-red-600",
              trend === "flat" && "bg-gray-100 text-gray-600"
            )}
          >
            <span className="text-sm font-bold">
              {trend === "up" ? "↑" : trend === "down" ? "↓" : "→"}
            </span>
          </div>
        )}
      </MobileCardContent>
    </MobileCard>
  );
}

/**
 * Mobile Action Card - A card with a primary action button
 * Perfect for quick actions on mobile dashboards
 */
interface MobileActionCardProps {
  title: string;
  description?: string;
  actionLabel: string;
  onAction: () => void;
  icon?: ReactNode;
  variant?: "default" | "primary" | "warning";
  className?: string;
}

export function MobileActionCard({
  title,
  description,
  actionLabel,
  onAction,
  icon,
  variant = "default",
  className,
}: MobileActionCardProps) {
  const variantStyles = {
    default: "border-gray-200",
    primary: "border-blue-200 bg-blue-50/50",
    warning: "border-orange-200 bg-orange-50/50",
  };

  const buttonStyles = {
    default: "bg-gray-900 text-white",
    primary: "bg-blue-600 text-white",
    warning: "bg-orange-500 text-white",
  };

  return (
    <MobileCard className={cn(variantStyles[variant], className)}>
      <MobileCardContent className="flex items-center gap-3">
        {icon && (
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
            {icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 truncate">{title}</h4>
          {description && (
            <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">
              {description}
            </p>
          )}
        </div>
        <button
          onClick={onAction}
          className={cn(
            "flex-shrink-0 px-4 py-2 rounded-lg font-medium text-sm min-h-[44px] min-w-[44px]",
            "active:scale-95 transition-transform",
            buttonStyles[variant]
          )}
        >
          {actionLabel}
        </button>
      </MobileCardContent>
    </MobileCard>
  );
}

/**
 * Mobile Grid Component - Responsive grid for cards
 * Automatically adjusts columns based on screen size
 */
interface MobileGridProps {
  children: ReactNode;
  className?: string;
  cols?: 1 | 2 | 3 | 4;
}

export function MobileGrid({
  children,
  className,
  cols = 2,
}: MobileGridProps) {
  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  };

  return (
    <div className={cn("grid gap-3 sm:gap-4", gridCols[cols], className)}>
      {children}
    </div>
  );
}

/**
 * Mobile List Item - Touch-friendly list item component
 */
interface MobileListItemProps {
  title: string;
  description?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  onClick?: () => void;
  href?: string;
  badge?: string | number;
  className?: string;
}

export function MobileListItem({
  title,
  description,
  leftIcon,
  rightIcon,
  onClick,
  href,
  badge,
  className,
}: MobileListItemProps) {
  const Component = href ? "a" : onClick ? "button" : "div";
  const componentProps = href
    ? { href }
    : onClick
    ? { type: "button" as const, onClick }
    : {};

  return (
    <Component
      {...componentProps}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl",
        "bg-white border border-gray-200",
        "active:bg-gray-50 active:scale-[0.99]",
        "transition-all duration-150",
        "min-h-[56px]",
        onClick || href ? "cursor-pointer" : "",
        className
      )}
    >
      {leftIcon && (
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
          {leftIcon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 truncate">{title}</p>
        {description && (
          <p className="text-sm text-gray-500 truncate">{description}</p>
        )}
      </div>
      {badge && (
        <span className="flex-shrink-0 px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
          {badge}
        </span>
      )}
      {rightIcon && (
        <div className="flex-shrink-0 text-gray-400">{rightIcon}</div>
      )}
    </Component>
  );
}
