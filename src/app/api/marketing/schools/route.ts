import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { schools, users } from "@/lib/db/schema";
import { desc, count, sql, eq, and } from "drizzle-orm";

/**
 * GET /api/marketing/schools - Get schools for marketing display
 *
 * Returns schools ordered by student count (most active first)
 */
export async function GET(request: NextRequest) {
  try {
    // Get schools with student counts
    const schoolsData = await db.query.schools.findMany({
      orderBy: [desc(schools.createdAt)],
      limit: 8,
      columns: {
        id: true,
        name: true,
        schoolType: true,
        level: true,
        city: true,
        createdAt: true
      }
    });

    // Format schools for display
    const formattedSchools = await Promise.all(
      schoolsData.map(async (school) => {
        // Get student count for this school
        const studentCountResult = await db
          .select({ count: count() })
          .from(users)
          .where(
            and(
              eq(users.schoolId, school.id),
              eq(users.type, "student")
            )
          );

        return {
          id: school.id,
          name: school.name || "Unknown School",
          students: studentCountResult[0]?.count || 0,
        };
      })
    );

    return NextResponse.json({
      schools: formattedSchools
    });
  } catch (error) {
    console.error("Error fetching marketing schools:", error);
    // Return empty array on error instead of showing fake data
    return NextResponse.json({ schools: [] }, { status: 200 });
  }
}
