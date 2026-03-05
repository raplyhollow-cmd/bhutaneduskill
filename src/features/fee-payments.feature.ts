/**
 * FEE PAYMENTS FEATURE DEFINITION
 */

import { defineFeature } from "@/lib/features/define-feature";

export const FeePaymentFeature = defineFeature({
  name: "fee-payments",
  tableName: "fee_payments",

  schema: {
    id: { type: "text", required: true, primary: true },
    studentId: { type: "reference", reference: { table: "users", onDelete: "cascade" }, required: true, label: "Student" },
    feeId: { type: "reference", reference: { table: "fees", onDelete: "cascade" }, required: true, label: "Fee" },
    schoolId: { type: "reference", reference: { table: "schools", onDelete: "cascade" } },
    amount: { type: "float", required: true, label: "Amount", sortable: true },
    paymentDate: { type: "date", required: true, label: "Payment Date", sortable: true },
    paymentMethod: { type: "enum", options: ["cash", "bank_transfer", "online", "cheque"], label: "Method", filterable: true },
    transactionId: { type: "text", label: "Transaction ID" },
    status: { type: "enum", options: ["pending", "completed", "failed", "refunded"], label: "Status", filterable: true },
    receiptNumber: { type: "text", label: "Receipt" },
    remarks: { type: "text", multiline: true },
    collectedBy: { type: "reference", reference: { table: "users", onDelete: "set null" } },
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
    title: "Fee Payment",
    titlePlural: "Fee Payments",
    basePath: "/school-admin/fee-payments",
    columns: [
      { key: "studentName", label: "Student" },
      { key: "feeName", label: "Fee Type" },
      { key: "amount", label: "Amount", sortable: true },
      { key: "paymentDate", label: "Date", type: "date", sortable: true },
      { key: "paymentMethod", label: "Method", filterable: true },
      { key: "status", label: "Status", filterable: true },
      { key: "receiptNumber", label: "Receipt" },
    ],
  },

  customHandlers: {
    list: async (params: any, auth: any) => {
      const { db } = await import("@/lib/db");
      const { feePayments, users, fees } = await import("@/lib/db/schema");
      const { eq, and, desc, sql } = await import("drizzle-orm");

      const { page = "1", limit = "20", studentId, status, paymentMethod } = params;
      const offset = (parseInt(page) - 1) * parseInt(limit);

      const conditions = [];
      if (auth.user?.schoolId) conditions.push(eq(feePayments.schoolId, auth.user.schoolId));
      if (studentId) conditions.push(eq(feePayments.studentId, studentId));
      if (status) conditions.push(eq(feePayments.status, status));
      if (paymentMethod) conditions.push(eq(feePayments.paymentMethod, paymentMethod));

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const data = await db
        .select({
          id: feePayments.id,
          studentId: feePayments.studentId,
          feeId: feePayments.feeId,
          amount: feePayments.amount,
          paymentDate: feePayments.paymentDate,
          paymentMethod: feePayments.paymentMethod,
          status: feePayments.status,
          receiptNumber: feePayments.receiptNumber,
          createdAt: feePayments.createdAt,
          studentName: sql<string>`concat(${users.firstName}, ' ', ${users.lastName})`,
          feeName: fees.name,
        })
        .from(feePayments)
        .innerJoin(users, eq(feePayments.studentId, users.id))
        .innerJoin(fees, eq(feePayments.feeId, fees.id))
        .where(whereClause)
        .orderBy(desc(feePayments.paymentDate))
        .limit(parseInt(limit))
        .offset(offset);

      const [{ count }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(feePayments)
        .where(whereClause);

      return {
        success: true,
        data: { data, pagination: { total: count, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(count / parseInt(limit)) } },
      };
    },
  },
});
