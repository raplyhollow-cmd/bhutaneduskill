/**
 * School Branding API
 * Manage school-specific branding and themes
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import {
  getSchoolBranding,
  updateSchoolBranding,
  applySchoolTheme,
  getSchoolBrandingForClient,
  isValidColor,
  SCHOOL_THEMES,
} from "@/lib/branding/school-branding";
import { schools } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";

/**
 * GET /api/school-admin/branding
 * Get school branding configuration
 */
export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAuth(["school_admin", "admin", "student", "teacher", "parent"]);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { userId } = authResult;

    const { searchParams } = new URL(req.url);
    const schoolId = searchParams.get("schoolId");

    if (!schoolId) {
      return NextResponse.json({
        error: "School ID is required",
      }, { status: 400 });
    }

    const branding = await getSchoolBrandingForClient(schoolId);

    return NextResponse.json({
      success: true,
      data: {
        branding,
        availableThemes: Object.entries(SCHOOL_THEMES).map(([key, theme]) => ({
          key,
          name: theme.name,
          colors: theme.colors,
        })),
      },
    });

  } catch (error) {
    logger.apiError(error, { route: "/api/school-admin/branding", method: "GET" });
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Failed to fetch branding",
    }, { status: 500 });
  }
}

/**
 * PUT /api/school-admin/branding
 * Update school branding
 */
export async function PUT(req: NextRequest) {
  try {
    const authResult = await requireAuth(["school_admin", "admin"]);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { userId } = authResult;

    const body = await req.json();
    const { schoolId, branding } = body;

    if (!schoolId) {
      return NextResponse.json({
        error: "School ID is required",
      }, { status: 400 });
    }

    // Verify user belongs to this school (unless admin)
    const [user] = await db
      .select({ schoolId: schools.id })
      .from(schools)
      .where(eq(schools.id, userId))
      .limit(1);

    if (!user && userId !== "admin") {
      return NextResponse.json({
        error: "School not found",
      }, { status: 404 });
    }

    // Validate colors if provided
    if (branding?.primaryColor && !isValidColor(branding.primaryColor)) {
      return NextResponse.json({
        error: "Invalid primary color format",
      }, { status: 400 });
    }

    if (branding?.secondaryColor && !isValidColor(branding.secondaryColor)) {
      return NextResponse.json({
        error: "Invalid secondary color format",
      }, { status: 400 });
    }

    if (branding?.accentColor && !isValidColor(branding.accentColor)) {
      return NextResponse.json({
        error: "Invalid accent color format",
      }, { status: 400 });
    }

    // Update branding
    const result = await updateSchoolBranding(schoolId, branding);

    if (!result.success) {
      return NextResponse.json({
        error: result.error,
      }, { status: 400 });
    }

    logger.info("School branding updated", {
      userId,
      schoolId,
    });

    return NextResponse.json({
      success: true,
      message: "Branding updated successfully",
    });

  } catch (error) {
    logger.apiError(error, { route: "/api/school-admin/branding", method: "PUT" });
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Failed to update branding",
    }, { status: 500 });
  }
}

/**
 * POST /api/school-admin/branding/apply-theme
 * Apply a preset theme to school
 */
export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth(["school_admin", "admin"]);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { userId } = authResult;

    const body = await req.json();
    const { schoolId, themeName } = body;

    if (!schoolId) {
      return NextResponse.json({
        error: "School ID is required",
      }, { status: 400 });
    }

    if (!themeName) {
      return NextResponse.json({
        error: "Theme name is required",
      }, { status: 400 });
    }

    // Apply theme
    const result = await applySchoolTheme(schoolId, themeName);

    if (!result.success) {
      return NextResponse.json({
        error: result.error,
      }, { status: 400 });
    }

    logger.info("School theme applied", {
      userId,
      schoolId,
      themeName,
    });

    return NextResponse.json({
      success: true,
      message: `Theme "${SCHOOL_THEMES[themeName]?.name || themeName}" applied successfully`,
    });

  } catch (error) {
    logger.apiError(error, { route: "/api/school-admin/branding/apply-theme", method: "POST" });
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Failed to apply theme",
    }, { status: 500 });
  }
}
