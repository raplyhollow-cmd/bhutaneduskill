/**
 * SCHOOL ADMIN - TIMETABLE ENTRY API (Individual Entry)
 *
 * PATCH /api/school-admin/timetable/[id] - Update timetable entry
 * DELETE /api/school-admin/timetable/[id] - Delete timetable entry
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import type { ApiSuccess } from "@/types";
import {
  users,
  classes,
  subjects,
  timetableEntries,
  rooms,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { createApiRoute } from "@/lib/api/route-handler";

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

export const PATCH = createApiRoute(
  async (req: NextRequest, auth, { params }: { params?: Promise<{ id: string }> }) => {
    const { userId } = auth;
    const { id } = await params!;
    const body = await req.json() as UpdateTimetableEntryRequest;

    // Check if entry exists
    const existingEntry = await db.select().from(timetableEntries).where(eq(timetableEntries.id, id)).limit(1).then(r => r[0]);

    if (!existingEntry) {
      return { error: "Timetable entry not found", status: 404 };
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (body.subjectId) {
      const subject = await db.select().from(subjects).where(eq(subjects.id, body.subjectId)).limit(1).then(r => r[0]);
      if (subject) {
        updateData.subjectId = body.subjectId;
        updateData.subjectName = subject.name;
      }
    }

    if (body.teacherId) {
      const teacher = await db.select().from(users).where(eq(users.id, body.teacherId)).limit(1).then(r => r[0]);
      if (teacher) {
        updateData.teacherId = body.teacherId;
        updateData.teacherName = { firstName: teacher.firstName || "", lastName: teacher.lastName || "" };
      }
    }

    if (body.roomId !== undefined) {
      if (body.roomId) {
        const room = await db.select().from(rooms).where(eq(rooms.id, body.roomId)).limit(1).then(r => r[0]);
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

    return {
      data: {
        message: "Timetable entry updated successfully",
      },
    } satisfies ApiSuccess<{ message: string }>;
  },
  ["school-admin", "admin"]
);

// ============================================================================
// DELETE - Delete timetable entry
// ============================================================================

export const DELETE = createApiRoute(
  async (req: NextRequest, auth, { params }: { params?: Promise<{ id: string }> }) => {
    const { userId } = auth;
    const { id } = await params!;

    // Check if entry exists
    const existingEntry = await db.select().from(timetableEntries).where(eq(timetableEntries.id, id)).limit(1).then(r => r[0]);

    if (!existingEntry) {
      return { error: "Timetable entry not found", status: 404 };
    }

    // Delete the entry
    await db.delete(timetableEntries).where(eq(timetableEntries.id, id));

    logger.info("Timetable entry deleted", {
      route: "/api/school-admin/timetable/[id]",
      method: "DELETE",
      userId,
      entryId: id,
    });

    return {
      data: {
        message: "Timetable entry deleted successfully",
      },
    } satisfies ApiSuccess<{ message: string }>;
  },
  ["school-admin", "admin"]
);
