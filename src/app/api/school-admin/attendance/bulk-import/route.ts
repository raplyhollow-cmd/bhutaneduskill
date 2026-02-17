import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { attendance, users, classes } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "@/lib/auth-utils";

// POST /api/school-admin/attendance/bulk-import - CSV import of attendance
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(['admin', 'school-admin']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { userId, user } = authResult;

    const body = await request.json();
    const { records } = body; // Array of attendance records

    if (!Array.isArray(records)) {
      return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
    }

    const now = new Date();
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
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
        const existing = await db.query.attendance.findFirst({
          where: and(
            eq(attendance.classId, classId),
            eq(attendance.studentId, studentId),
            eq(attendance.date, date)
          ),
        });

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

    return NextResponse.json({ results }, { status: results.failed > 0 ? 207 : 201 });
  } catch (error) {
    console.error("Bulk import error:", error);
    return NextResponse.json({ error: "Failed to import attendance" }, { status: 500 });
  }
}
