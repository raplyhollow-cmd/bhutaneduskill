/**
 * Bento Grid
 *
 * Modern CSS Grid layout for dashboards inspired by Apple and Linear.
 * Cards can span multiple columns and rows for visual hierarchy.
 */

import { HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface BentoGridProps extends HTMLAttributes<HTMLDivElement> {
  cols?: number;
  gap?: string;
}

export const BentoGrid = forwardRef<HTMLDivElement, BentoGridProps>(
  ({ className, cols = 4, gap = "1rem", children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("grid w-full", className)}
        style={{
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gridAutoRows: "minmax(140px, auto)",
          gap,
        }}
        {...props}
      >
        {children}
      </div>
    );
  }
);

BentoGrid.displayName = "BentoGrid";

// ============================================================================
// BENTO CARD (with span utilities)
// ============================================================================

interface BentoCardProps extends HTMLAttributes<HTMLDivElement> {
  colSpan?: 1 | 2 | 3 | 4;
  rowSpan?: 1 | 2 | 3;
}

export const BentoCard = forwardRef<HTMLDivElement, BentoCardProps>(
  ({ className, colSpan = 1, rowSpan = 1, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("rounded-2xl overflow-hidden", className)}
        style={{
          gridColumn: `span ${colSpan}`,
          gridRow: `span ${rowSpan}`,
        }}
        {...props}
      >
        {children}
      </div>
    );
  }
);

BentoCard.displayName = "BentoCard";

// ============================================================================
// PRE-DEFINED CARD SIZES
// ============================================================================

export function Bento1x1(props: HTMLAttributes<HTMLDivElement>) {
  return <BentoCard {...props} colSpan={1} rowSpan={1} />;
}

export function Bento2x1(props: HTMLAttributes<HTMLDivElement>) {
  return <BentoCard {...props} colSpan={2} rowSpan={1} />;
}

export function Bento2x2(props: HTMLAttributes<HTMLDivElement>) {
  return <BentoCard {...props} colSpan={2} rowSpan={2} />;
}

export function Bento3x1(props: HTMLAttributes<HTMLDivElement>) {
  return <BentoCard {...props} colSpan={3} rowSpan={1} />;
}

export function Bento4x1(props: HTMLAttributes<HTMLDivElement>) {
  return <BentoCard {...props} colSpan={4} rowSpan={1} />;
}

// ============================================================================
// RESPONSIVE BENTO (adapts columns on mobile)
// ============================================================================

interface ResponsiveBentoGridProps extends HTMLAttributes<HTMLDivElement> {
  mobileCols?: number;
  tabletCols?: number;
  desktopCols?: number;
}

export function ResponsiveBentoGrid({
  mobileCols = 1,
  tabletCols = 2,
  desktopCols = 4,
  className,
  children,
  ...props
}: ResponsiveBentoGridProps) {
  return (
    <BentoGrid
      className={cn(
        // Mobile (default)
        "grid-cols-1",
        // Tablet (md breakpoint)
        `md:grid-cols-${tabletCols}`,
        // Desktop (lg breakpoint)
        `lg:grid-cols-${desktopCols}`,
        className
      )}
      {...props}
    >
      {children}
    </BentoGrid>
  );
}
