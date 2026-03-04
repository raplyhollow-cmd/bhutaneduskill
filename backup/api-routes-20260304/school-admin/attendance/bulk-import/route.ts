import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { attendance } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { createApiRoute } from "@/lib/api/route-handler";

interface AttendanceRecord {
  studentId: string;
  classId: string;
  date: string;
  status: string;
  notes?: string;
  reason?: string;
}

interface ImportRequest {
  records: AttendanceRecord[];
}

interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}

interface ImportResponse {
  results: ImportResult;
}

// POST /api/school-admin/attendance/bulk-import - CSV import of attendance
export const POST = createApiRoute<{}, ImportResponse>(
  async (req, { user, userId }) => {
    const body: ImportRequest = await req.json();
    const { records } = body;

    if (!Array.isArray(records)) {
      return { error: "Invalid data format", status: 400 };
    }

    const now = new Date();
    const results: ImportResult = {
      success: 0,
      failed: 0,
      errors: [],
    };

    // Process each record
    for (const record of records) {
      try {
        const { studentId, classId, date, status, notes, reason } = record;

        // Validate required fields
        if (!studentId || !classId || !date || !status) {
          results.failed++;
          results.errors.push(`Missing required fields for record ${JSON.stringify(record)}`);
          continue;
        }

        // Check for existing record
        const [existing] = await db
          .select()
          .from(attendance)
          .where(
            and(
              eq(attendance.classId, classId),
              eq(attendance.studentId, studentId),
              eq(attendance.date, date)
            )
          )
          .limit(1);

        if (existing) {
          // Update existing
          await db.update(attendance)
            .set({
              status,
              notes,
              reason,
              entryMethod: "csv_import",
              updatedAt: now,
            })
            .where(eq(attendance.id, existing.id));
        } else {
          // Create new
          await db.insert(attendance)
            .values({
              id: `att_${Date.now()}_${studentId}_${Math.random().toString(36).substring(2, 11)}`,
              schoolId: user.schoolId,
              classId,
              studentId,
              date,
              status,
              notes,
              reason,
              entryMethod: "csv_import",
              recordedBy: userId,
              createdAt: now,
              updatedAt: now,
            });
        }

        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push(`Failed to process record: ${error}`);
      }
    }

    return { data: { results } };
  },
  ['admin', 'school-admin']
);
