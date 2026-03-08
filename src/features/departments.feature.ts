/**
 * DEPARTMENTS FEATURE
 *
 * Unified definition for Department resource: Schema + API + Components
 */

import { defineFeature } from "@/lib/features/define-feature";

export const DepartmentFeature = defineFeature({
  name: "departments",
  tableName: "departments",

  schema: {
    id: { type: "text", required: true },
    name: { type: "text", required: true, label: "Department Name", sortable: true, searchable: true, unique: true },
    code: { type: "text", required: true, label: "Code", sortable: true, unique: true },
    schoolId: { type: "text", required: true, label: "School" },
    headId: { type: "text", label: "Department Head" },
    description: { type: "text", label: "Description", multiline: true },
    isActive: { type: "boolean", label: "Active", filterable: true },
    createdAt: { type: "timestamp", label: "Created", sortable: true },
    updatedAt: { type: "timestamp" },
  },

  permissions: {
    read: ["school-admin", "teacher", "admin", "ministry"],
    create: ["school-admin", "admin"],
    update: ["school-admin", "admin"],
    delete: ["school-admin", "admin"],
  },

  ui: {
    title: "Department",
    titlePlural: "Departments",
    basePath: "/school-admin/departments",
    columns: [
      { key: "code", label: "Code", sortable: true },
      { key: "name", label: "Name", sortable: true, searchable: true },
      { key: "headId", label: "Department Head" },
      { key: "description", label: "Description" },
      { key: "isActive", label: "Status", type: "boolean" },
    ],
  },

  customHandlers: {
    list: async (params: any, auth: any) => {
      const { db } = await import("@/lib/db");
      const { departments, users } = await import("@/lib/db/schema");
      const { eq, and, desc, count } = await import("drizzle-orm");

      const { page = 1, limit = 20, search } = params;
      const offset = (page - 1) * limit;
      const { user } = auth;

      const conditions = [
        eq(departments.isActive, true),
        user.schoolId ? eq(departments.schoolId, user.schoolId) : undefined,
      ].filter(Boolean);

      const [dataResult, countResult] = await Promise.all([
        db
          .select({
            id: departments.id,
            name: departments.name,
            code: departments.code,
            schoolId: departments.schoolId,
            headId: (departments as any).headId,
            description: departments.description,
            isActive: departments.isActive,
            createdAt: departments.createdAt,
            updatedAt: departments.updatedAt,
          })
          .from(departments)
          .where(conditions.length === 1 ? conditions[0] : and(...conditions))
          .orderBy(desc(departments.createdAt))
          .limit(limit)
          .offset(offset),
        db
          .select({ count: count() })
          .from(departments)
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
      const { departments } = await import("@/lib/db/schema");
      const { eq } = await import("drizzle-orm");
      const { successResponse, notFoundResponse } = await import("@/lib/api/response-helpers");

      const result = await db
        .select()
        .from(departments)
        .where(eq(departments.id, id))
        .limit(1);

      if (result.length === 0) {
        return notFoundResponse("Department");
      }

      return successResponse({ data: result[0] });
    },

    create: async (data: any, auth: any) => {
      const { db } = await import("@/lib/db");
      const { departments } = await import("@/lib/db/schema");
      const { createdResponse } = await import("@/lib/api/response-helpers");
      const { nanoid } = await import("nanoid");

      const { user } = auth;
      const departmentId = `dep-${nanoid()}`;

      const result = await db
        .insert(departments)
        .values({
          id: departmentId,
          name: data.name,
          code: data.code,
          schoolId: user.schoolId,
          description: data.description || null,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      return createdResponse({ data: result[0] });
    },

    update: async (id: string, data: any, auth: any) => {
      const { db } = await import("@/lib/db");
      const { departments } = await import("@/lib/db/schema");
      const { eq } = await import("drizzle-orm");
      const { updatedResponse, notFoundResponse } = await import("@/lib/api/response-helpers");

      const result = await db
        .update(departments)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(departments.id, id))
        .returning();

      if (result.length === 0) {
        return notFoundResponse("Department");
      }

      return updatedResponse({ data: result[0] });
    },

    delete: async (id: string, auth: any) => {
      const { db } = await import("@/lib/db");
      const { departments } = await import("@/lib/db/schema");
      const { eq } = await import("drizzle-orm");
      const { successResponse, notFoundResponse } = await import("@/lib/api/response-helpers");

      const result = await db
        .update(departments)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(departments.id, id))
        .returning();

      if (result.length === 0) {
        return notFoundResponse("Department");
      }

      return successResponse({ message: "Department deleted successfully" });
    },
  },
});
