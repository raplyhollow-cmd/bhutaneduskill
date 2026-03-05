/**
 * LIBRARY FINES FEATURE
 *
 * Track library fines for overdue/lost books
 */

import { defineFeature } from "@/lib/features/define-feature";

export const LibraryFineFeature = defineFeature({
  name: "library-fines",
  tableName: "library_fines",

  schema: {
    id: { type: "text", required: true },
    loanId: { type: "text", required: true, reference: "library-loans" },
    studentId: { type: "text", required: true, reference: "users" },
    bookId: { type: "text", reference: "library-books" },
    amount: { type: "integer", required: true },
    reason: { type: "text", required: true }, // overdue, lost, damaged
    daysOverdue: { type: "integer" },
    ratePerDay: { type: "integer" },
    status: { type: "select", options: ["pending", "paid", "waived"] },
    paidAt: { type: "timestamp" },
    paidBy: { type: "text", reference: "users" },
    waivedBy: { type: "text", reference: "users" },
    waivedAt: { type: "timestamp" },
    waiveReason: { type: "text" },
    notes: { type: "text", multiline: true },
    isActive: { type: "boolean" },
    createdAt: { type: "timestamp" },
    updatedAt: { type: "timestamp" },
  },

  permissions: {
    read: ["admin", "school-admin", "teacher", "student", "parent"],
    create: ["admin", "school-admin"],
    update: ["admin", "school-admin"],
    delete: ["admin"],
  },

  ui: {
    title: "Library Fine",
    titlePlural: "Library Fines",
    basePath: "/library/fines",
    columns: [
      { key: "studentId", label: "Student" },
      { key: "bookId", label: "Book" },
      { key: "amount", label: "Amount" },
      { key: "reason", label: "Reason" },
      { key: "status", label: "Status" },
    ],
  },

  actions: {
    pay: {
      handler: async (id: string | undefined, data: any, auth: any) => {
        const { db } = await import("@/lib/db");
        const { libraryFines } = await import("@/lib/db/schema");
        const { eq } = await import("drizzle-orm");
        const { successResponse, notFoundResponse } = await import("@/lib/api/response-helpers");

        if (!id) {
          return { error: "Fine ID is required", status: 400 };
        }

        const [updated] = await db
          .update(libraryFines)
          .set({
            status: "paid",
            paidAt: new Date(),
            paidBy: auth.userId,
            updatedAt: new Date(),
          })
          .where(eq(libraryFines.id, id))
          .returning();

        if (!updated.length) {
          return notFoundResponse("Library Fine");
        }

        return successResponse({ data: updated[0] });
      },
      allowedRoles: ["admin", "school-admin", "student"] as any[],
    },

    waive: {
      handler: async (id: string | undefined, data: any, auth: any) => {
        const { db } = await import("@/lib/db");
        const { libraryFines } = await import("@/lib/db/schema");
        const { eq } = await import("drizzle-orm");
        const { successResponse, notFoundResponse } = await import("@/lib/api/response-helpers");

        if (!id) {
          return { error: "Fine ID is required", status: 400 };
        }

        const { waiveReason } = data;

        const [updated] = await db
          .update(libraryFines)
          .set({
            status: "waived",
            waivedBy: auth.userId,
            waivedAt: new Date(),
            waiveReason,
            updatedAt: new Date(),
          })
          .where(eq(libraryFines.id, id))
          .returning();

        if (!updated.length) {
          return notFoundResponse("Library Fine");
        }

        return successResponse({ data: updated[0] });
      },
      allowedRoles: ["admin", "school-admin"] as any[],
    },
  },
});
