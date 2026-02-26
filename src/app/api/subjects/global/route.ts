import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { subjects } from "@/lib/db/schema";
import { eq, isNull, desc } from "drizzle-orm";
import { requireAuth } from "@/lib/auth-utils";

// GET /api/subjects/global - Get all global subject templates (for dropdown)
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(['admin', 'school-admin']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    // Fetch all global subject templates (school_id IS NULL)
    const globalSubjects = await db
      .select({
        id: subjects.id,
        code: subjects.code,
        name: subjects.name,
        type: subjects.type,
        grade: subjects.grade,
        description: subjects.description,
      })
      .from(subjects)
      .where(isNull(subjects.schoolId))
      .orderBy(subjects.name, subjects.grade);

    return NextResponse.json({ subjects: globalSubjects });
  } catch (error) {
    console.error("Error fetching global subjects:", error);
    return NextResponse.json({ error: "Failed to fetch global subjects" }, { status: 500 });
  }
}
