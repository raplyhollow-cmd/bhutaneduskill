/**
 * Classes Feature Definition
 */

import { defineFeature } from "@/lib/features/define-feature";
import { db } from "@/lib/db";
import { eq, inArray } from "drizzle-orm";

export const ClassesFeature = defineFeature({
  name: "classes",
  tableName: "classes",

  schema: {
    id: {
      type: "text",
      required: true,
      primary: true,
      label: "ID",
    },
    name: {
      type: "text",
      required: true,
      label: "Name",
      sortable: true,
    },
    createdAt: {
      type: "timestamp",
      label: "Created At",
      sortable: true,
    },
    updatedAt: {
      type: "timestamp",
      label: "Updated At",
      sortable: true,
    },
  },

  permissions: {
    read: ["school-admin", "teacher", "ministry"],
    create: ["school-admin"],
    update: ["school-admin"],
    delete: ["school-admin"],
  },

  ui: {
    title: "Classes",
    titlePlural: "Classess",
    basePath: "/admin/classes",
    icon: "FileText",
    columns: [
      { key: "name", label: "Name", sortable: true },
      { key: "createdAt", label: "Created", sortable: true },
    ],
  },

  // Custom handlers to handle related fields
  customHandlers: {
    // Custom update handler that handles classTeacherId -> classTeacherName mapping
    update: async (id: string, data: any, auth: any) => {
      console.log("[ClassesFeature] Update called with:", { id, data });
      const { classes: classesTable, users } = await import("@/lib/db/schema");

      try {
        // First check if class exists
        const existing = await db.select().from(classesTable).where(eq(classesTable.id, id)).limit(1);
        console.log("[ClassesFeature] Existing class check:", { found: existing.length, class: existing[0] });

        if (existing.length === 0) {
          console.error("[ClassesFeature] Class NOT FOUND in database:", id);
          const { notFoundResponse } = await import("@/lib/api/response-helpers");
          return notFoundResponse("Class");
        }

        // Clone data to avoid modifying the original
        const updateData: any = { ...data };

        // If classTeacherId is being set, fetch the teacher name
        if (updateData.classTeacherId !== undefined) {
          if (updateData.classTeacherId === null) {
            // Clearing the teacher - set name to "Not Assigned"
            updateData.classTeacherName = "Not Assigned";
          } else {
            // Fetch teacher name
            const teacher = await db
              .select({ name: users.name, firstName: users.firstName, lastName: users.lastName })
              .from(users)
              .where(eq(users.id, updateData.classTeacherId))
              .limit(1);

            if (teacher.length > 0) {
              const t = teacher[0];
              updateData.classTeacherName = t.name || `${t.firstName || ""} ${t.lastName || ""}`.trim() || "Unknown";
            } else {
              console.warn("[ClassesFeature] Teacher not found:", updateData.classTeacherId);
              updateData.classTeacherName = "Unknown";
            }
          }
        }

        // Same for homeroomTeacherId -> homeroomTeacherName
        if (updateData.homeroomTeacherId !== undefined) {
          if (updateData.homeroomTeacherId === null) {
            updateData.homeroomTeacherName = "Not Assigned";
          } else {
            const teacher = await db
              .select({ name: users.name, firstName: users.firstName, lastName: users.lastName })
              .from(users)
              .where(eq(users.id, updateData.homeroomTeacherId))
              .limit(1);

            if (teacher.length > 0) {
              const t = teacher[0];
              updateData.homeroomTeacherName = t.name || `${t.firstName || ""} ${t.lastName || ""}`.trim() || "Unknown";
            } else {
              console.warn("[ClassesFeature] Homeroom teacher not found:", updateData.homeroomTeacherId);
              updateData.homeroomTeacherName = "Unknown";
            }
          }
        }

        // Perform the update
        const result = await db
          .update(classesTable)
          .set({
            ...updateData,
            updatedAt: new Date(),
          })
          .where(eq(classesTable.id, id))
          .returning();

        // Debug logging
        console.log("[ClassesFeature] Update executed:", {
          id,
          whereClause: `classes.id = ${id}`,
          data: updateData,
          resultLength: result.length,
          result: result[0]
        });

        if (result.length === 0) {
          const { notFoundResponse } = await import("@/lib/api/response-helpers");
          return notFoundResponse("Class");
        }

        const { updatedResponse } = await import("@/lib/api/response-helpers");
        return updatedResponse({ data: result[0] });
      } catch (error) {
        console.error("[ClassesFeature] Update error:", error);
        const { errorResponse } = await import("@/lib/api/response-helpers");
        return errorResponse(error instanceof Error ? error.message : "Failed to update class", 500);
      }
    },
  },

  // Actions for classes
  actions: {
    // Get students in a class
    "get-students": {
      handler: async (context: any) => {
        const { params } = context;

        const classId = params.id;
        if (!classId) {
          return { error: "Class ID required", status: 400 };
        }

        // Students have currentClass field that references the class
        const { students, users } = await import("@/lib/db/schema");

        const studentList = await db
          .select({
            id: students.id,
            userId: students.userId,
            studentCode: students.studentCode,
            currentClass: students.currentClass,
            section: students.section,
            status: students.status,
            name: users.name,
            email: users.email,
            firstName: users.firstName,
            lastName: users.lastName,
          })
          .from(students)
          .innerJoin(users, eq(students.userId, users.id))
          .where(eq(students.currentClass, classId));

        return { data: studentList };
      },
      allowedRoles: ["school-admin", "teacher", "ministry"],
    },

    // Get subjects for a class
    "get-subjects": {
      handler: async (context: any) => {
        const { params } = context;

        const classId = params.id;
        if (!classId) {
          return { error: "Class ID required", status: 400 };
        }

        // Get subjects assigned to this class
        const { classSubjects, subjects } = await import("@/lib/db/schema");

        const assignments = await db
          .select({
            subjectId: classSubjects.subjectId,
          })
          .from(classSubjects)
          .where(eq(classSubjects.classId, classId));

        if (assignments.length === 0) {
          return { data: [] };
        }

        const subjectIds = assignments.map(a => a.subjectId);

        // Get subject details
        const subjectList = await db
          .select()
          .from(subjects)
          .where(inArray(subjects.id, subjectIds));

        return { data: subjectList };
      },
      allowedRoles: ["school-admin", "teacher", "ministry"],
    },
  },
});
