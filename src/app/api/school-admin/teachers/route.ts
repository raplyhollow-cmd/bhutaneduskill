/**
 * TEACHERS API (School Admin)
 *
 * GET /api/school-admin/teachers - List all teachers for the school
 * POST /api/school-admin/teachers - Add a new teacher
 */

import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq, and, desc, like, or, sql } from "drizzle-orm";
import { successResponse, errorResponse } from "@/lib/api/response-helpers";
import { logger } from "@/lib/logger";

// ============================================================================
// GET /api/school-admin/teachers - List all teachers for the school
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return successResponse({ teachers: [] });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const status = searchParams.get("status");

    // Get current user from database to get schoolId
    const currentUserResult = await db
      .select({ schoolId: users.schoolId })
      .from(users)
      .where(eq(users.clerkUserId, userId))
      .limit(1);

    if (currentUserResult.length === 0) {
      return successResponse({ teachers: [] });
    }

    const schoolId = currentUserResult[0].schoolId;

    // Build conditions
    const conditions = [
      eq(users.type, "teacher"),
    ];

    if (schoolId) {
      conditions.push(eq(users.schoolId, schoolId));
    }

    // Filter by status if provided
    if (status === "active") {
      conditions.push(eq(users.isActive, true));
    }

    if (search) {
      const searchCondition = or(
        like(users.firstName, `%${search}%`),
        like(users.lastName, `%${search}%`),
        like(users.email, `%${search}%`)
      );
      conditions.push(searchCondition);
    }

    // Fetch teachers
    const teachersList = await db
      .select()
      .from(users)
      .where(and(...conditions))
      .orderBy(desc(users.createdAt));

    // Transform for frontend
    const transformedTeachers = teachersList.map((teacher) => {
      let subjectsArray: string[] = [];
      try {
        if (teacher.subjects) {
          subjectsArray = typeof teacher.subjects === 'string'
            ? JSON.parse(teacher.subjects)
            : teacher.subjects;
        }
      } catch {
        subjectsArray = [];
      }

      return {
        id: teacher.id,
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        name: teacher.name || `${teacher.firstName || ""} ${teacher.lastName || ""}`.trim(),
        email: teacher.email,
        phone: teacher.phone,
        employeeId: teacher.employeeId,
        subjects: Array.isArray(subjectsArray)
          ? subjectsArray.map((s: unknown) => {
              if (typeof s === 'string') return s;
              if (typeof s === 'object' && s !== null) {
                const obj = s as { subject?: string; name?: string };
                return obj.subject || obj.name || String(s);
              }
              return String(s);
            })
          : [],
        classGrade: teacher.classGrade,
        section: teacher.section,
        department: teacher.department,
        isActive: teacher.isActive ?? true,
        schoolId: teacher.schoolId,
      };
    });

    logger.info("Teachers fetched successfully", { count: transformedTeachers.length });

    return successResponse({ teachers: transformedTeachers });
  } catch (error) {
    logger.error("Failed to fetch teachers", error);
    return errorResponse("Failed to fetch teachers", 500);
  }
}

// ============================================================================
// POST /api/school-admin/teachers - Add a new teacher
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return errorResponse("Unauthorized", 401);
    }

    const body = await request.json();
    const {
      firstName,
      lastName,
      email,
      phone,
      employeeId,
      department,
      subjects,
      classGrade,
      section,
    } = body;

    // Get current user's schoolId
    const currentUserResult = await db
      .select({ schoolId: users.schoolId })
      .from(users)
      .where(eq(users.clerkUserId, userId))
      .limit(1);

    if (currentUserResult.length === 0) {
      return errorResponse("User not found", 404);
    }

    const schoolId = currentUserResult[0].schoolId;

    // Create teacher
    const newTeacher = await db
      .insert(users)
      .values({
        id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        clerkUserId: userId, // Will be updated when teacher signs up
        type: "teacher",
        role: "teacher",
        firstName,
        lastName,
        name: `${firstName} ${lastName}`.trim(),
        email,
        phone,
        employeeId,
        department,
        subjects: JSON.stringify(subjects || []),
        classGrade,
        section,
        schoolId,
        onboardingStatus: "enrolled",
        onboardingComplete: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    logger.info("Teacher created successfully", { teacherId: newTeacher.id });

    return successResponse({
      teacher: {
        id: newTeacher.id,
        firstName,
        lastName,
        name: `${firstName} ${lastName}`.trim(),
        email,
        employeeId,
      },
    }, 201);
  } catch (error) {
    logger.error("Failed to create teacher", error);
    return errorResponse("Failed to create teacher", 500);
  }
}
