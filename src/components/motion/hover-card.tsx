/**
 * HoverCard Component
 *
 * Card with subtle, sophisticated hover effects.
 * Combines scale, brightness, and optional lift effects.
 *
 * @example
 * <HoverCard variant="lift">
 *   <CardContent>Content</CardContent>
 * </HoverCard>
 *
 * @example
 * <HoverCard variant="glow" glowColor="#6366f1">
 *   <CardContent>Brand glow effect</CardContent>
 * </HoverCard>
 */

"use client";

import { motion, HTMLMotionProps, Transition, TargetAndTransition } from "framer-motion";
import { forwardRef, ReactNode } from "react";
import { prefersReducedMotion, scale } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils";

// ============================================================================
// TYPES
// ============================================================================

export type HoverCardVariant =
  | "scale"        // Subtle scale (1.02x)
  | "lift"         // Scale + Y translate
  | "brighten"     // Brightness filter
  | "glow"         // Box shadow glow
  | "brand"        // Brand-colored glow
  | "iconBounce"   // Bounce effect for icons
  | "none";        // No hover effect

export interface HoverCardProps extends Omit<HTMLMotionProps<"div">, "whileHover" | "whileTap"> {
  /**
   * Hover effect variant
   * @default "scale"
   */
  variant?: HoverCardVariant;

  /**
   * Color for glow effects
   * @default "rgba(99, 102, 241, 0.3)"
   */
  glowColor?: string;

  /**
   * Disable hover effect
   * @default false
   */
  disabled?: boolean;

  /**
   * Enable press/tap feedback
   * @default true
   */
  pressFeedback?: boolean;

  /**
   * Make card clickable (adds cursor pointer)
   * @default false
   */
  clickable?: boolean;

  /**
   * Child content
   */
  children: ReactNode;
}

// ============================================================================
// HOVER VARIANTS
// ============================================================================

interface VariantConfig {
  whileHover?: TargetAndTransition;
  whileTap?: TargetAndTransition;
  transition?: Transition;
}

const hoverVariants: Record<HoverCardVariant, VariantConfig> = {
  scale: {
    whileHover: prefersReducedMotion()
      ? undefined
      : { scale: scale.grow, transition: { duration: 0.15, ease: [0.4, 0, 0.2, 1] } },
    whileTap: prefersReducedMotion()
      ? undefined
      : { scale: scale.base, transition: { duration: 0.1 } },
  },
  lift: {
    whileHover: prefersReducedMotion()
      ? undefined
      : {
          scale: 1.02,
          y: -2,
          transition: { duration: 0.15, ease: [0.4, 0, 0.2, 1] },
        },
    whileTap: prefersReducedMotion()
      ? undefined
      : { scale: 0.98, y: 0, transition: { duration: 0.1 } },
  },
  brighten: {
    whileHover: prefersReducedMotion()
      ? undefined
      : {
          filter: "brightness(1.05)",
          transition: { duration: 0.15, ease: [0.4, 0, 0.2, 1] },
        },
    whileTap: prefersReducedMotion()
      ? undefined
      : { filter: "brightness(1)", transition: { duration: 0.1 } },
  },
  glow: {
    whileHover: prefersReducedMotion()
      ? undefined
      : {
          boxShadow: "0 0 0 3px rgba(99, 102, 241, 0.2), 0 4px 12px rgba(0, 0, 0, 0.1)",
          transition: { duration: 0.15, ease: [0.4, 0, 0.2, 1] },
        },
    whileTap: prefersReducedMotion()
      ? undefined
      : { boxShadow: "0 0 0 0px transparent", transition: { duration: 0.1 } },
  },
  brand: {
    whileHover: prefersReducedMotion()
      ? undefined
      : {
          boxShadow: "0 0 0 3px var(--brand-glow, rgba(139, 92, 246, 0.3))",
          transition: { duration: 0.15, ease: [0.4, 0, 0.2, 1] },
        },
    whileTap: prefersReducedMotion()
      ? undefined
      : { boxShadow: "0 0 0 0px transparent", transition: { duration: 0.1 } },
  },
  iconBounce: {
    whileHover: prefersReducedMotion()
      ? undefined
      : {
          scale: 1.1,
          rotate: 5,
          transition: { duration: 0.2, ease: [0.34, 1.56, 0.64, 1] },
        },
    whileTap: prefersReducedMotion()
      ? undefined
      : { scale: 0.95, rotate: 0, transition: { duration: 0.1 } },
  },
  none: {
    whileHover: undefined,
    whileTap: undefined,
  },
};

// ============================================================================
// COMPONENT
// ============================================================================

export const HoverCard = forwardRef<HTMLDivElement, HoverCardProps>(
  (
    {
      children,
      variant = "scale",
      glowColor,
      disabled = false,
      pressFeedback = true,
      clickable = false,
      className = "",
      ...props
    },
    ref
  ) => {
    // Apply glow color via CSS variable for brand variant
    const style = glowColor ? { "--brand-glow": glowColor } as React.CSSProperties : props.style;

    const variants = hoverVariants[variant];
    const isActive = !disabled && !prefersReducedMotion();

    return (
      <motion.div
        ref={ref}
        className={cn(
          "rounded-lg",
          clickable && "cursor-pointer",
          className
        )}
        style={style}
        whileHover={isActive && variants.whileHover ? variants.whileHover : undefined}
        whileTap={isActive && pressFeedback && variants.whileTap ? variants.whileTap : undefined}
        transition={variants.transition}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

HoverCard.displayName = "HoverCard";

// ============================================================================
// CONVENIENCE COMPONENTS
// ============================================================================

/**
 * Card with lift effect - great for interactive cards.
 */
export const LiftCard = forwardRef<HTMLDivElement, Omit<HoverCardProps, "variant">>(
  (props, ref) => <HoverCard ref={ref} variant="lift" {...props} />
);
LiftCard.displayName = "LiftCard";

/**
 * Card with glow effect - great for featured items.
 */
export const GlowCard = forwardRef<HTMLDivElement, Omit<HoverCardProps, "variant">>(
  (props, ref) => <HoverCard ref={ref} variant="glow" {...props} />
);
GlowCard.displayName = "GlowCard";

/**
 * Card with brand glow - uses CSS variable for theming.
 */
export const BrandCard = forwardRef<HTMLDivElement, Omit<HoverCardProps, "variant">>(
  (props, ref) => <HoverCard ref={ref} variant="brand" {...props} />
);
BrandCard.displayName = "BrandCard";

/**
 * Interactive icon button with bounce.
 */
export const IconBounce = forwardRef<HTMLDivElement, Omit<HoverCardProps, "variant">>(
  (props, ref) => <HoverCard ref={ref} variant="iconBounce" {...props} />
);
IconBounce.displayName = "IconBounce";
