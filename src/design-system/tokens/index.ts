/**
 * Design Tokens - Central configuration for all visual properties
 * Change these values and updates will propagate throughout the app
 *
 * UPDATED: New professional color palette (less green-heavy)
 * Primary: Navy Blue (professional, trustworthy)
 * Secondary: Teal (modern, calm)
 * Accent: Terra Cotta (warmth)
 * Bhutan Green: Used sparingly as accent (preserving cultural identity)
 */

export const colors = {
  // NEW: Primary - Navy Blue (Professional, trustworthy)
  primary: {
    50: "#f0f4f8",
    100: "#d9e2ec",
    200: "#bcccdc",
    300: "#9fb3c8",
    400: "#829ab1",
    500: "#627d98",
    600: "#486581",
    700: "#334e68",
    800: "#243b53",
    900: "#102a43",
    950: "#0a1929",
  },

  // NEW: Secondary - Teal (Modern, fresh)
  secondary: {
    50: "#f0fdfa",
    100: "#ccfbf1",
    200: "#99f6e4",
    300: "#5fead4",
    400: "#2dd4bf",
    500: "#14b8a6",
    600: "#0d9488",
    700: "#0f766e",
    800: "#115e59",
    900: "#134e4a",
    950: "#042f2e",
  },

  // Accent - Terra Cotta (Warmth, connection to oxidized iron)
  accent: {
    50: "#fbedea",
    100: "#f7dad4",
    200: "#eeb5aa",
    300: "#e6907f",
    400: "#dd6b55",
    500: "#d5472a",
    600: "#aa3822",
    700: "#802a19",
    800: "#551c11",
    900: "#2b0e08",
    950: "#1e0a06",
  },

  // Bhutan Green - Used SPARINGLY as cultural accent (not primary anymore)
  "bhutan-green": {
    50: "#f0f5ef",
    100: "#e1ecdf",
    200: "#c3d8c0",
    300: "#a6c5a0",
    400: "#88b181",
    500: "#6a9e61",
    600: "#557e4e",
    700: "#405f3a",
    800: "#2a3f27",
    900: "#152013",
    950: "#0f160e",
  },

  // Powder Blue (Bhutan's rivers) - Now used for specific contexts
  "powder-blue": {
    50: "#ebf3f9",
    100: "#d8e7f3",
    200: "#b1d0e7",
    300: "#8ab8db",
    400: "#63a0cf",
    500: "#3c89c3",
    600: "#306d9c",
    700: "#245275",
    800: "#18374e",
    900: "#0c1b27",
    950: "#08131b",
  },

  // Oxidized Iron (Traditional elements) - Preserved
  "oxidized-iron": {
    50: "#fbedea",
    100: "#f7dad4",
    200: "#eeb5aa",
    300: "#e6907f",
    400: "#dd6b55",
    500: "#c85a41",
    600: "#a34832",
    700: "#7d3623",
    800: "#582415",
    900: "#331207",
    950: "#220a05",
  },

  // Neutral - Ash Grey (Refined for professional look)
  "ash-grey": {
    50: "#f8fafc",
    100: "#f1f5f9",
    200: "#e2e8f0",
    300: "#cbd5e1",
    400: "#94a3b8",
    500: "#64748b",
    600: "#475569",
    700: "#334155",
    800: "#1e293b",
    900: "#0f172a",
    950: "#020617",
  },

  // Semantic colors (updated with new palette)
  success: {
    light: "#99f6e4",
    DEFAULT: "#14b8a6",
    dark: "#0f766e",
  },
  warning: {
    light: "#eeb5aa",
    DEFAULT: "#d5472a",
    dark: "#aa3822",
  },
  error: {
    light: "#fecaca",
    DEFAULT: "#ef4444",
    dark: "#b91c1c",
  },
  info: {
    light: "#bcccdc",
    DEFAULT: "#486581",
    dark: "#243b53",
  },

  // Legacy aliases (for backward compatibility)
  hunterGreen: "#557e4e",
  hunter: "#557e4e",
} as const;

export const spacing = {
  xs: "0.25rem",    // 4px
  sm: "0.5rem",     // 8px
  md: "1rem",       // 16px
  lg: "1.5rem",     // 24px
  xl: "2rem",       // 32px
  "2xl": "3rem",     // 48px
  "3xl": "4rem",     // 64px
  "4xl": "6rem",     // 96px
} as const;

export const fontSize = {
  xs: "0.75rem",    // 12px
  sm: "0.875rem",   // 14px
  base: "1rem",     // 16px
  lg: "1.125rem",   // 18px
  xl: "1.25rem",    // 20px
  "2xl": "1.5rem",   // 24px
  "3xl": "1.875rem", // 30px
  "4xl": "2.25rem",   // 36px
  "5xl": "3rem",      // 48px
} as const;

export const borderRadius = {
  none: "0",
  sm: "0.125rem",   // 2px
  DEFAULT: "0.375rem", // 6px
  md: "0.5rem",     // 8px
  lg: "0.75rem",    // 12px
  xl: "1rem",        // 16px
  "2xl": "1.5rem",   // 24px
  full: "9999px",
} as const;

export const boxShadow = {
  sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
  DEFAULT: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)",
  md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)",
  lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)",
  xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
  "2xl": "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
  inner: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)",
  none: "none",
} as const;

export const animation = {
  fast: "150ms cubic-bezier(0.4, 0, 0.2, 1)",
  DEFAULT: "200ms cubic-bezier(0.4, 0, 0.2, 1)",
  slow: "300ms cubic-bezier(0.4, 0, 0.2, 1)",
} as const;

export const zIndex = {
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
  toast: 1080,
} as const;

// Gradient combinations
export const gradients = {
  primary: "linear-gradient(135deg, #557e4e 0%, #405f3a 100%)",
  secondary: "linear-gradient(135deg, #3c89c3 0%, #245275 100%)",
  accent: "linear-gradient(135deg, #d5472a 0%, #aa3822 100%)",
  bhutan: "linear-gradient(135deg, #557e4e 0%, #3c89c3 50%, #d5472a 100%)",
  success: "linear-gradient(135deg, #88b181 0%, #557e4e 100%)",
  premium: "linear-gradient(135deg, #557e4e 0%, #3c89c3 50%, #d5472a 100%)",
} as const;

// Role-based themes with inline style gradients (use these for portal styling)
export const roleThemes = {
  student: {
    primary: colors.primary[600], // Navy
    secondary: colors.secondary[500], // Teal
    accent: colors["bhutan-green"][500], // Bhutan green as accent
    gradientInline: "linear-gradient(135deg, rgb(249 115 22) 0%, rgb(194 65 12) 100%)", // Orange
  },
  teacher: {
    primary: colors.secondary[600], // Teal
    secondary: colors["bhutan-green"][500], // Bhutan green
    accent: colors.accent[500], // Terra cotta
    gradientInline: "linear-gradient(135deg, rgb(59 130 246) 0%, rgb(37 99 235) 100%)", // Blue
  },
  parent: {
    primary: colors["ash-grey"][600], // Grey
    secondary: colors.primary[500], // Navy
    accent: colors.secondary[500], // Teal
    gradientInline: "linear-gradient(135deg, rgb(107 114 128) 0%, rgb(75 85 99) 100%)", // Gray
  },
  counselor: {
    primary: colors["oxidized-iron"][600], // Rust
    secondary: colors.primary[500], // Navy
    accent: colors.secondary[500], // Teal
    gradientInline: "linear-gradient(135deg, rgb(168 85 247) 0%, rgb(147 51 234) 100%)", // Purple
  },
  "school-admin": {
    primary: colors.primary[600], // Navy
    secondary: colors["bhutan-green"][500], // Bhutan green
    accent: colors.accent[500], // Terra cotta
    gradientInline: "linear-gradient(135deg, rgb(139 92 246) 0%, rgb(124 58 237) 100%)", // Violet
  },
  admin: {
    primary: colors.accent[600], // Terra cotta
    secondary: colors.primary[600], // Navy
    accent: colors.secondary[600], // Teal
    gradientInline: "linear-gradient(135deg, rgb(236 72 153) 0%, rgb(219 39 119) 100%)", // Pink
  },
} as const;

// Shorthand for accessing colors
export const color = (colorName: keyof typeof colors, shade: number = 500) => {
  return colors[colorName]?.[shade as keyof typeof colors.primary] || colorName;
};

// Tailwind-compatible class generator
export const tw = (strings: TemplateStringsArray, ...values: (string | number | boolean)[]) => {
  return String.raw({ raw: strings }, ...values);
};
