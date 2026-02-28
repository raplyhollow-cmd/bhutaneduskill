/**
 * CLASSES API
 *
 * GET /api/classes - Get classes with filtering
 * POST /api/classes - Create new class
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { classes, users, schools } from "@/lib/db/schema";
import { eq, and, desc, inArray, type SQL } from "drizzle-orm";
import { createApiRoute, getAuth } from "@/lib/api/route-handler";
import { successResponse, errorResponse, createdResponse, badRequestResponse } from "@/lib/api/response-helpers";

interface CreateClassInput {
  name: string;
  grade: number;
  section: string;
  academicYear?: string;
  roomNumber?: string;
  capacity?: number;
  teacherId?: string;
  schoolId?: string;
}

// ============================================================================
// GET /api/classes - Get classes
// ============================================================================

export const GET = createApiRoute(
  async (request: NextRequest, auth) => {
    const { user: currentUser, userId } = auth;

    const { searchParams } = new URL(request.url);
    const schoolId = searchParams.get("schoolId");
    const teacherId = searchParams.get("teacherId");
    const academicYear = searchParams.get("academicYear");

    // Build conditions array using SQL type
    const conditions: SQL[] = [];
    if (schoolId) {
      conditions.push(eq(classes.schoolId, schoolId));
    }
    if (teacherId) {
      conditions.push(eq(classes.teacherId, teacherId));
    }
    if (academicYear) {
      conditions.push(eq(classes.academicYear, academicYear));
    }

    // Teachers can only see their own classes
    if (currentUser.type === "teacher") {
      conditions.push(eq(classes.teacherId, userId));
    }

    // Build where clause: single condition or and() for multiple
    const whereClause = conditions.length > 0
      ? conditions.length === 1 ? conditions[0]! : and(...conditions)
      : undefined;

    // Get base class data
    const classList = await db
      .select()
      .from(classes)
      .where(whereClause)
      .orderBy(desc(classes.createdAt));

    // OPTIMIZATION: Fix N+1 query by batching teacher and school lookups
    const uniqueTeacherIds = [...new Set(classList.map(c => c.teacherId).filter(Boolean))];
    const uniqueSchoolIds = [...new Set(classList.map(c => c.schoolId).filter(Boolean))];

    // Batch fetch teachers
    const teachers = uniqueTeacherIds.length > 0
      ? await db
          .select({
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            email: users.email,
          })
          .from(users)
          .where(inArray(users.id, uniqueTeacherIds))
      : [];

    const teacherMap = new Map(teachers.map(t => [t.id, t]));

    // Batch fetch schools
    const schoolData = uniqueSchoolIds.length > 0
      ? await db
          .select({
            id: schools.id,
            name: schools.name,
          })
          .from(schools)
          .where(inArray(schools.id, uniqueSchoolIds))
      : [];

    const schoolMap = new Map(schoolData.map(s => [s.id, s]));

    // Enrich classes with batched data
    const enrichedClasses = classList.map((cls) => ({
      ...cls,
      teacher: cls.teacherId ? teacherMap.get(cls.teacherId) || null : null,
      school: cls.schoolId ? schoolMap.get(cls.schoolId) || null : null,
    }));

    return successResponse({ classes: enrichedClasses });
  },
  ['admin', 'school-admin', 'teacher', 'counselor']
);

// ============================================================================
// POST /api/classes - Create class
// ============================================================================

export const POST = createApiRoute(
  async (request: NextRequest, auth) => {
    const { user: currentUser } = auth;
    const body = await request.json() as CreateClassInput;
    const { name, grade, section, academicYear, roomNumber, capacity, teacherId, schoolId } = body;

    if (!name || grade === undefined) {
      return badRequestResponse("Name and grade are required");
    }

    const finalTeacherId = teacherId || currentUser.id;
    const finalSchoolId = schoolId || currentUser.schoolId || "";
    const finalSection = section || "";
    const finalRoomNumber = roomNumber || "";
    const finalCapacity = capacity ?? 30;
    const finalAcademicYear = academicYear || new Date().getFullYear().toString();

    const [newClass] = await db
      .insert(classes)
      .values({
        id: `class_${Date.now()}`,
        schoolId: finalSchoolId,
        teacherId: finalTeacherId,
        name,
        grade: typeof grade === 'string' ? parseInt(grade, 10) : grade,
        section: finalSection,
        roomNumber: finalRoomNumber,
        capacity: finalCapacity,
        homeroomTeacherName: "",
        classTeacherName: "",
        academicYear: finalAcademicYear,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return createdResponse({ class: newClass });
  },
  ['admin', 'school-admin', 'teacher']
);
