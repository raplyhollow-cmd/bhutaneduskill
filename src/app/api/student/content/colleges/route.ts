import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { colleges, rubPrograms } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

// GET /api/student/content/colleges - Discover colleges
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // "bhutan", "international"
    const careerCluster = searchParams.get("careerCluster");

    const allColleges = await db.query.colleges.findMany({
      where: eq(colleges.isActive, true),
      orderBy: [desc(colleges.createdAt)],
    });

    let filtered = allColleges;

    if (type === "bhutan") {
      filtered = allColleges.filter(c => c.isBhutanCollege);
    } else if (type === "international") {
      filtered = allColleges.filter(c => !c.isBhutanCollege);
    }

    // Get programs for Bhutan colleges
    if (type === "bhutan" || !type) {
      const bhutanCollegeIds = filtered
        .filter(c => c.bhutanCollegeType === "rub")
        .map(c => c.id);

      const programs = await db.query.rubPrograms.findMany();
      filtered = filtered.map(college => {
        if (college.isBhutanCollege) {
          return {
            ...college,
            programsList: programs.filter(p => p.collegeId === college.id),
          };
        }
        return college;
      });
    }

    return NextResponse.json({ colleges: filtered });
  } catch (error) {
    console.error("Colleges discovery error:", error);
    return NextResponse.json({ error: "Failed to discover colleges" }, { status: 500 });
  }
}
