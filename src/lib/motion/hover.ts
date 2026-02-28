/**
 * Hover Effects
 *
 * Subtle, performant hover animations for interactive elements.
 * All effects are GPU-accelerated and respect reduced motion.
 *
 * @see docs/design/motion-system.md
 */

import { Transition } from "framer-motion";
import { scale, prefersReducedMotion, getDuration, easing } from "./tokens";

// ============================================================================
// TRANSITION CONFIG
// ============================================================================

/**
 * Default transition for hover effects.
 * Fast and snappy for responsive feel.
 */
export const hoverTransition: Transition = {
  duration: getDuration(150) / 1000,
  ease: easing.spring,
};

// ============================================================================
// SCALE HOVER
// ============================================================================

/**
 * Subtle scale on hover - most common hover effect.
 * Use for: buttons, cards, clickable elements.
 */
export const hoverScale = {
  rest: {
    scale: 1,
  },
  hover: {
    scale: prefersReducedMotion() ? 1 : scale.grow,
    transition: hoverTransition,
  },
};

/**
 * More noticeable scale for emphasis.
 * Use for: primary actions, featured cards.
 */
export const hoverScaleExpand = {
  rest: {
    scale: 1,
  },
  hover: {
    scale: prefersReducedMotion() ? 1 : scale.expand,
    transition: hoverTransition,
  },
};

// ============================================================================
// BRIGHTNESS HOVER
// ============================================================================

/**
 * Brighten on hover using CSS filter (GPU accelerated).
 * Use for: icons, images, cards with backgrounds.
 */
export const hoverBrighten = {
  rest: {
    filter: "brightness(1)",
  },
  hover: {
    filter: prefersReducedMotion() ? "brightness(1)" : "brightness(1.05)",
    transition: hoverTransition,
  },
};

/**
 * Slight dim on hover for inverted effect.
 * Use for: already-bright elements, reduce glare.
 */
export const hoverDim = {
  rest: {
    filter: "brightness(1)",
  },
  hover: {
    filter: prefersReducedMotion() ? "brightness(1)" : "brightness(0.95)",
    transition: hoverTransition,
  },
};

// ============================================================================
// COMBINED HOVER EFFECTS
// ============================================================================

/**
 * Scale + Brighten - classic card hover.
 * Use for: interactive cards, list items.
 */
export const hoverCard = {
  rest: {
    scale: 1,
    filter: "brightness(1)",
  },
  hover: {
    scale: prefersReducedMotion() ? 1 : scale.grow,
    filter: prefersReducedMotion() ? "brightness(1)" : "brightness(1.03)",
    transition: hoverTransition,
  },
};

/**
 * Scale + Lift effect (subtle Y translation).
 * Use for: buttons, links, navigation items.
 */
export const hoverLift = {
  rest: {
    scale: 1,
    y: 0,
  },
  hover: {
    scale: prefersReducedMotion() ? 1 : 1.02,
    y: prefersReducedMotion() ? 0 : -2,
    transition: hoverTransition,
  },
};

// ============================================================================
// BORDER GLOW HOVER
// ============================================================================

/**
 * Subtle border glow on hover.
 * Note: Requires boxShadow to be pre-set on element.
 * Use for: input fields, focused elements, buttons.
 */
export const hoverGlow = {
  rest: {
    boxShadow: "0 0 0 0px transparent",
  },
  hover: {
    boxShadow: prefersReducedMotion()
      ? "0 0 0 0px transparent"
      : "0 0 0 3px rgba(99, 102, 241, 0.2)",
    transition: hoverTransition,
  },
};

/**
 * Brand color glow - customizable via CSS variable.
 * Use for: branded elements, themed components.
 */
export const hoverBrandGlow = {
  rest: {
    boxShadow: "0 0 0 0px var(--glow-color, rgba(99, 102, 241, 0))",
  },
  hover: {
    boxShadow: prefersReducedMotion()
      ? "0 0 0 0px var(--glow-color, rgba(99, 102, 241, 0))"
      : "0 0 0 3px var(--glow-color, rgba(99, 102, 241, 0.3))",
    transition: hoverTransition,
  },
};

// ============================================================================
// ICON HOVER EFFECTS
// ============================================================================

/**
 * Icon bounces slightly on hover.
 * Use for: icon buttons, nav icons, tool icons.
 */
export const hoverIconBounce = {
  rest: {
    scale: 1,
    rotate: 0,
  },
  hover: {
    scale: prefersReducedMotion() ? 1 : 1.1,
    rotate: prefersReducedMotion() ? 0 : 5,
    transition: {
      duration: getDuration(200) / 1000,
      ease: [0.34, 1.56, 0.64, 1], // Snappy spring
    },
  },
};

/**
 * Icon wiggles on hover.
 * Use for: playful interactions, playful UI.
 */
export const hoverIconWiggle = {
  rest: {
    rotate: 0,
  },
  hover: {
    rotate: prefersReducedMotion() ? 0 : [0, -10, 10, -10, 10, 0],
    transition: {
      duration: 0.4,
      ease: [0.4, 0, 0.2, 1],
    },
  },
};

// ============================================================================
// TAP/PRESS EFFECTS
// ============================================================================

/**
 * Scale down on press/tap.
 * Use for: buttons, interactive elements.
 */
export const tapScale = {
  scale: prefersReducedMotion() ? 1 : scale.shrink,
  transition: {
    duration: 0.1,
  },
};

/**
 * Instant press feedback.
 * Use for: snappy buttons, toggle switches.
 */
export const tapScaleInstant = {
  scale: prefersReducedMotion() ? 1 : scale.base,
  transition: {
    duration: 0.05,
  },
};

// ============================================================================
// LINK UNDERLINE EFFECTS
// ============================================================================

/**
 * Animated underline from left.
 * Use for: text links, navigation links.
 */
export const hoverUnderline = {
  rest: {
    backgroundPosition: "0% 50%",
  },
  hover: {
    backgroundPosition: "100% 50%",
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1],
    },
  },
};

// ============================================================================
// FOCUS VISIBLE EFFECTS
// ============================================================================

/**
 * Focus ring for keyboard accessibility.
 * Use for: all interactive elements.
 */
export const focusRing = {
  focus: {
    boxShadow:
      "0 0 0 3px rgba(99, 102, 241, 0.4), 0 0 0 1px rgba(99, 102, 241, 0.1)",
    outline: "none",
  },
};

// ============================================================================
// WHILEHOVER PRESETS
// ============================================================================

/**
 * Direct values for use with Framer Motion's whileHover prop.
 * Simpler API for quick hover effects.
 */
export const whileHover = {
  scale: prefersReducedMotion() ? 1 : scale.grow,
  transition: hoverTransition,
};

export const whileHoverLift = {
  y: prefersReducedMotion() ? 0 : -2,
  scale: prefersReducedMotion() ? 1 : 1.02,
  transition: hoverTransition,
};

export const whileHoverBrighten = {
  filter: prefersReducedMotion() ? "brightness(1)" : "brightness(1.05)",
  transition: hoverTransition,
};

// ============================================================================
// WHILETAP PRESETS
// ============================================================================

/**
 * Direct values for use with Framer Motion's whileTap prop.
 */
export const whileTap = {
  scale: prefersReducedMotion() ? 1 : scale.base,
};

export const whileTapStrong = {
  scale: prefersReducedMotion() ? 1 : scale.shrink,
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Create custom hover effect with custom scale.
 */
export function createHoverScale(hoverScaleValue: number) {
  return {
    rest: { scale: 1 },
    hover: {
      scale: prefersReducedMotion() ? 1 : hoverScaleValue,
      transition: hoverTransition,
    },
  };
}

/**
 * Create custom glow effect with custom color.
 */
export function createHoverGlow(color: string, spread: number = 3) {
  return {
    rest: {
      boxShadow: "0 0 0 0px transparent",
    },
    hover: {
      boxShadow: prefersReducedMotion()
        ? "0 0 0 0px transparent"
        : `0 0 0 ${spread}px ${color}`,
      transition: hoverTransition,
    },
  };
}

/**
 * Combine multiple hover effects.
 */
export function combineHover(...effects: Array<{ rest: Record<string, unknown>; hover: Record<string, unknown> }>) {
  return {
    rest: effects.reduce((acc, effect) => ({ ...acc, ...effect.rest }), {}),
    hover: effects.reduce(
      (acc, effect) => ({ ...acc, ...effect.hover }),
      {} as Record<string, unknown>
    ),
    transition: hoverTransition,
  };
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type HoverEffect =
  | "scale"
  | "scaleExpand"
  | "brighten"
  | "dim"
  | "card"
  | "lift"
  | "glow"
  | "brandGlow"
  | "iconBounce"
  | "iconWiggle";
