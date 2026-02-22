/**
 * School Branding Service
 * Manage school-specific branding, themes, and customization
 */

import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { schools } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// ============================================================================
// TYPES
// ============================================================================

export interface SchoolBranding {
  logo?: string;
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor?: string;
  textColor?: string;
  fontFamily?: string;
  customCSS?: string;
  favicon?: string;
  loginBackground?: string;
  reportCardTemplate?: string;
  idCardTemplate?: string;
}

export interface SchoolTheme {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background?: string;
    text?: string;
  };
  fonts?: {
    heading?: string;
    body?: string;
  };
  borderRadius?: string;
  spacing?: string;
}

// ============================================================================
// PRESET THEMES
// ============================================================================

export const SCHOOL_THEMES: Record<string, SchoolTheme> = {
  default: {
    name: "Default",
    colors: {
      primary: "rgb(249 115 22)",
      secondary: "rgb(194 65 12)",
      accent: "rgb(251 146 60)",
    },
    borderRadius: "0.5rem",
    spacing: "normal",
  },
  professional_blue: {
    name: "Professional Blue",
    colors: {
      primary: "rgb(59 130 246)",
      secondary: "rgb(37 99 235)",
      accent: "rgb(96 165 250)",
    },
    borderRadius: "0.375rem",
    spacing: "normal",
  },
  nature_green: {
    name: "Nature Green",
    colors: {
      primary: "rgb(34 197 94)",
      secondary: "rgb(22 163 74)",
      accent: "rgb(74 222 128)",
    },
    borderRadius: "0.5rem",
    spacing: "normal",
  },
  elegant_purple: {
    name: "Elegant Purple",
    colors: {
      primary: "rgb(139 92 246)",
      secondary: "rgb(124 58 237)",
      accent: "rgb(167 139 250)",
    },
    borderRadius: "0.75rem",
    spacing: "relaxed",
  },
  warm_amber: {
    name: "Warm Amber",
    colors: {
      primary: "rgb(245 158 11)",
      secondary: "rgb(217 119 6)",
      accent: "rgb(251 191 36)",
    },
    borderRadius: "0.5rem",
    spacing: "normal",
  },
  modern_red: {
    name: "Modern Red",
    colors: {
      primary: "rgb(239 68 68)",
      secondary: "rgb(220 38 38)",
      accent: "rgb(248 113 113)",
    },
    borderRadius: "0.25rem",
    spacing: "compact",
  },
  minimal_gray: {
    name: "Minimal Gray",
    colors: {
      primary: "rgb(71 85 105)",
      secondary: "rgb(51 65 85)",
      accent: "rgb(100 116 139)",
    },
    borderRadius: "0rem",
    spacing: "compact",
  },
};

// ============================================================================
// BRANDING FUNCTIONS
// ============================================================================

/**
 * Get school branding configuration
 * Note: Branding is stored in the settings field of the tenants table, not schools table
 * This function returns default branding for now - use tenant-based branding for custom themes
 */
export async function getSchoolBranding(schoolId: string): Promise<SchoolBranding> {
  try {
    // Check if school exists first
    const [school] = await db
      .select({
        name: schools.name,
        logo: schools.logo,
        type: schools.type,
      })
      .from(schools)
      .where(eq(schools.id, schoolId))
      .limit(1);

    if (!school) {
      // Return default branding
      return {
        primaryColor: "rgb(249 115 22)",
        secondaryColor: "rgb(194 65 12)",
        accentColor: "rgb(251 146 60)",
      };
    }

    // Return default branding with school logo if available
    return {
      logoUrl: school.logo || undefined,
      primaryColor: "rgb(249 115 22)",
      secondaryColor: "rgb(194 65 12)",
      accentColor: "rgb(251 146 60)",
    };

  } catch (error) {
    logger.error("Failed to get school branding", { error, schoolId });
    return {
      primaryColor: "rgb(249 115 22)",
      secondaryColor: "rgb(194 65 12)",
      accentColor: "rgb(251 146 60)",
    };
  }
}

/**
 * Update school branding
 * Note: Branding is stored in the settings field of the tenants table, not schools table
 * This function is a placeholder - use tenant-based branding for custom themes
 */
export async function updateSchoolBranding(
  schoolId: string,
  brandingData: Partial<SchoolBranding>
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if school exists
    const [school] = await db
      .select({ id: schools.id })
      .from(schools)
      .where(eq(schools.id, schoolId))
      .limit(1);

    if (!school) {
      return { success: false, error: "School not found" };
    }

    // Note: Branding should be stored in the tenants table settings, not schools table
    // For now, this is a placeholder that logs the branding data
    logger.info("School branding update requested (not implemented - use tenant branding)", {
      schoolId,
      brandingData,
    });

    return { success: false, error: "School branding should be updated via tenant settings" };

  } catch (error) {
    logger.error("Failed to update school branding", { error, schoolId });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Apply preset theme to school
 */
export async function applySchoolTheme(
  schoolId: string,
  themeName: string
): Promise<{ success: boolean; error?: string }> {
  const theme = SCHOOL_THEMES[themeName];

  if (!theme) {
    return { success: false, error: "Theme not found" };
  }

  return updateSchoolBranding(schoolId, {
    primaryColor: theme.colors.primary,
    secondaryColor: theme.colors.secondary,
    accentColor: theme.colors.accent,
    backgroundColor: theme.colors.background,
    textColor: theme.colors.text,
    fontFamily: theme.fonts?.body,
  });
}

/**
 * Generate CSS variables from branding
 */
export function getCSSVariables(branding: SchoolBranding): string {
  const variables: string[] = [];

  // Colors
  variables.push(`--brand-primary: ${branding.primaryColor}`);
  variables.push(`--brand-secondary: ${branding.secondaryColor}`);
  variables.push(`--brand-accent: ${branding.accentColor}`);

  if (branding.backgroundColor) {
    variables.push(`--brand-background: ${branding.backgroundColor}`);
  }
  if (branding.textColor) {
    variables.push(`--brand-text: ${branding.textColor}`);
  }

  // Extract RGB values for rgba() usage
  const extractRGB = (color: string) => {
    const match = color.match(/\(([^)]+)\)/);
    return match ? match[1] : "";
  };

  variables.push(`--brand-primary-rgb: ${extractRGB(branding.primaryColor)}`);
  variables.push(`--brand-secondary-rgb: ${extractRGB(branding.secondaryColor)}`);

  return variables.join(";\n");
}

/**
 * Get branding for client-side use
 */
export async function getSchoolBrandingForClient(schoolId: string) {
  const branding = await getSchoolBranding(schoolId);

  return {
    colors: {
      primary: branding.primaryColor,
      secondary: branding.secondaryColor,
      accent: branding.accentColor,
      background: branding.backgroundColor,
      text: branding.textColor,
    },
    logo: branding.logoUrl || branding.logo,
    customCSS: branding.customCSS,
    cssVariables: getCSSVariables(branding),
  };
}

/**
 * Validate branding color input
 */
export function isValidColor(color: string): boolean {
  // Check for rgb(r g b) format
  if (/^rgb\(\d+\s+\d+\s+\d+\)$/.test(color)) {
    const rgb = color.match(/\d+/g);
    if (rgb) {
      return rgb.every((val) => {
        const num = parseInt(val, 10);
        return num >= 0 && num <= 255;
      });
    }
  }

  // Check for hex format
  if (/^#[0-9A-Fa-f]{6}$/.test(color)) {
    return true;
  }

  // Check for named colors
  const namedColors = [
    "black", "white", "red", "green", "blue", "yellow", "orange", "purple", "pink",
    "gray", "brown", "cyan", "magenta", "lime", "navy", "teal", "olive", "maroon"
  ];
  return namedColors.includes(color.toLowerCase());
}
