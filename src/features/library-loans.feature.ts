/**
 * LIBRARY LOANS FEATURE
 *
 * Track library book loans
 */

import { defineFeature } from "@/lib/features/define-feature";

export const LibraryLoanFeature = defineFeature({
  name: "library-loans",
  tableName: "library_loans",

  schema: {
    id: { type: "text", required: true },
    bookId: { type: "text", required: true, reference: "library-books" },
    studentId: { type: "text", required: true, reference: "users" },
    loanDate: { type: "date", required: true },
    dueDate: { type: "date", required: true },
    returnDate: { type: "date" },
    status: { type: "select", options: ["borrowed", "returned", "overdue", "lost"] },
    fine: { type: "integer" },
    finePaid: { type: "boolean" },
    renewalCount: { type: "integer" },
    notes: { type: "text" },
    issuedBy: { type: "text", reference: "users" },
    isActive: { type: "boolean" },
    createdAt: { type: "timestamp" },
    updatedAt: { type: "timestamp" },
  },

  permissions: {
    read: ["admin", "school-admin", "teacher", "student", "parent"],
    create: ["admin", "school-admin"],
    update: ["admin", "school-admin"],
    delete: ["admin", "school-admin"],
  },

  ui: {
    title: "Library Loan",
    titlePlural: "Library Loans",
    basePath: "/library/loans",
    columns: [
      { key: "bookId", label: "Book" },
      { key: "studentId", label: "Student" },
      { key: "loanDate", label: "Borrowed" },
      { key: "dueDate", label: "Due Date" },
      { key: "status", label: "Status" },
    ],
  },

  actions: {
    returnBook: {
      handler: async (id: string | undefined, data: any, auth: any) => {
        const { db } = await import("@/lib/db");
        const { libraryLoans } = await import("@/lib/db/schema");
        const { eq } = await import("drizzle-orm");
        const { successResponse, notFoundResponse } = await import("@/lib/api/response-helpers");

        if (!id) {
          return { error: "Loan ID is required", status: 400 };
        }

        const [updated] = await db
          .update(libraryLoans)
          .set({
            status: "returned",
            returnDate: new Date().toISOString().split('T')[0],
            updatedAt: new Date(),
          })
          .where(eq(libraryLoans.id, id))
          .returning();

        if (!updated.length) {
          return notFoundResponse("Library Loan");
        }

        return successResponse({ data: updated[0] });
      },
      allowedRoles: ["admin", "school-admin"] as any[],
    },

    renew: {
      handler: async (id: string | undefined, data: any, auth: any) => {
        const { db } = await import("@/lib/db");
        const { libraryLoans } = await import("@/lib/db/schema");
        const { eq, and, sql } = await import("drizzle-orm");
        const { successResponse, notFoundResponse, badRequestResponse } = await import("@/lib/api/response-helpers");

        if (!id) {
          return { error: "Loan ID is required", status: 400 };
        }

        // Get current loan
        const [loan] = await db
          .select()
          .from(libraryLoans)
          .where(eq(libraryLoans.id, id))
          .limit(1);

        if (!loan) {
          return notFoundResponse("Library Loan");
        }

        if (loan.renewalCount >= 3) {
          return badRequestResponse("Maximum renewals reached");
        }

        // Calculate new due date (extend by 7 days)
        const currentDue = new Date(loan.dueDate);
        const newDue = new Date(currentDue);
        newDue.setDate(newDue.getDate() + 7);

        const [updated] = await db
          .update(libraryLoans)
          .set({
            dueDate: newDue.toISOString().split('T')[0],
            renewalCount: sql`${libraryLoans.renewalCount} + 1`,
            updatedAt: new Date(),
          })
          .where(eq(libraryLoans.id, id))
          .returning();

        return successResponse({ data: updated[0] });
      },
      allowedRoles: ["admin", "school-admin", "student"] as any[],
    },
  },
});
