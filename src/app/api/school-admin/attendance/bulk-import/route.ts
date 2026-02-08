import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { attendance, users, classes } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

// POST /api/school-admin/attendance/bulk-import - CSV import of attendance
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { records } = body; // Array of attendance records

    if (!Array.isArray(records)) {
      return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
    }

    const currentUser = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
    });

    if (!currentUser || currentUser.type !== "admin") {
      return NextResponse.json({ error: "Forbidden - Admins only" }, { status: 403 });
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
              enteredBy: currentUser.id,
              updatedAt: now,
            })
            .where(eq(attendance.id, existing.id));
        } else {
          // Create new
          await db.insert(attendance)
            .values({
              id: `att_${Date.now()}_${studentId}_${Math.random().toString(36).substr(2, 9)}`,
              schoolId: currentUser.schoolId,
              classId,
              studentId,
              date,
              status,
              notes,
              reason,
              entryMethod: "csv_import",
              enteredBy: currentUser.id,
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
