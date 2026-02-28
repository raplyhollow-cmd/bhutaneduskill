/**
 * BHUTAN EDUSKILL DESIGN TOKENS
 *
 * A comprehensive design token system inspired by:
 * - Vercel Geist: Minimal, dense, dark-first
 * - Clerk: Compact, refined interactions
 * - Apple: Subtle depth, premium feel
 * - Linear: Smooth animations, refined colors
 *
 * DESIGN PHILOSOPHY:
 * - Dark-first optimization (subtle, not harsh)
 * - Compact but readable (12px base)
 * - Dense information layout
 * - Subtle depth through colored shadows
 * - Premium, next-gen SaaS aesthetic
 *
 * @version 1.0.0
 */

// ============================================================================
// COLOR TOKENS
// ============================================================================

/**
 * Semantic Colors
 * Contextual colors for UI states and feedback
 */
export const semantic = {
  // Primary - Brand color (Royal Blue)
  primary: {
    50: '#f0f4ff',
    100: '#e0e9ff',
    200: '#c7d5fe',
    300: '#a5b8fc',
    400: '#8294f8',
    500: '#6674f0', // Default primary
    600: '#4f5ee8',
    700: '#4347d6',
    800: '#3a3db3',
    900: '#323494',
    DEFAULT: '#6674f0',
    fg: '#ffffff', // Foreground color on primary
  },

  // Secondary - Muted accent
  secondary: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
    DEFAULT: '#64748b',
    fg: '#ffffff',
  },

  // Accent - Highlight color (Violet)
  accent: {
    50: '#f5f3ff',
    100: '#ede9fe',
    200: '#ddd6fe',
    300: '#c4b5fd',
    400: '#a78bfa',
    500: '#8b5cf6', // Default accent
    600: '#7c3aed',
    700: '#6d28d9',
    800: '#5b21b6',
    900: '#4c1d95',
    DEFAULT: '#8b5cf6',
    fg: '#ffffff',
  },

  // Success - Green tones
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
    DEFAULT: '#22c55e',
    fg: '#ffffff',
    subtle: 'rgba(34, 197, 94, 0.1)',
    subtleText: '#16a34a',
    // Gradient utilities
    gradient: 'linear-gradient(135deg, rgb(34 197 94) 0%, rgb(22 163 74) 100%)',
    primary: 'rgb(34, 197, 94)',
    dark: 'rgb(22, 163, 74)',
  },

  // Warning - Orange/amber tones
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
    DEFAULT: '#f59e0b',
    fg: '#ffffff',
    subtle: 'rgba(245, 158, 11, 0.1)',
    subtleText: '#d97706',
    // Gradient utilities
    gradient: 'linear-gradient(135deg, rgb(245 158 11) 0%, rgb(217 119 6) 100%)',
    primary: 'rgb(245, 158, 11)',
    dark: 'rgb(217, 119, 6)',
  },

  // Error - Red tones
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
    DEFAULT: '#ef4444',
    fg: '#ffffff',
    subtle: 'rgba(239, 68, 68, 0.1)',
    subtleText: '#dc2626',
    // Gradient utilities
    gradient: 'linear-gradient(135deg, rgb(239 68 68) 0%, rgb(220 38 38) 100%)',
    primary: 'rgb(239, 68, 68)',
    dark: 'rgb(220, 38, 38)',
  },

  // Info - Blue tones
  info: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
    DEFAULT: '#3b82f6',
    fg: '#ffffff',
    subtle: 'rgba(59, 130, 246, 0.1)',
    subtleText: '#2563eb',
    // Gradient utilities
    gradient: 'linear-gradient(135deg, rgb(59 130 246) 0%, rgb(37 99 235) 100%)',
    primary: 'rgb(59, 130, 246)',
    dark: 'rgb(37, 99, 235)',
  },
} as const;

/**
 * Neutral Grays
 * Refined gray scale optimized for dark mode
 * Dark-first: 50-300 for light mode elements, 400-950 for dark mode
 */
export const neutral = {
  50: '#fafafa',   // Lightest background
  100: '#f5f5f5',  // Subtle border
  200: '#e5e5e5',  // Border
  300: '#d4d4d4',  // Disabled border
  400: '#a3a3a3',  // Placeholder text
  500: '#737373',  // Secondary text
  600: '#525252',  // Muted text
  700: '#404040',  // Primary text (light)
  800: '#262626',  // Background (light)
  900: '#171717',  // Surface
  950: '#0a0a0a',  // Deepest background
} as const;

/**
 * Dark Mode Neutrals
 * Specifically tuned for dark mode to avoid harshness
 */
export const dark = {
  bg: {
    DEFAULT: '#0a0a0a',    // Deepest background
    elevated: '#111111',   // Elevated surfaces
    surface: '#171717',    // Cards, panels
    hover: '#1f1f1f',      // Hover state
    active: '#262626',     // Active state
  },
  border: {
    DEFAULT: '#262626',    // Subtle border
    strong: '#404040',     // Strong border
    focus: '#525252',      // Focus ring
  },
  text: {
    primary: '#fafafa',    // Primary text
    secondary: '#a3a3a3',  // Secondary text
    tertiary: '#737373',   // Tertiary text
    disabled: '#525252',   // Disabled text
    inverse: '#0a0a0a',    // Text on colored bg
  },
} as const;

/**
 * Portal-Specific Colors
 * Refined gradients for each portal
 */
export const portal = {
  student: {
    primary: 'rgb(249, 115, 22)',
    primaryDark: 'rgb(194, 65, 12)',
    gradient: 'linear-gradient(135deg, rgb(249 115 22) 0%, rgb(194 65 12) 100%)',
    gradientSubtle: 'linear-gradient(135deg, rgba(249, 115, 22, 0.1) 0%, rgba(194, 65, 12, 0.05) 100%)',
    shadow: '0 4px 20px rgba(249, 115, 22, 0.15)',
  },
  teacher: {
    primary: 'rgb(59, 130, 246)',
    primaryDark: 'rgb(37, 99, 235)',
    gradient: 'linear-gradient(135deg, rgb(59 130 246) 0%, rgb(37 99 235) 100%)',
    gradientSubtle: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.05) 100%)',
    shadow: '0 4px 20px rgba(59, 130, 246, 0.15)',
  },
  parent: {
    primary: 'rgb(107, 114, 128)',
    primaryDark: 'rgb(75, 85, 99)',
    gradient: 'linear-gradient(135deg, rgb(107 114 128) 0%, rgb(75 85 99) 100%)',
    gradientSubtle: 'linear-gradient(135deg, rgba(107, 114, 128, 0.1) 0%, rgba(75, 85, 99, 0.05) 100%)',
    shadow: '0 4px 20px rgba(107, 114, 128, 0.15)',
  },
  counselor: {
    primary: 'rgb(168, 85, 247)',
    primaryDark: 'rgb(147, 51, 234)',
    gradient: 'linear-gradient(135deg, rgb(168 85 247) 0%, rgb(147 51 234) 100%)',
    gradientSubtle: 'linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(147, 51, 234, 0.05) 100%)',
    shadow: '0 4px 20px rgba(168, 85, 247, 0.15)',
  },
  admin: {
    primary: 'rgb(236, 72, 153)',
    primaryDark: 'rgb(219, 39, 119)',
    gradient: 'linear-gradient(135deg, rgb(236 72 153) 0%, rgb(219 39 119) 100%)',
    gradientSubtle: 'linear-gradient(135deg, rgba(236, 72, 153, 0.1) 0%, rgba(219, 39, 119, 0.05) 100%)',
    shadow: '0 4px 20px rgba(236, 72, 153, 0.15)',
  },
  schoolAdmin: {
    primary: 'rgb(139, 92, 246)',
    primaryDark: 'rgb(124, 58, 237)',
    gradient: 'linear-gradient(135deg, rgb(139 92 246) 0%, rgb(124 58 237) 100%)',
    gradientSubtle: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(124, 58, 237, 0.05) 100%)',
    shadow: '0 4px 20px rgba(139, 92, 246, 0.15)',
  },
  ministry: {
    primary: 'rgb(20, 184, 166)',
    primaryDark: 'rgb(13, 148, 136)',
    gradient: 'linear-gradient(135deg, rgb(20 184 166) 0%, rgb(13 148 136) 100%)',
    gradientSubtle: 'linear-gradient(135deg, rgba(20, 184, 166, 0.1) 0%, rgba(13, 148, 136, 0.05) 100%)',
    shadow: '0 4px 20px rgba(20, 184, 166, 0.15)',
  },
} as const;

/**
 * Semantic Utility Gradients
 * Common gradients for UI states
 */
export const semanticGradients = {
  success: {
    gradient: 'linear-gradient(135deg, rgb(34 197 94) 0%, rgb(22 163 74) 100%)',
    primary: 'rgb(34, 197, 94)',
    dark: 'rgb(22, 163, 74)',
  },
  warning: {
    gradient: 'linear-gradient(135deg, rgb(245 158 11) 0%, rgb(217 119 6) 100%)',
    primary: 'rgb(245, 158, 11)',
    dark: 'rgb(217, 119, 6)',
  },
  error: {
    gradient: 'linear-gradient(135deg, rgb(239 68 68) 0%, rgb(220 38 38) 100%)',
    primary: 'rgb(239, 68, 68)',
    dark: 'rgb(220, 38, 38)',
  },
  info: {
    gradient: 'linear-gradient(135deg, rgb(59 130 246) 0%, rgb(37 99 235) 100%)',
    primary: 'rgb(59, 130, 246)',
    dark: 'rgb(37, 99, 235)',
  },
} as const;

/**
 * Social Colors
 * Colors for third-party integrations
 */
export const social = {
  google: '#4285f4',
  github: '#333333',
  twitter: '#000000',
  facebook: '#1877f2',
  linkedin: '#0a66c2',
  apple: '#000000',
} as const;

/**
 * Data Visualization Colors
 * High-contrast colors for charts and graphs
 */
export const chart = {
  colors: [
    '#6674f0', // Primary blue
    '#8b5cf6', // Violet
    '#22c55e', // Green
    '#f59e0b', // Orange
    '#ef4444', // Red
    '#06b6d4', // Cyan
    '#ec4899', // Pink
    '#84cc16', // Lime
    '#6366f1', // Indigo
    '#14b8a6', // Teal
  ],
  sequential: [
    '#e0e7ff', // Light
    '#a5b8fc',
    '#8294f8',
    '#6674f0',
    '#4f5ee8',
    '#4347d6', // Dark
  ],
  diverging: [
    '#ef4444', // Red (negative)
    '#f87171',
    '#fbbf24',
    '#fef3c7',
    '#f3f4f6', // Neutral
    '#dbeafe',
    '#60a5fa',
    '#3b82f6', // Blue (positive)
  ],
} as const;

// ============================================================================
// TYPOGRAPHY TOKENS
// ============================================================================

/**
 * Font Families
 * Using system fonts for performance and native feel
 */
export const fontFamily = {
  // Primary UI font - Inter-like stack
  sans: [
    '-apple-system',
    'BlinkMacSystemFont',
    '"Segoe UI"',
    'Roboto',
    '"Helvetica Neue"',
    'Arial',
    'sans-serif',
    '"Apple Color Emoji"',
    '"Segoe UI Emoji"',
    '"Segoe UI Symbol"',
  ].join(', '),

  // Monospace for code
  mono: [
    'ui-monospace',
    'SFMono-Regular',
    '"SF Mono"',
    'Menlo',
    'Monaco',
    'Consolas',
    '"Liberation Mono"',
    '"Courier New"',
    'monospace',
  ].join(', '),

  // Display font for headings
  display: [
    '-apple-system',
    'BlinkMacSystemFont',
    '"Segoe UI"',
    'sans-serif',
  ].join(', '),
} as const;

/**
 * Font Sizes
 * Compact scale starting at 12px
 */
export const fontSize = {
  // Display sizes
  'display-xs': '0.75rem',     // 12px
  'display-sm': '0.875rem',    // 14px
  'display-md': '1rem',        // 16px
  'display-lg': '1.125rem',    // 18px
  'display-xl': '1.25rem',     // 20px
  'display-2xl': '1.5rem',     // 24px
  'display-3xl': '1.875rem',   // 30px
  'display-4xl': '2.25rem',    // 36px
  'display-5xl': '3rem',       // 48px

  // Text sizes (compact)
  'text-xs': '0.75rem',        // 12px
  'text-sm': '0.875rem',       // 14px
  'text-base': '1rem',         // 16px
  'text-lg': '1.125rem',       // 18px
  'text-xl': '1.25rem',        // 20px
  'text-2xl': '1.5rem',        // 24px
  'text-3xl': '1.875rem',      // 30px
  'text-4xl': '2.25rem',       // 36px

  // Alias for convenience
  xs: '0.75rem',
  sm: '0.875rem',
  base: '1rem',
  lg: '1.125rem',
  xl: '1.25rem',
  '2xl': '1.5rem',
  '3xl': '1.875rem',
  '4xl': '2.25rem',
  '5xl': '3rem',
  '6xl': '3.75rem',            // 60px
  '7xl': '4.5rem',             // 72px
} as const;

/**
 * Font Weights
 * Limited scale for consistency
 */
export const fontWeight = {
  thin: 100,
  extralight: 200,
  light: 300,
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800,
  black: 900,
} as const;

/**
 * Line Heights
 * Tight but readable scale
 */
export const lineHeight = {
  none: 1,
  tight: 1.25,
  snug: 1.375,
  normal: 1.5,
  relaxed: 1.625,
  loose: 2,

  // Pixel values for precision
  '3': '0.75rem',   // 12px
  '4': '1rem',      // 16px
  '5': '1.25rem',   // 20px
  '6': '1.5rem',    // 24px
  '7': '1.75rem',   // 28px
  '8': '2rem',      // 32px
  '9': '2.25rem',   // 36px
  '10': '2.5rem',   // 40px
} as const;

/**
 * Letter Spacing
 * Subtle adjustments for different contexts
 */
export const letterSpacing = {
  tighter: '-0.05em',
  tight: '-0.025em',
  normal: '0',
  wide: '0.025em',
  wider: '0.05em',
  widest: '0.1em',

  // Specific use cases
  display: '-0.02em',  // Slightly tighter for headings
  caps: '0.05em',      // Wider for uppercase
  mono: '0.05em',      // Wider for code
} as const;

// ============================================================================
// SPACING TOKENS
// ============================================================================

/**
 * Base Spacing Unit
 * 4px grid system for consistency
 */
export const spacingBase = 4; // pixels

/**
 * Spacing Scale
 * Multiples of base unit (4px)
 */
export const spacing = {
  0: '0',
  px: '1px',
  0.5: '0.125rem',   // 2px
  1: '0.25rem',      // 4px - 1x base
  1.5: '0.375rem',   // 6px
  2: '0.5rem',       // 8px - 2x base
  2.5: '0.625rem',   // 10px
  3: '0.75rem',      // 12px - 3x base
  3.5: '0.875rem',   // 14px
  4: '1rem',         // 16px - 4x base
  5: '1.25rem',      // 20px - 5x base
  6: '1.5rem',       // 24px - 6x base
  7: '1.75rem',      // 28px
  8: '2rem',         // 32px - 8x base
  9: '2.25rem',      // 36px
  10: '2.5rem',      // 40px
  11: '2.75rem',     // 44px
  12: '3rem',        // 48px
  14: '3.5rem',      // 56px
  16: '4rem',        // 64px
  20: '5rem',        // 80px
  24: '6rem',        // 96px
  28: '7rem',        // 112px
  32: '8rem',        // 128px
  36: '9rem',        // 144px
  40: '10rem',       // 160px
  44: '11rem',       // 176px
  48: '12rem',       // 192px
  52: '13rem',       // 208px
  56: '14rem',       // 224px
  60: '15rem',       // 240px
  64: '16rem',       // 256px
  72: '18rem',       // 288px
  80: '20rem',       // 320px
  96: '24rem',       // 384px
} as const;

/**
 * Component Padding
 * Compact but comfortable spacing for components
 */
export const padding = {
  // Compact components
  xs: '0.25rem',     // 4px - Tags, badges
  sm: '0.5rem',      // 8px - Small buttons
  md: '0.75rem',     // 12px - Default inputs
  lg: '1rem',        // 16px - Card padding
  xl: '1.25rem',     // 20px - Large cards
  '2xl': '1.5rem',   // 24px - Modal padding

  // Specific components
  button: '0.5rem 1rem',      // 8px 16px
  buttonSm: '0.375rem 0.75rem', // 6px 12px
  buttonLg: '0.625rem 1.25rem', // 10px 20px
  input: '0.625rem 0.75rem',  // 10px 12px
  card: '1rem',               // 16px
  modal: '1.5rem',            // 24px
  dropdown: '0.5rem',         // 8px
} as const;

/**
 * Gap Spacing
 * Spacing between elements
 */
export const gap = {
  xs: '0.25rem',     // 4px - Tight groups
  sm: '0.5rem',      // 8px - Related items
  md: '0.75rem',     // 12px - Form fields
  lg: '1rem',        // 16px - Sections
  xl: '1.5rem',      // 24px - Major sections
  '2xl': '2rem',     // 32px - Page sections
  '3xl': '3rem',     // 48px - Hero spacing
  '4xl': '4rem',     // 64px - Major breaks
} as const;

// ============================================================================
// RADIUS TOKENS
// ============================================================================

/**
 * Border Radius
 * Subtle, refined corners (not overly rounded)
 */
export const radius = {
  none: '0',
  xs: '0.125rem',    // 2px - Minimal
  sm: '0.25rem',     // 4px - Subtle
  md: '0.375rem',    // 6px - Default
  lg: '0.5rem',      // 8px - Cards
  xl: '0.75rem',     // 12px - Modals
  '2xl': '1rem',     // 16px - Large cards
  '3xl': '1.5rem',   // 24px - Hero elements (max)
  full: '9999px',    // Pill shape

  // Component-specific
  button: '0.375rem',      // 6px
  input: '0.375rem',       // 6px
  card: '0.5rem',          // 8px
  modal: '0.75rem',        // 12px
  popover: '0.5rem',       // 8px
  tooltip: '0.25rem',      // 4px
  badge: '9999px',         // Pill
  avatar: '9999px',        // Circle
} as const;

// ============================================================================
// SHADOW TOKENS
// ============================================================================

/**
 * Box Shadows
 * Subtle elevation with colored shadows for depth
 */
export const shadow = {
  none: 'none',

  // Subtle elevation (for cards, panels)
  xs: '0 1px 2px rgba(0, 0, 0, 0.05)',

  // Default elevation
  sm: '0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.1)',

  // Medium elevation (dropdowns, popovers)
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',

  // Large elevation (modals, panels)
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.025)',

  // Extra large (special modals)
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.01)',

  // 2xl (hero elements)
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.15)',

  // Inner shadow (inset elements)
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.03)',

  // Colored shadows for portal colors
  primary: '0 4px 14px rgba(102, 116, 240, 0.25)',
  success: '0 4px 14px rgba(34, 197, 94, 0.25)',
  warning: '0 4px 14px rgba(245, 158, 11, 0.25)',
  error: '0 4px 14px rgba(239, 68, 68, 0.25)',

  // Glow effects
  glowSm: '0 0 20px rgba(102, 116, 240, 0.15)',
  glowMd: '0 0 40px rgba(102, 116, 240, 0.2)',
  glowLg: '0 0 60px rgba(102, 116, 240, 0.25)',
} as const;

/**
 * Dark Mode Shadows
 * Lighter shadows for dark backgrounds
 */
export const shadowDark = {
  none: 'none',
  xs: '0 1px 2px rgba(0, 0, 0, 0.3)',
  sm: '0 1px 3px rgba(0, 0, 0, 0.2), 0 1px 2px rgba(0, 0, 0, 0.3)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.2), 0 2px 4px -1px rgba(0, 0, 0, 0.15)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.2), 0 4px 6px -2px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.05)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.2)',
} as const;

// ============================================================================
// ANIMATION TOKENS
// ============================================================================

/**
 * Duration
 * Fast, snappy animations
 */
export const duration = {
  instant: '50ms',
  fast: '100ms',
  normal: '150ms',
  slow: '200ms',
  slower: '300ms',
  slowest: '500ms',
} as const;

/**
 * Easing Curves
 * Custom easing for natural feel
 */
export const easing = {
  // Linear
  linear: 'linear',

  // Standard ease
  ease: 'ease',
  easeIn: 'ease-in',
  easeOut: 'ease-out',
  easeInOut: 'ease-in-out',

  // Custom cubic-bezier curves
  // Inspired by iOS and Material Design
  brisk: 'cubic-bezier(0.2, 0, 0, 1)',           // Snappy
  smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',        // Standard
  bouncy: 'cubic-bezier(0.34, 1.56, 0.64, 1)',    // Bounce
  gentle: 'cubic-bezier(0.25, 0.1, 0.25, 1)',     // Subtle

  // Apple-style easing
  apple: 'cubic-bezier(0.25, 0.1, 0.25, 1)',

  // Material Design easing
  decelerate: 'cubic-bezier(0.0, 0.0, 0.2, 1)',   // Entering
  accelerate: 'cubic-bezier(0.4, 0.0, 1, 1)',     // Leaving

  // Custom smooth easing
  easeOutQuart: 'cubic-bezier(0.25, 1, 0.5, 1)',
  easeInOutQuart: 'cubic-bezier(0.76, 0, 0.24, 1)',
} as const;

/**
 * Spring Physics
 * For spring-based animations
 */
export const spring = {
  // Gentle spring (subtle animations)
  gentle: {
    stiffness: 200,
    damping: 20,
    mass: 1,
  },

  // Default spring (most interactions)
  default: {
    stiffness: 300,
    damping: 25,
    mass: 0.8,
  },

  // Snappy spring (button presses, toggles)
  snappy: {
    stiffness: 400,
    damping: 20,
    mass: 0.5,
  },

  // Bouncy spring (attention-grabbing)
  bouncy: {
    stiffness: 350,
    damping: 15,
    mass: 1,
  },
} as const;

/**
 * Transition Presets
 * Pre-combined duration and easing
 */
export const transition = {
  // Fast transitions (hover, focus)
  fast: '100ms cubic-bezier(0.2, 0, 0, 1)',

  // Default transitions
  default: '150ms cubic-bezier(0.4, 0, 0.2, 1)',

  // Slow transitions (modals, page transitions)
  slow: '200ms cubic-bezier(0.4, 0, 0.2, 1)',

  // Slower transitions (complex animations)
  slower: '300ms cubic-bezier(0.4, 0, 0.2, 1)',

  // Color transitions (slightly longer)
  colors: '150ms cubic-bezier(0.4, 0, 0.2, 1)',

  // Transform transitions (faster)
  transform: '100ms cubic-bezier(0.2, 0, 0, 1)',

  // Modal transitions
  modal: '200ms cubic-bezier(0.25, 0.1, 0.25, 1)',
} as const;

// ============================================================================
// Z-INDEX TOKENS
// ============================================================================

/**
 * Z-Index Scale
 * Organized stacking context
 */
export const zIndex = {
  // Base level
  base: 0,
  above: 1,

  // Sticky elements
  sticky: 10,

  // Dropdowns and popovers
  dropdown: 100,
  popover: 100,

  // Fixed elements
  header: 200,
  sidebar: 200,
  fixed: 300,

  // Overlays
  overlay: 400,
  backdrop: 400,

  // Modals
  modal: 500,
  modalBackdrop: 499,

  // Tooltips and toasts
  tooltip: 600,
  toast: 700,

  // Maximum
  max: 9999,
} as const;

// ============================================================================
// LAYOUT TOKENS
// ============================================================================

/**
 * Container Widths
 * Max widths for content containers
 */
export const container = {
  xs: '20rem',     // 320px
  sm: '24rem',     // 384px
  md: '28rem',     // 448px
  lg: '32rem',     // 512px
  xl: '36rem',     // 576px
  '2xl': '42rem',  // 672px
  '3xl': '48rem',  // 768px
  '4xl': '56rem',  // 896px
  '5xl': '64rem',  // 1024px
  '6xl': '72rem',  // 1152px
  '7xl': '80rem',  // 1280px
  full: '100%',
} as const;

/**
 * Breakpoints
 * Responsive breakpoints
 */
export const breakpoint = {
  xs: '320px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

/**
 * Sidebar Widths
 */
export const sidebar = {
  collapsed: '4rem',   // 64px
  default: '16rem',    // 256px
  expanded: '20rem',   // 320px
} as const;

// ============================================================================
// MOBILE TOKENS
// ============================================================================

/**
 * Mobile-Specific Design Tokens
 *
 * These tokens are specifically designed for mobile devices:
 * - Touch target sizes (iOS HIG standard is 44px minimum)
 * - Safe area insets for notched devices
 * - Mobile-specific breakpoints
 * - Bottom navigation sizing
 */
export const mobile = {
  /**
   * Touch Target Sizes
   * Minimum sizes for touchable elements to ensure usability
   */
  touchTarget: {
    minimum: '44px',     // iOS HIG minimum
    comfortable: '48px', // More comfortable for most users
    large: '52px',       // Easy to tap, recommended for primary actions
    iconButton: '44px',  // Circular icon buttons
    fab: '56px',         // Floating action buttons
    fabLarge: '64px',    // Large FAB for tablets
  },

  /**
   * Safe Area Insets
   * CSS env() variables for devices with notches/home indicators
   */
  safeArea: {
    top: 'env(safe-area-inset-top)',
    bottom: 'env(safe-area-inset-bottom)',
    left: 'env(safe-area-inset-left)',
    right: 'env(safe-area-inset-right)',
  },

  /**
   * Mobile Navigation
   * Bottom navigation bar sizing
   */
  navigation: {
    height: '56px',        // Material Design standard
    compactHeight: '48px', // Compact variant
    iconSize: '24px',      // Navigation icons
    labelSize: '11px',     // Navigation labels
    activeIndicatorWidth: '32px',
    activeIndicatorHeight: '32px',
  },

  /**
   * Mobile Typography
   * Font sizes optimized for mobile readability
   */
  typography: {
    xs: '0.75rem',   // 12px - Captions, labels
    sm: '0.875rem',  // 14px - Secondary text
    base: '1rem',    // 16px - Body text (WCAG minimum readable size)
    lg: '1.125rem',  // 18px - Emphasized text
    xl: '1.25rem',   // 20px - Subheadings
    '2xl': '1.5rem', // 24px - Headings
    '3xl': '1.875rem', // 30px - Page titles
  },

  /**
   * Mobile Spacing
   * Optimized padding and gaps for small screens
   */
  spacing: {
    xs: '0.5rem',   // 8px
    sm: '0.75rem',  // 12px
    md: '1rem',     // 16px
    lg: '1.25rem',  // 20px
    xl: '1.5rem',   // 24px
    '2xl': '2rem',  // 32px
  },

  /**
   * Mobile Card Sizes
   */
  card: {
    padding: '1rem',        // 16px padding
    compactPadding: '0.75rem', // 12px padding
    gap: '0.75rem',         // 12px gap between elements
    borderRadius: '0.75rem', // 12px radius
  },

  /**
   * Mobile Button Sizes
   */
  button: {
    sm: {
      height: '40px',    // Minimum touch target
      padding: '0 16px',
      fontSize: '0.875rem', // 14px
    },
    md: {
      height: '48px',    // Comfortable touch target
      padding: '0 20px',
      fontSize: '1rem',    // 16px
    },
    lg: {
      height: '56px',    // Large touch target
      padding: '0 24px',
      fontSize: '1.125rem', // 18px
    },
  },

  /**
   * Mobile Animation Durations
   * Faster animations for perceived performance
   */
  animation: {
    fast: '150ms',
    normal: '200ms',
    slow: '300ms',
  },

  /**
   * Mobile Z-Index Layers
   */
  zIndex: {
    bottomNav: 40,
    sidebar: 50,
    overlay: 40,
    modal: 100,
    toast: 200,
  },
} as const;

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type SemanticColor = keyof typeof semantic;
export type NeutralColor = keyof typeof neutral;
export type PortalType = keyof typeof portal;
export type FontSize = keyof typeof fontSize;
export type FontWeight = keyof typeof fontWeight;
export type Spacing = keyof typeof spacing;
export type Radius = keyof typeof radius;
export type Duration = keyof typeof duration;
export type Easing = keyof typeof easing;
export type ZIndex = keyof typeof zIndex;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get a color value from the semantic palette
 */
export function getColor(color: SemanticColor, shade: number = 500): string {
  const palette = semantic[color] as Record<number | string, string>;
  const result = palette[shade] || palette.DEFAULT || palette;
  return typeof result === 'string' ? result : palette.DEFAULT;
}

/**
 * Get a portal color
 */
export function getPortalColor(portal: PortalType): string {
  return portal[portal]?.primary || '#6674f0';
}

/**
 * Get a portal gradient
 */
export function getPortalGradient(portal: PortalType): string {
  return portal[portal]?.gradient || semantic.primary.DEFAULT;
}

/**
 * Create a transition string
 */
export function createTransition(
  properties: string[],
  duration: Duration = 'normal',
  easing: Easing = 'smooth'
): string {
  const dur = duration as string;
  const eas = easing as string;
  return properties.map(p => `${p} ${dur} ${eas}`).join(', ');
}

/**
 * Get responsive value based on breakpoint
 */
export function responsive(base: string, md: string, lg: string): string {
  return `${base}; @media (min-width: 768px) { ${md}; } @media (min-width: 1024px) { ${lg}; }`;
}

// ============================================================================
// CSS VARIABLES OUTPUT
// ============================================================================

/**
 * CSS Variables for use in stylesheets
 * Copy this to your globals.css or equivalent
 */
export const cssVars = `
:root {
  /* Colors - Semantic */
  --color-primary: ${semantic.primary.DEFAULT};
  --color-primary-foreground: ${semantic.primary.fg};
  --color-secondary: ${semantic.secondary.DEFAULT};
  --color-success: ${semantic.success.DEFAULT};
  --color-warning: ${semantic.warning.DEFAULT};
  --color-error: ${semantic.error.DEFAULT};
  --color-info: ${semantic.info.DEFAULT};

  /* Colors - Neutral */
  --color-bg: ${neutral[50]};
  --color-bg-elevated: ${neutral[100]};
  --color-border: ${neutral[200]};
  --color-text: ${neutral[900]};
  --color-text-secondary: ${neutral[500]};

  /* Spacing */
  --spacing-xs: ${spacing[1]};
  --spacing-sm: ${spacing[2]};
  --spacing-md: ${spacing[4]};
  --spacing-lg: ${spacing[6]};
  --spacing-xl: ${spacing[8]};

  /* Radius */
  --radius-sm: ${radius.sm};
  --radius-md: ${radius.md};
  --radius-lg: ${radius.lg};
  --radius-xl: ${radius.xl};

  /* Shadow */
  --shadow-sm: ${shadow.sm};
  --shadow-md: ${shadow.md};
  --shadow-lg: ${shadow.lg};

  /* Transition */
  --transition-fast: ${transition.fast};
  --transition-default: ${transition.default};
  --transition-slow: ${transition.slow};
}

.dark {
  --color-bg: ${dark.bg.DEFAULT};
  --color-bg-elevated: ${dark.bg.elevated};
  --color-border: ${dark.border.DEFAULT};
  --color-text: ${dark.text.primary};
  --color-text-secondary: ${dark.text.secondary};
}
`;

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

const designTokens = {
  color: {
    semantic,
    neutral,
    dark,
    portal,
    social,
    chart,
  },
  // Re-export portal at top level for easier access
  portal,
  semantic,
  semanticGradients,
  neutral,
  dark,
  typography: {
    fontFamily,
    fontSize,
    fontWeight,
    lineHeight,
    letterSpacing,
  },
  spacing: {
    base: spacingBase,
    scale: spacing,
    padding,
    gap,
  },
  radius,
  shadow: {
    light: shadow,
    dark: shadowDark,
  },
  padding,
  animation: {
    duration,
    easing,
    spring,
    transition,
  },
  layout: {
    container,
    breakpoint,
    sidebar,
  },
  zIndex,
  utils: {
    getColor,
    getPortalColor,
    getPortalGradient,
    createTransition,
    responsive,
  },
  cssVars,
} as const;

export default designTokens;
