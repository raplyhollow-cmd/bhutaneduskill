/**
 * Clerk-Style Toast Design Tokens
 *
 * Design tokens matching Clerk.com's toast aesthetic
 * Based on the design-tokens.ts but specialized for toasts
 */

import { semantic, dark, zIndex } from "@/styles/design-tokens"

// ============================================================================
// COLOR TOKENS
// ============================================================================

export const toastColors = {
  // Background colors (dark, premium)
  background: {
    DEFAULT: 'rgb(27, 27, 31)',
    elevated: 'rgb(32, 32, 37)',
    success: 'rgba(34, 197, 94, 0.1)',
    error: 'rgba(239, 68, 68, 0.1)',
    warning: 'rgba(245, 158, 11, 0.1)',
    info: 'rgba(59, 130, 246, 0.1)',
  },

  // Border colors
  border: {
    DEFAULT: 'rgb(62, 62, 75)',
    subtle: 'rgb(82, 82, 95)',
    success: semantic.success.DEFAULT,
    error: semantic.error.DEFAULT,
    warning: semantic.warning.DEFAULT,
    info: semantic.info.DEFAULT,
  },

  // Text colors
  text: {
    primary: '#ffffff',
    secondary: 'rgb(163, 163, 175)',
    tertiary: 'rgb(115, 115, 128)',
    success: semantic.success.DEFAULT,
    error: semantic.error.DEFAULT,
    warning: semantic.warning.DEFAULT,
    info: semantic.info.DEFAULT,
  },

  // Icon colors
  icon: {
    success: '#31c854',
    error: '#f73d3d',
    warning: '#fd7224',
    info: '#307ff6',
    loading: '#846bff',
    default: '#90909d',
  },

  // Action button colors
  action: {
    primary: '#846bff',
    primaryHover: '#6c47ff',
    danger: '#f73d3d',
    dangerHover: '#e02e2e',
    ghost: 'transparent',
    ghostHover: 'rgba(255, 255, 255, 0.1)',
  },
} as const

// ============================================================================
// SPACING TOKENS
// ============================================================================

export const toastSpacing = {
  // Container padding
  padding: {
    DEFAULT: '16px',
    compact: '12px',
    cozy: '20px',
  },

  // Gap between elements
  gap: {
    DEFAULT: '12px',
    compact: '8px',
  },

  // Icon size
  icon: {
    DEFAULT: '20px',
    compact: '16px',
    large: '24px',
  },

  // Border radius
  radius: {
    DEFAULT: '8px',
    compact: '6px',
  },
} as const

// ============================================================================
// ANIMATION TOKENS
// ============================================================================

/**
 * Clerk-style toast animation durations
 * Fast, snappy animations like Clerk
 */
export const toastAnimation = {
  duration: {
    // Slide in from right
    enter: 200,      // 200ms
    // Slide out to right
    exit: 150,       // 150ms
    // Progress bar animation
    progress: 5000,  // Default toast duration
  },

  easing: {
    // Clerk-style cubic bezier for smooth entrance
    enter: 'cubic-bezier(0.16, 1, 0.3, 1)',
    // Quick exit
    exit: 'cubic-bezier(0.4, 0, 1, 1)',
    // Progress bar linear
    progress: 'linear',
  },
} as const

// ============================================================================
// SHADOW TOKENS
// ============================================================================

/**
 * Subtle, premium shadows for toasts
 * Based on Clerk's elevated depth
 */
export const toastShadow = {
  DEFAULT: '0 4px 12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05)',
  elevated: '0 8px 24px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(0, 0, 0, 0.08)',
  subtle: '0 2px 8px rgba(0, 0, 0, 0.1)',
} as const

// ============================================================================
// TYPOGRAPHY TOKENS
// ============================================================================

export const toastTypography = {
  fontSize: {
    title: '14px',
    description: '13px',
    action: '13px',
  },

  fontWeight: {
    title: 500,
    description: 400,
    action: 500,
  },

  lineHeight: {
    title: 1.4,
    description: 1.5,
    action: 1.4,
  },
} as const

// ============================================================================
// SIZE TOKENS
// ============================================================================

export const toastSize = {
  // Toast width
  width: {
    DEFAULT: '360px',
    compact: '320px',
    large: '420px',
  },

  // Toast height (approximate, based on content)
  minHeight: {
    DEFAULT: '44px',
    compact: '40px',
  },

  // Max width for description
  maxDescriptionWidth: '280px',
} as const

// ============================================================================
// POSITION TOKENS
// ============================================================================

export const toastPosition = {
  // Distance from viewport edges
  offset: {
    x: '24px',   // Horizontal offset
    y: '24px',   // Vertical offset
  },

  // Gap between stacked toasts
  stackGap: '12px',

  // Z-index for toasts (above everything except modals)
  zIndex: zIndex.toast,
} as const

// ============================================================================
// PROGRESS BAR TOKENS
// ============================================================================

export const toastProgress = {
  height: '2px',
  radius: '1px',
  color: {
    success: semantic.success.DEFAULT,
    error: semantic.error.DEFAULT,
    warning: semantic.warning.DEFAULT,
    info: semantic.info.DEFAULT,
    loading: semantic.accent.DEFAULT,
    default: 'rgb(132, 107, 255)',
  },
} as const

// ============================================================================
// BACKDROP BLUR
// ============================================================================

export const toastBackdrop = {
  blur: '12px',
  overlay: 'rgba(0, 0, 0, 0.4)',
} as const

// ============================================================================
// VARIANT STYLES
// ============================================================================

export const getVariantStyles = (variant: string) => {
  const variants = {
    success: {
      iconColor: toastColors.icon.success,
      borderColor: 'transparent',
      backgroundColor: toastColors.background.DEFAULT,
    },
    error: {
      iconColor: toastColors.icon.error,
      borderColor: 'transparent',
      backgroundColor: toastColors.background.DEFAULT,
    },
    warning: {
      iconColor: toastColors.icon.warning,
      borderColor: 'transparent',
      backgroundColor: toastColors.background.DEFAULT,
    },
    info: {
      iconColor: toastColors.icon.info,
      borderColor: 'transparent',
      backgroundColor: toastColors.background.DEFAULT,
    },
    loading: {
      iconColor: toastColors.icon.loading,
      borderColor: 'transparent',
      backgroundColor: toastColors.background.DEFAULT,
    },
    default: {
      iconColor: toastColors.icon.default,
      borderColor: 'transparent',
      backgroundColor: toastColors.background.DEFAULT,
    },
  }
  return variants[variant as keyof typeof variants] || variants.default
}

// ============================================================================
// POSITION STYLES
// ============================================================================

export const getPositionStyles = (position: string) => {
  const positions = {
    'top-right': {
      container: 'top-6 right-6',
      toast: '',
    },
    'top-left': {
      container: 'top-6 left-6',
      toast: '',
    },
    'bottom-right': {
      container: 'bottom-6 right-6',
      toast: '',
    },
    'bottom-left': {
      container: 'bottom-6 left-6',
      toast: '',
    },
    'top-center': {
      container: 'top-6 left-1/2 -translate-x-1/2',
      toast: '',
    },
    'bottom-center': {
      container: 'bottom-6 left-1/2 -translate-x-1/2',
      toast: '',
    },
  }
  return positions[position as keyof typeof positions] || positions['top-right']
}
