/**
 * BATCHES FEATURE
 *
 * Unified definition for Batch resource: Schema + API + Components
 *
 * Batches represent groups of students in a specific class and year,
 * used for cohort tracking and management.
 */

import { defineFeature } from "@/lib/features/define-feature";

export const BatchFeature = defineFeature({
  name: "batches",
  tableName: "batches",

  schema: {
    id: { type: "text", required: true },
    name: { type: "text", required: true, label: "Batch Name", sortable: true, searchable: true },
    code: { type: "text", required: true, label: "Batch Code", unique: true, sortable: true, searchable: true },
    schoolId: { type: "text", required: true, label: "School", reference: { table: "schools", displayField: "name" } },
    classId: { type: "text", required: true, label: "Class", reference: { table: "classes", displayField: "name" }, filterable: true },
    year: { type: "integer", required: true, label: "Academic Year", sortable: true, filterable: true },
    isActive: { type: "boolean", label: "Active", filterable: true },
    createdAt: { type: "timestamp", label: "Created", sortable: true },
    updatedAt: { type: "timestamp" },
  },

  permissions: {
    read: ["school-admin", "teacher", "admin"],
    create: ["school-admin", "admin"],
    update: ["school-admin", "admin"],
    delete: ["school-admin", "admin"],
  },

  ui: {
    title: "Batch",
    titlePlural: "Batches",
    basePath: "/school-admin/batches",
    columns: [
      { key: "code", label: "Code", sortable: true },
      { key: "name", label: "Name", sortable: true, searchable: true },
      { key: "year", label: "Year", sortable: true, filterable: true },
      { key: "isActive", label: "Status", type: "boolean" },
      { key: "createdAt", label: "Created", sortable: true },
    ],
  },

  customHandlers: {
    list: async (params: any, auth: any) => {
      const { db } = await import("@/lib/db");
      const { batches } = await import("@/lib/db/schema");
      const { eq, and, desc, count, sql } = await import("drizzle-orm");

      const { page = 1, limit = 20, year, status, search } = params;
      const offset = (page - 1) * limit;
      const { user } = auth;

      const conditions = [
        user.schoolId ? eq(batches.schoolId, user.schoolId) : undefined,
      ].filter(Boolean);

      if (year) {
        conditions.push(eq(batches.year, parseInt(year)));
      }

      if (status === "active") {
        conditions.push(eq(batches.isActive, true));
      } else if (status === "inactive") {
        conditions.push(eq(batches.isActive, false));
      }

      if (search) {
        const searchCondition = sql`(
          ${batches.name} ILIKE ${"%" + search + "%"} OR
          ${batches.code} ILIKE ${"%" + search + "%"}
        )`;
        conditions.push(searchCondition);
      }

      const [dataResult, countResult] = await Promise.all([
        db
          .select()
          .from(batches)
          .where(conditions.length === 1 ? conditions[0] : and(...conditions))
          .orderBy(desc(batches.createdAt))
          .limit(limit)
          .offset(offset),
        db
          .select({ count: count() })
          .from(batches)
          .where(conditions.length === 1 ? conditions[0] : and(...conditions)),
      ]);

      const { successResponse } = await import("@/lib/api/response-helpers");

      return successResponse({
        data: dataResult,
        pagination: {
          total: countResult[0]?.count || 0,
          page,
          limit,
          totalPages: Math.ceil((countResult[0]?.count || 0) / limit),
        },
      });
    },

    get: async (id: string, auth: any) => {
      const { db } = await import("@/lib/db");
      const { batches } = await import("@/lib/db/schema");
      const { eq } = await import("drizzle-orm");
      const { successResponse, notFoundResponse } = await import("@/lib/api/response-helpers");

      const result = await db
        .select()
        .from(batches)
        .where(eq(batches.id, id))
        .limit(1);

      if (result.length === 0) {
        return notFoundResponse("Batch");
      }

      return successResponse({ data: result[0] });
    },

    create: async (data: any, auth: any) => {
      const { db } = await import("@/lib/db");
      const { batches } = await import("@/lib/db/schema");
      const { createdResponse } = await import("@/lib/api/response-helpers");
      const { nanoid } = await import("nanoid");

      const { user } = auth;
      const batchId = `bat-${nanoid()}`;

      const result = await db
        .insert(batches)
        .values({
          id: batchId,
          name: data.name,
          code: data.code,
          schoolId: user.schoolId,
          classId: data.classId,
          year: data.year,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      return createdResponse({ data: result[0] });
    },

    update: async (id: string, data: any, auth: any) => {
      const { db } = await import("@/lib/db");
      const { batches } = await import("@/lib/db/schema");
      const { eq } = await import("drizzle-orm");
      const { updatedResponse, notFoundResponse } = await import("@/lib/api/response-helpers");

      const result = await db
        .update(batches)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(batches.id, id))
        .returning();

      if (result.length === 0) {
        return notFoundResponse("Batch");
      }

      return updatedResponse({ data: result[0] });
    },

    delete: async (id: string, auth: any) => {
      const { db } = await import("@/lib/db");
      const { batches } = await import("@/lib/db/schema");
      const { eq } = await import("drizzle-orm");
      const { successResponse, notFoundResponse } = await import("@/lib/api/response-helpers");

      // Soft delete
      const result = await db
        .update(batches)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(batches.id, id))
        .returning();

      if (result.length === 0) {
        return notFoundResponse("Batch");
      }

      return successResponse({ message: "Batch deleted successfully" });
    },
  },
});
