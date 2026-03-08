/**
 * AUDIT LOGS FEATURE DEFINITION
 */

import { defineFeature } from "@/lib/features/define-feature";

export const AuditLogFeature = defineFeature({
  name: "audit-logs",
  tableName: "audit_logs",

  schema: {
    id: { type: "text", required: true, primary: true },
    userId: { type: "reference", reference: { table: "users", onDelete: "set null" }, label: "User" },
    schoolId: { type: "reference", reference: { table: "schools", onDelete: "cascade" } },
    action: { type: "enum", options: ["create", "update", "delete", "view", "login", "logout", "export"], label: "Action", filterable: true },
    entityType: { type: "text", label: "Entity Type", filterable: true },
    entityId: { type: "text", label: "Entity ID" },
    changes: { type: "json", label: "Changes" },
    ipAddress: { type: "text", label: "IP Address" },
    userAgent: { type: "text", label: "User Agent" },
    timestamp: { type: "timestamp", label: "Timestamp", sortable: true },
  },

  permissions: {
    read: ["admin"],
    create: [],
    update: [],
    delete: ["admin"],
  },

  ui: {
    title: "Audit Log",
    titlePlural: "Audit Logs",
    basePath: "/admin/audit-logs",
    columns: [
      { key: "userName", label: "User" },
      { key: "action", label: "Action", filterable: true },
      { key: "entityType", label: "Entity" },
      { key: "timestamp", label: "Time", sortable: true },
    ],
  },

  customHandlers: {
    list: async (params: any, auth: any) => {
      const { db } = await import("@/lib/db");
      const { auditLogs, users } = await import("@/lib/db/schema") as any;
      const { eq, and, desc, sql } = await import("drizzle-orm");

      const { page = "1", limit = "50", action, entityType, userId } = params;
      const offset = (parseInt(page) - 1) * parseInt(limit);

      const conditions = [];
      if (action) conditions.push(eq(auditLogs.action, action));
      if (entityType) conditions.push(eq(auditLogs.entityType, entityType));
      if (userId) conditions.push(eq(auditLogs.userId, userId));

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const data = await db
        .select({
          id: auditLogs.id,
          action: auditLogs.action,
          entityType: auditLogs.entityType,
          entityId: auditLogs.entityId,
          ipAddress: auditLogs.ipAddress,
          timestamp: auditLogs.timestamp,
          userName: sql<string>`concat(${users.firstName}, ' ', ${users.lastName})`,
        })
        .from(auditLogs)
        .leftJoin(users, eq(auditLogs.userId, users.id))
        .where(whereClause)
        .orderBy(desc(auditLogs.timestamp))
        .limit(parseInt(limit))
        .offset(offset);

      const [{ count }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(auditLogs)
        .where(whereClause);

      return {
        success: true,
        data: { data, pagination: { total: count, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(count / parseInt(limit)) } },
      };
    },
  },
});
