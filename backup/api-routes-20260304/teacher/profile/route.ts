import { logger } from "@/lib/logger";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { users, teachers, classes, subjects, departments, schools, classSubjects, enrollments } from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { parseJsonArray } from "@/lib/db/json-helpers";
import { createApiRoute } from "@/lib/api/route-handler";
import type { AuthContext } from "@/lib/api/route-handler";

/**
 * GET /api/teacher/profile - Fetch teacher profile
 */
export const GET = createApiRoute(
  async (request: NextRequest, auth: AuthContext | null) => {
    if (!auth) {
      return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { userId, user } = auth;

    const { searchParams } = new URL(request.url);
    const includeStats = searchParams.get("includeStats") !== "false"; // default true

    // Get user record
    const userRecord = await db.select().from(users).where(eq(users.id, userId)).limit(1).then(r => r[0]);

    if (!userRecord) {
      return Response.json({ success: false, error: "Teacher profile not found" }, { status: 404 });
    }

    // Get teacher-specific information
    const teacherRecord = await db.select().from(teachers).where(eq(teachers.userId, userId)).limit(1).then(r => r[0]);

    // Get school information if user has a school
    let schoolRecord = null;
    if (userRecord.schoolId) {
      schoolRecord = await db
        .select({
          id: schools.id,
          name: schools.name,
          code: schools.code,
          type: schools.type,
          subscriptionTier: schools.subscriptionTier,
          city: schools.city,
        })
        .from(schools)
        .where(eq(schools.id, userRecord.schoolId))
        .limit(1)
        .then(r => r[0]);
    }

    // Get department information if teacher has a department
    let departmentRecord = null;
    if (teacherRecord?.department) {
      // Try to find department by name (since teachers table stores department name)
      departmentRecord = await db
        .select({
          id: departments.id,
          name: departments.name,
          code: departments.code,
        })
        .from(departments)
        .where(eq(departments.name, teacherRecord.department))
        .limit(1)
        .then(r => r[0]);
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
      joiningDate: teacherRecord?.joiningDate ? String(teacherRecord.joiningDate) : null,
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
      const teacherClasses = await db.select().from(classes).where(eq(classes.classTeacherId, userId));

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
        const allClassSubjects = await db
          .select({
            id: classSubjects.id,
            classId: classSubjects.classId,
            teacherId: classSubjects.teacherId,
            subjectId: classSubjects.subjectId,
            subjectName: subjects.name,
            subjectCode: subjects.code,
            subjectType: subjects.type,
          })
          .from(classSubjects)
          .innerJoin(subjects, eq(classSubjects.subjectId, subjects.id))
          .where(eq(classSubjects.teacherId, userId));

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
          if (classIds.includes(cs.classId)) {
            const existing = subjectMap.get(cs.subjectId);
            if (existing) {
              existing.classCount++;
              existing.classIds.push(cs.classId);
            } else {
              subjectMap.set(cs.subjectId, {
                id: cs.subjectId,
                name: cs.subjectName,
                code: cs.subjectCode,
                type: cs.subjectType,
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
          grade: cls.grade !== undefined ? String(cls.grade) : "",
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
  async (request: NextRequest, auth: AuthContext | null) => {
    if (!auth) {
      return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { userId, user } = auth;

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