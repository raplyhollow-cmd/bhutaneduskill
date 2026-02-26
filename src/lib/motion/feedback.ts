/**
 * Feedback Animations
 *
 * Success states, checkmarks, confetti, and confirmation animations.
 * Subtle celebrations that don't overwhelm the interface.
 *
 * @see docs/design/motion-system.md
 */

import { Variants, Transition } from "framer-motion";
import { prefersReducedMotion, getDuration, easing } from "./tokens";

// ============================================================================
// CHECKMARK ANIMATION
// ============================================================================

/**
 * Checkmark path drawing animation.
 * Use for: success icons, completed tasks, confirmed actions.
 */
export const checkmarkVariants: Variants = {
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
        delay: getDuration(50) / 1000,
      },
    },
  },
};

/**
 * Circle background for checkmark.
 * Fills in after the checkmark draws.
 */
export const checkmarkCircleVariants: Variants = {
  hidden: {
    scale: 0,
    opacity: 0,
  },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      delay: getDuration(200) / 1000,
      type: "spring",
      stiffness: 400,
      damping: 20,
    },
  },
};

// ============================================================================
// SUCCESS STAMP ANIMATION
// ============================================================================

/**
 * Stamp/badge appearing with impact.
 * Use for: "Success!" stamps, approval badges, completion markers.
 */
export const stampVariants: Variants = {
  hidden: {
    scale: 3,
    opacity: 0,
    rotate: -15,
  },
  visible: {
    scale: 1,
    opacity: 1,
    rotate: -15,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 15,
    },
  },
};

// ============================================================================
// PROGRESS FILL ANIMATION
// ============================================================================

/**
 * Smooth progress bar fill.
 * Use for: loading bars, completion indicators, step progress.
 */
export const progressFillVariants: Variants = {
  hidden: {
    scaleX: 0,
  },
  visible: (progress: number) => ({
    scaleX: progress,
    transition: {
      duration: getDuration(600) / 1000,
      ease: [0.4, 0, 0.2, 1],
    },
  }),
};

/**
 * Progress circle (circular progress).
 */
export const progressCircleVariants: Variants = {
  hidden: {
    pathLength: 0,
    rotate: -90,
  },
  visible: (progress: number) => ({
    pathLength: progress,
    rotate: -90,
    transition: {
      pathLength: {
        duration: getDuration(600) / 1000,
        ease: [0.4, 0, 0.2, 1],
      },
    },
  }),
};

// ============================================================================
// STEP PROGRESS ANIMATION
// ============================================================================

/**
 * Individual step in a progress stepper.
 */
export const stepVariants: Variants = {
  inactive: {
    scale: 1,
    backgroundColor: "var(--step-inactive, #e5e7eb)",
    borderColor: "var(--step-inactive-border, #d1d5db)",
  },
  active: {
    scale: prefersReducedMotion() ? 1 : 1.1,
    backgroundColor: "var(--step-active, #6366f1)",
    borderColor: "var(--step-active-border, #6366f1)",
    transition: {
      duration: getDuration(200) / 1000,
      ease: easing.spring,
    },
  },
  completed: {
    scale: 1,
    backgroundColor: "var(--step-completed, #10b981)",
    borderColor: "var(--step-completed-border, #10b981)",
    transition: {
      duration: getDuration(200) / 1000,
    },
  },
};

// ============================================================================
// BUTTON PRESS FEEDBACK
// ============================================================================

/**
 * Button press animation - subtle scale down.
 */
export const buttonPressVariants: Variants = {
  idle: {
    scale: 1,
  },
  hover: {
    scale: prefersReducedMotion() ? 1 : 1.02,
    transition: {
      duration: 0.15,
      ease: easing.spring,
    },
  },
  tap: {
    scale: prefersReducedMotion() ? 1 : 0.98,
    transition: {
      duration: 0.1,
    },
  },
};

// ============================================================================
// SUCCESS ICON VARIANTS
// ============================================================================

/**
 * Generic success icon entrance.
 */
export const successIconVariants: Variants = {
  hidden: {
    scale: 0,
    opacity: 0,
  },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 500,
      damping: 20,
    },
  },
};

// ============================================================================
// CONFETTI ANIMATIONS (Subtle)
// ============================================================================

/**
 * Single confetti particle animation.
 * Spawn multiple instances with different delays.
 */
export const confettiParticle = {
  initial: {
    y: 0,
    x: 0,
    scale: 0,
    opacity: 1,
  },
  animate: (delay: number) => ({
    y: prefersReducedMotion() ? 0 : [0, -100, -50],
    x: prefersReducedMotion() ? 0 : (Math.random() - 0.5) * 100,
    scale: [0, 1, 0.5],
    opacity: [1, 1, 0],
    rotate: prefersReducedMotion() ? 0 : [0, 360, 720],
    transition: {
      duration: 1.5,
      delay: delay / 1000,
      ease: [0.25, 0.1, 0.25, 1],
    },
  }),
};

/**
 * Emoji celebration - single emoji floats up.
 */
export const emojiCelebration = {
  initial: {
    y: 0,
    x: 0,
    scale: 0,
    opacity: 1,
  },
  animate: (delay: number, xOffset: number) => ({
    y: prefersReducedMotion() ? 0 : [0, -80],
    x: prefersReducedMotion() ? 0 : [0, xOffset],
    scale: [0, 1.2, 1],
    opacity: [1, 1, 0],
    rotate: prefersReducedMotion() ? 0 : [0, 20, -20, 0],
    transition: {
      duration: 1.2,
      delay: delay / 1000,
      ease: [0.25, 0.1, 0.25, 1],
    },
  }),
};

// ============================================================================
// TOAST NOTIFICATION VARIANTS
// ============================================================================

/**
 * Toast slide in from top.
 */
export const toastSlideIn: Variants = {
  hidden: {
    y: -100,
    x: "-50%",
    opacity: 0,
  },
  visible: {
    y: 0,
    x: "-50%",
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 500,
      damping: 35,
    },
  },
  exit: {
    y: -50,
    x: "-50%",
    opacity: 0,
    transition: {
      duration: 0.2,
    },
  },
};

/**
 * Toast slide in from bottom (more common).
 */
export const toastSlideUp: Variants = {
  hidden: {
    y: 100,
    opacity: 0,
  },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 30,
    },
  },
  exit: {
    y: 50,
    opacity: 0,
    transition: {
      duration: 0.15,
    },
  },
};

// ============================================================================
// SHAKE ERROR FEEDBACK
// ============================================================================

/**
 * Error shake for form validation.
 */
export const errorShake: Variants = {
  idle: { x: 0 },
  error: {
    x: [0, -6, 6, -4, 4, -2, 2, 0],
    transition: {
      duration: 0.4,
      ease: easing.easeOut,
    },
  },
};

// ============================================================================
// PULSE FOR ATTENTION
// ============================================================================

/**
 * Subtle pulse to draw attention.
 */
export const attentionPulse: Variants = {
  idle: {
    scale: 1,
    boxShadow: "0 0 0 0 rgba(99, 102, 241, 0)",
  },
  pulse: {
    scale: [1, 1.02, 1],
    boxShadow: [
      "0 0 0 0 rgba(99, 102, 241, 0.4)",
      "0 0 0 8px rgba(99, 102, 241, 0)",
    ],
    transition: {
      duration: 1.5,
      repeat: prefersReducedMotion() ? 0 : Infinity,
      repeatType: "loop" as const,
    },
  },
};

// ============================================================================
// RATING STAR ANIMATIONS
// ============================================================================

/**
 * Star fill animation for ratings.
 */
export const starFillVariants: Variants = {
  empty: {
    scale: 1,
    fill: "transparent",
  },
  filling: {
    scale: 1.2,
    fill: "currentColor",
    transition: {
      duration: 0.2,
      ease: [0.34, 1.56, 0.64, 1],
    },
  },
  filled: {
    scale: 1,
    fill: "currentColor",
    transition: {
      duration: 0.1,
    },
  },
  hover: {
    scale: 1.15,
    transition: {
      duration: 0.1,
    },
  },
};

// ============================================================================
// LIKE/HEART ANIMATION
// ============================================================================

/**
 * Heart pop animation for likes/favorites.
 */
export const heartPopVariants: Variants = {
  unliked: {
    scale: 1,
  },
  liking: {
    scale: [1, 1.3, 0.9, 1.15, 1],
    transition: {
      duration: 0.4,
      ease: [0.68, -0.6, 0.32, 1.6], // Bouncy
    },
  },
  liked: {
    scale: 1,
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate confetti data for animation.
 * Returns array of random colors and delays.
 */
export function generateConfetti(count: number = 20) {
  const colors = [
    "#6366f1", // Indigo
    "#8b5cf6", // Violet
    "#ec4899", // Pink
    "#10b981", // Emerald
    "#f59e0b", // Amber
  ];

  return Array.from({ length: count }, (_, i) => ({
    id: i,
    color: colors[Math.floor(Math.random() * colors.length)],
    delay: i * 30,
    x: (Math.random() - 0.5) * 100,
    rotation: Math.random() * 360,
  }));
}

/**
 * Generate emoji celebration data.
 */
export function generateEmojiCelebration(emojis: string[] = ["\u{1F389}", "\u{2728}", "\u{1F386}", "\u{1F382}"]) {
  return Array.from({ length: 8 }, (_, i) => ({
    id: i,
    emoji: emojis[Math.floor(Math.random() * emojis.length)],
    delay: i * 50,
    xOffset: (Math.random() - 0.5) * 60,
  }));
}

/**
 * Success state variants for multi-step forms.
 */
export function createSuccessStepVariants(totalSteps: number): Variants {
  return {
    hidden: {
      opacity: 0,
      scale: 0.8,
    },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        delay: 0.2,
        type: "spring",
        stiffness: 400,
        damping: 20,
      },
    },
  };
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type FeedbackVariant =
  | "checkmark"
  | "stamp"
  | "progress"
  | "step"
  | "button"
  | "successIcon"
  | "confetti"
  | "toast"
  | "errorShake"
  | "attentionPulse"
  | "star"
  | "heart";
