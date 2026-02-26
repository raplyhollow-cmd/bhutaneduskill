/**
 * STUDENT ATTENDANCE API
 *
 * GET /api/student/attendance - Get student's attendance records
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 *
 * Returns attendance with statistics
 */

import { NextRequest } from "next/server";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { attendance as attendanceTable, users } from "@/lib/db/schema";
import { eq, and, desc, gte, lte } from "drizzle-orm";
import { createApiRoute, getAuth } from "@/lib/api/route-handler";
import { successResponse, errorResponse } from "@/lib/api/response-helpers";

// ============================================================================
// GET /api/student/attendance - Get student's attendance records
// ============================================================================

export const GET = createApiRoute(
  async (request: NextRequest) => {
    const auth = getAuth(request);
    if (!auth) {
      return errorResponse("Unauthorized", 401);
    }

    const { userId, user } = auth;

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const limit = parseInt(searchParams.get("limit") || "30");

    try {
      let conditions = [eq(attendanceTable.studentId, user.id)];

      if (startDate) {
        conditions.push(gte(attendanceTable.date, startDate));
      }
      if (endDate) {
        conditions.push(lte(attendanceTable.date, endDate));
      }

      // Get attendance records using db.select()
      const records = await db
        .select()
        .from(attendanceTable)
        .where(and(...conditions))
        .orderBy(desc(attendanceTable.date))
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

      // Transform records for frontend
      const attendance = records.map((r) => ({
        id: r.id,
        date: r.date,
        status: r.status,
        checkInTime: r.checkInTime,
        checkOutTime: r.checkOutTime || null,
        notes: r.notes,
        className: r.classId, // Will be enriched with join if needed
      }));

      return successResponse({ attendance, stats });
    } catch (error) {
      logger.error("Attendance fetch error:", error);
      return errorResponse("Failed to fetch attendance", 500);
    }
  },
  ['student']
);
