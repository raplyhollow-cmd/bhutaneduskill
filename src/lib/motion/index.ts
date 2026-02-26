/**
 * Motion Design System
 *
 * Complete animation library for Bhutan EduSkill.
 * Provides tokens, variants, and presets for consistent motion design.
 *
 * @see docs/design/motion-system.md
 *
 * @example
 * import { fadeInUp, hoverCard, progressFill } from '@/lib/motion';
 *
 * // Use variants with Framer Motion
 * <motion.div variants={fadeInUp} initial="hidden" animate="visible" />
 */

// ============================================================================
// TOKENS
// ============================================================================

export * from "./tokens";

// ============================================================================
// VARIANTS
// ============================================================================

export * from "./variants";

// ============================================================================
// HOVER EFFECTS
// ============================================================================

export * from "./hover";

// ============================================================================
// FEEDBACK ANIMATIONS
// ============================================================================

export * from "./feedback";

// ============================================================================
// LOADING STATES
// ============================================================================

export * from "./loading";

// ============================================================================
// PAGE TRANSITIONS
// ============================================================================

export * from "./page-transitions";

// ============================================================================
// PRESET COLLECTIONS
// ============================================================================

import {
  fadeVariants,
  fadeInUp,
  scaleVariants,
  staggerContainer,
  staggerItem,
} from "./variants";
import {
  hoverCard,
  hoverLift,
  hoverScale,
  whileHover,
  whileTap,
} from "./hover";
import {
  buttonPressVariants,
  progressFillVariants,
  toastSlideUp,
} from "./feedback";
import {
  spinnerVariants,
  skeletonVariants,
  progressBarVariants,
} from "./loading";
import {
  fadeUpPageTransition,
  staggerPageTransition,
} from "./page-transitions";

/**
 * Common animation presets for quick use.
 */
export const presets = {
  // Enter/exit
  fadeIn: fadeVariants,
  fadeInUp,
  scaleIn: scaleVariants,
  stagger: {
    container: staggerContainer,
    item: staggerItem,
  },

  // Hover
  hover: hoverCard,
  hoverLift,
  hoverScale,
  whileHover,
  whileTap,

  // Feedback
  buttonPress: buttonPressVariants,
  progressFill: progressFillVariants,
  toast: toastSlideUp,

  // Loading
  spinner: spinnerVariants,
  skeleton: skeletonVariants,
  progressBar: progressBarVariants,

  // Pages
  pageFadeUp: fadeUpPageTransition,
  pageStagger: staggerPageTransition,
} as const;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get animation config respecting reduced motion preference.
 */
export function getMotionConfig<T extends Record<string, unknown>>(
  config: T,
  fallback: T = {} as T
): T | Record<string, never> {
  const { prefersReducedMotion } = require("./tokens");
  if (prefersReducedMotion()) {
    return fallback;
  }
  return config;
}

/**
 * Create spring animation config.
 */
export function spring(stiffness = 400, damping = 30) {
  return {
    type: "spring" as const,
    stiffness,
    damping,
  };
}

/**
 * Easing function type for animations
 */
export type EasingFunction = number[] | string;

/**
 * Create tween animation config.
 */
export function tween(duration = 0.25, ease: EasingFunction = [0.4, 0, 0.2, 1]) {
  return {
    type: "tween" as const,
    duration,
    ease,
  };
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type MotionPreset = keyof typeof presets;
