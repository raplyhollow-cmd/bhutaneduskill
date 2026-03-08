/**
 * GLOBAL SUBJECTS API
 *
 * Returns global subject templates (not tied to any school).
 * Used by the subjects management page to show available templates.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { subjects } from "@/lib/db/schema";
import { isNull } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    // Get all global subjects (schoolId is null)
    const globalSubjects = await db
      .select()
      .from(subjects)
      .where(isNull(subjects.schoolId));

    return NextResponse.json({
      success: true,
      data: {
        subjects: globalSubjects,
      },
    });

  } catch (error: any) {
    console.error("Global subjects API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch global subjects" },
      { status: 500 }
    );
  }
}
