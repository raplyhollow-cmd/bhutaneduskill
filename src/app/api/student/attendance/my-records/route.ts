import { NextRequest } from "next/server";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { attendance, users } from "@/lib/db/schema";
import { eq, and, desc, gte, lte } from "drizzle-orm";
import { createApiRoute } from "@/lib/api/route-handler";

/**
 * GET /api/student/attendance/my-records - Get own attendance records
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 */
export const GET = createApiRoute(
  async (request: NextRequest, auth) => {
    const { userId, user } = auth;

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const limit = parseInt(searchParams.get("limit") || "30");

    let conditions = [eq(attendance.studentId, user.id)];

    if (startDate) {
      conditions.push(gte(attendance.date, startDate));
    }
    if (endDate) {
      conditions.push(lte(attendance.date, endDate));
    }

    // Use db.select instead of db.query (neon-http compatible)
    const records = await db
      .select()
      .from(attendance)
      .where(and(...conditions))
      .orderBy(desc(attendance.date))
      .limit(limit);

    // Calculate statistics
    const stats = {
      total: records.length,
      present: records.filter(r => r.status === "present").length,
      absent: records.filter(r => r.status === "absent").length,
      late: records.filter(r => r.status === "late").length,
      excused: records.filter(r => r.status === "excused").length,
      sickLeave: records.filter(r => r.status === "sick_leave").length,
      percentage: records.length > 0
        ? Math.round((records.filter(r => r.status === "present" || r.status === "excused").length / records.length) * 100)
        : 0,
    };

    return { records, stats };
  },
  ["student"]
);
