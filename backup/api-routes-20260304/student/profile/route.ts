/**
 * Student Profile API
 *
 * GET /api/student/profile - Fetch student profile with school information
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 *
 * Returns comprehensive student profile data including:
 * - User information (name, email, grade, etc.)
 * - Student-specific data (student code, class, section)
 * - School information (name, code, address)
 * - Academic metadata
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { users, students, schools } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { createApiRoute, getAuth } from "@/lib/api/route-handler";
import { successResponse, errorResponse } from "@/lib/api/response-helpers";

// ============================================================================
// GET /api/student/profile
// ============================================================================

/**
 * Fetches the current student's complete profile including:
 * - User data from users table
 * - Student-specific data from students table
 * - School information from schools table
 */
export const GET = createApiRoute(
  async (request: NextRequest) => {
    const auth = getAuth(request);
    if (!auth) {
      return errorResponse("Unauthorized", 401);
    }

    const { userId, user } = auth;

    try {
      // Query user data using db.select()
      const userDataResult = await db
        .select({
          id: users.id,
          clerkUserId: users.clerkUserId,
          type: users.type,
          role: users.role,
          name: users.name,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          phone: users.phone,
          schoolId: users.schoolId,
          profileImage: users.profileImage,
          dateOfBirth: users.dateOfBirth,
          gender: users.gender,
          grade: users.grade,
          section: users.section,
          rollNumber: users.rollNumber,
          address: users.address,
          city: users.city,
          state: users.state,
          postalCode: users.postalCode,
          country: users.country,
          parentContact: users.parentContact,
          parentPhone: users.parentPhone,
          emergencyContact: users.emergencyContact,
          bloodGroup: users.bloodGroup,
          enrollmentDate: users.enrollmentDate,
          lastLogin: users.lastLogin,
          emailVerified: users.emailVerified,
          onboardingComplete: users.onboardingComplete,
          onboardingStatus: users.onboardingStatus,
          classGrade: users.classGrade,
          parentId: users.parentId,
          isActive: users.isActive,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      const userData = userDataResult[0];

      if (!userData) {
        logger.warn("User data not found", { userId });
        return errorResponse("Student profile not found", 404);
      }

      // Query student-specific data using db.select()
      const studentDataResult = await db
        .select()
        .from(students)
        .where(eq(students.userId, userId))
        .limit(1);

      const studentData = studentDataResult[0];

      // If no student record exists, create a minimal response with user data
      if (!studentData) {
        logger.warn("Student record not found, returning user data only", { userId });

        let schoolData = null;
        if (userData.schoolId) {
          const schoolResult = await db
            .select({
              id: schools.id,
              name: schools.name,
              code: schools.code,
              address: schools.address,
              city: schools.city,
              contactEmail: schools.contactEmail,
              contactPhone: schools.contactPhone,
              logo: schools.logo,
            })
            .from(schools)
            .where(eq(schools.id, userData.schoolId))
            .limit(1);

          schoolData = schoolResult[0] || null;
        }

        return successResponse({
          user: userData,
          student: null,
          school: schoolData,
          academic: {
            grade: userData.grade || userData.classGrade,
            section: userData.section,
            rollNumber: userData.rollNumber,
          },
        });
      }

      // Query school information directly
      let schoolData = null;
      if (studentData.schoolId) {
        const schoolResult = await db
          .select({
            id: schools.id,
            name: schools.name,
            code: schools.code,
            address: schools.address,
            city: schools.city,
            state: schools.state,
            contactEmail: schools.contactEmail,
            contactPhone: schools.contactPhone,
            logo: schools.logo,
            schoolType: schools.schoolType,
            level: schools.level,
          })
          .from(schools)
          .where(eq(schools.id, studentData.schoolId))
          .limit(1);

        schoolData = schoolResult[0] || null;
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

      return successResponse(profile);
    } catch (error) {
      logger.apiError(error, { route: "/api/student/profile", method: "GET" });
      return errorResponse("Failed to fetch student profile", 500);
    }
  },
  ['student']
);
