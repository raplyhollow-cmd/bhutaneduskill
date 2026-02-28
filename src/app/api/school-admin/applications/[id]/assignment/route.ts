import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { users, classes, departments, teacherAssignments } from "@/lib/db/schema";
import { requirePermission } from "@/lib/rbac";
import { logger } from "@/lib/logger";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { createApiRoute } from "@/lib/api/route-handler";
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
export const PATCH = createApiRoute<{ id: string }, AssignmentResponse>(
  async (req, { user }, context) => {
    const params = await context!.params;
    const targetUserId = params.id;

    // Check permission for managing teachers
    const permCheck = await requirePermission(user.id, 'teachers.approve');
    if (permCheck) return permCheck;

    // Get the target user
    const targetUsers = await db
      .select()
      .from(users)
      .where(eq(users.id, targetUserId))
      .limit(1);

    if (targetUsers.length === 0) {
      return { error: "User not found", status: 404 };
    }

    const targetUser = targetUsers[0];

    // Verify target user is a teacher
    if (targetUser.type !== 'teacher') {
      return { error: "Assignments can only be made for teachers", status: 400 };
    }

    // Check school access (unless platform admin)
    const schoolId = user.type === 'admin' ? targetUser.schoolId : user.schoolId;
    if (user.type !== 'admin' && targetUser.schoolId !== user.schoolId) {
      return { error: "Access denied to this user", status: 403 };
    }

    if (!schoolId) {
      return { error: "School ID not found", status: 400 };
    }

    const body: AssignmentRequest = await req.json();
    const { departmentId, classIds = [] } = body;

    // Validate at least one assignment is provided
    if (!departmentId && (!classIds || classIds.length === 0)) {
      return { error: "At least one of departmentId or classIds must be provided", status: 400 };
    }

    const result: AssignmentResponse['assignments'] = {};

    // Handle department assignment
    if (departmentId) {
      // Verify department belongs to the school
      const [dept] = await db
      .select()
      .from(departments)
      .where(and(
          eq(departments.id, departmentId),
          eq(departments.schoolId, schoolId)
        ))
      .limit(1);

      if (!dept) {
        return { error: "Department not found or access denied", status: 404 };
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
        assignedBy: user.id
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
        return {
          error: `Invalid class IDs: ${invalidClassIds.join(', ')}`,
          status: 400
        };
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
        assignedBy: user.id
      });
    }

    // Get updated user
    const [updatedUser] = await db
      .select({
        id: users.id,
        clerkUserId: users.clerkUserId,
        type: users.type,
        name: users.name,
        email: users.email,
        schoolId: users.schoolId,
        department: users.department,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.id, targetUserId))
      .limit(1);

    if (!updatedUser) {
      return { error: "Failed to retrieve updated user", status: 500 };
    }

    logger.info("User assignment updated successfully", {
      targetUserId,
      assignedBy: user.id,
      assignments: result
    });

    return {
      data: {
        success: true,
        user: updatedUser as UserEntity,
        assignments: result
      } as AssignmentResponse
    };

  },
  ['school-admin', 'admin']
);

// GET /api/school-admin/applications/[id]/assignment - Get user assignments
export const GET = createApiRoute<{ id: string }>(
  async (req, { user }, context) => {
    const params = await context!.params;
    const targetUserId = params.id;

    // Check permission
    const permCheck = await requirePermission(user.id, 'teachers.view');
    if (permCheck) return permCheck;

    // Get the target user
    const targetUsers = await db
      .select()
      .from(users)
      .where(eq(users.id, targetUserId))
      .limit(1);

    if (targetUsers.length === 0) {
      return { error: "User not found", status: 404 };
    }

    const targetUser = targetUsers[0];

    // Check school access (unless platform admin)
    if (user.type !== 'admin' && targetUser.schoolId !== user.schoolId) {
      return { error: "Access denied to this user", status: 403 };
    }

    // Get department info if assigned
    let department = null;
    if (targetUser.department) {
      const deptResult = await db
        .select()
        .from(departments)
        .where(eq(departments.name, targetUser.department))
        .limit(1);
      const dept = deptResult[0];
      if (dept) {
        department = { id: dept.id, name: dept.name, code: dept.code };
      }
    }

    // Get class assignments
    const currentYear = new Date().getFullYear().toString();
    const assignments = await db
      .select()
      .from(teacherAssignments)
      .where(and(
        eq(teacherAssignments.teacherId, targetUserId),
        eq(teacherAssignments.academicYear, currentYear),
        eq(teacherAssignments.isActive, true)
      ));

    const assignedClasses = [];
    for (const assignment of assignments) {
      const clsResult = await db
        .select()
        .from(classes)
        .where(eq(classes.id, assignment.classId))
        .limit(1);
      const cls = clsResult[0];
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

    return {
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
    };
  },
  ['school-admin', 'admin']
);
