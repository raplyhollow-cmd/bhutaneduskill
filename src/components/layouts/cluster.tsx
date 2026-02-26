"use client";

import * as React from "react";
import { forwardRef, HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/**
 * Cluster - Flex row with wrap for responsive clusters
 *
 * Similar to HStack but with wrapping enabled by default.
 * Perfect for tag clouds, button groups, and card collections.
 *
 * Features:
 * - Wraps items to multiple lines by default
 * - Consistent gaps with wrap
 * - Align and justify options
 * - Responsive behavior
 *
 * @example
 * ```tsx
 * // Tag cloud
 * <Cluster gap={8} justify="center">
 *   <Badge>React</Badge>
 *   <Badge>TypeScript</Badge>
 *   <Badge>Node.js</Badge>
 * </Cluster>
 *
 * // Button group
 * <Cluster gap={12}>
 *   <Button>Cancel</Button>
 *   <Button variant="primary">Submit</Button>
 * </Cluster>
 * ```
 */

export type GapToken = 0 | 8 | 16 | 24 | 32 | 48;

export interface ClusterProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Gap between items in pixels
   * @default 16
   */
  gap?: GapToken;
  /**
   * Cross-axis alignment
   * @default "center"
   */
  align?: "start" | "center" | "end" | "stretch" | "baseline";
  /**
   * Main-axis alignment
   * @default "start"
   */
  justify?: "start" | "center" | "end" | "space-between" | "space-around" | "space-evenly";
  /**
   * How to distribute extra space in each line
   * @default "normal"
   */
  alignContent?: "start" | "center" | "end" | "stretch" | "space-between" | "space-around" | "space-evenly";
  /**
   * Reverse the order
   * @default false
   */
  reverse?: boolean;
  /**
   * Make children grow to fill available space
   * @default false
   */
  grow?: boolean;
}

const gapStyles: Record<GapToken, string> = {
  0: "gap-0",
  8: "gap-2",
  16: "gap-4",
  24: "gap-6",
  32: "gap-8",
  48: "gap-12",
};

const alignStyles: Record<NonNullable<ClusterProps["align"]>, string> = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
  stretch: "items-stretch",
  baseline: "items-baseline",
};

const justifyStyles: Record<NonNullable<ClusterProps["justify"]>, string> = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
  "space-between": "justify-between",
  "space-around": "justify-around",
  "space-evenly": "justify-evenly",
};

const alignContentStyles: Record<NonNullable<ClusterProps["alignContent"]>, string> = {
  start: "content-start",
  center: "content-center",
  end: "content-end",
  stretch: "content-stretch",
  "space-between": "content-between",
  "space-around": "content-around",
  "space-evenly": "content-evenly",
};

export const Cluster = forwardRef<HTMLDivElement, ClusterProps>(
  ({
    children,
    className,
    gap = 16,
    align = "center",
    justify = "start",
    alignContent = "normal",
    reverse = false,
    grow = false,
    ...props
  }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          // Base flex with wrap
          "flex flex-wrap",
          // Direction
          reverse ? "flex-row-reverse" : "flex-row",
          // Gap (works with flex-wrap)
          gapStyles[gap],
          // Alignment
          alignStyles[align],
          justifyStyles[justify],
          // Content alignment (multi-line)
          alignContent !== "normal" && alignContentStyles[alignContent],
          // Growth
          grow && "flex-1",
          // Transition
          "transition-all duration-200",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Cluster.displayName = "Cluster";

/**
 * VCluster - Vertical cluster (column with wrap)
 *
 * Rarely used, but available for completeness
 */
export interface VClusterProps extends Omit<ClusterProps, "reverse"> {
  reverse?: boolean;
}

export const VCluster = forwardRef<HTMLDivElement, VClusterProps>(
  ({
    children,
    className,
    gap = 16,
    align = "center",
    justify = "start",
    alignContent = "normal",
    reverse = false,
    grow = false,
    ...props
  }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          // Base flex with wrap
          "flex flex-wrap",
          // Direction
          reverse ? "flex-col-reverse" : "flex-col",
          // Gap
          gapStyles[gap],
          // Alignment
          alignStyles[align],
          justifyStyles[justify],
          // Content alignment
          alignContent !== "normal" && alignContentStyles[alignContent],
          // Growth
          grow && "flex-1",
          // Transition
          "transition-all duration-200",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

VCluster.displayName = "VCluster";

/**
 * Preset cluster configurations
 */

/**
 * TightCluster - For compact item clusters (tags, badges)
 */
export function TightCluster(props: Omit<ClusterProps, "gap">) {
  return <Cluster gap={8} {...props} />;
}

/**
 * NormalCluster - For general-purpose clusters
 */
export function NormalCluster(props: Omit<ClusterProps, "gap">) {
  return <Cluster gap={16} {...props} />;
}

/**
 * LooseCluster - For item clusters with more breathing room
 */
export function LooseCluster(props: Omit<ClusterProps, "gap">) {
  return <Cluster gap={24} {...props} />;
}

/**
 * CenterCluster - Automatically centers all items
 */
export function CenterCluster(props: ClusterProps) {
  return <Cluster align="center" justify="center" {...props} />;
}

/**
 * SpaceBetweenCluster - Distributes items with space between
 */
export function SpaceBetweenCluster(props: ClusterProps) {
  return <Cluster justify="space-between" {...props} />;
}

/**
 * FlowCluster - Automatically grows to fill available space
 */
export function FlowCluster(props: Omit<ClusterProps, "grow">) {
  return <Cluster grow {...props} />;
}

/**
 * WrapInfo - Information about cluster wrapping state
 *
 * Hook to detect if items in a cluster have wrapped to new lines
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { hasWrapped, lineCount } = useWrapInfo(ref);
 *
 *   return (
 *     <Cluster ref={ref}>
 *       {hasWrapped ? <Badge>{lineCount} lines</Badge> : null}
 *       {items}
 *     </Cluster>
 *   );
 * }
 * ```
 */
export interface UseWrapInfoReturn {
  hasWrapped: boolean;
  lineCount: number;
  containerWidth: number | null;
}

export function useWrapInfo(ref: React.RefObject<HTMLDivElement>): UseWrapInfoReturn {
  const [hasWrapped, setHasWrapped] = React.useState(false);
  const [lineCount, setLineCount] = React.useState(1);
  const [containerWidth, setContainerWidth] = React.useState<number | null>(null);

  React.useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const updateWrapInfo = () => {
      const rect = element.getBoundingClientRect();
      setContainerWidth(rect.width);

      const children = Array.from(element.children);
      if (children.length === 0) return;

      // Get first child's top position as baseline
      const firstChildTop = children[0].getBoundingClientRect().top;

      // Count how many children have different top positions
      let lines = 1;
      for (const child of children) {
        const childTop = child.getBoundingClientRect().top;
        if (Math.abs(childTop - firstChildTop) > 1) {
          lines++;
        }
      }

      setLineCount(lines);
      setHasWrapped(lines > 1);
    };

    // Initial check
    updateWrapInfo();

    // Recalculate on resize
    const resizeObserver = new ResizeObserver(updateWrapInfo);
    resizeObserver.observe(element);

    return () => resizeObserver.disconnect();
  }, [ref]);

  return { hasWrapped, lineCount, containerWidth };
}
