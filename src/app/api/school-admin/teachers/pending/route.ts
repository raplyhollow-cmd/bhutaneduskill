/**
 * SCHOOL ADMIN TEACHERS PENDING API
 *
 * GET - Fetch pending teachers for the school admin's school
 * POST - Approve or reject a teacher application
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { users, teacherApplications } from "@/lib/db/schema";
import { eq, and, desc, or, notInArray } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { createApiRoute } from "@/lib/api/route-handler";
import { successResponse, errorResponse, badRequestResponse } from "@/lib/api/response-helpers";

/**
 * GET - Fetch pending teachers for the school admin's school
 * This includes:
 * 1. Teachers with pending teacher applications
 * 2. Teachers with pending_enrollment or pending_approval status (even without application record)
 */
export const GET = createApiRoute(
  async (req: NextRequest, auth) => {
    const { userId, user } = auth;

    if (!user.schoolId) {
      return errorResponse("No school associated with your account", 400);
    }

    // First, get all teacher applications for this school
    const applications = await db
      .select({
        id: teacherApplications.id,
        userId: teacherApplications.userId,
        schoolId: teacherApplications.schoolId,
        status: teacherApplications.status,
        qualifications: teacherApplications.qualifications,
        experience: teacherApplications.experience,
        subjects: teacherApplications.subjects,
        desiredClasses: teacherApplications.desiredClasses,
        previousSchool: teacherApplications.previousSchool,
        specialization: teacherApplications.specialization,
        appliedAt: teacherApplications.appliedAt,
        rejectionReason: teacherApplications.rejectionReason,
        notes: teacherApplications.notes,
        // User details
        user: {
          id: users.id,
          name: users.name,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          phone: users.phone,
          employeeId: users.employeeId,
          profileImage: users.profileImage,
        },
      })
      .from(teacherApplications)
      .innerJoin(users, eq(teacherApplications.userId, users.id))
      .where(
        and(
          eq(teacherApplications.schoolId, user.schoolId),
          eq(teacherApplications.status, "pending")
        )
      )
      .orderBy(desc(teacherApplications.appliedAt));

    // Get userIds from applications to exclude them from the second query
    const applicationUserIds = applications.map(app => app.userId);

    // Second, get teachers with pending status who don't have applications yet
    // (teachers who signed up before the application flow was implemented)
    let pendingTeachersWithoutApplications: typeof applications = [];
    if (applicationUserIds.length === 0 || applicationUserIds.length < 50) {
      // Only do this query if we don't have too many applications (avoid performance issues)
      const pendingStatusTeachers = await db
        .select({
          id: users.id,
          name: users.name,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          phone: users.phone,
          employeeId: users.employeeId,
          profileImage: users.profileImage,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(
          and(
            eq(users.schoolId, user.schoolId),
            eq(users.type, "teacher"),
            or(
              eq(users.onboardingStatus, "pending_enrollment"),
              eq(users.onboardingStatus, "pending_approval")
            ),
            // Exclude teachers who already have applications
            ...(applicationUserIds.length > 0 ? [notInArray(users.id, applicationUserIds)] : [])
          )
        )
        .orderBy(desc(users.createdAt));

      // Convert these to the same format as applications
      pendingTeachersWithoutApplications = pendingStatusTeachers.map(teacher => ({
        id: teacher.id, // Use user ID as application ID for those without applications
        userId: teacher.id,
        schoolId: user.schoolId,
        status: "pending",
        qualifications: null,
        experience: null,
        subjects: null,
        desiredClasses: null,
        previousSchool: null,
        specialization: null,
        appliedAt: teacher.createdAt,
        rejectionReason: null,
        notes: null,
        user: teacher,
      }));
    }

    // Combine both lists
    const allPendingTeachers = [...applications, ...pendingTeachersWithoutApplications];

    logger.info("Fetched pending teachers", {
      schoolId: user.schoolId,
      fromApplications: applications.length,
      fromPendingStatus: pendingTeachersWithoutApplications.length,
      total: allPendingTeachers.length,
    });

    return successResponse({ applications: allPendingTeachers });
  },
  ['school-admin']
);

/**
 * POST - Approve or reject a teacher application
 */
export const POST = createApiRoute(
  async (req: NextRequest, auth) => {
    const { userId, user } = auth;

    if (!user.schoolId) {
      return errorResponse("No school associated with your account", 400);
    }

    const body = await req.json();
    const { action, applicationId, reason } = body;

    if (!action || !applicationId) {
      return badRequestResponse("Missing required fields");
    }

    const now = new Date();

    // Check if this is a real application or just a user with pending status
    const [application] = await db
      .select()
      .from(teacherApplications)
      .where(
        and(
          eq(teacherApplications.id, applicationId),
          eq(teacherApplications.schoolId, user.schoolId)
        )
      )
      .limit(1);

    if (action === "approve") {
      if (application) {
        // This is a real application - update it
        if (application.status !== "pending") {
          return errorResponse("Application has already been processed", 400);
        }

        await db
          .update(teacherApplications)
          .set({
            status: "approved",
            reviewedBy: userId,
            reviewedAt: now,
            updatedAt: now,
          })
          .where(eq(teacherApplications.id, applicationId));

        // Update user status to enrolled
        await db
          .update(users)
          .set({
            onboardingStatus: "enrolled",
            updatedAt: now,
          })
          .where(eq(users.id, application.userId));

        logger.info("Approved teacher application", {
          applicationId,
          userId: application.userId,
          schoolId: user.schoolId,
          reviewedBy: userId,
        });
      } else {
        // This might be a teacher without an application (applicationId = userId)
        // Just update the user status
        await db
          .update(users)
          .set({
            onboardingStatus: "enrolled",
            updatedAt: now,
          })
          .where(
            and(
              eq(users.id, applicationId),
              eq(users.schoolId, user.schoolId),
              eq(users.type, "teacher")
            )
          );

        logger.info("Approved teacher without application", {
          userId: applicationId,
          schoolId: user.schoolId,
          reviewedBy: userId,
        });
      }

      return successResponse({ message: "Teacher application approved successfully" });
    } else if (action === "reject") {
      if (!reason || !reason.trim()) {
        return badRequestResponse("Rejection reason is required");
      }

      if (application) {
        // This is a real application - update it
        if (application.status !== "pending") {
          return errorResponse("Application has already been processed", 400);
        }

        await db
          .update(teacherApplications)
          .set({
            status: "rejected",
            rejectionReason: reason,
            reviewedBy: userId,
            reviewedAt: now,
            updatedAt: now,
          })
          .where(eq(teacherApplications.id, applicationId));

        // Update user status back to pending
        await db
          .update(users)
          .set({
            onboardingStatus: "pending_approval",
            updatedAt: now,
          })
          .where(eq(users.id, application.userId));

        logger.info("Rejected teacher application", {
          applicationId,
          userId: application.userId,
          schoolId: user.schoolId,
          reviewedBy: userId,
          reason,
        });
      } else {
        // This might be a teacher without an application
        await db
          .update(users)
          .set({
            onboardingStatus: "pending_approval",
            updatedAt: now,
          })
          .where(
            and(
              eq(users.id, applicationId),
              eq(users.schoolId, user.schoolId),
              eq(users.type, "teacher")
            )
          );

        logger.info("Rejected teacher without application", {
          userId: applicationId,
          schoolId: user.schoolId,
          reviewedBy: userId,
          reason,
        });
      }

      return successResponse({ message: "Teacher application rejected" });
    } else {
      return badRequestResponse("Invalid action");
    }
  },
['school-admin']
);
