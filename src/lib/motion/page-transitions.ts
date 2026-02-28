/**
 * Page Transitions
 *
 * Smooth transitions for page navigation and route changes.
 * Designed to work with Next.js App Router and Framer Motion.
 *
 * @see docs/design/motion-system.md
 */

import { Variants, Transition } from "framer-motion";
import { distance, opacity, scale, prefersReducedMotion, getDuration, easing } from "./tokens";

// ============================================================================
// FADE PAGE TRANSITION
// ============================================================================

/**
 * Simple fade - most subtle page transition.
 * Use for: default page transitions, subtle navigation.
 */
export const fadePageTransition: Variants = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
    transition: {
      duration: getDuration(200) / 1000,
      ease: easing.easeOut,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: getDuration(150) / 1000,
      ease: easing.easeIn,
    },
  },
};

// ============================================================================
// FADE AND SLIDE UP
// ============================================================================

/**
 * Fade with subtle slide up - the most common page transition.
 * Content appears to rise into view.
 */
export const fadeUpPageTransition: Variants = {
  initial: {
    opacity: 0,
    y: prefersReducedMotion() ? 0 : distance.base,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: getDuration(250) / 1000,
      ease: easing.easeOut,
    },
  },
  exit: {
    opacity: 0,
    y: prefersReducedMotion() ? 0 : -distance.small,
    transition: {
      duration: getDuration(150) / 1000,
      ease: easing.easeIn,
    },
  },
};

// ============================================================================
// FADE AND SLIDE DOWN
// ============================================================================

/**
 * Fade with subtle slide down.
 * Content appears from above.
 */
export const fadeDownPageTransition: Variants = {
  initial: {
    opacity: 0,
    y: prefersReducedMotion() ? 0 : -distance.base,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: getDuration(250) / 1000,
      ease: easing.easeOut,
    },
  },
  exit: {
    opacity: 0,
    y: prefersReducedMotion() ? 0 : distance.small,
    transition: {
      duration: getDuration(150) / 1000,
      ease: easing.easeIn,
    },
  },
};

// ============================================================================
// FADE AND SCALE
// ============================================================================

/**
 * Fade with subtle scale - focused reveal.
 * Use for: dialogs, detail views, focused content.
 */
export const fadeScalePageTransition: Variants = {
  initial: {
    opacity: 0,
    scale: prefersReducedMotion() ? 1 : scale.base,
  },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: getDuration(250) / 1000,
      ease: [0.34, 1.56, 0.64, 1], // Snappy spring
    },
  },
  exit: {
    opacity: 0,
    scale: prefersReducedMotion() ? 1 : 0.98,
    transition: {
      duration: getDuration(150) / 1000,
      ease: easing.easeIn,
    },
  },
};

// ============================================================================
// SLIDE FROM RIGHT
// ============================================================================

/**
 * Content slides in from right (like moving forward).
 * Use for: navigation stacks, forward navigation.
 */
export const slideFromRightTransition: Variants = {
  initial: {
    opacity: 0,
    x: prefersReducedMotion() ? 0 : distance.medium,
  },
  animate: {
    opacity: 1,
    x: 0,
    transition: {
      duration: getDuration(250) / 1000,
      ease: easing.easeOut,
    },
  },
  exit: {
    opacity: 0,
    x: prefersReducedMotion() ? 0 : -distance.small,
    transition: {
      duration: getDuration(150) / 1000,
      ease: easing.easeIn,
    },
  },
};

// ============================================================================
// SLIDE FROM LEFT
// ============================================================================

/**
 * Content slides in from left (like moving back).
 * Use for: back navigation, returning to previous view.
 */
export const slideFromLeftTransition: Variants = {
  initial: {
    opacity: 0,
    x: prefersReducedMotion() ? 0 : -distance.medium,
  },
  animate: {
    opacity: 1,
    x: 0,
    transition: {
      duration: getDuration(250) / 1000,
      ease: easing.easeOut,
    },
  },
  exit: {
    opacity: 0,
    x: prefersReducedMotion() ? 0 : distance.small,
    transition: {
      duration: getDuration(150) / 1000,
      ease: easing.easeIn,
    },
  },
};

// ============================================================================
// STAGGER PAGE CHILDREN
// ============================================================================

/**
 * Page content with staggered children.
 * Elements appear sequentially for visual hierarchy.
 */
export const staggerPageTransition = {
  container: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.05,
      },
    },
  },
  item: {
    hidden: {
      opacity: 0,
      y: prefersReducedMotion() ? 0 : distance.base,
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
// LAYOUT TRANSITION (shared element)
// ============================================================================

/**
 * Layout transition config for shared element animations.
 * Use with Framer Motion's layout prop.
 */
export const layoutTransition: Transition = {
  type: "spring",
  stiffness: 400,
  damping: 30,
};

// ============================================================================
// MODAL PAGE TRANSITION
// ============================================================================

/**
 * Page transition for modal-like pages.
 * Scale and fade with backdrop.
 */
export const modalPageTransition: Variants = {
  initial: {
    opacity: 0,
    scale: prefersReducedMotion() ? 1 : 0.95,
    y: prefersReducedMotion() ? 0 : distance.small,
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: getDuration(200) / 1000,
      ease: [0.34, 1.56, 0.64, 1],
    },
  },
  exit: {
    opacity: 0,
    scale: prefersReducedMotion() ? 1 : 0.98,
    y: prefersReducedMotion() ? 0 : distance.tiny,
    transition: {
      duration: getDuration(150) / 1000,
      ease: easing.easeIn,
    },
  },
};

// ============================================================================
// SECTION TRANSITIONS
// ============================================================================

/**
 * Transition for page sections/areas appearing.
 */
export const sectionTransition: Variants = {
  initial: {
    opacity: 0,
    y: prefersReducedMotion() ? 0 : distance.small,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: getDuration(300) / 1000,
      ease: easing.easeOut,
    },
  },
};

// ============================================================================
// VIEW TRANSITION API UTILITIES
// ============================================================================

/**
 * Check if View Transition API is supported.
 */
export function supportsViewTransition(): boolean {
  return typeof document !== "undefined" && "startViewTransition" in document;
}

/**
 * Start a view transition if supported.
 */
export function startViewTransition(callback: () => void | Promise<void>) {
  if (supportsViewTransition()) {
    type DocumentWithViewTransition = Document & {
      startViewTransition: (cb: () => void | Promise<void>) => { finished: Promise<void> };
    };
    return (document as DocumentWithViewTransition).startViewTransition(callback);
  }
  // Fallback: just run the callback
  return callback();
}

// ============================================================================
// TRANSITION PRESETS
// ============================================================================

/**
 * Common page transition presets.
 */
export const pageTransitions = {
  fade: fadePageTransition,
  fadeUp: fadeUpPageTransition,
  fadeDown: fadeDownPageTransition,
  fadeScale: fadeScalePageTransition,
  slideRight: slideFromRightTransition,
  slideLeft: slideFromLeftTransition,
  modal: modalPageTransition,
  section: sectionTransition,
  stagger: staggerPageTransition,
} as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get transition config respecting reduced motion.
 */
export function getPageTransition(variant: keyof typeof pageTransitions): Variants {
  if (prefersReducedMotion()) {
    return {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
    };
  }
  return pageTransitions[variant];
}

/**
 * Create custom page transition.
 */
export function createPageTransition(
  enterY: number = distance.base,
  exitY: number = -distance.small,
  duration: number = 250
): Variants {
  return {
    initial: {
      opacity: 0,
      y: prefersReducedMotion() ? 0 : enterY,
    },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: getDuration(duration) / 1000,
        ease: easing.easeOut,
      },
    },
    exit: {
      opacity: 0,
      y: prefersReducedMotion() ? 0 : exitY,
      transition: {
        duration: getDuration(150) / 1000,
        ease: easing.easeIn,
      },
    },
  };
}

/**
 * Get AnimatePresence mode based on preference.
 */
export function getAnimatePresenceMode(): "wait" | "popLayout" | "sync" {
  // Use 'wait' for smoother transitions, 'sync' for instant
  return "wait";
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type PageTransitionName = keyof typeof pageTransitions;
