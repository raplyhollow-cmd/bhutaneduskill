/**
import { sql } from "drizzle-orm";
 * FEES FEATURE DEFINITION
 */

import { defineFeature } from "@/lib/features/define-feature";

export const FeeFeature = defineFeature({
  name: "fees",
  tableName: "fees",

  schema: {
    id: { type: "text", required: true, primary: true },
    name: { type: "text", required: true, label: "Fee Name", sortable: true, searchable: true },
    feeType: { type: "enum", options: ["tuition", "transport", "library", "lab", "sports", "other"], label: "Type", filterable: true },
    amount: { type: "float", required: true, label: "Amount", sortable: true },
    currency: { type: "text", defaultValue: "BTN", label: "Currency" },
    classId: { type: "reference", reference: { table: "classes", onDelete: "set null" }, label: "Class" },
    schoolId: { type: "reference", reference: { table: "schools", onDelete: "cascade" } },
    dueDate: { type: "date", label: "Due Date", sortable: true },
    academicYear: { type: "text", label: "Academic Year", filterable: true },
    term: { type: "enum", options: ["term1", "term2", "term3", "annual"], label: "Term", filterable: true },
    isRecurring: { type: "boolean", defaultValue: false, label: "Recurring" },
    isActive: { type: "boolean", defaultValue: true, filterable: true },
    createdAt: { type: "timestamp", sortable: true },
    updatedAt: { type: "timestamp", sortable: true },
  },

  permissions: {
    read: ["school-admin", "teacher", "student", "parent"],
    create: ["school-admin"],
    update: ["school-admin"],
    delete: ["school-admin"],
  },

  ui: {
    title: "Fee",
    titlePlural: "Fees",
    basePath: "/school-admin/fees",
    columns: [
      { key: "name", label: "Fee Name", sortable: true },
      { key: "feeType", label: "Type", filterable: true },
      { key: "amount", label: "Amount", sortable: true },
      { key: "className", label: "Class" },
      { key: "dueDate", label: "Due Date", type: "date" },
      { key: "term", label: "Term", filterable: true },
      { key: "isActive", label: "Active", type: "boolean" },
    ],
  },

  customHandlers: {
    list: async (params: any, auth: any) => {
      const { db } = await import("@/lib/db");
      const { fees, classes } = await import("@/lib/db/schema");
      const { eq, and, desc, sql } = await import("drizzle-orm");

      const { page = "1", limit = "20", feeType, term, isActive } = params;
      const offset = (parseInt(page) - 1) * parseInt(limit);

      const conditions = [];
      if (auth.user?.schoolId) conditions.push(eq(fees.schoolId, auth.user.schoolId));
      if (feeType) conditions.push(eq(fees.feeType, feeType));
      if (term) conditions.push(eq(fees.term, term));
      if (isActive !== undefined) conditions.push(eq(fees.isActive, isActive === "true"));

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const data = await db
        .select({
          id: fees.id,
          name: fees.name,
          feeType: fees.feeType,
          amount: fees.amount,
          currency: fees.currency,
          dueDate: fees.dueDate,
          academicYear: fees.academicYear,
          term: fees.term,
          isRecurring: fees.isRecurring,
          isActive: fees.isActive,
          createdAt: fees.createdAt,
          className: classes.name,
        })
        .from(fees)
        .leftJoin(classes, eq(fees.classId, classes.id))
        .where(whereClause)
        .orderBy(desc(fees.createdAt))
        .limit(parseInt(limit))
        .offset(offset);

      const [{ count }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(fees)
        .where(whereClause);

      return {
        success: true,
        data: { data, pagination: { total: count, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(count / parseInt(limit)) } },
      };
    },
  },
});
