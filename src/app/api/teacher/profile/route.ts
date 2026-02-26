import { logger } from "@/lib/logger";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { users, teachers, classes, subjects, departments, schools, classSubjects, enrollments } from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { parseJsonArray } from "@/lib/db/json-helpers";
import { createApiRoute } from "@/lib/api/route-handler";
import { requirePermission } from "@/lib/rbac";

/**
 * GET /api/teacher/profile - Fetch teacher profile
 */
export const GET = createApiRoute(
  async (request, auth) => {
    const { userId, user } = auth;

    // Check profile.read permission
    const permCheck = await requirePermission(userId, "profile.read");
    if (permCheck) return permCheck;

    const { searchParams } = new URL(request.url);
    const includeStats = searchParams.get("includeStats") !== "false"; // default true

    // Get user record
    const userRecord = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!userRecord) {
      return Response.json({ success: false, error: "Teacher profile not found" }, { status: 404 });
    }

    // Get teacher-specific information
    const teacherRecord = await db.query.teachers.findFirst({
      where: eq(teachers.userId, userId),
    });

    // Get school information if user has a school
    let schoolRecord = null;
    if (userRecord.schoolId) {
      schoolRecord = await db.query.schools.findFirst({
        where: eq(schools.id, userRecord.schoolId),
      });
    }

    // Get department information if teacher has a department
    let departmentRecord = null;
    if (teacherRecord?.department) {
      // Try to find department by name (since teachers table stores department name)
      departmentRecord = await db.query.departments.findFirst({
        where: eq(departments.name, teacherRecord.department),
      });
    }

    // Parse subjects from JSON string if available
    let subjectsList: string[] = [];
    if (userRecord.subjects) {
      try {
        subjectsList = parseJsonArray<string>(userRecord.subjects);
      } catch (e) {
        // If parsing fails, subjects might be a comma-separated string
        subjectsList = userRecord.subjects.split(',').map(s => s.trim()).filter(Boolean);
      }
    }

    // Build profile response
    interface TeacherProfileResponse {
      id: string;
      name?: string;
      firstName?: string;
      lastName?: string;
      email?: string | null;
      phone?: string | null;
      profileImage?: string | null;
      employeeId?: string | null;
      designation?: string | null;
      department?: string | null;
      departmentId?: string | null;
      specialization?: string | null;
      subjects: string[];
      joiningDate?: string | null;
      status?: string;
      schoolId?: string | null;
      schoolName?: string | null;
      schoolCode?: string | null;
      schoolType?: string | null;
      isActive?: boolean;
      emailVerified?: boolean;
      onboardingComplete?: boolean;
      lastLogin?: Date;
      createdAt?: Date;
      updatedAt?: Date;
      statistics?: {
        totalClasses: number;
        totalStudents: number;
        subjects: Array<{
          id: string;
          name: string;
          code: string;
          type: string;
          classCount: number;
          classIds: string[];
        }>;
        classes: Array<{
          id: string;
          name: string;
          grade: string;
          section: string;
          studentCount: number;
          isActive: boolean;
        }>;
      };
    }
    const profile: TeacherProfileResponse = {
      id: userRecord.id,
      // Basic user info
      name: userRecord.name,
      firstName: userRecord.firstName,
      lastName: userRecord.lastName,
      email: userRecord.email,
      phone: userRecord.phone,
      profileImage: userRecord.profileImage,

      // Teacher-specific info
      employeeId: userRecord.employeeId || teacherRecord?.employeeId,
      designation: teacherRecord?.designation || null,
      department: teacherRecord?.department || null,
      departmentId: departmentRecord?.id || null,
      specialization: teacherRecord?.specialization || null,
      subjects: subjectsList,

      // Employment details
      joiningDate: teacherRecord?.joiningDate || null,
      status: teacherRecord?.status || "active",

      // School info
      schoolId: userRecord.schoolId,
      schoolName: schoolRecord?.name || null,
      schoolCode: schoolRecord?.code || null,
      schoolType: schoolRecord?.type || null,

      // Account status
      isActive: userRecord.isActive ?? true,
      emailVerified: userRecord.emailVerified ?? false,
      onboardingComplete: userRecord.onboardingComplete ?? false,

      // Metadata
      lastLogin: userRecord.lastLogin,
      createdAt: userRecord.createdAt,
      updatedAt: userRecord.updatedAt,
    };

    // Include statistics if requested
    if (includeStats) {
      // Get classes taught by this teacher
      const teacherClasses = await db.query.classes.findMany({
        where: eq(classes.teacherId, userId),
      });

      // Get unique subjects from class-subject assignments for this teacher
      const classIds = teacherClasses.map(c => c.id);
      let subjectStats: Array<{
        id: string;
        name: string;
        code: string;
        type: string;
        classCount: number;
        classIds: string[];
      }> = [];

      if (classIds.length > 0) {
        // Get all class-subject assignments for this teacher
        const allClassSubjects = await db.query.classSubjects.findMany({
          where: eq(classSubjects.teacherId, userId),
          with: {
            subject: true,
          },
        });

        // Build subject statistics
        const subjectMap = new Map<string, {
          id: string;
          name: string;
          code: string;
          type: string;
          classCount: number;
          classIds: string[];
        }>();

        for (const cs of allClassSubjects) {
          const subjectData = cs.subject as unknown as { id: string; name: string; code: string; type: string } | undefined;
          if (subjectData && classIds.includes(cs.classId)) {
            const existing = subjectMap.get(subjectData.id);
            if (existing) {
              existing.classCount++;
              existing.classIds.push(cs.classId);
            } else {
              subjectMap.set(subjectData.id, {
                id: subjectData.id,
                name: subjectData.name,
                code: subjectData.code,
                type: subjectData.type,
                classCount: 1,
                classIds: [cs.classId],
              });
            }
          }
        }

        subjectStats = Array.from(subjectMap.values());
      }

      // Calculate total students across all classes
      let totalStudents = 0;
      const teacherClassesWithStudents = await Promise.all(
        teacherClasses.map(async (cls) => {
          // Get student count for this class
          const enrollmentCount = await db
            .select()
            .from(enrollments)
            .where(
              and(
                eq(enrollments.classId, cls.id),
                eq(enrollments.status, "active")
              )
            );

          totalStudents += enrollmentCount.length;

          return {
            ...cls,
            studentCount: enrollmentCount.length,
          };
        })
      );

      profile.statistics = {
        totalClasses: teacherClasses.length,
        totalStudents,
        subjects: subjectStats,
        classes: teacherClassesWithStudents.map(cls => ({
          id: cls.id,
          name: cls.name,
          grade: cls.grade,
          section: cls.section,
          studentCount: cls.studentCount,
          isActive: cls.isActive ?? true,
        })),
      };
    }

    logger.info("Teacher profile fetched", {
      teacherId: userId,
      includeStats,
    });

    return Response.json({ success: true, data: profile });
  },
  ['teacher', 'admin']
);

/**
 * PATCH /api/teacher/profile - Update teacher profile
 */
export const PATCH = createApiRoute(
  async (request, auth) => {
    const { userId, user } = auth;

    // Check profile.update permission
    const permCheck = await requirePermission(userId, "profile.update");
    if (permCheck) return permCheck;

    const body = await request.json();

    // Fields that can be updated in users table
    const allowedUserFields = ['phone', 'profileImage', 'subjects'];
    // Fields that can be updated in teachers table
    const allowedTeacherFields = ['department', 'specialization'];

    const userUpdates: { updatedAt: Date; phone?: string; profileImage?: string; subjects?: string } = { updatedAt: new Date() };
    const teacherUpdates: { updatedAt: Date; department?: string; specialization?: string } = { updatedAt: new Date() };

    for (const [key, value] of Object.entries(body)) {
      if (allowedUserFields.includes(key)) {
        if (key === 'subjects' && Array.isArray(value)) {
          // Convert subjects array to JSON string
          userUpdates.subjects = JSON.stringify(value);
        } else {
          userUpdates[key] = value;
        }
      } else if (allowedTeacherFields.includes(key)) {
        teacherUpdates[key] = value;
      }
    }

    // Update user record if there are changes
    if (Object.keys(userUpdates).length > 1) {
      await db.update(users)
        .set(userUpdates)
        .where(eq(users.id, userId));
    }

    // Update teacher record if there are changes
    if (Object.keys(teacherUpdates).length > 1) {
      await db.update(teachers)
        .set(teacherUpdates)
        .where(eq(teachers.userId, userId));
    }

    logger.info("Teacher profile updated", {
      teacherId: userId,
      updatedFields: [...Object.keys(userUpdates), ...Object.keys(teacherUpdates)],
    });

    // Return success - client should re-fetch if needed
    return Response.json({ success: true, message: "Profile updated successfully" });
  },
  ['teacher', 'admin']
);