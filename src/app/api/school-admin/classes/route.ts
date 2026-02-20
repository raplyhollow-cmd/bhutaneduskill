import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { users, classes } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { logger } from "@/lib/logger";

/**
 * GET /api/school-admin/classes
 * Fetch classes for the school admin's school
 */
export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAuth(["school_admin"]);
    if ("error" in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { userId } = authResult;

    // Get school admin's school ID
    const admin = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        schoolId: true,
      },
    });

    if (!admin?.schoolId) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    // Fetch active classes for this school
    const schoolClasses = await db.query.classes.findMany({
      where: eq(classes.schoolId, admin.schoolId),
      orderBy: [classes.grade, classes.section],
    });

    logger.info("Fetched classes for school admin", {
      schoolId: admin.schoolId,
      count: schoolClasses.length,
    });

    return NextResponse.json({ classes: schoolClasses });
  } catch (error) {
    logger.apiError(error, { route: "/api/school-admin/classes", method: "GET" });
    return NextResponse.json({ error: "Failed to fetch classes" }, { status: 500 });
  }
}
