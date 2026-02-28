/**
 * Pressable Component
 *
 * Button/element with press feedback animations.
 * Provides visual confirmation of user interaction.
 *
 * @example
 * <Pressable onPress={() => console.log('pressed')}>
 *   <button>Click me</button>
 * </Pressable>
 *
 * @example
 * <Pressable variant="snappy" onPress={handleAction}>
 *   <div>Snappy feedback</div>
 * </Pressable>
 */

"use client";

import { motion, HTMLMotionProps, Transition, TargetAndTransition } from "framer-motion";
import { forwardRef, ReactNode, MouseEvent, TouchEvent } from "react";
import { prefersReducedMotion, scale } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils";

// ============================================================================
// TYPES
// ============================================================================

export type PressableEffect =
  | "scale"        // Scale down (0.98x) - default
  | "snappy"       // Quick scale down (0.95x)
  | "shrink"       // More shrink (0.92x)
  | "brighten"     // Brighten on press
  | "dim"          // Dim on press
  | "none";        // No press effect

export interface PressableProps extends Omit<HTMLMotionProps<"div">, "whileTap" | "onPress" | "children"> {
  /**
   * Press effect variant
   * @default "scale"
   */
  effect?: PressableEffect;

  /**
   * Press callback
   */
  onPress?: (e: MouseEvent<HTMLDivElement> | TouchEvent<HTMLDivElement>) => void;

  /**
   * Disable press effect
   * @default false
   */
  disabled?: boolean;

  /**
   * Add hover effect
   * @default false
   */
  withHover?: boolean;

  /**
   * Child content or render prop
   */
  children: ReactNode | ((props: { isPressed: boolean }) => ReactNode);
}

// ============================================================================
// PRESS VARIANTS
// ============================================================================

const pressVariants: Record<
  PressableEffect,
  { whileTap?: TargetAndTransition | undefined; whileHover?: TargetAndTransition | undefined }
> = {
  scale: {
    whileTap: prefersReducedMotion()
      ? undefined
      : { scale: scale.base, transition: { duration: 0.1 } },
    whileHover: { scale: prefersReducedMotion() ? 1 : 1.02, transition: { duration: 0.15 } },
  },
  snappy: {
    whileTap: prefersReducedMotion()
      ? undefined
      : { scale: scale.shrink, transition: { duration: 0.08 } },
    whileHover: { scale: prefersReducedMotion() ? 1 : 1.03, transition: { duration: 0.1 } },
  },
  shrink: {
    whileTap: prefersReducedMotion()
      ? undefined
      : { scale: 0.92, transition: { duration: 0.1 } },
    whileHover: { scale: prefersReducedMotion() ? 1 : 1.02, transition: { duration: 0.15 } },
  },
  brighten: {
    whileTap: prefersReducedMotion()
      ? undefined
      : { filter: "brightness(1.1)", transition: { duration: 0.1 } },
    whileHover: { filter: "brightness(1.05)", transition: { duration: 0.15 } },
  },
  dim: {
    whileTap: prefersReducedMotion()
      ? undefined
      : { filter: "brightness(0.9)", transition: { duration: 0.1 } },
    whileHover: { filter: "brightness(1)", transition: { duration: 0.15 } },
  },
  none: {
    whileTap: undefined,
    whileHover: undefined,
  },
};

// ============================================================================
// COMPONENT
// ============================================================================

export const Pressable = forwardRef<HTMLDivElement, PressableProps>(
  (
    {
      children,
      effect = "scale",
      onPress,
      disabled = false,
      withHover = false,
      className = "",
      onClick,
      ...props
    },
    ref
  ) => {
    const variants = pressVariants[effect];
    const isActive = !disabled && !prefersReducedMotion();

    const handleClick = (e: MouseEvent<HTMLDivElement>) => {
      if (disabled) return;
      onPress?.(e);
      onClick?.(e);
    };

    const renderChildren = () => {
      if (typeof children === "function") {
        return children({ isPressed: false });
      }
      return children;
    };

    return (
      <motion.div
        ref={ref}
        className={cn(
          "cursor-pointer",
          disabled && "cursor-not-allowed opacity-50",
          className
        )}
        whileTap={isActive ? variants.whileTap : undefined}
        whileHover={isActive && withHover ? variants.whileHover : undefined}
        onClick={handleClick}
        {...props}
      >
        {renderChildren()}
      </motion.div>
    );
  }
);

Pressable.displayName = "Pressable";

// ============================================================================
// CONVENIENCE COMPONENTS
// ============================================================================

/**
 * Quick snappy press feedback.
 */
export const SnappyPress = forwardRef<HTMLDivElement, Omit<PressableProps, "effect">>(
  (props, ref) => <Pressable ref={ref} effect="snappy" {...(props as any)} />
);
SnappyPress.displayName = "SnappyPress";

/**
 * Strong press feedback (more shrink).
 */
export const StrongPress = forwardRef<HTMLDivElement, Omit<PressableProps, "effect">>(
  (props, ref) => <Pressable ref={ref} effect="shrink" {...(props as any)} />
);
StrongPress.displayName = "StrongPress";

/**
 * Pressable with hover effect included.
 */
export const Interactive = forwardRef<HTMLDivElement, Omit<PressableProps, "withHover">>(
  (props, ref) => <Pressable ref={ref} effect="scale" withHover {...(props as any)} />
);
Interactive.displayName = "Interactive";

// ============================================================================
// BUTTON WRAPPER
// ============================================================================

/**
 * Wrap a button with press feedback.
 * Preserves all button semantics and styles.
 */
export const PressableButton = forwardRef<
  HTMLButtonElement,
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "effect"> & { effect?: PressableEffect }
>(({ children, effect = "scale" as PressableEffect, disabled = false, className = "", ...props }, ref) => {
  const variants = pressVariants[effect];
  const isActive = !disabled && !prefersReducedMotion();

  return (
    <motion.button
      ref={ref as any}
      className={cn(
        "cursor-pointer",
        disabled && "cursor-not-allowed opacity-50",
        className
      )}
      disabled={disabled}
      whileTap={(isActive ? variants.whileTap : undefined) as any}
      whileHover={(isActive ? variants.whileHover : undefined) as any}
      {...(props as any)}
    >
      {children}
    </motion.button>
  );
});

PressableButton.displayName = "PressableButton";
