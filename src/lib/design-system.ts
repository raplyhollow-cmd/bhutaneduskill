/**
 * CERAMIC DESIGN SYSTEM
 *
 * A comprehensive design system based on Clerk's ceramic design language.
 * This provides type-safe access to all design tokens, colors, and utilities.
 *
 * @see docs/design/CLERK_DESIGN_SYSTEM.md
 */

// ============================================================================
// COLOR PALETTE
// ============================================================================

/**
 * Complete ceramic gray scale
 */
export const ceramicGray = {
  50: '#fafafb',
  100: '#f6f6f7',
  200: '#ececee',
  300: '#dbdbe0',
  400: '#c7c7cf',
  500: '#adadb7',
  600: '#90909d',
  700: '#767684',
  800: '#5f5f6f',
  900: '#4c4c5c',
  1000: '#3d3d4a',
  1100: '#33333e',
  1200: '#2b2b34',
  1300: '#232328',
  1400: '#1b1b1f',
  1500: '#111113',
} as const;

/**
 * Brand color (purple)
 */
export const ceramicPurple = {
  50: '#f5f3ff',
  100: '#e3e0ff',
  200: '#ccc8ff',
  300: '#bab0ff',
  400: '#a698ff',
  500: '#9280ff',
  600: '#846bff', // Brand - Light
  700: '#6c47ff', // Brand - Dark
  800: '#5f15fe',
  900: '#4d06d1',
  1000: '#3707a6',
  1100: '#27057c',
  1200: '#1c045f',
  1300: '#16034b',
} as const;

/**
 * Semantic colors
 */
export const ceramicGreen = {
  50: '#effdf1',
  100: '#aff9bf',
  200: '#65f088',
  300: '#49dc6e',
  400: '#31c854',
  500: '#1eb43c',
  600: '#199d34',
  700: '#15892b',
  800: '#107524',
  900: '#09661c',
} as const;

export const ceramicRed = {
  50: '#fef8f8',
  100: '#fedddd',
  200: '#fec4c4',
  300: '#fca9a9',
  400: '#f98a8a',
  500: '#f86969',
  600: '#f73d3d',
  700: '#e02e2e',
  800: '#c22a2a',
  900: '#aa1b1b',
} as const;

export const ceramicOrange = {
  50: '#fff8f2',
  100: '#feead5',
  200: '#fecc9f',
  300: '#feb166',
  400: '#fd9357',
  500: '#fd7224',
  600: '#e06213',
  700: '#c3540f',
  800: '#a8470c',
  900: '#9d3405',
} as const;

export const ceramicBlue = {
  50: '#f6faff',
  100: '#daeafe',
  200: '#b4d5fe',
  300: '#8dc2fd',
  400: '#73acfa',
  500: '#6694f8',
  600: '#307ff6',
  700: '#236dd7',
  800: '#1c5bb6',
  900: '#1744a6',
} as const;

// ============================================================================
// SEMANTIC COLOR MAPPINGS
// ============================================================================

export const ceramicColors = {
  white: '#ffffff',
  black: '#000000',
  primary: ceramicGray[100],
  secondary: ceramicGray[800],
  dimmed: ceramicGray[600],
  positive: ceramicGreen[400], // Light mode
  negative: ceramicRed[600],
  warning: ceramicOrange[500],
  info: ceramicBlue[600],
  brand: ceramicPurple[600],
  bgMain: '#ffffff',
  bgMenu: '#ffffff',
  bgSeparator: ceramicGray[200],
  border: ceramicGray[300],
  borderHover: ceramicGray[400],
} as const;

export const ceramicDarkColors = {
  primary: ceramicGray[100],
  secondary: ceramicGray[800],
  dimmed: ceramicGray[800],
  positive: ceramicGreen[700], // Dark mode
  negative: ceramicRed[700],
  warning: ceramicOrange[700],
  info: ceramicBlue[700],
  brand: ceramicPurple[700],
  bgMain: ceramicGray[1400],
  bgMenu: ceramicGray[1100],
  bgSeparator: ceramicGray[1300],
  border: ceramicGray[800],
  borderHover: ceramicGray[700],
} as const;

// ============================================================================
// TYPOGRAPHY
// ============================================================================

export const ceramicFonts = {
  suisse: '"suisse", "suisse Fallback", system-ui, -apple-system, sans-serif',
  geistNumbers: '"geistNumbers", system-ui',
  soehneMono: '"soehneMono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
  base: '"geistNumbers", "suisse", system-ui, -apple-system, sans-serif',
} as const;

export const ceramicFontWeights = {
  book: 450,
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
} as const;

export const ceramicTextSizes = {
  xs: '0.75rem',   // 12px
  sm: '0.875rem',  // 14px
  base: '1rem',    // 16px
  lg: '1.125rem',  // 18px
  xl: '1.25rem',   // 20px
  '2xl': '1.5rem',   // 24px
  '3xl': '1.875rem', // 30px
  '4xl': '2.25rem',  // 36px
} as const;

export const ceramicLineHeights = {
  tight: '1.2',
  snug: '1.375',
  normal: '1.5',
  relaxed: '1.625',
  loose: '2',
} as const;

// ============================================================================
// SPACING
// ============================================================================

export const ceramicSpacing = {
  0: '0',
  px: '0.0625rem',  // 1px
  '0_5': '0.125rem', // 2px
  1: '0.25rem',     // 4px
  '1_5': '0.375rem', // 6px
  2: '0.5rem',      // 8px
  '2_5': '0.625rem', // 10px
  3: '0.75rem',     // 12px
  '3_5': '0.875rem', // 14px
  4: '1rem',        // 16px
  5: '1.25rem',     // 20px
  6: '1.5rem',      // 24px
  7: '1.75rem',     // 28px
  8: '2rem',        // 32px
  9: '2.25rem',     // 36px
  10: '2.5rem',     // 40px
  11: '2.75rem',    // 44px
  12: '3rem',       // 48px
  14: '3.5rem',     // 56px
  16: '4rem',       // 64px
  20: '5rem',       // 80px
  24: '6rem',       // 96px
} as const;

// ============================================================================
// BORDER RADIUS
// ============================================================================

export const ceramicRadius = {
  none: '0',
  sm: '0.125rem',   // 2px
  base: '0.25rem',  // 4px
  md: '0.375rem',   // 6px
  lg: '0.5rem',     // 8px
  xl: '0.75rem',    // 12px
  '2xl': '1rem',    // 16px
  '3xl': '1.5rem',  // 24px
  full: '9999px',
} as const;

// ============================================================================
// SHADOWS
// ============================================================================

export const ceramicShadows = {
  '0': '0 0 #0000',
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
} as const;

// ============================================================================
// ANIMATION
// ============================================================================

export const ceramicDuration = {
  default: '0.25s',
  fast: '0.15s',
  slow: '0.35s',
} as const;

export const ceramicEasing = {
  default: 'cubic-bezier(0.4, 0, 0.2, 1)',
  in: 'cubic-bezier(0.4, 0, 1, 1)',
  out: 'cubic-bezier(0, 0, 0.2, 1)',
  inOut: 'cubic-bezier(0.4, 0, 0.6, 1)',
} as const;

// ============================================================================
// Z-INDEX SCALE
// ============================================================================

export const ceramicZIndex = {
  '0': '0',
  '10': '10',
  '20': '20',
  '30': '30',
  '40': '40',
  '50': '50',
  '100': '100',
  modal: '50',
  dropdown: '40',
  sticky: '30',
  header: '20',
} as const;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get a CSS variable value for a ceramic color
 */
export function ceramicVar(color: string): string {
  return `var(--ceramic-${color})`;
}

/**
 * Get a CSS variable value with fallback
 */
export function ceramicVarWithFallback(color: string, fallback: string): string {
  return `var(--ceramic-${color}, ${fallback})`;
}

/**
 * Create a gradient string from two ceramic colors
 */
export function ceramicGradient(
  from: string,
  to: string,
  direction: number = 135
): string {
  return `linear-gradient(${direction}deg, ${from} 0%, ${to} 100%)`;
}

/**
 * Type helper for ceramic color keys
 */
export type CeramicGrayKey = keyof typeof ceramicGray;
export type CeramicPurpleKey = keyof typeof ceramicPurple;
export type CeramicGreenKey = keyof typeof ceramicGreen;
export type CeramicRedKey = keyof typeof ceramicRed;
export type CeramicOrangeKey = keyof typeof ceramicOrange;
export type CeramicBlueKey = keyof typeof ceramicBlue;

/**
 * Spacing key type
 */
export type CeramicSpacingKey = keyof typeof ceramicSpacing;

/**
 * Radius key type
 */
export type CeramicRadiusKey = keyof typeof ceramicRadius;

// ============================================================================
// CLASSES FOR COMMON COMPONENTS
// ============================================================================

/**
 * CSS class strings for common patterns
 */
export const ceramicClasses = {
  // Button variants
  buttonPrimary: 'btn-clerk-primary',
  buttonSecondary: 'btn-clerk-secondary',
  buttonGhost: 'btn-clerk-ghost',

  // Input
  input: 'input-clerk',

  // Card
  card: 'card-clerk',
  cardInteractive: 'card-clerk card-clerk-interactive',
  cardHeader: 'card-clerk-header',
  cardTitle: 'card-clerk-title',
  cardDescription: 'card-clerk-description',
  cardBody: 'card-clerk-body',
  cardFooter: 'card-clerk-footer',

  // Data table
  dataTable: 'data-table-clerk',

  // Toast
  toast: 'toast-clerk',
  toastSuccess: 'toast-clerk toast-clerk-success',
  toastError: 'toast-clerk toast-clerk-error',
  toastWarning: 'toast-clerk toast-clerk-warning',
  toastInfo: 'toast-clerk toast-clerk-info',

  // Modal
  modalBackdrop: 'modal-backdrop-clerk',
  modal: 'modal-clerk',
  modalHeader: 'modal-clerk-header',
  modalTitle: 'modal-clerk-title',
  modalClose: 'modal-clerk-close',
  modalBody: 'modal-clerk-body',
  modalFooter: 'modal-clerk-footer',

  // Badge
  badgeDefault: 'badge-clerk badge-clerk-default',
  badgeBrand: 'badge-clerk badge-clerk-brand',
  badgeSuccess: 'badge-clerk badge-clerk-success',
  badgeError: 'badge-clerk badge-clerk-error',
  badgeWarning: 'badge-clerk badge-clerk-warning',
  badgeInfo: 'badge-clerk badge-clerk-info',

  // Avatar
  avatarPrimary: 'avatar-clerk avatar-clerk-primary',
  avatarGray: 'avatar-clerk avatar-clerk-gray',
  avatarSuccess: 'avatar-clerk avatar-clerk-success',

  // Callout
  calloutInfo: 'callout-clerk callout-clerk-info',
  calloutWarning: 'callout-clerk callout-clerk-warning',
  calloutError: 'callout-clerk callout-clerk-error',
  calloutSuccess: 'callout-clerk callout-clerk-success',

  // Navigation
  nav: 'nav-clerk',
  navHeader: 'nav-clerk-header',
  navNav: 'nav-clerk-nav',
  navItem: 'nav-item-clerk',
  navItemActive: 'nav-item-clerk nav-item-clerk-active',
  navIcon: 'nav-icon-clerk',

  // Topnav
  topnav: 'topnav-clerk',
  breadcrumb: 'breadcrumb-clerk',

  // Rich text
  richText: 'rich-text-clerk',

  // Skeleton
  skeleton: 'skeleton-clerk',
} as const;

// ============================================================================
// THEME HELPERS
// ============================================================================

/**
 * Check if dark mode is active
 */
export function isDarkMode(): boolean {
  if (typeof window === 'undefined') return false;
  return document.documentElement.classList.contains('dark');
}

/**
 * Toggle dark mode
 */
export function toggleDarkMode(): void {
  if (typeof window === 'undefined') return;
  document.documentElement.classList.toggle('dark');
}

/**
 * Set dark mode
 */
export function setDarkMode(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  if (enabled) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

/**
 * Get colors based on current theme
 */
export function getThemeColors() {
  return isDarkMode() ? ceramicDarkColors : ceramicColors;
}

// ============================================================================
// EXPORT ALL AS DEFAULT
// ============================================================================

const ceramicDesignSystem = {
  colors: {
    gray: ceramicGray,
    purple: ceramicPurple,
    green: ceramicGreen,
    red: ceramicRed,
    orange: ceramicOrange,
    blue: ceramicBlue,
    semantic: ceramicColors,
    semanticDark: ceramicDarkColors,
  },
  typography: {
    fonts: ceramicFonts,
    weights: ceramicFontWeights,
    sizes: ceramicTextSizes,
    lineHeights: ceramicLineHeights,
  },
  spacing: ceramicSpacing,
  radius: ceramicRadius,
  shadows: ceramicShadows,
  animation: {
    duration: ceramicDuration,
    easing: ceramicEasing,
  },
  zIndex: ceramicZIndex,
  classes: ceramicClasses,
  utils: {
    ceramicVar,
    ceramicVarWithFallback,
    ceramicGradient,
    isDarkMode,
    toggleDarkMode,
    setDarkMode,
    getThemeColors,
  },
} as const;

export default ceramicDesignSystem;
