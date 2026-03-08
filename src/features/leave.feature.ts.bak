/**
 * LEAVE FEATURE
 *
 * Student and teacher leave request management
 * Supports: sick, vacation, emergency, family, casual, official, other
 */

import { defineFeature } from "@/lib/features/define-feature";
import { z } from "zod";

export const LeaveFeature = defineFeature({
  name: "leave-requests",
  tableName: "leave_requests",

  schema: {
    id: { type: "text", required: true },
    studentId: { type: "text", reference: "users" },
    schoolId: { type: "text", reference: "schools" },
    applicantId: { type: "text", required: true, reference: "users" },
    applicantType: { type: "select", options: ["student", "teacher", "staff"] },
    type: { type: "select", options: ["sick", "vacation", "emergency", "family", "casual", "official", "other"] },
    startDate: { type: "date", required: true },
    endDate: { type: "date", required: true },
    reason: { type: "text", multiline: true },
    status: { type: "select", options: ["pending", "approved", "rejected", "cancelled"] },
    approvedBy: { type: "text", reference: "users" },
    approvedAt: { type: "timestamp" },
    rejectionReason: { type: "text", multiline: true },
    substituteTeacherId: { type: "text", reference: "users" },
    leaveHandoverNotes: { type: "text", multiline: true },
    documents: { type: "json" },
    createdAt: { type: "timestamp" },
    updatedAt: { type: "timestamp" },
  },

  permissions: {
    read: ["admin", "school-admin", "teacher", "student", "parent"],
    create: ["admin", "school-admin", "teacher", "student"],
    update: ["admin", "school-admin"],
    delete: ["admin", "school-admin"],
  },

  ui: {
    title: "Leave Request",
    titlePlural: "Leave Requests",
    basePath: "/leave",
    columns: [
      { key: "applicantId", label: "Applicant" },
      { key: "type", label: "Leave Type" },
      { key: "startDate", label: "Start Date" },
      { key: "endDate", label: "End Date" },
      { key: "status", label: "Status" },
      { key: "createdAt", label: "Created" },
    ],
  },

  // Custom actions for leave management
  actions: {
    // Approve a leave request (admin/school-admin only)
    approve: {
      handler: async ({ db, params, auth, schema }) => {
        const { id } = params;
        const { substituteTeacherId, leaveHandoverNotes } = params.body || {};

        const leaveRequest = await db
          .select()
          .from(schema)
          .where((eq: any) => eq(schema.id, id))
          .limit(1)
          .then(r => r[0]);

        if (!leaveRequest) {
          return { error: "Leave request not found", status: 404 };
        }

        if (leaveRequest.status !== "pending") {
          return { error: "Can only approve pending leave requests", status: 400 };
        }

        const updated = await db
          .update(schema)
          .set({
            status: "approved",
            approvedBy: auth.userId,
            approvedAt: new Date(),
            substituteTeacherId: substituteTeacherId || leaveRequest.substituteTeacherId,
            leaveHandoverNotes: leaveHandoverNotes || leaveRequest.leaveHandoverNotes,
            updatedAt: new Date(),
          })
          .where((eq: any) => eq(schema.id, id))
          .returning();

        return { success: true, data: updated[0] };
      },
      method: "POST",
      permission: ["admin", "school-admin"],
      bodySchema: z.object({
        substituteTeacherId: z.string().optional(),
        leaveHandoverNotes: z.string().optional(),
      }),
    },

    // Reject a leave request (admin/school-admin only)
    reject: {
      handler: async ({ db, params, auth, schema }) => {
        const { id } = params;
        const { rejectionReason } = params.body || {};

        if (!rejectionReason) {
          return { error: "Rejection reason is required", status: 400 };
        }

        const leaveRequest = await db
          .select()
          .from(schema)
          .where((eq: any) => eq(schema.id, id))
          .limit(1)
          .then(r => r[0]);

        if (!leaveRequest) {
          return { error: "Leave request not found", status: 404 };
        }

        if (leaveRequest.status !== "pending") {
          return { error: "Can only reject pending leave requests", status: 400 };
        }

        const updated = await db
          .update(schema)
          .set({
            status: "rejected",
            approvedBy: auth.userId,
            approvedAt: new Date(),
            rejectionReason,
            updatedAt: new Date(),
          })
          .where((eq: any) => eq(schema.id, id))
          .returning();

        return { success: true, data: updated[0] };
      },
      method: "POST",
      permission: ["admin", "school-admin"],
      bodySchema: z.object({
        rejectionReason: z.string().min(1, "Rejection reason is required"),
      }),
    },

    // Cancel a leave request (owner or admin only)
    cancel: {
      handler: async ({ db, params, auth, schema }) => {
        const { id } = params;

        const leaveRequest = await db
          .select()
          .from(schema)
          .where((eq: any) => eq(schema.id, id))
          .limit(1)
          .then(r => r[0]);

        if (!leaveRequest) {
          return { error: "Leave request not found", status: 404 };
        }

        const isAdmin = auth.role === "school-admin" || auth.role === "admin";
        const isOwner = leaveRequest.applicantId === auth.userId;

        if (!isOwner && !isAdmin) {
          return { error: "You don't have permission to cancel this leave request", status: 403 };
        }

        if (leaveRequest.status !== "pending") {
          return { error: "Can only cancel pending leave requests", status: 400 };
        }

        const updated = await db
          .update(schema)
          .set({
            status: "cancelled",
            updatedAt: new Date(),
          })
          .where((eq: any) => eq(schema.id, id))
          .returning();

        return { success: true, data: updated[0] };
      },
      method: "POST",
      permission: ["admin", "school-admin", "teacher", "student"],
    },

    // Get leave balance for a user
    getBalance: {
      handler: async ({ db, auth, params, schema }) => {
        const { userId, year } = params;

        const targetUserId = userId || auth.userId;
        const targetYear = year || new Date().getFullYear().toString();

        // Get all approved leave requests for the user in the given year
        const { eq, and, desc } = await import("drizzle-orm");

        const approvedLeaves = await db
          .select()
          .from(schema)
          .where(
            and(
              eq(schema.applicantId, targetUserId),
              eq(schema.status, "approved")
            )
          )
          .orderBy(desc(schema.createdAt));

        // Filter by year and calculate days used
        const yearNumber = parseInt(targetYear, 10);
        const usedByType: Record<string, number> = {};

        for (const leave of approvedLeaves) {
          const leaveYear = new Date(leave.startDate as string).getFullYear();
          if (leaveYear === yearNumber) {
            const start = new Date(leave.startDate as string);
            const end = new Date(leave.endDate as string);
            const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
            usedByType[leave.type as string] = (usedByType[leave.type as string] || 0) + days;
          }
        }

        // Default leave balances by type
        const DEFAULT_LEAVE_BALANCE: Record<string, number> = {
          sick: 10,
          vacation: 15,
          emergency: 5,
          family: 7,
          other: 5,
          casual: 10,
          official: 30,
        };

        // Calculate remaining for each type
        const byType: Record<string, { total: number; used: number; remaining: number }> = {};
        let totalUsed = 0;
        let totalRemaining = 0;

        for (const [type, defaultValue] of Object.entries(DEFAULT_LEAVE_BALANCE)) {
          const used = usedByType[type] || 0;
          const remaining = Math.max(0, defaultValue - used);
          byType[type] = {
            total: defaultValue,
            used,
            remaining,
          };
          totalUsed += used;
          totalRemaining += remaining;
        }

        return {
          success: true,
          data: {
            total: Object.values(DEFAULT_LEAVE_BALANCE).reduce((a, b) => a + b, 0),
            used: totalUsed,
            remaining: totalRemaining,
            byType,
          },
        };
      },
      method: "GET",
      permission: ["admin", "school-admin", "teacher", "student"],
    },
  },

  // Public handlers for student/teacher portal access
  publicHandlers: {
    // Get my leave requests
    getMyRequests: async ({ db, auth, schema }) => {
      const { eq, desc, and } = await import("drizzle-orm");

      const isAdmin = auth.role === "school-admin" || auth.role === "admin";

      let whereClause;
      if (isAdmin && auth.schoolId) {
        // Admins see all leave requests for their school
        whereClause = eq(schema.schoolId, auth.schoolId);
      } else {
        // Students/teachers see only their own
        whereClause = eq(schema.applicantId, auth.userId);
      }

      const requests = await db
        .select()
        .from(schema)
        .where(whereClause)
        .orderBy(desc(schema.createdAt));

      return { success: true, data: requests };
    },

    // Create leave request
    createRequest: async ({ db, auth, schema, body }) => {
      const { nanoid } = await import("nanoid");

      const { type, reason, startDate, endDate, documents } = body;

      // Validate dates
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (end < start) {
        return { error: "End date must be after start date", status: 400 };
      }

      const leaveId = `leave_${nanoid()}`;

      const [created] = await db
        .insert(schema)
        .values({
          id: leaveId,
          schoolId: auth.schoolId || null,
          applicantId: auth.userId,
          applicantType: auth.type,
          type,
          startDate,
          endDate,
          reason,
          status: "pending",
          documents: documents || [],
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      return { success: true, data: created };
    },
  },
});

// Also export as LeaveRequest for compatibility
export { LeaveFeature as LeaveRequestFeature };
