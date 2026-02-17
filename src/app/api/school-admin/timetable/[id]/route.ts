/**
 * SCHOOL ADMIN - TIMETABLE ENTRY API (Individual Entry)
 *
 * PATCH /api/school-admin/timetable/[id] - Update timetable entry
 * DELETE /api/school-admin/timetable/[id] - Delete timetable entry
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { requireAuth } from "@/lib/auth-utils";
import type { ApiSuccess, ApiErrorResponse } from "@/types";
import {
  users,
  classes,
  subjects,
  timetableEntries,
  rooms,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// ============================================================================
// TYPES
// ============================================================================

interface UpdateTimetableEntryRequest {
  subjectId?: string;
  teacherId?: string;
  roomId?: string | null;
  dayOfWeek?: string;
  periodId?: string;
  startTime?: string;
  endTime?: string;
  notes?: string;
  classId?: string;
}

// ============================================================================
// PATCH - Update timetable entry
// ============================================================================

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(["school-admin", "admin"]);
    if ("error" in authResult) {
      return NextResponse.json(
        { error: authResult.error, status: authResult.status } satisfies ApiErrorResponse,
        { status: authResult.status }
      );
    }

    const { userId } = authResult;
    const { id } = await params;
    const body = await req.json() as UpdateTimetableEntryRequest;

    // Check if entry exists
    const existingEntry = await db.query.timetableEntries.findFirst({
      where: eq(timetableEntries.id, id),
    });

    if (!existingEntry) {
      return NextResponse.json(
        { error: "Timetable entry not found", status: 404 } satisfies ApiErrorResponse,
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (body.subjectId) {
      const subject = await db.query.subjects.findFirst({
        where: eq(subjects.id, body.subjectId),
      });
      if (subject) {
        updateData.subjectId = body.subjectId;
        updateData.subjectName = subject.name;
      }
    }

    if (body.teacherId) {
      const teacher = await db.query.users.findFirst({
        where: eq(users.id, body.teacherId),
      });
      if (teacher) {
        updateData.teacherId = body.teacherId;
        updateData.teacherName = { firstName: teacher.firstName || "", lastName: teacher.lastName || "" };
      }
    }

    if (body.roomId !== undefined) {
      if (body.roomId) {
        const room = await db.query.rooms.findFirst({
          where: eq(rooms.id, body.roomId),
        });
        if (room) {
          updateData.roomId = body.roomId;
          updateData.roomName = { name: room.name, roomNumber: room.roomNumber || "" };
        }
      } else {
        updateData.roomId = null;
        updateData.roomName = { name: "", roomNumber: "" };
      }
    }

    if (body.dayOfWeek !== undefined) {
      updateData.dayOfWeek = body.dayOfWeek;
    }

    if (body.periodId !== undefined) {
      updateData.periodId = body.periodId;
    }

    if (body.startTime !== undefined) {
      updateData.startTime = body.startTime;
    }

    if (body.endTime !== undefined) {
      updateData.endTime = body.endTime;
    }

    if (body.notes !== undefined) {
      updateData.notes = body.notes;
    }

    if (body.classId !== undefined) {
      updateData.classId = body.classId;
    }

    // Update the entry
    await db.update(timetableEntries)
      .set(updateData)
      .where(eq(timetableEntries.id, id));

    logger.info("Timetable entry updated", {
      route: "/api/school-admin/timetable/[id]",
      method: "PATCH",
      userId,
      entryId: id,
    });

    return NextResponse.json({
      data: {
        message: "Timetable entry updated successfully",
      },
    } satisfies ApiSuccess<{ message: string }>);
  } catch (error) {
    logger.apiError(error, {
      route: "/api/school-admin/timetable/[id]",
      method: "PATCH",
    });

    return NextResponse.json(
      { error: "Failed to update timetable entry", status: 500 } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE - Delete timetable entry
// ============================================================================

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(["school-admin", "admin"]);
    if ("error" in authResult) {
      return NextResponse.json(
        { error: authResult.error, status: authResult.status } satisfies ApiErrorResponse,
        { status: authResult.status }
      );
    }

    const { userId } = authResult;
    const { id } = await params;

    // Check if entry exists
    const existingEntry = await db.query.timetableEntries.findFirst({
      where: eq(timetableEntries.id, id),
    });

    if (!existingEntry) {
      return NextResponse.json(
        { error: "Timetable entry not found", status: 404 } satisfies ApiErrorResponse,
        { status: 404 }
      );
    }

    // Delete the entry
    await db.delete(timetableEntries).where(eq(timetableEntries.id, id));

    logger.info("Timetable entry deleted", {
      route: "/api/school-admin/timetable/[id]",
      method: "DELETE",
      userId,
      entryId: id,
    });

    return NextResponse.json({
      data: {
        message: "Timetable entry deleted successfully",
      },
    } satisfies ApiSuccess<{ message: string }>);
  } catch (error) {
    logger.apiError(error, {
      route: "/api/school-admin/timetable/[id]",
      method: "DELETE",
    });

    return NextResponse.json(
      { error: "Failed to delete timetable entry", status: 500 } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}
