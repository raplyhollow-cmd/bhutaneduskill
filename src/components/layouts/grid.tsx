"use client";

import { forwardRef, HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/**
 * Grid - CSS Grid wrapper for common layouts
 *
 * Features:
 * - Responsive columns (1 -> 2 -> 3 -> 4)
 * - Configurable gap (8, 16, 24, 32px)
 * - Auto-fit variants for responsive behavior
 * - Alignment options
 *
 * @example
 * ```tsx
 * // Basic responsive grid
 * <Grid cols={{ sm: 1, md: 2, lg: 3 }}>
 *   <Card>Item 1</Card>
 *   <Card>Item 2</Card>
 *   <Card>Item 3</Card>
 * </Grid>
 *
 * // Auto-fit grid
 * <Grid cols="auto-fit" minColWidth="250px">
 *   <Card>Item 1</Card>
 *   <Card>Item 2</Card>
 * </Grid>
 * ```
 */

export type ColsValue =
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | "auto-fit"
  | "auto-fill"
  | {
      sm?: 1 | 2 | 3 | 4;
      md?: 1 | 2 | 3 | 4 | 5 | 6;
      lg?: 1 | 2 | 3 | 4 | 5 | 6;
      xl?: 1 | 2 | 3 | 4 | 5 | 6;
      "2xl"?: 1 | 2 | 3 | 4 | 5 | 6;
    };

export type GapValue = 0 | 8 | 16 | 24 | 32 | 48;

export interface GridProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Number of columns or responsive object
   * @default 1
   */
  cols?: ColsValue;
  /**
   * Gap between grid items in pixels
   * @default 16
   */
  gap?: GapValue;
  /**
   * Minimum column width (for auto-fit/auto-fill)
   */
  minColWidth?: string;
  /**
   * Horizontal alignment
   * @default "start"
   */
  align?: "start" | "center" | "end" | "stretch";
  /**
   * Vertical alignment
   * @default "start"
   */
  justify?: "start" | "center" | "end" | "stretch";
}

const gapStyles: Record<GapValue, string> = {
  0: "gap-0",
  8: "gap-2",
  16: "gap-4",
  24: "gap-6",
  32: "gap-8",
  48: "gap-12",
};

const alignStyles: Record<NonNullable<GridProps["align"]>, string> = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
  stretch: "items-stretch",
};

const justifyStyles: Record<NonNullable<GridProps["justify"]>, string> = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
  stretch: "justify-stretch",
};

function getColsTemplate(cols: ColsValue, minColWidth?: string): string {
  if (typeof cols === "number") {
    return `grid-cols-${cols}`;
  }

  if (cols === "auto-fit" || cols === "auto-fill") {
    const minWidth = minColWidth || "250px";
    return `grid-cols-[repeat(auto-fit,minmax(${minWidth},1fr))]`;
  }

  // Responsive object
  const sm = cols.sm ?? 1;
  const md = cols.md ?? sm;
  const lg = cols.lg ?? md;
  const xl = cols.xl ?? lg;
  const xl2 = cols["2xl"] ?? xl;

  return `grid-cols-1 sm:grid-cols-${sm} md:grid-cols-${md} lg:grid-cols-${lg} xl:grid-cols-${xl} 2xl:grid-cols-${xl2}`;
}

export const Grid = forwardRef<HTMLDivElement, GridProps>(
  ({ children, className, cols = 1, gap = 16, align = "start", justify = "start", minColWidth, style, ...props }, ref) => {
    const gridTemplate = getColsTemplate(cols, minColWidth);

    return (
      <div
        ref={ref}
        className={cn(
          // Base grid
          "grid",
          // Columns
          gridTemplate,
          // Gap
          gapStyles[gap],
          // Alignment
          alignStyles[align],
          justifyStyles[justify],
          // Transition
          "transition-all duration-200",
          className
        )}
        style={style}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Grid.displayName = "Grid";

/**
 * GridItem - Individual grid cell with optional span
 *
 * @example
 * ```tsx
 * <Grid>
 *   <GridItem colSpan={2}>Spans 2 columns</GridItem>
 *   <GridItem>Normal item</GridItem>
 * </Grid>
 * ```
 */
export interface GridItemProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Number of columns to span (1-6)
   */
  colSpan?: 1 | 2 | 3 | 4 | 5 | 6 | "full";
  /**
   * Number of rows to span (1-6)
   */
  rowSpan?: 1 | 2 | 3 | 4 | 5 | 6;
  /**
   * Responsive column span
   */
  colSpanResponsive?: {
    sm?: 1 | 2 | 3 | 4 | 5 | 6;
    md?: 1 | 2 | 3 | 4 | 5 | 6;
    lg?: 1 | 2 | 3 | 4 | 5 | 6;
    xl?: 1 | 2 | 3 | 4 | 5 | 6;
  };
}

export const GridItem = forwardRef<HTMLDivElement, GridItemProps>(
  ({ children, className, colSpan = 1, rowSpan, colSpanResponsive, ...props }, ref) => {
    const colSpanClass = colSpan === "full"
      ? "col-span-full"
      : `col-span-${colSpan}`;

    const rowSpanClass = rowSpan ? `row-span-${rowSpan}` : "";

    const responsiveClasses = colSpanResponsive
      ? [
          colSpanResponsive.sm ? `sm:col-span-${colSpanResponsive.sm}` : "",
          colSpanResponsive.md ? `md:col-span-${colSpanResponsive.md}` : "",
          colSpanResponsive.lg ? `lg:col-span-${colSpanResponsive.lg}` : "",
          colSpanResponsive.xl ? `xl:col-span-${colSpanResponsive.xl}` : "",
        ].join(" ")
      : "";

    return (
      <div
        ref={ref}
        className={cn(
          colSpanClass,
          rowSpanClass,
          responsiveClasses,
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

GridItem.displayName = "GridItem";

/**
 * Preset grid configurations for common layouts
 */

export function CardGrid({ children, className, ...props }: Omit<GridProps, "cols" | "gap">) {
  return (
    <Grid
      cols={{ sm: 1, md: 2, lg: 3, xl: 3 }}
      gap={24}
      className={className}
      {...props}
    >
      {children}
    </Grid>
  );
}

export function ListGrid({ children, className, ...props }: Omit<GridProps, "cols" | "gap">) {
  return (
    <Grid
      cols="auto-fit"
      minColWidth="300px"
      gap={16}
      className={className}
      {...props}
    >
      {children}
    </Grid>
  );
}

export function StatGrid({ children, className, ...props }: Omit<GridProps, "cols" | "gap">) {
  return (
    <Grid
      cols={{ sm: 1, md: 2, lg: 4 }}
      gap={16}
      className={className}
      {...props}
    >
      {children}
    </Grid>
  );
}

export function FormGrid({ children, className, ...props }: Omit<GridProps, "cols" | "gap">) {
  return (
    <Grid
      cols={{ sm: 1, md: 2, lg: 2 }}
      gap={16}
      className={className}
      {...props}
    >
      {children}
    </Grid>
  );
}
