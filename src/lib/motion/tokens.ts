/**
 * Motion Design Tokens
 *
 * Centralized animation constants for consistent, performant motion design.
 * All values are optimized for subtlety and accessibility.
 *
 * @see docs/design/motion-system.md
 */

// ============================================================================
// DURATION TOKENS
// ============================================================================

/**
 * Animation durations in milliseconds.
 * Fast durations for frequent interactions, slower for emphasis.
 */
export const duration = {
  instant: 100,   // Barely perceptible, for micro-interactions
  fast: 150,      // Quick feedback, button presses, hover states
  base: 200,      // Default animation speed, transitions
  slow: 300,      // Emphasis, drawing attention
  slower: 400,    // Complex animations, modals
} as const;

// ============================================================================
// EASING TOKENS
// ============================================================================

/**
 * CSS cubic-bezier easing curves.
 * Spring-based easing for natural, organic motion.
 */
export const easing = {
  /**
   * Spring-like ease-out for natural deceleration.
   * Use for: entrances, hover effects, scale changes.
   * [0.4, 0, 0.2, 1] - starts quick, slows smoothly
   */
  spring: [0.4, 0, 0.2, 1] as const,

  /**
   * Quick deceleration, immediate start.
   * Use for: exits, slide-outs, fade-outs.
   * [0, 0, 0.2, 1] - immediate, smooth stop
   */
  easeOut: [0, 0, 0.2, 1] as const,

  /**
   * Gradual acceleration.
   * Use for: drawing attention, emphasis.
   * [0.4, 0, 1, 1] - slow start, fast end
   */
  easeIn: [0.4, 0, 1, 1] as const,

  /**
   * Symmetrical ease for continuous motion.
   * Use for: loading states, repeated animations.
   * [0.4, 0, 0.6, 1] - smooth both directions
   */
  easeInOut: [0.4, 0, 0.6, 1] as const,

  /**
   * Bouncy spring for playful feedback.
   * Use for: success states, confetti, celebrations.
   * [0.68, -0.6, 0.32, 1.6] - overshoots and settles
   */
  bouncy: [0.68, -0.6, 0.32, 1.6] as const,

  /**
   * Sharp spring for snappy UI feedback.
   * Use for: button presses, toggle switches.
   * [0.34, 1.56, 0.64, 1] - quick snap
   */
  snappy: [0.34, 1.56, 0.64, 1] as const,
} as const;

// ============================================================================
// DELAY TOKENS
// ============================================================================

/**
 * Standard delays for staggered animations.
 */
export const delay = {
  none: 0,
  short: 50,
  base: 100,
  long: 150,
  longer: 200,
} as const;

// ============================================================================
// DISTANCE TOKENS
// ============================================================================

/**
 * Subtle movement distances (in pixels).
 * Small values maintain subtlety and reduce motion sickness risk.
 */
export const distance = {
  micro: 2,      // Barely perceptible shift
  tiny: 4,       // Subtle nudge
  small: 6,      // Gentle movement
  base: 8,       // Default slide distance
  medium: 12,    // Moderate movement
  large: 16,     // Maximum for standard animations
} as const;

// ============================================================================
// SCALE TOKENS
// ============================================================================

/**
 * Scale transformation values.
 * Near 1.0 for subtle, professional feel.
 */
export const scale = {
  shrink: 0.95,     // Button press state
  base: 0.98,       // Subtle press feedback
  rest: 1,          // Default state
  grow: 1.02,       // Hover state (subtle)
  expand: 1.05,     // Emphasis hover
} as const;

// ============================================================================
// OPACITY TOKENS
// ============================================================================

/**
 * Opacity values for fade animations.
 */
export const opacity = {
  hidden: 0,
  faint: 0.3,
  dim: 0.5,
  muted: 0.7,
  visible: 1,
} as const;

// ============================================================================
// SPRING PHYSICS TOKENS
// ============================================================================

/**
 * Framer Motion spring configuration for physics-based animations.
 */
export const spring = {
  gentle: {
    type: "spring",
    stiffness: 300,
    damping: 25,
  } as const,
  default: {
    type: "spring",
    stiffness: 400,
    damping: 30,
  } as const,
  snappy: {
    type: "spring",
    stiffness: 500,
    damping: 28,
  } as const,
  bouncy: {
    type: "spring",
    stiffness: 400,
    damping: 15,
  } as const,
  smooth: {
    type: "spring",
    stiffness: 200,
    damping: 30,
  } as const,
} as const;

// ============================================================================
// REDUCED MOTION
// ============================================================================

/**
 * Check if user prefers reduced motion.
 * Respects accessibility preferences.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Get animation duration respecting reduced motion preference.
 */
export function getDuration(ms: number): number {
  return prefersReducedMotion() ? 0 : ms;
}

/**
 * Get transition config respecting reduced motion preference.
 */
export function getTransition<T extends Record<string, unknown>>(
  config: T
): T | { duration: 0 } {
  if (prefersReducedMotion()) {
    return { duration: 0 } as T | { duration: 0 };
  }
  return config;
}

// ============================================================================
// PRESET TRANSITIONS
// ============================================================================

/**
 * Pre-configured transitions for common use cases.
 */
export const transition = {
  instant: {
    duration: duration.instant / 1000,
    ease: easing.spring,
  },
  fast: {
    duration: duration.fast / 1000,
    ease: easing.spring,
  },
  base: {
    duration: duration.base / 1000,
    ease: easing.spring,
  },
  slow: {
    duration: duration.slow / 1000,
    ease: easing.spring,
  },
  fadeIn: {
    duration: duration.base / 1000,
    ease: easing.easeOut,
  },
  fadeOut: {
    duration: duration.fast / 1000,
    ease: easing.easeIn,
  },
  slideIn: {
    duration: duration.base / 1000,
    ease: easing.easeOut,
  },
  springy: {
    duration: duration.slow / 1000,
    ease: easing.bouncy,
  },
} as const;

// ============================================================================
// GPU-ACCELERATED PROPERTIES
// ============================================================================

/**
 * Properties that trigger GPU acceleration.
 * Prefer these for smooth 60fps animations.
 */
export const gpuProperties = [
  "transform",
  "opacity",
  "filter",
] as const;

/**
 * Properties that trigger layout recalculations.
 * Avoid animating these for performance.
 */
export const layoutProperties = [
  "width",
  "height",
  "top",
  "left",
  "right",
  "bottom",
  "margin",
  "padding",
  "borderWidth",
] as const;

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type Duration = (typeof duration)[keyof typeof duration];
export type Easing = (typeof easing)[keyof typeof easing];
export type Delay = (typeof delay)[keyof typeof delay];
export type Distance = (typeof distance)[keyof typeof distance];
export type Scale = (typeof scale)[keyof typeof scale];
export type Opacity = (typeof opacity)[keyof typeof opacity];
export type Spring = (typeof spring)[keyof typeof spring];
export type Transition = (typeof transition)[keyof typeof transition];
