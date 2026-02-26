"use client";

import * as React from "react";
import { forwardRef, HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/**
 * Stack - Flex column with consistent gap spacing
 *
 * Features:
 * - Configurable gap tokens (8, 16, 24, 32, 48px)
 * - Align items options (start, center, end, stretch)
 * - Justify options (start, center, end, space-between)
 * - Responsive sizing
 *
 * @example
 * ```tsx
 * // Vertical stack with gap
 * <Stack gap={16}>
 *   <div>Item 1</div>
 *   <div>Item 2</div>
 *   <div>Item 3</div>
 * </Stack>
 *
 * // Centered stack
 * <Stack gap={24} align="center">
 *   <h1>Title</h1>
 *   <p>Subtitle</p>
 * </Stack>
 * ```
 */

export type GapToken = 0 | 8 | 16 | 24 | 32 | 48 | 64;

export interface StackProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Gap between items in pixels
   * @default 16
   */
  gap?: GapToken;
  /**
   * Horizontal alignment
   * @default "stretch"
   */
  align?: "start" | "center" | "end" | "stretch" | "baseline";
  /**
   * Vertical alignment
   * @default "start"
   */
  justify?: "start" | "center" | "end" | "space-between" | "space-around" | "space-evenly";
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
  /**
   * Wrap items
   * @default false
   */
  wrap?: boolean;
}

const gapStyles: Record<GapToken, string> = {
  0: "gap-0",
  8: "gap-2",
  16: "gap-4",
  24: "gap-6",
  32: "gap-8",
  48: "gap-12",
  64: "gap-16",
};

const alignStyles: Record<NonNullable<StackProps["align"]>, string> = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
  stretch: "items-stretch",
  baseline: "items-baseline",
};

const justifyStyles: Record<NonNullable<StackProps["justify"]>, string> = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
  "space-between": "justify-between",
  "space-around": "justify-around",
  "space-evenly": "justify-evenly",
};

export const Stack = forwardRef<HTMLDivElement, StackProps>(
  ({
    children,
    className,
    gap = 16,
    align = "stretch",
    justify = "start",
    reverse = false,
    grow = false,
    wrap = false,
    ...props
  }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          // Base flex
          "flex",
          // Direction (column)
          reverse ? "flex-col-reverse" : "flex-col",
          // Gap
          gapStyles[gap],
          // Alignment
          alignStyles[align],
          justifyStyles[justify],
          // Growth
          grow && "flex-1",
          // Wrap
          wrap && "flex-wrap",
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

Stack.displayName = "Stack";

/**
 * HStack - Horizontal stack (row layout)
 *
 * @example
 * ```tsx
 * <HStack gap={16} align="center">
 *   <Avatar />
 *   <div>
 *     <Text>Name</Text>
 *     <Text variant="muted">Email</Text>
 *   </div>
 * </HStack>
 * ```
 */
export interface HStackProps extends Omit<StackProps, "reverse"> {
  /**
   * Reverse the order
   * @default false
   */
  reverse?: boolean;
}

export const HStack = forwardRef<HTMLDivElement, HStackProps>(
  ({
    children,
    className,
    gap = 16,
    align = "center",
    justify = "start",
    reverse = false,
    grow = false,
    wrap = false,
    ...props
  }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          // Base flex
          "flex",
          // Direction (row)
          reverse ? "flex-row-reverse" : "flex-row",
          // Gap
          gapStyles[gap],
          // Alignment
          alignStyles[align],
          justifyStyles[justify],
          // Growth
          grow && "flex-1",
          // Wrap
          wrap && "flex-wrap",
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

HStack.displayName = "HStack";

/**
 * VStack - Alias for Stack (vertical layout)
 * Provides semantic clarity when you want to emphasize vertical stacking
 */
export const VStack = Stack;

/**
 * Preset stack configurations
 */

export function TightStack(props: Omit<StackProps, "gap">) {
  return <Stack gap={8} {...props} />;
}

export function NormalStack(props: Omit<StackProps, "gap">) {
  return <Stack gap={16} {...props} />;
}

export function LooseStack(props: Omit<StackProps, "gap">) {
  return <Stack gap={24} {...props} />;
}

export function SpaciousStack(props: Omit<StackProps, "gap">) {
  return <Stack gap={32} {...props} />;
}

/**
 * Separator - A visual divider between stack items
 *
 * @example
 * ```tsx
 * <Stack gap={0}>
 *   <div>Item 1</div>
 *   <Separator />
 *   <div>Item 2</div>
 *   <Separator />
 *   <div>Item 3</div>
 * </Stack>
 * ```
 */
export interface SeparatorProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Orientation of the separator
   * @default "horizontal"
   */
  orientation?: "horizontal" | "vertical";
  /**
   * Visual style
   * @default "default"
   */
  variant?: "default" | "muted" | "strong";
}

const separatorStyles = {
  horizontal: "h-px w-full",
  vertical: "w-px h-full",
};

const variantStyles = {
  default: "bg-border",
  muted: "bg-muted",
  strong: "bg-foreground/10",
};

export const Separator = forwardRef<HTMLDivElement, SeparatorProps>(
  ({ className, orientation = "horizontal", variant = "default", ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="separator"
        aria-orientation={orientation}
        className={cn(
          "shrink-0",
          separatorStyles[orientation],
          variantStyles[variant],
          className
        )}
        {...props}
      />
    );
  }
);

Separator.displayName = "Separator";

/**
 * StackWithSeparator - Stack with automatic separators between items
 *
 * @example
 * ```tsx
 * <StackWithSeparator>
 *   <div>Item 1</div>
 *   <div>Item 2</div>
 *   <div>Item 3</div>
 * </StackWithSeparator>
 * ```
 */
export interface StackWithSeparatorProps extends Omit<StackProps, "gap"> {
  /**
   * Gap between items (in addition to separator)
   */
  gap?: GapToken;
  /**
   * Separator variant
   */
  separatorVariant?: SeparatorProps["variant"];
}

export const StackWithSeparator = forwardRef<HTMLDivElement, StackWithSeparatorProps>(
  ({ children, gap = 16, separatorVariant = "default", className, ...props }, ref) => {
    const childrenArray = React.Children.toArray(children);

    return (
      <Stack gap={gap} className={className} ref={ref} {...props}>
        {childrenArray.map((child, index) => (
          <React.Fragment key={index}>
            {child}
            {index < childrenArray.length - 1 && (
              <Separator variant={separatorVariant} className="my-0" />
            )}
          </React.Fragment>
        ))}
      </Stack>
    );
  }
);

StackWithSeparator.displayName = "StackWithSeparator";
