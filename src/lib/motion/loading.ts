/**
 * Loading Animations
 *
 * Spinners, skeletons, shimmer effects, and loading states.
 * Optimized for performance with minimal DOM impact.
 *
 * @see docs/design/motion-system.md
 */

import { Variants, Transition } from "framer-motion";
import { prefersReducedMotion, getDuration, easing, opacity } from "./tokens";

// ============================================================================
// SPINNER ANIMATIONS
// ============================================================================

/**
 * Rotating spinner - classic loading indicator.
 * Size: 16-20px recommended for compact loading.
 */
export const spinnerVariants: Variants = {
  hidden: {
    opacity: 0,
    rotate: 0,
  },
  visible: {
    opacity: 1,
    rotate: 360,
    transition: {
      duration: 1,
      repeat: prefersReducedMotion() ? 0 : Infinity,
      repeatType: "loop" as const,
      ease: "linear",
    },
  },
};

/**
 * Pulsing spinner (no rotation).
 * Use for: subtle loading, alternate to rotation.
 */
export const pulseSpinnerVariants: Variants = {
  hidden: {
    opacity: 0.3,
    scale: 0.8,
  },
  visible: {
    opacity: [0.3, 0.8, 0.3],
    scale: [0.8, 1, 0.8],
    transition: {
      duration: 1.2,
      repeat: prefersReducedMotion() ? 0 : Infinity,
      repeatType: "loop" as const,
      ease: "easeInOut",
    },
  },
};

/**
 * Dots pulse (3-dot loading pattern).
 */
export const dotsVariants: Variants = {
  container: {
    visible: {
      transition: {
        staggerChildren: 0.15,
      },
    },
  },
  dot: {
    hidden: {
      opacity: 0.3,
      scale: 0.6,
    },
    visible: {
      opacity: [0.3, 1, 0.3],
      scale: [0.6, 1, 0.6],
      transition: {
        duration: 0.8,
        repeat: prefersReducedMotion() ? 0 : Infinity,
        repeatType: "loop" as const,
        ease: "easeInOut",
      },
    },
  },
};

// ============================================================================
// SKELETON LOADING
// ============================================================================

/**
 * Subtle skeleton pulse (0.95 -> 1.0 opacity).
 * Use for: content placeholders, image loading.
 */
export const skeletonVariants: Variants = {
  pulse: {
    opacity: [0.95, 1, 0.95],
    transition: {
      duration: 1.5,
      repeat: prefersReducedMotion() ? 0 : Infinity,
      repeatType: "loop" as const,
      ease: "easeInOut",
    },
  },
  shimmer: {
    backgroundPosition: ["-200% 0", "200% 0"],
    transition: {
      duration: 2,
      repeat: prefersReducedMotion() ? 0 : Infinity,
      repeatType: "loop" as const,
      ease: "linear",
    },
  },
};

// ============================================================================
// SHIMMER EFFECT
// ============================================================================

/**
 * Shimmer gradient for skeleton screens.
 * Apply via style with gradient background.
 */
export const shimmerStyle = {
  background:
    "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)",
  backgroundSize: "200% 100%",
};

/**
 * Dark mode shimmer.
 */
export const shimmerStyleDark = {
  background:
    "linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)",
  backgroundSize: "200% 100%",
};

// ============================================================================
// BAR LOADING ANIMATIONS
// ============================================================================

/**
 * Horizontal progress bar.
 * Smooth fill from left to right.
 */
export const progressBarVariants: Variants = {
  hidden: {
    width: "0%",
  },
  visible: (progress: number) => ({
    width: `${progress}%`,
    transition: {
      duration: getDuration(400) / 1000,
      ease: easing.easeOut,
    },
  }),
  indeterminate: {
    x: ["-100%", "100%"],
    transition: {
      duration: 1.5,
      repeat: prefersReducedMotion() ? 0 : Infinity,
      repeatType: "loop" as const,
      ease: "linear",
    },
  },
};

/**
 * Continuous loading bar (like YouTube).
 */
export const continuousProgressBarVariants: Variants = {
  start: {
    x: "-100%",
  },
  animate: {
    x: "100%",
    transition: {
      duration: 2,
      repeat: prefersReducedMotion() ? 0 : Infinity,
      repeatType: "loop" as const,
      ease: "linear",
    },
  },
};

// ============================================================================
// CIRCULAR PROGRESS
// ============================================================================

/**
 * Circular progress spinner with stroke.
 */
export const circularProgressVariants: Variants = {
  hidden: {
    pathLength: 0,
    rotate: -90,
  },
  visible: (progress: number) => ({
    pathLength: progress,
    rotate: -90,
    transition: {
      pathLength: {
        duration: getDuration(500) / 1000,
        ease: [0.4, 0, 0.2, 1],
      },
    },
  }),
  indeterminate: {
    rotate: [-90, 270],
    transition: {
      duration: 2,
      repeat: prefersReducedMotion() ? 0 : Infinity,
      repeatType: "loop" as const,
      ease: "linear",
    },
  },
};

// ============================================================================
// WAVE LOADING
// ============================================================================

/**
 * Wave animation for multiple elements.
 * Use for: skeleton lists, repeated items.
 */
export const waveVariants: Variants = {
  container: {
    visible: {
      transition: {
        staggerChildren: 0.1,
        repeat: prefersReducedMotion() ? 0 : Infinity,
        repeatType: "loop" as const,
      },
    },
  },
  item: {
    hidden: {
      opacity: 0.5,
      y: 0,
    },
    visible: {
      opacity: [0.5, 1, 0.5],
      y: [0, -4, 0],
      transition: {
        duration: 1.2,
        ease: "easeInOut",
      },
    },
  },
};

// ============================================================================
// BOUNCE LOADING
// ============================================================================

/**
 * Bouncing balls loading animation.
 */
export const bounceVariants: Variants = {
  container: {
    visible: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  },
  ball: {
    hidden: {
      y: 0,
      opacity: 0.6,
    },
    visible: {
      y: [-10, -30, -10],
      opacity: [0.6, 1, 0.6],
      transition: {
        duration: 0.6,
        repeat: prefersReducedMotion() ? 0 : Infinity,
        repeatType: "loop" as const,
        ease: "easeInOut",
      },
    },
  },
};

// ============================================================================
// CARD SKELETON VARIANTS
// ============================================================================

/**
 * Skeleton card with multiple elements.
 */
export const cardSkeletonVariants: Variants = {
  pulse: {
    opacity: [0.96, 1, 0.96],
    transition: {
      duration: 1.5,
      repeat: prefersReducedMotion() ? 0 : Infinity,
      repeatType: "loop" as const,
      ease: "easeInOut",
    },
  },
};

// ============================================================================
// TEXT LOADING
// ============================================================================

/**
 * Text line skeleton (for paragraphs).
 */
export const textLineVariants: Variants = {
  pulse: {
    opacity: [0.5, 1, 0.5],
    transition: {
      duration: 1.5,
      repeat: prefersReducedMotion() ? 0 : Infinity,
      repeatType: "loop" as const,
      ease: "easeInOut",
    },
  },
};

// ============================================================================
// IMAGE LOADING STATES
// ============================================================================

/**
 * Image placeholder animation.
 */
export const imagePlaceholderVariants: Variants = {
  loading: {
    opacity: 0.5,
    scale: 0.98,
  },
  loaded: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: getDuration(300) / 1000,
      ease: easing.easeOut,
    },
  },
  error: {
    opacity: 0.7,
    scale: 1,
  },
};

// ============================================================================
// OVERLAY LOADING
// ============================================================================

/**
 * Full-page or overlay loading state.
 */
export const overlayVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      duration: getDuration(150) / 1000,
      ease: easing.easeOut,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: getDuration(100) / 1000,
      ease: easing.easeIn,
    },
  },
};

// ============================================================================
// STAGGER LOADING (for lists)
// ============================================================================

/**
 * Stagger reveal for loaded content.
 */
export const staggerLoadVariants: Variants = {
  container: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  },
  item: {
    hidden: {
      opacity: 0,
      y: 8,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: getDuration(250) / 1000,
        ease: easing.easeOut,
      },
    },
  },
};

// ============================================================================
// TYPEWRITER EFFECT
// ============================================================================

/**
 * Typewriter cursor blink.
 */
export const cursorVariants: Variants = {
  blinking: {
    opacity: [1, 0, 1],
    transition: {
      duration: 0.8,
      repeat: prefersReducedMotion() ? 0 : Infinity,
      repeatType: "loop" as const,
      ease: "step-end",
    },
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get skeleton animation based on reduced motion preference.
 */
export function getSkeletonAnimation() {
  return prefersReducedMotion() ? { opacity: 1 } : skeletonVariants.pulse;
}

/**
 * Get spinner animation based on reduced motion preference.
 */
export function getSpinnerAnimation() {
  return prefersReducedMotion() ? { opacity: 1, rotate: 0 } : spinnerVariants.visible;
}

/**
 * Create custom progress animation.
 */
export function createProgressVariants(
  from: number,
  to: number,
  duration: number = 400
): Variants {
  return {
    hidden: {
      scaleX: from,
    },
    visible: {
      scaleX: to,
      transition: {
        duration: getDuration(duration) / 1000,
        ease: easing.easeOut,
      },
    },
  };
}

// ============================================================================
// CSS CLASSES FOR SKELETON
// ============================================================================

/**
 * CSS class strings for common skeleton patterns.
 */
export const skeletonClasses = {
  base: "bg-gray-200 dark:bg-gray-700 rounded animate-pulse",
  text: "h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse",
  title: "h-6 w-1/3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse",
  avatar: "h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse",
  button: "h-10 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse",
  card: "h-32 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse",
  image: "aspect-video bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse",
} as const;

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type LoadingVariant =
  | "spinner"
  | "pulseSpinner"
  | "dots"
  | "skeleton"
  | "shimmer"
  | "progressBar"
  | "circularProgress"
  | "wave"
  | "bounce"
  | "overlay"
  | "staggerLoad";
