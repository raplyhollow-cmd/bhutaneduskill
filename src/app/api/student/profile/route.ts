/**
 * Student Profile API
 *
 * GET /api/student/profile - Fetch student profile with school information
 *
 * Returns comprehensive student profile data including:
 * - User information (name, email, grade, etc.)
 * - Student-specific data (student code, class, section)
 * - School information (name, code, address)
 * - Academic metadata
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { users, students, schools } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { logger } from "@/lib/logger";
import type { ApiSuccess, ApiErrorResponse } from "@/types";

/**
 * GET /api/student/profile
 *
 * Fetches the current student's complete profile including:
 * - User data from users table
 * - Student-specific data from students table
 * - School information from schools table
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate and authorize - only students can access their profile
    const authResult = await requireAuth(["student"]);
    if ("error" in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const { userId, user } = authResult;

    // Query user data with basic fields
    const userData = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        id: true,
        clerkUserId: true,
        type: true,
        role: true,
        name: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        schoolId: true,
        profileImage: true,
        dateOfBirth: true,
        gender: true,
        grade: true,
        section: true,
        rollNumber: true,
        address: true,
        city: true,
        state: true,
        postalCode: true,
        country: true,
        parentContact: true,
        parentPhone: true,
        emergencyContact: true,
        bloodGroup: true,
        enrollmentDate: true,
        lastLogin: true,
        emailVerified: true,
        onboardingComplete: true,
        onboardingStatus: true,
        classGrade: true,
        parentId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!userData) {
      logger.warn("User data not found", { userId });
      return NextResponse.json(
        { error: "Student profile not found" },
        { status: 404 }
      );
    }

    // Query student-specific data
    const studentData = await db.query.students.findFirst({
      where: eq(students.userId, userId),
      with: {
        school: true,
      },
    });

    // If no student record exists, create a minimal response with user data
    if (!studentData) {
      logger.warn("Student record not found, returning user data only", { userId });

      const schoolData = userData.schoolId
        ? await db.query.schools.findFirst({
            where: eq(schools.id, userData.schoolId!),
            columns: {
              id: true,
              name: true,
              code: true,
              address: true,
              city: true,
              contactEmail: true,
              contactPhone: true,
              logo: true,
            },
          })
        : null;

      return NextResponse.json({
        data: {
          user: userData,
          student: null,
          school: schoolData,
          academic: {
            grade: userData.grade || userData.classGrade,
            section: userData.section,
            rollNumber: userData.rollNumber,
          },
        },
      } satisfies ApiSuccess<unknown>);
    }

    // Query school information directly if not already loaded
    let schoolData: {
      id: string;
      name: string | null;
      code: string | null;
      address: string | null;
      city: string | null;
      state: string | null;
      contactEmail: string | null;
      contactPhone: string | null;
      logo: string | null;
      schoolType: string | null;
      level: string | null;
    } | null = Array.isArray(studentData.school)
      ? studentData.school[0] || null
      : studentData.school;

    if (!schoolData && studentData.schoolId) {
      const schoolResult = await db.query.schools.findFirst({
        where: eq(schools.id, studentData.schoolId),
        columns: {
          id: true,
          name: true,
          code: true,
          address: true,
          city: true,
          state: true,
          contactEmail: true,
          contactPhone: true,
          logo: true,
          schoolType: true,
          level: true,
        },
      });
      schoolData = schoolResult;
    }

    // Transform the data for the frontend
    const profile = {
      // User information
      user: {
        id: userData.id,
        clerkUserId: userData.clerkUserId,
        name: userData.name,
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        phone: userData.phone,
        profileImage: userData.profileImage,
        dateOfBirth: userData.dateOfBirth,
        gender: userData.gender,
        bloodGroup: userData.bloodGroup,
        emergencyContact: userData.emergencyContact,
        parentContact: userData.parentContact,
        parentPhone: userData.parentPhone,
        address: userData.address,
        city: userData.city,
        state: userData.state,
        postalCode: userData.postalCode,
        country: userData.country,
        lastLogin: userData.lastLogin,
        enrollmentDate: userData.enrollmentDate,
        onboardingComplete: userData.onboardingComplete,
        isActive: userData.isActive,
      },

      // Student-specific information
      student: studentData
        ? {
            id: studentData.id,
            studentCode: studentData.studentCode,
            currentClass: studentData.currentClass,
            section: studentData.section,
            status: studentData.status,
            metadata: studentData.metadata,
          }
        : null,

      // Academic information (from users table)
      academic: {
        grade: userData.grade || userData.classGrade,
        section: userData.section || studentData?.section,
        rollNumber: userData.rollNumber,
      },

      // School information
      school: schoolData
        ? {
            id: schoolData.id,
            name: schoolData.name,
            code: schoolData.code,
            address: schoolData.address,
            city: schoolData.city,
            state: schoolData.state,
            contactEmail: schoolData.contactEmail,
            contactPhone: schoolData.contactPhone,
            logo: schoolData.logo,
            schoolType: schoolData.schoolType,
            level: schoolData.level,
          }
        : null,
    };

    logger.info("Student profile fetched", {
      userId,
      studentId: studentData?.id,
      schoolId: studentData?.schoolId,
    });

    return NextResponse.json({ data: profile } satisfies ApiSuccess<typeof profile>);
  } catch (error) {
    logger.apiError(error, { route: "/api/student/profile", method: "GET" });
    return NextResponse.json(
      { error: "Failed to fetch student profile", status: 500 } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}
