/**
 * PUBLIC CLASSES API
 *
 * Returns classes for a given school (public, no auth required).
 * Used by the unified setup wizard.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { classes, schools } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const schoolCode = searchParams.get("schoolCode");

    if (!schoolCode) {
      return NextResponse.json({ error: "schoolCode is required" }, { status: 400 });
    }

    // Verify school exists
    const [school] = await db
      .select()
      .from(schools)
      .where(eq(schools.code, schoolCode))
      .limit(1);

    if (!school) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    // Get classes for this school
    const schoolClasses = await db
      .select()
      .from(classes)
      .where(eq(classes.schoolId, school.id));

    return NextResponse.json({
      success: true,
      data: {
        school: {
          id: school.id,
          name: school.name,
          code: school.code,
        },
        classes: schoolClasses,
      },
    });

  } catch (error: any) {
    console.error("Public classes API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch classes" },
      { status: 500 }
    );
  }
}
