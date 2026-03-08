/**
 * LEAVE FEATURE
 *
 * Student and teacher leave request management
 * Supports: sick, vacation, emergency, family, casual, official, other
 */

import { defineFeature } from "@/lib/features/define-feature";
import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";

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
      handler: async (id: string | undefined, data: any, auth: any) => {
        const { db } = await import("@/lib/db");
        const { leave } = await import("@/lib/db/schema") as any;
        const { eq, and } = await import("drizzle-orm");
        const { nanoid } = await import("nanoid");
        const { successResponse } = await import("@/lib/api/response-helpers");
        const { notFoundResponse } = await import("@/lib/api/response-helpers");

        if (!id) {
          return { error: "Leave request ID is required", status: 400 };
        }

        const { substituteTeacherId, leaveHandoverNotes } = data || {};

        const leaveRequest = await db
          .select()
          .from(leave)
          .where(eq(leave.id, id))
          .limit(1)
          .then(r => r[0]);

        if (!leaveRequest) {
          return notFoundResponse("Leave request");
        }

        if (leaveRequest.status !== "pending") {
          return { error: "Can only approve pending leave requests", status: 400 };
        }

        const updated = await db
          .update(leave)
          .set({
            status: "approved",
            approvedBy: auth.userId,
            approvedAt: new Date(),
            substituteTeacherId: substituteTeacherId || leaveRequest.substituteTeacherId,
            leaveHandoverNotes: leaveHandoverNotes || leaveRequest.leaveHandoverNotes,
            updatedAt: new Date(),
          })
          .where(eq(leave.id, id))
          .returning();

        return successResponse({ data: updated[0] });
      },
      allowedRoles: ["admin", "school-admin"] as any[],
    },

    // Reject a leave request (admin/school-admin only)
    reject: {
      handler: async (context) => {
        const { db, params, auth, schema } = context;
        const { id } = params;
        const { rejectionReason } = params.body || {};

        if (!rejectionReason) {
          return { error: "Rejection reason is required", status: 400 };
        }

        const leaveRequest = await db
          .select()
          .from(schema)
          .where(eq(schema.id, id))
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
          .where(eq(schema.id, id))
          .returning();

        return { success: true, data: updated[0] };
      },
      allowedRoles: ["admin", "school-admin"] as any[],
    },

    // Cancel a leave request (owner or admin only)
    cancel: {
      handler: async (context) => {
        const { db, params, auth, schema } = context;
        const { id } = params;

        const leaveRequest = await db
          .select()
          .from(schema)
          .where(eq(schema.id, id))
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
          .where(eq(schema.id, id))
          .returning();

        return { success: true, data: updated[0] };
      },
      allowedRoles: ["admin", "school-admin", "teacher", "student"] as any[],
    },

    // Get leave balance for a user
    getBalance: {
      handler: async (context) => {
        const { db, auth, params, schema } = context;
        const { userId, year } = params;

        const targetUserId = userId || auth.userId;
        const targetYear = year || new Date().getFullYear().toString();

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
      allowedRoles: ["admin", "school-admin", "teacher", "student"] as any[],
    },
  },

});

// Also export as LeaveRequest for compatibility
export { LeaveFeature as LeaveRequestFeature };
