/**
 * TEACHER ASSIGNMENTS FEATURE
 *
 * Manages teacher-class-subject assignments
 */

import { defineFeature } from "@/lib/features/define-feature";

export const TeacherAssignmentsFeature = defineFeature({
  name: "teacher-assignments",
  tableName: "teacher_assignments",

  schema: {
    id: { type: "text", required: true },
    teacherId: { type: "text", required: true, reference: "users" },
    classId: { type: "text", required: true, reference: "classes" },
    subjectId: { type: "text", reference: "subjects" },
    academicYear: { type: "text", required: true },
    role: { type: "select", options: ["homeroom", "subject_teacher", "both"] },
    isPrimary: { type: "boolean" },
    isActive: { type: "boolean" },
    createdAt: { type: "timestamp" },
    updatedAt: { type: "timestamp" },
  },

  permissions: {
    read: ["admin", "school-admin", "teacher"],
    create: ["admin", "school-admin"],
    update: ["admin", "school-admin"],
    delete: ["admin", "school-admin"],
  },

  ui: {
    title: "Teacher Assignment",
    titlePlural: "Teacher Assignments",
    basePath: "/teacher-assignments",
    columns: [
      { key: "teacherId", label: "Teacher" },
      { key: "classId", label: "Class" },
      { key: "subjectId", label: "Subject" },
      { key: "role", label: "Role" },
      { key: "academicYear", label: "Academic Year" },
    ],
  },

  actions: {
    // Get assignments for a specific teacher
    getByTeacher: {
      handler: async (context: { db: any; params: any; auth: any; schema: any; request?: Request }) => {
        const { db } = await import("@/lib/db");
        const { teacherAssignments, classes, subjects, users } = await import("@/lib/db/schema");
        const { eq, and } = await import("drizzle-orm");
        const { successResponse, errorResponse } = await import("@/lib/api/response-helpers");

        const { teacherId } = context.params;
        const { userId, user } = context.auth;

        // Only allow teachers to view their own assignments
        if (user?.type === "teacher" && userId !== teacherId) {
          return errorResponse("Unauthorized", 403);
        }

        const assignments = await db
          .select({
            id: teacherAssignments.id,
            teacherId: teacherAssignments.teacherId,
            classId: teacherAssignments.classId,
            className: classes.name,
            classGrade: classes.grade,
            section: classes.section,
            subjectId: teacherAssignments.subjectId,
            subjectName: subjects.name,
            academicYear: teacherAssignments.academicYear,
            role: teacherAssignments.role,
            isPrimary: teacherAssignments.isPrimary,
            isActive: teacherAssignments.isActive,
          })
          .from(teacherAssignments)
          .innerJoin(classes, eq(teacherAssignments.classId, classes.id))
          .leftJoin(subjects, eq(teacherAssignments.subjectId, subjects.id))
          .where(and(eq(teacherAssignments.teacherId, teacherId), eq(teacherAssignments.isActive, true)));

        return successResponse({ assignments });
      },
      allowedRoles: ["admin", "school-admin", "teacher"] as any[],
    },

    // Get assignments for a specific class
    getByClass: {
      handler: async (context: { db: any; params: any; auth: any; schema: any; request?: Request }) => {
        const { db } = await import("@/lib/db");
        const { teacherAssignments, classes, subjects, users } = await import("@/lib/db/schema");
        const { eq } = await import("drizzle-orm");
        const { successResponse } = await import("@/lib/api/response-helpers");

        const { classId } = context.params;

        const assignments = await db
          .select({
            id: teacherAssignments.id,
            teacherId: teacherAssignments.teacherId,
            teacherName: users.name,
            classId: teacherAssignments.classId,
            className: classes.name,
            subjectId: teacherAssignments.subjectId,
            subjectName: subjects.name,
            role: teacherAssignments.role,
            isPrimary: teacherAssignments.isPrimary,
            isActive: teacherAssignments.isActive,
          })
          .from(teacherAssignments)
          .innerJoin(classes, eq(teacherAssignments.classId, classes.id))
          .innerJoin(users, eq(teacherAssignments.teacherId, users.id))
          .leftJoin(subjects, eq(teacherAssignments.subjectId, subjects.id))
          .where(eq(teacherAssignments.classId, classId));

        return successResponse({ assignments });
      },
      allowedRoles: ["admin", "school-admin", "teacher"] as any[],
    },

    // Assign a teacher to a class
    assign: {
      handler: async (context: { db: any; params: any; auth: any; schema: any; request?: Request }) => {
        const { eq } = await import("drizzle-orm");
        const { db } = await import("@/lib/db");
        const { teacherAssignments } = await import("@/lib/db/schema");
        const { successResponse, errorResponse } = await import("@/lib/api/response-helpers");

        const { teacherId, classId, subjectId, role, academicYear, isPrimary } = context.params;

        // Check if assignment already exists
        const existing = await db
          .select()
          .from(teacherAssignments)
          .where(eq((teacherAssignments as any).teacherId, teacherId) as any)
          .limit(1);

        // Create new assignment
        const id = `ta_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        const now = new Date();

        await db.insert(teacherAssignments).values({
          id,
          teacherId,
          classId,
          subjectId: subjectId || null,
          academicYear: academicYear || new Date().getFullYear().toString(),
          role: role || "subject_teacher",
          isPrimary: isPrimary || false,
          isActive: true,
          createdAt: now,
          updatedAt: now,
        });

        return successResponse({ assignment: { id, teacherId, classId, role } });
      },
      allowedRoles: ["admin", "school-admin"] as any[],
    },

    // Remove a teacher assignment
    remove: {
      handler: async (context: { db: any; params: any; auth: any; schema: any; request?: Request }) => {
        const { db } = await import("@/lib/db");
        const { teacherAssignments } = await import("@/lib/db/schema");
        const { eq, and } = await import("drizzle-orm");
        const { successResponse, errorResponse } = await import("@/lib/api/response-helpers");

        const { assignmentId } = context.params;

        await db
          .delete(teacherAssignments)
          .where(eq(teacherAssignments.id, assignmentId));

        return successResponse({ message: "Assignment removed" });
      },
      allowedRoles: ["admin", "school-admin"] as any[],
    },
  },
});
