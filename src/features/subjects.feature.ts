/**
 * SUBJECTS FEATURE
 *
 * Unified definition for Subject resource: Schema + API + Components
 */

import { defineFeature } from "@/lib/features/define-feature";

export const SubjectFeature = defineFeature({
  name: "subjects",
  tableName: "subjects",

  schema: {
    id: { type: "text", required: true },
    name: { type: "text", required: true, label: "Subject Name", sortable: true, searchable: true },
    code: { type: "text", required: true, label: "Code", sortable: true, unique: true },
    type: { type: "text", label: "Type", filterable: true }, // core, elective, etc.
    subjectType: { type: "text", label: "Subject Type" },
    grade: { type: "integer", label: "Grade", sortable: true, filterable: true },
    description: { type: "text", label: "Description" },
    departmentId: { type: "text", label: "Department" },
    schoolId: { type: "text", label: "School" },
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
    title: "Subject",
    titlePlural: "Subjects",
    basePath: "/school-admin/subjects",
    columns: [
      { key: "code", label: "Code", sortable: true },
      { key: "name", label: "Name", sortable: true, searchable: true },
      { key: "type", label: "Type", filterable: true },
      { key: "grade", label: "Grade", sortable: true, filterable: true },
      { key: "description", label: "Description" },
      { key: "isActive", label: "Status", type: "boolean" },
    ],
  },

  customHandlers: {
    list: async (params: any, auth: any) => {
      const { db } = await import("@/lib/db");
      const { subjects } = await import("@/lib/db/schema");
      const { eq, and, desc, count } = await import("drizzle-orm");

      const { page = 1, limit = 20, grade, type, search } = params;
      const offset = (page - 1) * limit;
      const { user } = auth;

      const conditions = [
        eq(subjects.isActive, true),
        user.schoolId ? eq(subjects.schoolId, user.schoolId) : undefined,
      ].filter(Boolean);

      if (grade) {
        conditions.push(eq(subjects.grade, parseInt(grade)));
      }

      if (type) {
        conditions.push(eq(subjects.type, type));
      }

      const [dataResult, countResult] = await Promise.all([
        db
          .select()
          .from(subjects)
          .where(conditions.length === 1 ? conditions[0] : and(...conditions))
          .orderBy(desc(subjects.createdAt))
          .limit(limit)
          .offset(offset),
        db
          .select({ count: count() })
          .from(subjects)
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
      const { subjects } = await import("@/lib/db/schema");
      const { eq } = await import("drizzle-orm");
      const { successResponse, notFoundResponse } = await import("@/lib/api/response-helpers");

      const result = await db
        .select()
        .from(subjects)
        .where(eq(subjects.id, id))
        .limit(1);

      if (result.length === 0) {
        return notFoundResponse("Subject");
      }

      return successResponse({ data: result[0] });
    },

    create: async (data: any, auth: any) => {
      const { db } = await import("@/lib/db");
      const { subjects } = await import("@/lib/db/schema");
      const { createdResponse } = await import("@/lib/api/response-helpers");
      const { nanoid } = await import("nanoid");

      const { user } = auth;
      const subjectId = `sub-${nanoid()}`;

      const result = await db
        .insert(subjects)
        .values({
          id: subjectId,
          name: data.name,
          code: data.code,
          type: data.type || "core",
          grade: data.grade || null,
          description: data.description || null,
          schoolId: user.schoolId,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      return createdResponse({ data: result[0] });
    },

    update: async (id: string, data: any, auth: any) => {
      const { db } = await import("@/lib/db");
      const { subjects } = await import("@/lib/db/schema");
      const { eq } = await import("drizzle-orm");
      const { updatedResponse, notFoundResponse } = await import("@/lib/api/response-helpers");

      const result = await db
        .update(subjects)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(subjects.id, id))
        .returning();

      if (result.length === 0) {
        return notFoundResponse("Subject");
      }

      return updatedResponse({ data: result[0] });
    },

    delete: async (id: string, auth: any) => {
      const { db } = await import("@/lib/db");
      const { subjects } = await import("@/lib/db/schema");
      const { eq } = await import("drizzle-orm");
      const { successResponse, notFoundResponse } = await import("@/lib/api/response-helpers");

      const result = await db
        .update(subjects)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(subjects.id, id))
        .returning();

      if (result.length === 0) {
        return notFoundResponse("Subject");
      }

      return successResponse({ message: "Subject deleted successfully" });
    },
  },
});
