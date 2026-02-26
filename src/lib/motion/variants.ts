/**
 * Motion Variants
 *
 * Reusable Framer Motion variant sets for consistent animations.
 * All variants use GPU-accelerated properties and respect reduced motion.
 *
 * @see docs/design/motion-system.md
 */

import { Variants as VariantsType } from "framer-motion";
import { distance, opacity, scale, prefersReducedMotion, getDuration } from "./tokens";

// ============================================================================
// FADE VARIANTS
// ============================================================================

/**
 * Simple fade in/out variants.
 * Use for: modals, overlays, tooltips.
 */
export const fadeVariants: VariantsType = {
  hidden: { opacity: opacity.hidden },
  visible: {
    opacity: opacity.visible,
    transition: {
      duration: getDuration(200) / 1000,
      ease: [0, 0, 0.2, 1],
    },
  },
  exit: {
    opacity: opacity.hidden,
    transition: {
      duration: getDuration(150) / 1000,
      ease: [0.4, 0, 1, 1],
    },
  },
};

// ============================================================================
// SLIDE VARIANTS
// ============================================================================

/**
 * Slide up from bottom - the most common slide direction.
 * Use for: sheets, drawers, toasts, dropdown menus.
 */
export const slideUpVariants: VariantsType = {
  hidden: {
    opacity: opacity.hidden,
    y: prefersReducedMotion() ? 0 : distance.medium,
  },
  visible: {
    opacity: opacity.visible,
    y: 0,
    transition: {
      duration: getDuration(200) / 1000,
      ease: [0, 0, 0.2, 1],
    },
  },
  exit: {
    opacity: opacity.hidden,
    y: prefersReducedMotion() ? 0 : distance.small,
    transition: {
      duration: getDuration(150) / 1000,
      ease: [0.4, 0, 1, 1],
    },
  },
};

/**
 * Slide down from top.
 * Use for: dropdown menus, notifications from top.
 */
export const slideDownVariants: VariantsType = {
  hidden: {
    opacity: opacity.hidden,
    y: prefersReducedMotion() ? 0 : -distance.medium,
  },
  visible: {
    opacity: opacity.visible,
    y: 0,
    transition: {
      duration: getDuration(200) / 1000,
      ease: [0, 0, 0.2, 1],
    },
  },
  exit: {
    opacity: opacity.hidden,
    y: prefersReducedMotion() ? 0 : -distance.small,
    transition: {
      duration: getDuration(150) / 1000,
      ease: [0.4, 0, 1, 1],
    },
  },
};

/**
 * Slide in from right.
 * Use for: side panels, right drawers.
 */
export const slideRightVariants: VariantsType = {
  hidden: {
    opacity: opacity.hidden,
    x: prefersReducedMotion() ? 0 : distance.medium,
  },
  visible: {
    opacity: opacity.visible,
    x: 0,
    transition: {
      duration: getDuration(200) / 1000,
      ease: [0, 0, 0.2, 1],
    },
  },
  exit: {
    opacity: opacity.hidden,
    x: prefersReducedMotion() ? 0 : distance.medium,
    transition: {
      duration: getDuration(150) / 1000,
      ease: [0.4, 0, 1, 1],
    },
  },
};

/**
 * Slide in from left.
 * Use for: navigation drawers, left panels.
 */
export const slideLeftVariants: VariantsType = {
  hidden: {
    opacity: opacity.hidden,
    x: prefersReducedMotion() ? 0 : -distance.medium,
  },
  visible: {
    opacity: opacity.visible,
    x: 0,
    transition: {
      duration: getDuration(200) / 1000,
      ease: [0, 0, 0.2, 1],
    },
  },
  exit: {
    opacity: opacity.hidden,
    x: prefersReducedMotion() ? 0 : -distance.medium,
    transition: {
      duration: getDuration(150) / 1000,
      ease: [0.4, 0, 1, 1],
    },
  },
};

// ============================================================================
// SCALE VARIANTS
// ============================================================================

/**
 * Scale in from slightly smaller.
 * Use for: dialogs, menus, cards appearing.
 */
export const scaleVariants: VariantsType = {
  hidden: {
    opacity: opacity.hidden,
    scale: prefersReducedMotion() ? 1 : scale.shrink,
  },
  visible: {
    opacity: opacity.visible,
    scale: scale.rest,
    transition: {
      duration: getDuration(200) / 1000,
      ease: [0.34, 1.56, 0.64, 1], // Snappy spring
    },
  },
  exit: {
    opacity: opacity.hidden,
    scale: prefersReducedMotion() ? 1 : scale.base,
    transition: {
      duration: getDuration(150) / 1000,
      ease: [0.4, 0, 1, 1],
    },
  },
};

/**
 * Pop in with more bounce.
 * Use for: emphasis, drawing attention to new elements.
 */
export const popVariants: VariantsType = {
  hidden: {
    opacity: opacity.hidden,
    scale: prefersReducedMotion() ? 1 : 0.9,
  },
  visible: {
    opacity: opacity.visible,
    scale: scale.rest,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 15,
    },
  },
  exit: {
    opacity: opacity.hidden,
    scale: prefersReducedMotion() ? 1 : 0.95,
    transition: {
      duration: getDuration(100) / 1000,
    },
  },
};

// ============================================================================
// STAGGER VARIANTS (for lists)
// ============================================================================

/**
 * Container with staggered children.
 * Use for: lists, grids, form fields appearing sequentially.
 */
export const staggerContainer: VariantsType = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.05,
    },
  },
};

/**
 * Single item in staggered list - fade and slide up.
 */
export const staggerItem: VariantsType = {
  hidden: {
    opacity: 0,
    y: prefersReducedMotion() ? 0 : distance.base,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: getDuration(250) / 1000,
      ease: [0, 0, 0.2, 1],
    },
  },
};

/**
 * Stagger with scale effect.
 * Use for: card grids, icon lists.
 */
export const staggerScaleContainer: VariantsType = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.03,
    },
  },
};

export const staggerScaleItem: VariantsType = {
  hidden: {
    opacity: 0,
    scale: prefersReducedMotion() ? 1 : scale.base,
  },
  visible: {
    opacity: 1,
    scale: scale.rest,
    transition: {
      duration: getDuration(200) / 1000,
      ease: [0.34, 1.56, 0.64, 1],
    },
  },
};

// ============================================================================
// COMBINED VARIANTS
// ============================================================================

/**
 * Fade and slide - versatile for many contexts.
 * Use for: general content appearing, page sections.
 */
export const fadeInUp: VariantsType = {
  hidden: {
    opacity: opacity.hidden,
    y: prefersReducedMotion() ? 0 : distance.base,
  },
  visible: {
    opacity: opacity.visible,
    y: 0,
    transition: {
      duration: getDuration(200) / 1000,
      ease: [0, 0, 0.2, 1],
    },
  },
};

/**
 * Fade and slide down.
 * Use for: elements appearing from above.
 */
export const fadeInDown: VariantsType = {
  hidden: {
    opacity: opacity.hidden,
    y: prefersReducedMotion() ? 0 : -distance.base,
  },
  visible: {
    opacity: opacity.visible,
    y: 0,
    transition: {
      duration: getDuration(200) / 1000,
      ease: [0, 0, 0.2, 1],
    },
  },
};

/**
 * Fade and scale - focused reveal.
 * Use for: tooltips, popovers, badges.
 */
export const fadeInScale: VariantsType = {
  hidden: {
    opacity: opacity.hidden,
    scale: prefersReducedMotion() ? 1 : scale.base,
  },
  visible: {
    opacity: opacity.visible,
    scale: scale.rest,
    transition: {
      duration: getDuration(150) / 1000,
      ease: [0.34, 1.56, 0.64, 1],
    },
  },
};

// ============================================================================
// DRAW VARIANTS (path-based)
// ============================================================================

/**
 * Draw in SVG path.
 * Use for: icons, illustrations, progress indicators.
 */
export const drawVariants: VariantsType = {
  hidden: {
    pathLength: 0,
    opacity: 0,
  },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: {
        duration: getDuration(400) / 1000,
        ease: [0.4, 0, 0.2, 1],
      },
      opacity: {
        duration: getDuration(100) / 1000,
      },
    },
  },
};

// ============================================================================
// COLLAPSE VARIANTS
// ============================================================================

/**
 * Accordion-style collapse.
 * Use for: expand/collapse sections, accordions.
 */
export const collapseVariants: VariantsType = {
  expanded: {
    height: "auto",
    opacity: 1,
    transition: {
      height: {
        duration: getDuration(300) / 1000,
        ease: [0.4, 0, 0.2, 1],
      },
      opacity: {
        duration: getDuration(200) / 1000,
      },
    },
  },
  collapsed: {
    height: 0,
    opacity: prefersReducedMotion() ? 1 : 0,
    transition: {
      height: {
        duration: getDuration(200) / 1000,
        ease: [0.4, 0, 1, 1],
      },
      opacity: {
        duration: getDuration(150) / 1000,
      },
    },
  },
};

// ============================================================================
// FLIP VARIANTS
// ============================================================================

/**
 * Card flip animation.
 * Use for: flashcards, reveal interactions.
 */
export const flipVariants: VariantsType = {
  front: {
    rotateY: 0,
    scale: 1,
    zIndex: 1,
  },
  back: {
    rotateY: 180,
    scale: 1,
    zIndex: 0,
  },
};

// ============================================================================
// SHAKE VARIANTS (feedback)
// ============================================================================

/**
 * Shake animation for error feedback.
 * Use for: invalid form fields, error states.
 */
export const shakeVariants: VariantsType = {
  still: { x: 0 },
  shake: {
    x: [0, -4, 4, -4, 4, 0],
    transition: {
      duration: 0.4,
      ease: [0.4, 0, 0.2, 1],
    },
  },
};

// ============================================================================
// PULSE VARIANTS
// ============================================================================

/**
 * Subtle pulse for attention.
 * Use for: loading indicators, notifications, active states.
 */
export const pulseVariants: VariantsType = {
  rest: {
    scale: 1,
    opacity: 1,
  },
  pulse: {
    scale: [1, 1.02, 1],
    opacity: [1, 0.8, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      repeatType: "loop" as const,
      ease: [0.4, 0, 0.6, 1],
    },
  },
};

/**
 * Gentle glow pulse.
 * Use for: recording indicators, live status.
 */
export const glowVariants: VariantsType = {
  rest: {
    boxShadow: "0 0 0 0px rgba(99, 102, 241, 0)",
  },
  glow: {
    boxShadow: [
      "0 0 0 0px rgba(99, 102, 241, 0.4)",
      "0 0 0 4px rgba(99, 102, 241, 0)",
    ],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      repeatType: "loop" as const,
    },
  },
};

// ============================================================================
// PRESET COLLECTIONS
// ============================================================================

/**
 * Commonly used variant sets grouped for easy import.
 */
export const variants = {
  fade: fadeVariants,
  slideUp: slideUpVariants,
  slideDown: slideDownVariants,
  slideLeft: slideLeftVariants,
  slideRight: slideRightVariants,
  scale: scaleVariants,
  pop: popVariants,
  fadeInUp,
  fadeInDown,
  fadeInScale,
  staggerContainer,
  staggerItem,
  staggerScaleContainer,
  staggerScaleItem,
  draw: drawVariants,
  collapse: collapseVariants,
  flip: flipVariants,
  shake: shakeVariants,
  pulse: pulseVariants,
  glow: glowVariants,
} as const;

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type VariantName = keyof typeof variants;
