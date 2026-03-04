/**
 * DARK MODE THEME CONFIGURATION
 *
 * Consistent dark mode colors across the platform
 */

export const darkTheme = {
  colors: {
    // Background
    background: {
      DEFAULT: "#09090b",
      card: "#18181b",
      input: "#27272a",
      secondary: "#27272a",
      accent: "#3f3f46",
      muted: "#27272a",
    },
    // Foreground
    foreground: {
      DEFAULT: "#fafafa",
      card: "#fafafa",
      muted: "#a1a1aa",
    },
    // Borders
    border: {
      DEFAULT: "#27272a",
      input: "#3f3f46",
      secondary: "#3f3f46",
    },
    // Primary
    primary: {
      DEFAULT: "#a855f7",
      foreground: "#ffffff",
    },
    // Secondary
    secondary: {
      DEFAULT: "#71717a",
      foreground: "#fafafa",
    },
    // Accent
    accent: {
      DEFAULT: "#8b5cf6",
      foreground: "#fafafa",
    },
    // Destructive
    destructive: {
      DEFAULT: "#ef4444",
      foreground: "#fafafa",
    },
    // Success
    success: {
      DEFAULT: "#22c55e",
      foreground: "#fafafa",
    },
    // Warning
    warning: {
      DEFAULT: "#f59e0b",
      foreground: "#fafafa",
    },
    // Info
    info: {
      DEFAULT: "#3b82f6",
      foreground: "#fafafa",
    },
  },
  borderRadius: {
    sm: "4px",
    md: "6px",
    lg: "8px",
    xl: "12px",
  },
};

// Dark mode specific component overrides
export const darkModeOverrides = {
  // Chart colors for dark mode
  charts: {
    grid: "#3f3f46",
    text: "#a1a1aa",
    tooltip: {
      bg: "#18181b",
      border: "#3f3f46",
    },
  },
};
