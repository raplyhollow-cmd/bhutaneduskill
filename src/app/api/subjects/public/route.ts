import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { schools, subjects } from "@/lib/db/schema";
import { eq, isNull, or, and } from "drizzle-orm";

/**
 * GET /api/subjects/public - Get subjects by school code (public endpoint for signup flow)
 *
 * Query params:
 * - schoolCode: The school code (required)
 *
 * This is a public endpoint (no auth) used during teacher signup.
 * It validates the school code and returns subjects for that school.
 *
 * Returns both school-specific subjects and global subject templates.
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

    // Fetch subjects for this school:
    // 1. School-specific subjects (schoolId = this school's ID)
    // 2. Global subject templates (schoolId IS NULL)
    const subjectRecords = await db
      .select({
        id: subjects.id,
        name: subjects.name,
        code: subjects.code,
        type: subjects.type,
        grade: subjects.grade,
        description: subjects.description,
      })
      .from(subjects)
      .where(
        or(
          eq(subjects.schoolId, school.id),
          isNull(subjects.schoolId)
        )
      )
      .orderBy(subjects.name, subjects.grade);

    logger.info("Fetched subjects for school", {
      schoolId: school.id,
      schoolCode: school.code,
      count: subjectRecords.length,
    });

    // Return success with school info and subjects
    return NextResponse.json({
      success: true,
      data: {
        schoolId: school.id,
        schoolName: school.name,
        schoolCode: school.code,
        subjects: subjectRecords,
      },
    });

  } catch (error) {
    logger.error("Failed to fetch subjects for school", { error });
    return NextResponse.json(
      { success: false, error: "Failed to load subjects. Please try again." },
      { status: 500 }
    );
  }
}
