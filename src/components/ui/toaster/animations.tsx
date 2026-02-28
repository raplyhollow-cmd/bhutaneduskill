/**
 * Clerk-Style Toast Animations
 *
 * Framer Motion animation variants for toast notifications
 * Inspired by Clerk.com's smooth, snappy animations
 */

import { Variants, Transition, Easing } from "framer-motion"
import { toastAnimation } from "./tokens"

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface CustomVariants {
  [key: string]: {
    x?: number | [number, number, number];
    y?: number | [number, number, number];
    opacity?: number | [number, number, number];
    scale?: number | [number, number, number];
    rotate?: number | [number, number, number];
    pathLength?: number | [number, number, number];
    scaleX?: number | [number, number, number];
    transition?: Transition;
  } | ((props: { duration: number }) => {
    scaleX: number;
    transition: Transition;
  });
}

type ToastVariants = Variants & CustomVariants;

// ============================================================================
// SLIDE-IN ANIMATIONS (from right, like Clerk)
// ============================================================================

/**
 * Toast slides in from right with fade
 * Use for: top-right positioned toasts (Clerk's default)
 */
export const slideInRight: ToastVariants = {
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
      ease: toastAnimation.easing.enter as Easing,
    },
  },
  exit: {
    x: 400,
    opacity: 0,
    scale: 0.95,
    transition: {
      type: "tween",
      duration: toastAnimation.duration.exit / 1000,
      ease: toastAnimation.easing.exit as Easing,
    },
  },
}

/**
 * Toast slides in from left with fade
 * Use for: top-left positioned toasts
 */
export const slideInLeft: ToastVariants = {
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
      ease: toastAnimation.easing.enter as Easing,
    },
  },
  exit: {
    x: -400,
    opacity: 0,
    scale: 0.95,
    transition: {
      type: "tween",
      duration: toastAnimation.duration.exit / 1000,
      ease: toastAnimation.easing.exit as Easing,
    },
  },
}

/**
 * Toast slides in from top with fade
 * Use for: top-center positioned toasts
 */
export const slideInTop: ToastVariants = {
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
      ease: toastAnimation.easing.enter as Easing,
    },
  },
  exit: {
    y: -50,
    opacity: 0,
    scale: 0.95,
    transition: {
      type: "tween",
      duration: toastAnimation.duration.exit / 1000,
      ease: toastAnimation.easing.exit as Easing,
    },
  },
}

/**
 * Toast slides in from bottom with fade
 * Use for: bottom positioned toasts
 */
export const slideInBottom: ToastVariants = {
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
      ease: toastAnimation.easing.enter as Easing,
    },
  },
  exit: {
    y: 50,
    opacity: 0,
    scale: 0.95,
    transition: {
      type: "tween",
      duration: toastAnimation.duration.exit / 1000,
      ease: toastAnimation.easing.exit as Easing,
    },
  },
}

/**
 * Scale in animation (for center-positioned toasts)
 */
export const scaleIn: ToastVariants = {
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
export const progressShrink: ToastVariants = {
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
export const checkmarkDraw: ToastVariants = {
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
export const errorX: ToastVariants = {
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
export const spinner: ToastVariants = {
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
export const iconBounce: ToastVariants = {
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
export const subtlePulse: ToastVariants = {
  idle: {
    scale: 1,
  },
  pulse: {
    scale: [1, 1.05, 1] as any,
    transition: {
      duration: 0.6,
      repeat: 1,
      repeatType: "loop" as const,
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
export function getAnimationForPosition(position: string): ToastVariants {
  const animations: Record<string, ToastVariants> = {
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
export function getIconAnimation(variant: string): ToastVariants {
  const animations: Record<string, ToastVariants> = {
    success: checkmarkDraw,
    error: errorX,
    loading: spinner,
  }
  return animations[variant] || iconBounce
}
