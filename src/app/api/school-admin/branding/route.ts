/**
 * School Branding API
 * Manage school-specific branding and themes
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { schools } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { createApiRoute } from "@/lib/api/route-handler";
import { successResponse, errorResponse } from "@/lib/api/response-helpers";
import {
  getSchoolBranding,
  updateSchoolBranding,
  applySchoolTheme,
  getSchoolBrandingForClient,
  isValidColor,
  SCHOOL_THEMES,
  type SchoolTheme,
} from "@/lib/branding/school-branding";

/**
 * GET /api/school-admin/branding
 * Get school branding configuration
 */
export const GET = createApiRoute(
  async (req: NextRequest) => {
    const { searchParams } = new URL(req.url);
    const schoolId = searchParams.get("schoolId");

    if (!schoolId) {
      return errorResponse("School ID is required", 400);
    }

    const branding = await getSchoolBrandingForClient(schoolId);

    return successResponse({
      branding,
      availableThemes: Object.entries(SCHOOL_THEMES).map(([key, theme]) => ({
        key,
        name: (theme as SchoolTheme).name,
        colors: (theme as SchoolTheme).colors,
      })),
    });
  },
  ['school-admin', 'admin']
);

/**
 * PUT /api/school-admin/branding
 * Update school branding
 */
export const PUT = createApiRoute(
  async (req: NextRequest) => {
    const body = await req.json();
    const { schoolId, branding } = body;

    if (!schoolId) {
      return errorResponse("School ID is required", 400);
    }

    // Validate colors if provided
    if (branding?.primaryColor && !isValidColor(branding.primaryColor)) {
      return errorResponse("Invalid primary color format", 400);
    }

    if (branding?.secondaryColor && !isValidColor(branding.secondaryColor)) {
      return errorResponse("Invalid secondary color format", 400);
    }

    if (branding?.accentColor && !isValidColor(branding.accentColor)) {
      return errorResponse("Invalid accent color format", 400);
    }

    // Update branding
    const result = await updateSchoolBranding(schoolId, branding);

    if (!result.success) {
      return errorResponse(result.error, 400);
    }

    return successResponse({
      message: "Branding updated successfully",
    });
  },
  ['school-admin', 'admin']
);

/**
 * POST /api/school-admin/branding/apply-theme
 * Apply a preset theme to school
 */
export const POST = createApiRoute(
  async (req: NextRequest) => {
    const body = await req.json();
    const { schoolId, themeName } = body;

    if (!schoolId) {
      return errorResponse("School ID is required", 400);
    }

    if (!themeName) {
      return errorResponse("Theme name is required", 400);
    }

    // Apply theme
    const result = await applySchoolTheme(schoolId, themeName);

    if (!result.success) {
      return errorResponse(result.error, 400);
    }

    return successResponse({
      message: `Theme "${SCHOOL_THEMES[themeName]?.name || themeName}" applied successfully`,
    });
  },
  ['school-admin', 'admin']
);