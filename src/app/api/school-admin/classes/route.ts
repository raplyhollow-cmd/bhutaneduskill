/**
 * SCHOOL ADMIN - CLASSES API
 *
 * GET /api/school-admin/classes - Get all classes for the school
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { classes } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(["school-admin", "admin", "teacher"]);
    if ("error" in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { user } = authResult;
    const schoolId = user?.schoolId;

    if (!schoolId) {
      return NextResponse.json({ error: "School ID not found" }, { status: 400 });
    }

    console.log("[Classes API] Fetching classes for schoolId:", schoolId);

    // Get all classes for this school
    const classesList = await db
      .select()
      .from(classes)
      .where(eq(classes.schoolId, schoolId));

    console.log("[Classes API] Found classes:", classesList.length);

    return NextResponse.json({
      success: true,
      data: { classes: classesList },
    });
  } catch (error: any) {
    console.error("Classes API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch classes" },
      { status: 500 }
    );
  }
}
