import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { colleges, rubPrograms } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { createApiRoute } from "@/lib/api/route-handler";
import { successResponse } from "@/lib/api/response-helpers";
import { logger } from "@/lib/logger";

interface College extends Record<string, unknown> {
  id: string;
  name: string;
  isBhutanCollege?: boolean;
  bhutanCollegeType?: string;
}

interface Program {
  collegeId: string;
  id: string;
}

interface CollegeWithPrograms extends College {
  programsList?: Program[];
}

// GET /api/student/content/colleges - Discover colleges
export const GET = createApiRoute(
  async (request: NextRequest, auth) => {
    const { userId } = auth;

    try {

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // "bhutan", "international"
    const careerCluster = searchParams.get("careerCluster");

    const allColleges = await db
      .select()
      .from(colleges)
      .where(eq(colleges.isActive, true))
      .orderBy(desc(colleges.createdAt))
      .limit(100);

    let filtered = allColleges as College[];

    if (type === "bhutan") {
      filtered = allColleges.filter((c): c is College => (c as College).isBhutanCollege);
    } else if (type === "international") {
      filtered = allColleges.filter((c): c is College => !(c as College).isBhutanCollege);
    }

    // Get programs for Bhutan colleges
    if (type === "bhutan" || !type) {
      const bhutanCollegeIds = filtered
        .filter(c => c.bhutanCollegeType === "rub")
        .map(c => c.id);

      const programs = await db.select().from(rubPrograms);
      filtered = filtered.map((college): CollegeWithPrograms => {
        if (college.isBhutanCollege) {
          return {
            ...college,
            programsList: programs.filter((p: Program) => p.collegeId === college.id),
          };
        }
        return college;
      });
    }

    return successResponse({ colleges: filtered });
  } catch (error) {
    logger.error("Colleges retrieval error:", error);
    return errorResponse("Failed to retrieve colleges", 500);
  }
  },
  ['student', 'admin']
);
