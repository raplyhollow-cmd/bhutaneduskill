/**
 * INVOICES FEATURE DEFINITION
 */

import { defineFeature } from "@/lib/features/define-feature";

export const InvoiceFeature = defineFeature({
  name: "invoices",
  tableName: "invoices",

  schema: {
    id: { type: "text", required: true, primary: true },
    invoiceNumber: { type: "text", required: true, unique: true, label: "Invoice #", sortable: true },
    subscriptionId: { type: "reference", reference: { table: "subscriptions", onDelete: "cascade" }, label: "Subscription" },
    schoolId: { type: "reference", reference: { table: "schools", onDelete: "cascade" }, required: true, label: "School" },
    issueDate: { type: "date", required: true, label: "Issue Date", sortable: true },
    dueDate: { type: "date", label: "Due Date", sortable: true },
    amount: { type: "float", required: true, label: "Amount", sortable: true },
    currency: { type: "text", defaultValue: "BTN" },
    status: { type: "enum", options: ["draft", "sent", "paid", "overdue", "cancelled"], label: "Status", filterable: true },
    paidDate: { type: "date", label: "Paid Date" },
    paymentMethod: { type: "text", label: "Payment Method" },
    notes: { type: "text", multiline: true },
    createdAt: { type: "timestamp", sortable: true },
    updatedAt: { type: "timestamp", sortable: true },
  },

  permissions: {
    read: ["admin", "school-admin"],
    create: ["admin"],
    update: ["admin"],
    delete: ["admin"],
  },

  ui: {
    title: "Invoice",
    titlePlural: "Invoices",
    basePath: "/admin/invoices",
    columns: [
      { key: "invoiceNumber", label: "Invoice #", sortable: true },
      { key: "schoolName", label: "School" },
      { key: "amount", label: "Amount", sortable: true },
      { key: "issueDate", label: "Issue Date", type: "date" },
      { key: "dueDate", label: "Due Date", type: "date" },
      { key: "status", label: "Status", filterable: true },
    ],
  },

  customHandlers: {
    list: async (params: any, auth: any) => {
      const { db } = await import("@/lib/db");
      const { invoices, schools } = await import("@/lib/db/schema");
      const { eq, and, desc, sql } = await import("drizzle-orm");

      const { page = "1", limit = "20", status, schoolId } = params;
      const offset = (parseInt(page) - 1) * parseInt(limit);

      const conditions = [];
      if (status) conditions.push(eq(invoices.status, status));
      if (schoolId) conditions.push(eq(invoices.schoolId, schoolId));

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const data = await db
        .select({
          id: invoices.id,
          invoiceNumber: invoices.invoiceNumber,
          subscriptionId: invoices.subscriptionId,
          amount: invoices.amount,
          status: invoices.status,
          issueDate: invoices.issueDate,
          dueDate: invoices.dueDate,
          paidDate: invoices.paidDate,
          createdAt: invoices.createdAt,
          schoolName: schools.name,
        })
        .from(invoices)
        .innerJoin(schools, eq(invoices.schoolId, schools.id))
        .where(whereClause)
        .orderBy(desc(invoices.issueDate))
        .limit(parseInt(limit))
        .offset(offset);

      const [{ count }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(invoices)
        .where(whereClause);

      return {
        success: true,
        data: { data, pagination: { total: count, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(count / parseInt(limit)) } },
      };
    },
  },
});
