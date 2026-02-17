import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { colleges, rubPrograms } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import type { ApiSuccess, ApiErrorResponse } from "@/types";

// GET /api/student/content/colleges - Discover colleges
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(['student', 'admin']);
  if ('error' in authResult) {
    return NextResponse.json(
      { error: authResult.error, status: authResult.status } satisfies ApiErrorResponse,
      { status: authResult.status }
    );
  }

  const { userId } = authResult;

  try {

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // "bhutan", "international"
    const careerCluster = searchParams.get("careerCluster");

    const allColleges = await db.query.colleges.findMany({
      where: eq(colleges.isActive, true),
      orderBy: [desc(colleges.createdAt)],
    });

    let filtered = allColleges;

    if (type === "bhutan") {
      filtered = allColleges.filter(c => (c as any).isBhutanCollege);
    } else if (type === "international") {
      filtered = allColleges.filter(c => !(c as any).isBhutanCollege);
    }

    // Get programs for Bhutan colleges
    if (type === "bhutan" || !type) {
      const bhutanCollegeIds = filtered
        .filter(c => (c as any).bhutanCollegeType === "rub")
        .map(c => c.id);

      const programs = await db.query.rubPrograms.findMany();
      filtered = filtered.map((college: any) => {
        if (college.isBhutanCollege) {
          return {
            ...college,
            programsList: programs.filter((p: any) => p.collegeId === college.id),
          };
        }
        return college;
      });
    }

    return NextResponse.json({ colleges: filtered });
  } catch (error) {
    logger.apiError(error, { route: "/api/student/content/colleges", method: "GET", userId });
    return NextResponse.json(
      { error: "Failed to discover colleges", status: 500 } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}
