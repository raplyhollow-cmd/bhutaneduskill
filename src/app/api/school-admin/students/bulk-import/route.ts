import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, students, userRoles, roles, classes, enrollments } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth-utils";
import { requirePermission } from "@/lib/rbac";
import { enforceSeatCapacity, getCapacityStatus } from "@/lib/billing-utils";
import { logger } from "@/lib/logger";
import { eq, and, inArray } from "drizzle-orm";
import { nanoid } from "nanoid";
import type { ApiSuccess, ApiErrorResponse } from "@/types";

// ============================================================================
// TYPES
// ============================================================================

interface StudentImportData {
  name: string;
  email?: string;
  phone?: string;
  grade?: string;
  section?: string;
  admissionNumber?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  parentName?: string;
  parentPhone?: string;
}

interface BulkImportRequest {
  studentList: StudentImportData[];
  createClass?: boolean; // Auto-create class if it doesn't exist
}

interface ImportResult {
  total: number;
  successful: number;
  failed: number;
  imported: Array<{ id: string; name: string; email?: string }>;
  errors: Array<{ index: number; name: string; error: string }>;
}

// ============================================================================
// POST /api/school-admin/students/bulk-import - Import multiple students
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // 1. Authentication
    const authResult = await requireAuth(["school-admin", "admin"]);
    if ("error" in authResult) {
      return NextResponse.json(
        { error: authResult.error, status: authResult.status } satisfies ApiErrorResponse,
        { status: authResult.status }
      );
    }
    const { userId, user } = authResult;

    // 2. Permission Check
    const permCheck = await requirePermission(userId, "students.create");
    if (permCheck) return permCheck;

    // 3. Get School ID
    const schoolId = user.type === "admin"
      ? request.headers.get("x-school-id") // Platform admin specifies school
      : user.schoolId; // School admin uses their own school

    if (!schoolId) {
      return NextResponse.json(
        { error: "School ID not found", status: 400 } satisfies ApiErrorResponse,
        { status: 400 }
      );
    }

    // 4. Parse Request Body
    const body: BulkImportRequest = await request.json();
    const { studentList, createClass = true } = body;

    // 5. Validate Input
    if (!Array.isArray(studentList) || studentList.length === 0) {
      return NextResponse.json(
        { error: "studentList must be a non-empty array", status: 400 } satisfies ApiErrorResponse,
        { status: 400 }
      );
    }

    if (studentList.length > 500) {
      return NextResponse.json(
        { error: "Maximum 500 students can be imported at once", status: 400 } satisfies ApiErrorResponse,
        { status: 400 }
      );
    }

    // 6. Check Seat Capacity BEFORE importing
    try {
      await enforceSeatCapacity(schoolId, studentList.length);
    } catch (capacityError) {
      const capacityInfo = await getCapacityStatus(schoolId);
      return NextResponse.json(
        {
          error: capacityError instanceof Error ? capacityError.message : "Insufficient capacity",
          status: 409,
          capacityInfo,
        },
        { status: 409 }
      );
    }

    // 7. Get Student Role
    const [studentRole] = await db
      .select()
      .from(roles)
      .where(eq(roles.name, "student"))
      .limit(1);

    if (!studentRole) {
      return NextResponse.json(
        { error: "Student role not found in system", status: 500 } satisfies ApiErrorResponse,
        { status: 500 }
      );
    }

    // 8. Process Imports
    const result: ImportResult = {
      total: studentList.length,
      successful: 0,
      failed: 0,
      imported: [],
      errors: [],
    };

    for (let i = 0; i < studentList.length; i++) {
      const studentData = studentList[i];

      try {
        // Validate required fields
        if (!studentData.name) {
          result.errors.push({
            index: i,
            name: "(unnamed)",
            error: "Name is required",
          });
          result.failed++;
          continue;
        }

        // Check for duplicate email
        if (studentData.email) {
          const [existing] = await db
            .select({ id: users.id })
            .from(users)
            .where(eq(users.email, studentData.email))
            .limit(1);

          if (existing) {
            result.errors.push({
              index: i,
              name: studentData.name,
              error: `Email ${studentData.email} already exists`,
            });
            result.failed++;
            continue;
          }
        }

        // Create User Record
        const userId = `user_${nanoid()}`;
        const clerkId = `clerk_${nanoid()}`; // Placeholder for Clerk integration

        await db.insert(users).values({
          id: userId,
          clerkUserId: clerkId,
          name: studentData.name,
          email: studentData.email || null,
          phone: studentData.phone || null,
          type: "student",
          role: "student",
          schoolId,
          classGrade: studentData.grade || null,
          isActive: true,
          onboardingComplete: true,
          onboardingStatus: "active",
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        // Create Student Record
        const studentId = `student_${nanoid()}`;
        await db.insert(students).values({
          id: studentId,
          userId,
          schoolId,
          studentCode: studentData.admissionNumber || `STU${Date.now()}${i}`,
          dateOfBirth: studentData.dateOfBirth ? new Date(studentData.dateOfBirth) : null,
          gender: studentData.gender || null,
          address: studentData.address || null,
          emergencyContact: studentData.parentPhone || null,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        // Assign Student Role
        await db.insert(userRoles).values({
          id: `ur_${nanoid()}`,
          userId,
          roleId: studentRole.id,
          createdAt: new Date(),
        });

        // Find or Create Class and Enroll Student
        if (studentData.grade && createClass) {
          await enrollStudentInClass(userId, schoolId, studentData.grade, studentData.section);
        }

        // Track Success
        result.imported.push({
          id: userId,
          name: studentData.name,
          email: studentData.email,
        });
        result.successful++;

      } catch (error) {
        logger.error("Failed to import student", {
          index: i,
          name: studentData.name,
          error: error instanceof Error ? error.message : String(error),
        });

        result.errors.push({
          index: i,
          name: studentData.name,
          error: error instanceof Error ? error.message : "Unknown error",
        });
        result.failed++;
      }
    }

    // 9. Log Summary
    logger.info("Bulk student import completed", {
      schoolId,
      importedBy: userId,
      total: result.total,
      successful: result.successful,
      failed: result.failed,
    });

    // 10. Return Result
    return NextResponse.json({
      data: result,
      message: `Import completed: ${result.successful} successful, ${result.failed} failed`,
    } satisfies ApiSuccess<ImportResult>);

  } catch (error) {
    logger.apiError(error, { route: "/api/school-admin/students/bulk-import", method: "POST" });
    return NextResponse.json(
      { error: "Failed to process bulk import", status: 500 } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Enroll a student in a class, creating the class if it doesn't exist
 */
async function enrollStudentInClass(
  userId: string,
  schoolId: string,
  grade: string,
  section?: string
): Promise<void> {
  const sectionValue = section || "A";
  const className = `Class ${grade}${sectionValue}`;

  // Find existing class
  const gradeNum = parseInt(grade) || 0;
  const [existingClass] = await db
    .select()
    .from(classes)
    .where(
      and(
        eq(classes.schoolId, schoolId),
        eq(classes.grade, gradeNum)
      )
    )
    .limit(1);

  let classId = existingClass?.id;

  // Create class if it doesn't exist
  if (!classId) {
    classId = `class_${nanoid()}`;
    await db.insert(classes).values({
      id: classId,
      schoolId,
      name: className,
      grade: gradeNum,
      section: sectionValue,
      roomNumber: "TBD",
      capacity: 40,
      homeroomTeacherName: "To be assigned",
      classTeacherName: "To be assigned",
      academicYear: new Date().getFullYear().toString(),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  // Create enrollment
  await db.insert(enrollments).values({
    id: `enr_${nanoid()}`,
    studentId: userId,
    classId,
    academicYear: new Date().getFullYear().toString(),
    status: "active",
    enrollmentDate: new Date().toISOString().split("T")[0],
    createdAt: new Date(),
    updatedAt: new Date(),
  }).onConflictDoNothing(); // Avoid duplicate enrollments
}
