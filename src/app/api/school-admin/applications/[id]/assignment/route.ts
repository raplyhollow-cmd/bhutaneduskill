import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, classes, departments, teacherAssignments } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth-utils";
import { requirePermission } from "@/lib/rbac";
import { logger } from "@/lib/logger";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import type { ApiSuccess, ApiErrorResponse, UserEntity } from "@/types";

interface AssignmentRequest {
  departmentId?: string;
  classIds?: string[];
}

interface AssignmentResponse {
  success: true;
  user: UserEntity;
  assignments: {
    department?: { id: string; name: string };
    classes?: Array<{ id: string; name: string }>;
  };
}

// PATCH /api/school-admin/applications/[id]/assignment - Update user assignments
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(['school-admin', 'admin']);
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error, status: authResult.status } satisfies ApiErrorResponse,
        { status: authResult.status }
      );
    }
    const { userId, user } = authResult;

    const params = await context.params;
    const targetUserId = params.id;

    // Check permission for managing teachers
    const permCheck = await requirePermission(userId, 'teachers.approve');
    if (permCheck) return permCheck;

    // Get the target user
    const targetUsers = await db
      .select()
      .from(users)
      .where(eq(users.id, targetUserId))
      .limit(1);

    if (targetUsers.length === 0) {
      return NextResponse.json(
        { error: "User not found", status: 404 } satisfies ApiErrorResponse,
        { status: 404 }
      );
    }

    const targetUser = targetUsers[0];

    // Verify target user is a teacher
    if (targetUser.type !== 'teacher') {
      return NextResponse.json(
        { error: "Assignments can only be made for teachers", status: 400 } satisfies ApiErrorResponse,
        { status: 400 }
      );
    }

    // Check school access (unless platform admin)
    const schoolId = user.type === 'admin' ? targetUser.schoolId : user.schoolId;
    if (user.type !== 'admin' && targetUser.schoolId !== user.schoolId) {
      return NextResponse.json(
        { error: "Access denied to this user", status: 403 } satisfies ApiErrorResponse,
        { status: 403 }
      );
    }

    if (!schoolId) {
      return NextResponse.json(
        { error: "School ID not found", status: 400 } satisfies ApiErrorResponse,
        { status: 400 }
      );
    }

    const body: AssignmentRequest = await request.json();
    const { departmentId, classIds = [] } = body;

    // Validate at least one assignment is provided
    if (!departmentId && (!classIds || classIds.length === 0)) {
      return NextResponse.json(
        { error: "At least one of departmentId or classIds must be provided", status: 400 } satisfies ApiErrorResponse,
        { status: 400 }
      );
    }

    const result: AssignmentResponse['assignments'] = {};

    // Handle department assignment
    if (departmentId) {
      // Verify department belongs to the school
      const dept = await db.query.departments.findFirst({
        where: and(
          eq(departments.id, departmentId),
          eq(departments.schoolId, schoolId)
        )
      });

      if (!dept) {
        return NextResponse.json(
          { error: "Department not found or access denied", status: 404 } satisfies ApiErrorResponse,
          { status: 404 }
        );
      }

      // Update user's department
      await db
        .update(users)
        .set({
          department: dept.name,
          updatedAt: new Date(),
        })
        .where(eq(users.id, targetUserId));

      result.department = { id: dept.id, name: dept.name };

      logger.info("Teacher department assigned", {
        teacherId: targetUserId,
        departmentId: dept.id,
        assignedBy: userId
      });
    }

    // Handle class assignments
    if (classIds && classIds.length > 0) {
      // Verify all classes belong to the school
      const classRecords = await db
        .select()
        .from(classes)
        .where(
          and(
            eq(classes.schoolId, schoolId),
            eq(classes.isActive, true)
          )
        );

      const validClassIds = new Set(classRecords.map(c => c.id));
      const invalidClassIds = classIds.filter(id => !validClassIds.has(id));

      if (invalidClassIds.length > 0) {
        return NextResponse.json(
          {
            error: `Invalid class IDs: ${invalidClassIds.join(', ')}`,
            status: 400
          } satisfies ApiErrorResponse,
          { status: 400 }
        );
      }

      // Remove existing assignments for this teacher in the current academic year
      const currentYear = new Date().getFullYear().toString();
      await db
        .delete(teacherAssignments)
        .where(
          and(
            eq(teacherAssignments.teacherId, targetUserId),
            eq(teacherAssignments.academicYear, currentYear)
          )
        );

      // Create new assignments
      const assignmentPromises = classIds.map(classId =>
        db.insert(teacherAssignments).values({
          id: `ta_${nanoid()}`,
          teacherId: targetUserId,
          classId,
          academicYear: currentYear,
          role: 'subject_teacher',
          isPrimary: classIds.length === 1, // First/only class is primary
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        }).onConflictDoNothing()
      );

      await Promise.all(assignmentPromises);

      result.classes = classRecords
        .filter(c => classIds.includes(c.id))
        .map(c => ({ id: c.id, name: c.name }));

      logger.info("Teacher class assignments updated", {
        teacherId: targetUserId,
        classIds,
        assignedBy: userId
      });
    }

    // Get updated user
    const updatedUser = await db.query.users.findFirst({
      where: eq(users.id, targetUserId),
      columns: {
        id: true,
        clerkUserId: true,
        type: true,
        name: true,
        email: true,
        schoolId: true,
        department: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    if (!updatedUser) {
      return NextResponse.json(
        { error: "Failed to retrieve updated user", status: 500 } satisfies ApiErrorResponse,
        { status: 500 }
      );
    }

    logger.info("User assignment updated successfully", {
      targetUserId,
      assignedBy: userId,
      assignments: result
    });

    return NextResponse.json({
      data: {
        success: true,
        user: updatedUser as UserEntity,
        assignments: result
      } as AssignmentResponse
    } satisfies ApiSuccess<AssignmentResponse>);

  } catch (error) {
    logger.apiError(error, { route: "/api/school-admin/applications/[id]/assignment", method: "PATCH" });
    return NextResponse.json(
      { error: "Failed to update assignment", status: 500 } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}

// GET /api/school-admin/applications/[id]/assignment - Get user assignments
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(['school-admin', 'admin']);
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error, status: authResult.status } satisfies ApiErrorResponse,
        { status: authResult.status }
      );
    }
    const { userId, user } = authResult;

    const params = await context.params;
    const targetUserId = params.id;

    // Check permission
    const permCheck = await requirePermission(userId, 'teachers.view');
    if (permCheck) return permCheck;

    // Get the target user
    const targetUsers = await db
      .select()
      .from(users)
      .where(eq(users.id, targetUserId))
      .limit(1);

    if (targetUsers.length === 0) {
      return NextResponse.json(
        { error: "User not found", status: 404 } satisfies ApiErrorResponse,
        { status: 404 }
      );
    }

    const targetUser = targetUsers[0];

    // Check school access (unless platform admin)
    if (user.type !== 'admin' && targetUser.schoolId !== user.schoolId) {
      return NextResponse.json(
        { error: "Access denied to this user", status: 403 } satisfies ApiErrorResponse,
        { status: 403 }
      );
    }

    // Get department info if assigned
    let department = null;
    if (targetUser.department) {
      const dept = await db.query.departments.findFirst({
        where: eq(departments.name, targetUser.department)
      });
      if (dept) {
        department = { id: dept.id, name: dept.name, code: dept.code };
      }
    }

    // Get class assignments
    const currentYear = new Date().getFullYear().toString();
    const assignments = await db.query.teacherAssignments.findMany({
      where: and(
        eq(teacherAssignments.teacherId, targetUserId),
        eq(teacherAssignments.academicYear, currentYear),
        eq(teacherAssignments.isActive, true)
      )
    });

    const assignedClasses = [];
    for (const assignment of assignments) {
      const cls = await db.query.classes.findFirst({
        where: eq(classes.id, assignment.classId)
      });
      if (cls) {
        assignedClasses.push({
          id: cls.id,
          name: cls.name,
          grade: cls.grade,
          section: cls.section,
          role: assignment.role,
          isPrimary: assignment.isPrimary
        });
      }
    }

    return NextResponse.json({
      data: {
        success: true,
        user: {
          id: targetUser.id,
          name: targetUser.name,
          email: targetUser.email,
          type: targetUser.type,
          department: targetUser.department,
        },
        assignments: {
          department,
          classes: assignedClasses
        }
      }
    } satisfies ApiSuccess<{
      success: true;
      user: {
        id: string;
        name: string;
        email: string;
        type: string;
        department: string | null;
      };
      assignments: {
        department: { id: string; name: string; code: string } | null;
        classes: Array<{
          id: string;
          name: string;
          grade: number;
          section: string;
          role: string;
          isPrimary: boolean;
        }>;
      };
    }>);
  } catch (error) {
    logger.apiError(error, { route: "/api/school-admin/applications/[id]/assignment", method: "GET" });
    return NextResponse.json(
      { error: "Failed to get assignments", status: 500 } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}
