/**
 * AnimatedWrapper Component
 *
 * Wraps content with smooth enter/exit animations.
 * Supports multiple animation variants and respects reduced motion.
 *
 * @example
 * <AnimatedWrapper variant="fadeUp">
 *   <div>Content fades in from bottom</div>
 * </AnimatedWrapper>
 *
 * @example
 * <AnimatedWrapper variant="stagger" delay={0.1}>
 *   <ul>
 *     <li>Item 1</li>
 *     <li>Item 2</li>
 *   </ul>
 * </AnimatedWrapper>
 */

"use client";

import { motion, HTMLMotionProps, Variant, Transition } from "framer-motion";
import { forwardRef } from "react";
import { prefersReducedMotion } from "@/lib/motion/tokens";
import {
  fadeVariants,
  fadeInUp,
  scaleVariants,
  staggerContainer,
  staggerItem,
} from "@/lib/motion/variants";

// ============================================================================
// TYPES
// ============================================================================

export type AnimatedWrapperVariant =
  | "fade"
  | "fadeUp"
  | "fadeScale"
  | "scale"
  | "stagger"
  | "none";

export interface AnimatedWrapperProps extends Omit<HTMLMotionProps<"div">, "variants"> {
  /**
   * Animation variant to use
   * @default "fadeUp"
   */
  variant?: AnimatedWrapperVariant;

  /**
   * Delay before animation starts (seconds)
   * @default 0
   */
  delay?: number;

  /**
   * Animation duration (seconds)
   * @default 0.25
   */
  duration?: number;

  /**
   * Disable animation
   * @default false
   */
  disabled?: boolean;

  /**
   * Enable layout animation
   * @default false
   */
  layout?: boolean;

  /**
   * Animate children with stagger effect
   * Only works with "stagger" variant
   * @default 0.05
   */
  staggerDelay?: number;
}

// ============================================================================
// VARIANT MAPS
// ============================================================================

const variantMap: Record<AnimatedWrapperVariant, Variant> = {
  fade: fadeVariants,
  fadeUp: fadeInUp,
  fadeScale: {
    hidden: { opacity: 0, scale: prefersReducedMotion() ? 1 : 0.98 },
    visible: { opacity: 1, scale: 1 },
  },
  scale: scaleVariants,
  stagger: staggerContainer,
  none: {
    hidden: {},
    visible: {},
  },
};

// ============================================================================
// COMPONENT
// ============================================================================

export const AnimatedWrapper = forwardRef<HTMLDivElement, AnimatedWrapperProps>(
  (
    {
      children,
      variant = "fadeUp",
      delay = 0,
      duration = 0.25,
      disabled = false,
      layout = false,
      staggerDelay = 0.05,
      className = "",
      initial = undefined,
      animate = undefined,
      exit = undefined,
      transition = undefined,
      ...props
    },
    ref
  ) => {
    // Respect reduced motion preference
    if (prefersReducedMotion() || disabled) {
      return <div ref={ref} className={className} {...props}>{children}</div>;
    }

    const variants = variantMap[variant];

    // Build transition config
    const transitionConfig: Transition = transition || {
      duration,
      ease: [0, 0, 0.2, 1],
      delay,
    };

    // For stagger variant, configure stagger children
    if (variant === "stagger") {
      transitionConfig.staggerChildren = staggerDelay;
    }

    return (
      <motion.div
        ref={ref}
        className={className}
        layout={layout}
        variants={variants}
        initial={initial ?? "hidden"}
        animate={animate ?? "visible"}
        exit={exit ?? "hidden"}
        transition={transitionConfig}
        {...props}
      >
        {variant === "stagger" ? (
          <motion.div variants={staggerItem}>{children}</motion.div>
        ) : (
          children
        )}
      </motion.div>
    );
  }
);

AnimatedWrapper.displayName = "AnimatedWrapper";

// ============================================================================
// CONVENIENCE COMPONENTS
// ============================================================================

/**
 * Fade in animation wrapper.
 */
export const FadeIn = forwardRef<HTMLDivElement, Omit<AnimatedWrapperProps, "variant">>(
  (props, ref) => <AnimatedWrapper ref={ref} variant="fade" {...props} />
);
FadeIn.displayName = "FadeIn";

/**
 * Fade up animation wrapper (most common).
 */
export const FadeUp = forwardRef<HTMLDivElement, Omit<AnimatedWrapperProps, "variant">>(
  (props, ref) => <AnimatedWrapper ref={ref} variant="fadeUp" {...props} />
);
FadeUp.displayName = "FadeUp";

/**
 * Scale in animation wrapper.
 */
export const ScaleIn = forwardRef<HTMLDivElement, Omit<AnimatedWrapperProps, "variant">>(
  (props, ref) => <AnimatedWrapper ref={ref} variant="scale" {...props} />
);
ScaleIn.displayName = "ScaleIn";

/**
 * Stagger children animation wrapper.
 */
export const StaggerIn = forwardRef<
  HTMLDivElement,
  Omit<AnimatedWrapperProps, "variant">
>((props, ref) => <AnimatedWrapper ref={ref} variant="stagger" {...props} />);
StaggerIn.displayName = "StaggerIn";

/**
 * No animation wrapper (bypass).
 */
export const NoAnimation = forwardRef<HTMLDivElement, Omit<AnimatedWrapperProps, "variant">>(
  (props, ref) => <AnimatedWrapper ref={ref} variant="none" {...props} />
);
NoAnimation.displayName = "NoAnimation";
