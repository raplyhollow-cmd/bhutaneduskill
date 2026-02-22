import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { requirePermission } from "@/lib/rbac";
import { db } from "@/lib/db";
import { users, teachers, classes, subjects, departments, schools, classSubjects } from "@/lib/db/schema";
import { eq, and, desc, count } from "drizzle-orm";
import { parseJsonArray } from "@/lib/db/json-helpers";

/**
 * GET /api/teacher/profile - Fetch teacher profile
 *
 * Returns comprehensive teacher profile including:
 * - User information (name, email, contact)
 * - Teacher-specific details (designation, department, specialization)
 * - School information
 * - Teaching statistics (classes taught, subjects)
 * - Additional metadata
 */
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(['teacher', 'admin']);
  if ('error' in authResult) {
    return NextResponse.json({ success: false, error: authResult.error }, { status: authResult.status });
  }

  const { user: currentUser, userId } = authResult;

  // Check profile.read permission
  const permCheck = await requirePermission(userId, "profile.read");
  if (permCheck) return permCheck;

  const { searchParams } = new URL(request.url);
  const includeStats = searchParams.get("includeStats") !== "false"; // default true

  try {
    // Get user record
    const userRecord = await db.query.users.findFirst({
      where: eq(users.id, currentUser.id),
    });

    if (!userRecord) {
      return NextResponse.json({
        success: false,
        error: "Teacher profile not found",
      }, { status: 404 });
    }

    // Get teacher-specific information
    const teacherRecord = await db.query.teachers.findFirst({
      where: eq(teachers.userId, currentUser.id),
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
    const profile: any = {
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
        where: eq(classes.teacherId, currentUser.id),
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
          where: eq(classSubjects.teacherId, currentUser.id),
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
      for (const cls of teacherClasses) {
        if (cls.students && Array.isArray(cls.students)) {
          totalStudents += cls.students.length;
        }
      }

      profile.statistics = {
        totalClasses: teacherClasses.length,
        totalStudents,
        subjects: subjectStats,
        classes: teacherClasses.map(cls => ({
          id: cls.id,
          name: cls.name,
          grade: cls.grade,
          section: cls.section,
          studentCount: cls.students?.length || 0,
          isActive: cls.isActive ?? true,
        })),
      };
    }

    logger.info("Teacher profile fetched", {
      teacherId: currentUser.id,
      includeStats,
    });

    return NextResponse.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    logger.error("Teacher profile fetch error:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to fetch teacher profile",
    }, { status: 500 });
  }
}

/**
 * PATCH /api/teacher/profile - Update teacher profile
 *
 * Body: JSON object with fields to update (subset of profile fields)
 * Allowed updates:
 * - phone, profileImage
 * - department, specialization
 * - Subjects (array of subject IDs)
 */
export async function PATCH(request: NextRequest) {
  const authResult = await requireAuth(['teacher', 'admin']);
  if ('error' in authResult) {
    return NextResponse.json({ success: false, error: authResult.error }, { status: authResult.status });
  }

  const { user: currentUser, userId } = authResult;

  // Check profile.update permission
  const permCheck = await requirePermission(userId, "profile.update");
  if (permCheck) return permCheck;

  try {
    const body = await request.json();

    // Fields that can be updated in users table
    const allowedUserFields = ['phone', 'profileImage', 'subjects'];
    // Fields that can be updated in teachers table
    const allowedTeacherFields = ['department', 'specialization'];

    const userUpdates: any = { updatedAt: new Date() };
    const teacherUpdates: any = { updatedAt: new Date() };

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
        .where(eq(users.id, currentUser.id));
    }

    // Update teacher record if there are changes
    if (Object.keys(teacherUpdates).length > 1) {
      await db.update(teachers)
        .set(teacherUpdates)
        .where(eq(teachers.userId, currentUser.id));
    }

    logger.info("Teacher profile updated", {
      teacherId: currentUser.id,
      updatedFields: [...Object.keys(userUpdates), ...Object.keys(teacherUpdates)],
    });

    // Fetch and return updated profile
    return GET(request);
  } catch (error) {
    logger.error("Teacher profile update error:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to update teacher profile",
    }, { status: 500 });
  }
}
