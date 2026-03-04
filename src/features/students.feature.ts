/**
 * STUDENTS FEATURE
 *
 * Unified definition for Student resource: Schema + API + Components
 */

import { defineFeature } from "@/lib/features/define-feature";
import { users } from "@/lib/db/schema"; // Import existing for now
import { eq } from "drizzle-orm";

export const StudentFeature = defineFeature({
  name: "students",
  tableName: "users", // Use existing table

  schema: {
    id: { type: "text", required: true },
    firstName: { type: "text", required: true, label: "First Name", sortable: true, searchable: true },
    lastName: { type: "text", label: "Last Name", sortable: true, searchable: true },
    name: { type: "text", label: "Full Name", sortable: true, searchable: true },
    email: { type: "email", required: true, label: "Email", sortable: true, searchable: true },
    phone: { type: "text", label: "Phone" },
    classGrade: { type: "integer", label: "Grade", sortable: true, filterable: true },
    section: { type: "text", label: "Section", filterable: true },
    rollNumber: { type: "text", label: "Roll Number" },
    schoolId: { type: "text", label: "School" },
    clerkUserId: { type: "text" },
    type: { type: "text", required: true },
    isActive: { type: "boolean", label: "Active", filterable: true },
    createdAt: { type: "timestamp", label: "Created", sortable: true },
    updatedAt: { type: "timestamp" },
  },

  permissions: {
    read: ["school-admin", "teacher", "parent", "admin"],
    create: ["school-admin", "admin"],
    update: ["school-admin", "admin"],
    delete: ["school-admin", "admin"],
  },

  ui: {
    title: "Student",
    titlePlural: "Students",
    basePath: "/school-admin/students",
    columns: [
      { key: "rollNumber", label: "Roll No.", sortable: true },
      { key: "name", label: "Name", sortable: true, searchable: true },
      { key: "email", label: "Email", sortable: true },
      { key: "classGrade", label: "Grade", sortable: true, filterable: true },
      { key: "section", label: "Section", filterable: true },
      { key: "isActive", label: "Status", type: "boolean" },
    ],
  },

  // Custom handlers that use existing queries
  customHandlers: {
    list: async (params: any, auth: any) => {
      const { db } = await import("@/lib/db");
      const { users } = await import("@/lib/db/schema");
      const { eq, and, desc, count, sql } = await import("drizzle-orm");

      const { page = 1, limit = 20, search, grade, section, status } = params;
      const offset = (page - 1) * limit;
      const { user } = auth;

      // Build conditions
      const conditions = [
        eq(users.type, "student"),
        user.schoolId ? eq(users.schoolId, user.schoolId) : undefined,
      ].filter(Boolean);

      if (search) {
        const searchCondition = sql`(
          ${users.firstName} ILIKE ${"%" + search + "%"} OR
          ${users.lastName} ILIKE ${"%" + search + "%"} OR
          ${users.email} ILIKE ${"%" + search + "%"} OR
          ${users.rollNumber} ILIKE ${"%" + search + "%"}
        )`;
        conditions.push(searchCondition);
      }

      if (grade) {
        conditions.push(eq(users.classGrade, parseInt(grade)));
      }

      if (section) {
        conditions.push(eq(users.section, section));
      }

      if (status === "active") {
        conditions.push(eq(users.isActive, true));
      } else if (status === "inactive") {
        conditions.push(eq(users.isActive, false));
      }

      const [dataResult, countResult] = await Promise.all([
        db
          .select()
          .from(users)
          .where(conditions.length === 1 ? conditions[0] : and(...conditions))
          .orderBy(desc(users.createdAt))
          .limit(limit)
          .offset(offset),
        db
          .select({ count: count() })
          .from(users)
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
      const { users } = await import("@/lib/db/schema");
      const { eq, and } = await import("drizzle-orm");
      const { successResponse, notFoundResponse } = await import("@/lib/api/response-helpers");

      const { user } = auth;
      const conditions = [
        eq(users.id, id),
        eq(users.type, "student"),
        user.schoolId ? eq(users.schoolId, user.schoolId) : undefined,
      ].filter(Boolean);

      const result = await db
        .select()
        .from(users)
        .where(conditions.length === 1 ? conditions[0] : and(...conditions))
        .limit(1);

      if (result.length === 0) {
        return notFoundResponse("Student");
      }

      return successResponse({ data: result[0] });
    },

    create: async (data: any, auth: any) => {
      const { db } = await import("@/lib/db");
      const { users } = await import("@/lib/db/schema");
      const { successResponse, createdResponse } = await import("@/lib/api/response-helpers");
      const { nanoid } = await import("nanoid");

      const { user } = auth;
      const studentId = `stu-${nanoid()}`;

      const result = await db
        .insert(users)
        .values({
          id: studentId,
          firstName: data.firstName,
          lastName: data.lastName,
          name: `${data.firstName} ${data.lastName}`.trim(),
          email: data.email,
          phone: data.phone || null,
          classGrade: data.classGrade || null,
          section: data.section || null,
          rollNumber: data.rollNumber || null,
          schoolId: user.schoolId,
          type: "student",
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      return createdResponse({ data: result[0] });
    },

    update: async (id: string, data: any, auth: any) => {
      const { db } = await import("@/lib/db");
      const { users } = await import("@/lib/db/schema");
      const { eq } = await import("drizzle-orm");
      const { successResponse, updatedResponse, notFoundResponse } = await import("@/lib/api/response-helpers");

      const result = await db
        .update(users)
        .set({
          ...data,
          name: data.firstName || data.lastName ? `${data.firstName || ""} ${data.lastName || ""}`.trim() : undefined,
          updatedAt: new Date(),
        })
        .where(eq(users.id, id))
        .returning();

      if (result.length === 0) {
        return notFoundResponse("Student");
      }

      return updatedResponse({ data: result[0] });
    },

    delete: async (id: string, auth: any) => {
      const { db } = await import("@/lib/db");
      const { users } = await import("@/lib/db/schema");
      const { eq } = await import("drizzle-orm");
      const { successResponse, notFoundResponse } = await import("@/lib/api/response-helpers");

      // Soft delete
      const result = await db
        .update(users)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(users.id, id))
        .returning();

      if (result.length === 0) {
        return notFoundResponse("Student");
      }

      return successResponse({ message: "Student deleted successfully" });
    },
  },
});
