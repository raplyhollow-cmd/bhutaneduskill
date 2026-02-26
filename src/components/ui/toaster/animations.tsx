/**
 * Clerk-Style Toast Animations
 *
 * Framer Motion animation variants for toast notifications
 * Inspired by Clerk.com's smooth, snappy animations
 */

import { Variants, Transition } from "framer-motion"
import { toastAnimation } from "./tokens"

// ============================================================================
// SLIDE-IN ANIMATIONS (from right, like Clerk)
// ============================================================================

/**
 * Toast slides in from right with fade
 * Use for: top-right positioned toasts (Clerk's default)
 */
export const slideInRight: Variants = {
  hidden: {
    x: 400,
    opacity: 0,
    scale: 0.95,
  },
  visible: {
    x: 0,
    opacity: 1,
    scale: 1,
    transition: {
      type: "tween",
      duration: toastAnimation.duration.enter / 1000,
      ease: toastAnimation.easing.enter as any,
    },
  },
  exit: {
    x: 400,
    opacity: 0,
    scale: 0.95,
    transition: {
      type: "tween",
      duration: toastAnimation.duration.exit / 1000,
      ease: toastAnimation.easing.exit as any,
    },
  },
}

/**
 * Toast slides in from left with fade
 * Use for: top-left positioned toasts
 */
export const slideInLeft: Variants = {
  hidden: {
    x: -400,
    opacity: 0,
    scale: 0.95,
  },
  visible: {
    x: 0,
    opacity: 1,
    scale: 1,
    transition: {
      type: "tween",
      duration: toastAnimation.duration.enter / 1000,
      ease: toastAnimation.easing.enter as any,
    },
  },
  exit: {
    x: -400,
    opacity: 0,
    scale: 0.95,
    transition: {
      type: "tween",
      duration: toastAnimation.duration.exit / 1000,
      ease: toastAnimation.easing.exit as any,
    },
  },
}

/**
 * Toast slides in from top with fade
 * Use for: top-center positioned toasts
 */
export const slideInTop: Variants = {
  hidden: {
    y: -100,
    opacity: 0,
    scale: 0.95,
  },
  visible: {
    y: 0,
    opacity: 1,
    scale: 1,
    transition: {
      type: "tween",
      duration: toastAnimation.duration.enter / 1000,
      ease: toastAnimation.easing.enter as any,
    },
  },
  exit: {
    y: -50,
    opacity: 0,
    scale: 0.95,
    transition: {
      type: "tween",
      duration: toastAnimation.duration.exit / 1000,
      ease: toastAnimation.easing.exit as any,
    },
  },
}

/**
 * Toast slides in from bottom with fade
 * Use for: bottom positioned toasts
 */
export const slideInBottom: Variants = {
  hidden: {
    y: 100,
    opacity: 0,
    scale: 0.95,
  },
  visible: {
    y: 0,
    opacity: 1,
    scale: 1,
    transition: {
      type: "tween",
      duration: toastAnimation.duration.enter / 1000,
      ease: toastAnimation.easing.enter as any,
    },
  },
  exit: {
    y: 50,
    opacity: 0,
    scale: 0.95,
    transition: {
      type: "tween",
      duration: toastAnimation.duration.exit / 1000,
      ease: toastAnimation.easing.exit as any,
    },
  },
}

/**
 * Scale in animation (for center-positioned toasts)
 */
export const scaleIn: Variants = {
  hidden: {
    scale: 0.9,
    opacity: 0,
  },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 25,
    },
  },
  exit: {
    scale: 0.9,
    opacity: 0,
    transition: {
      type: "tween",
      duration: toastAnimation.duration.exit / 1000,
    },
  },
}

// ============================================================================
// PROGRESS BAR ANIMATION
// ============================================================================

/**
 * Progress bar shrinks from full width to zero
 * Use for: auto-dismiss countdown indicator
 */
export const progressShrink: Variants = {
  full: {
    scaleX: 1,
    transition: {
      duration: 0, // Instant set
    },
  },
  shrinking: (duration: number) => ({
    scaleX: 0,
    transition: {
      type: "tween",
      duration: duration / 1000,
      ease: "linear",
    },
  }),
}

// ============================================================================
// ICON ANIMATIONS
// ============================================================================

/**
 * Success checkmark animation
 */
export const checkmarkDraw: Variants = {
  hidden: {
    pathLength: 0,
    opacity: 0,
  },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: {
        type: "tween",
        duration: 0.3,
        ease: "easeInOut",
      },
      opacity: {
        duration: 0.1,
      },
    },
  },
}

/**
 * Error X animation
 */
export const errorX: Variants = {
  hidden: {
    pathLength: 0,
    opacity: 0,
  },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: {
        type: "tween",
        duration: 0.25,
        ease: "easeOut",
      },
      opacity: {
        duration: 0.1,
        delay: 0.1,
      },
    },
  },
}

/**
 * Loading spinner animation
 */
export const spinner: Variants = {
  hidden: {
    rotate: 0,
  },
  visible: {
    rotate: 360,
    transition: {
      repeat: Infinity,
      repeatType: "loop" as const,
      duration: 1,
      ease: "linear",
    },
  },
}

/**
 * Icon bounce on mount
 */
export const iconBounce: Variants = {
  hidden: {
    scale: 0,
    rotate: -180,
  },
  visible: {
    scale: 1,
    rotate: 0,
    transition: {
      type: "spring",
      stiffness: 500,
      damping: 20,
    },
  },
}

/**
 * Subtle pulse for attention
 */
export const subtlePulse: Variants = {
  idle: {
    scale: 1,
  },
  pulse: {
    scale: [1, 1.05, 1],
    transition: {
      duration: 0.6,
      repeat: 1,
      ease: "easeInOut",
    },
  },
}

// ============================================================================
// STACK ANIMATION (for multiple toasts)
// ============================================================================

/**
 * Stagger children in stack
 */
export const stackChildren = {
  container: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0,
      },
    },
  },
  item: slideInRight,
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get the appropriate animation variants based on position
 */
export function getAnimationForPosition(position: string): Variants {
  const animations: Record<string, Variants> = {
    'top-right': slideInRight,
    'bottom-right': slideInRight,
    'top-left': slideInLeft,
    'bottom-left': slideInLeft,
    'top-center': slideInTop,
    'bottom-center': slideInBottom,
  }
  return animations[position] || slideInRight
}

/**
 * Get icon animation based on variant
 */
export function getIconAnimation(variant: string): Variants {
  const animations: Record<string, Variants> = {
    success: checkmarkDraw,
    error: errorX,
    loading: spinner,
  }
  return animations[variant] || iconBounce
}
