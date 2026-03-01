import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { schools, classes } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

/**
 * GET /api/classes/public - Get classes by school code (public endpoint for signup flow)
 *
 * Query params:
 * - schoolCode: The school code (required)
 *
 * This is a public endpoint (no auth) used during student signup.
 * It validates the school code and returns active classes for that school.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const schoolCode = searchParams.get("schoolCode");

    // Validate school code parameter
    if (!schoolCode || schoolCode.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "School code is required" },
        { status: 400 }
      );
    }

    // Trim and normalize school code
    const normalizedCode = schoolCode.trim().toUpperCase();

    // Find school by code
    const schoolRecords = await db
      .select({
        id: schools.id,
        name: schools.name,
        code: schools.code,
        isActive: schools.isActive,
        subscriptionStatus: schools.subscriptionStatus,
      })
      .from(schools)
      .where(eq(schools.code, normalizedCode))
      .limit(1);

    if (schoolRecords.length === 0) {
      return NextResponse.json(
        { success: false, error: "School not found" },
        { status: 404 }
      );
    }

    const school = schoolRecords[0];

    // Check if school is active
    if (!school.isActive) {
      return NextResponse.json(
        { success: false, error: "This school is not currently active. Please contact your school administrator." },
        { status: 403 }
      );
    }

    // Check subscription status (if exists)
    if (school.subscriptionStatus && school.subscriptionStatus !== "active" && school.subscriptionStatus !== "trial") {
      return NextResponse.json(
        { success: false, error: "This school's subscription is not active. Please contact your school administrator." },
        { status: 403 }
      );
    }

    // Fetch active classes for this school
    const classRecords = await db
      .select({
        id: classes.id,
        name: classes.name,
        grade: classes.grade,
        section: classes.section,
        academicYear: classes.academicYear,
      })
      .from(classes)
      .where(
        and(
          eq(classes.schoolId, school.id),
          eq(classes.isActive, true)
        )
      )
      .orderBy(classes.grade, classes.section);

    // Return success with school info and classes
    return NextResponse.json({
      success: true,
      data: {
        schoolId: school.id,
        schoolName: school.name,
        schoolCode: school.code,
        classes: classRecords,
      },
    });

  } catch (error) {
    logger.error("Failed to fetch classes for school", { error });
    return NextResponse.json(
      { success: false, error: "Failed to load classes. Please try again." },
      { status: 500 }
    );
  }
}
