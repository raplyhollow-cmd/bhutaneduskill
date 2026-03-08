/**
 * SCHEDULE EXCEPTIONS FEATURE
 *
 * Handle timetable exceptions and substitutions
 */

import { defineFeature } from "@/lib/features/define-feature";

export const ScheduleExceptionFeature = defineFeature({
  name: "schedule-exceptions",
  tableName: "schedule_exceptions",

  schema: {
    id: { type: "text", required: true },
    timetableId: { type: "text", required: true, reference: "timetables" },
    date: { type: "date", required: true },
    reason: { type: "text", required: true },
    substituteTeacherId: { type: "text", reference: "users" },
    originalTeacherId: { type: "text", reference: "users" },
    classId: { type: "text", reference: "classes" },
    subjectId: { type: "text", reference: "subjects" },
    slotId: { type: "text", reference: "timetable-slots" },
    notes: { type: "text", multiline: true },
    status: { type: "select", options: ["pending", "approved", "cancelled", "completed"] },
    requestedBy: { type: "text", reference: "users" },
    approvedBy: { type: "text", reference: "users" },
    approvedAt: { type: "timestamp" },
    isActive: { type: "boolean" },
    createdAt: { type: "timestamp" },
    updatedAt: { type: "timestamp" },
  },

  permissions: {
    read: ["admin", "school-admin", "teacher", "student", "parent"],
    create: ["admin", "school-admin", "teacher"],
    update: ["admin", "school-admin", "teacher"],
    delete: ["admin", "school-admin"],
  },

  ui: {
    title: "Schedule Exception",
    titlePlural: "Schedule Exceptions",
    basePath: "/schedule-exceptions",
    columns: [
      { key: "date", label: "Date" },
      { key: "classId", label: "Class" },
      { key: "reason", label: "Reason" },
      { key: "status", label: "Status" },
      { key: "substituteTeacherId", label: "Substitute" },
    ],
  },

  actions: {
    approve: {
      handler: async (context: { db: any; params: any; auth: any; schema: any; request?: Request }) => {
        const { db } = await import("@/lib/db");
        const { scheduleExceptions } = await import("@/lib/db/schema") as any;
        const { eq } = await import("drizzle-orm");
        const { successResponse, notFoundResponse } = await import("@/lib/api/response-helpers");
        if (!context.params?.id) {
          return { error: "Exception ID is required", status: 400 };
        }

        const [updated] = await db
          .update(scheduleExceptions)
          .set({
            status: "approved",
            approvedBy: context.auth.userId,
            approvedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(scheduleExceptions.id, context.params.id))
          .returning();

        if (!updated.length) {
          return notFoundResponse("Schedule Exception");
        }

        return successResponse({ data: updated[0] });
      },
      allowedRoles: ["admin", "school-admin"] as any[],
    },

    cancel: {
      handler: async (context: { db: any; params: any; auth: any; schema: any; request?: Request }) => {
        const { db } = await import("@/lib/db");
        const { scheduleExceptions } = await import("@/lib/db/schema") as any;
        const { eq } = await import("drizzle-orm");
        const { successResponse, notFoundResponse } = await import("@/lib/api/response-helpers");
        if (!context.params?.id) {
          return { error: "Exception ID is required", status: 400 };
        }

        const [updated] = await db
          .update(scheduleExceptions)
          .set({
            status: "cancelled",
            updatedAt: new Date(),
          })
          .where(eq(scheduleExceptions.id, context.params.id))
          .returning();

        if (!updated.length) {
          return notFoundResponse("Schedule Exception");
        }

        return successResponse({ data: updated[0] });
      },
      allowedRoles: ["admin", "school-admin", "teacher"] as any[],
    },
  },
});
