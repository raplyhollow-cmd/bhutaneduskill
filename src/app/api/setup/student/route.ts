/**
 * STUDENT SETUP API
 *
 * POST /api/setup/student - Handle student onboarding/setup
 *
 * Note: Uses Clerk auth directly to handle new users not in DB yet
 * This is intentional as setup happens before database user creation
 */

import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users, wizardProgress, studentApplications, notifications, notificationDeliveries, schools } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { logger } from "@/lib/logger";

/**
 * Notify school admins when a new student applies for enrollment
 */
async function notifySchoolAdminsAboutNewStudent(schoolId: string, student: typeof users.$inferSelect) {
  try {
    // Get all school admins for this school
    const schoolAdmins = await db
      .select()
      .from(users)
      .where(eq(users.schoolId, schoolId))
      .then((admins) => admins.filter((a) => a.type === "school-admin"));

    if (schoolAdmins.length === 0) {
      logger.warn("No school admins found to notify", { schoolId });
      return;
    }

    // Create notification for each school admin
    const studentName = student.firstName && student.lastName
      ? `${student.firstName} ${student.lastName}`
      : student.name;
    const gradeText = student.classGrade || student.grade
      ? `Grade ${student.classGrade || student.grade}${student.section ? " " + student.section : ""}`
      : "Grade not specified";

    // Create a single notification for all school admins
    const notificationId = `notif-${Date.now()}-${nanoid(8)}`;
    const now = new Date();

    await db.insert(notifications).values({
      id: notificationId,
      title: "New Student Application",
      message: `${studentName} (${gradeText}) has applied for enrollment and needs your approval.`,
      type: "alert",
      category: "enrollment",
      targetAudience: "specific",
      targetUserIds: JSON.stringify(schoolAdmins.map(a => a.id)),
      priority: "high",
      status: "sent",
      senderId: student.id,
      senderName: studentName,
      senderRole: "student",
      actionUrl: "/school-admin/students/pending",
      actionLabel: "Review Application",
      sentAt: now,
      totalRecipients: schoolAdmins.length,
      deliveredCount: schoolAdmins.length,
      readCount: 0,
      createdAt: now,
      updatedAt: now,
    });

    // Create delivery records for each admin
    for (const admin of schoolAdmins) {
      try {
        const deliveryId = `delivery-${Date.now()}-${nanoid(8)}`;
        await db.insert(notificationDeliveries).values({
          id: deliveryId,
          notificationId,
          userId: admin.id,
          status: "delivered",
          deliveredAt: now,
          deliveryMethod: "in_app",
          createdAt: now,
          updatedAt: now,
        });
        logger.info("Created notification delivery for school admin", { deliveryId, adminId: admin.id });
      } catch (error) {
        logger.error("Failed to create notification delivery for admin", { adminId: admin.id, error });
      }
    }

    logger.info("Notified school admins about new student application", {
      schoolId,
      studentId: student.id,
      adminsNotified: schoolAdmins.length
    });
  } catch (error) {
    logger.error("Failed to notify school admins", { error });
  }
}

// ============================================================================
// POST /api/setup/student - Handle student setup
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get user from Clerk
    const clerkUser = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
      headers: {
        Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
      },
    }).then((res) => res.json());

    const body = await request.json();
    const { step, data } = body;

    logger.info("Student setup received", { step, data });

    // Get user from database
    const userRecord = await db
      .select()
      .from(users)
      .where(eq(users.clerkUserId, userId))
      .limit(1);

    let dbUser;

    if (userRecord.length === 0) {
      // User doesn't exist - create them
      logger.info("Creating new student user", { clerkUserId: userId });

      const newUserId = `user-${Date.now()}`;
      const firstName = clerkUser.first_name || "";
      const lastName = clerkUser.last_name || "";
      // Defensive email extraction
      const email = clerkUser.email_addresses?.[0]?.email_address
        || clerkUser.primary_email_address?.email_address
        || "";

      // Create the user with minimum required fields
      await db.insert(users).values({
        id: newUserId,
        clerkUserId: userId,
        type: "student",
        role: "student",
        name: `${firstName} ${lastName}`.trim() || "Student",
        firstName,
        lastName,
        email,
        phone: "",
        profileImage: clerkUser.image_url || "",
        gender: "",
        grade: 0,
        section: null,
        rollNumber: "",
        address: "",
        city: "",
        state: "",
        postalCode: "",
        country: "Bhutan",
        parentContact: null,
        parentPhone: null,
        emergencyContact: null,
        bloodGroup: "",
        enrollmentDate: new Date().toISOString().split('T')[0],
        lastLogin: new Date().toISOString(),
        onboardingComplete: step === "complete",
        onboardingStatus: "pending_enrollment",
        createdAt: new Date(),
        updatedAt: new Date(),
        ...(data.personalDetails?.fullName && {
          firstName: data.personalDetails.fullName.split(" ")[0],
          lastName: data.personalDetails.fullName.split(" ").slice(1).join(" "),
          name: data.personalDetails.fullName,
        }),
        ...(data.personalDetails?.dateOfBirth && {
          dateOfBirth: data.personalDetails.dateOfBirth,
        }),
        ...(data.personalDetails?.gender && {
          gender: data.personalDetails.gender,
        }),
        ...(data.personalDetails?.bloodGroup && {
          bloodGroup: data.personalDetails.bloodGroup,
        }),
        ...(data.academicDetails?.grade && {
          classGrade: parseInt(data.academicDetails.grade),
          grade: parseInt(data.academicDetails.grade),
        }),
        ...(data.academicDetails?.section && {
          section: data.academicDetails.section,
        }),
        ...(data.academicDetails?.rollNumber && {
          rollNumber: data.academicDetails.rollNumber,
        }),
        ...(data.guardianDetails?.guardianName && {
          parentContact: data.guardianDetails.guardianName,
        }),
        ...(data.guardianDetails?.guardianPhone && {
          parentPhone: data.guardianDetails.guardianPhone,
        }),
      });

      dbUser = (await db.select().from(users).where(eq(users.id, newUserId)).limit(1))[0];

      logger.info("Created new student user", { userId: dbUser.id });
    } else {
      dbUser = userRecord[0];
    }

    // Verify school code if provided and link user to school
    if (data?.schoolCode) {
      const schoolRecord = await db
        .select()
        .from(schools)
        .where(eq(schools.code, data.schoolCode))
        .limit(1);

      if (schoolRecord.length === 0) {
        return new Response(
          JSON.stringify({ error: "Invalid school code" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      // Link user to school
      await db
        .update(users)
        .set({ schoolId: schoolRecord[0].id })
        .where(eq(users.id, dbUser.id));

      dbUser.schoolId = schoolRecord[0].id;

      logger.info("Linked student to school", {
        userId: dbUser.id,
        schoolId: schoolRecord[0].id,
        schoolCode: data.schoolCode,
      });
    }

    // Update or create wizard progress
    let existingProgress: Array<{ id: string; currentStep: string; data: Record<string, unknown> }> = [];
    try {
      existingProgress = await db
        .select()
        .from(wizardProgress)
        .where(eq(wizardProgress.userId, dbUser.id))
        .limit(1);
    } catch {
      logger.warn("wizard_progress table not available, skipping progress tracking");
    }

    if (existingProgress.length > 0) {
      try {
        await db
          .update(wizardProgress)
          .set({
            currentStep: step === "complete" ? "5" : String((parseInt(existingProgress[0].currentStep as string) || 0) + 1),
            data: { ...(existingProgress[0].data as Record<string, unknown>), ...data },
            updatedAt: new Date(),
          })
          .where(eq(wizardProgress.id, existingProgress[0].id));
      } catch (error) {
        logger.warn("Could not update wizard_progress", { error });
      }
    } else {
      try {
        await db.insert(wizardProgress).values({
          id: nanoid(),
          userId: dbUser.id,
          currentStep: "1",
          completedSteps: [],
          data,
          isCompleted: false,
          lastUpdated: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      } catch {
        logger.warn("Could not insert wizard_progress");
      }
    }

    // Update user details
    if (data.personalDetails) {
      const nameParts = data.personalDetails.fullName?.split(" ") || ["", ""];
      const updateData: {
        firstName: string;
        lastName: string;
        dateOfBirth?: string;
      } = {
        firstName: nameParts[0],
        lastName: nameParts.slice(1).join(" "),
      };
      if (data.personalDetails.dateOfBirth) {
        updateData.dateOfBirth = data.personalDetails.dateOfBirth;
      }
      await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, dbUser.id));
    }

    if (data.academicDetails) {
      const updateData: Record<string, number | string> = {};
      if (data.academicDetails.grade) {
        updateData.classGrade = parseInt(data.academicDetails.grade);
        updateData.grade = parseInt(data.academicDetails.grade);
      }
      if (data.academicDetails.section) {
        updateData.section = data.academicDetails.section;
      }
      if (Object.keys(updateData).length > 0) {
        await db
          .update(users)
          .set(updateData)
          .where(eq(users.id, dbUser.id));
      }
    }

    // Mark onboarding as complete when step is "complete"
    if (step === "complete") {
      await db
        .update(users)
        .set({ onboardingComplete: true })
        .where(eq(users.id, dbUser.id));
      logger.info("Marked onboarding as complete for student", { userId: dbUser.id });

      // Create student application record if schoolId is available
      if (dbUser.schoolId) {
        try {
          // SEAT LIMIT CHECK: Verify school has capacity
          const schoolRecords = await db
            .select({
              maxStudents: schools.maxStudents,
              isActive: schools.isActive,
              subscriptionStatus: schools.subscriptionStatus,
            })
            .from(schools)
            .where(eq(schools.id, dbUser.schoolId))
            .limit(1);

          if (schoolRecords.length === 0) {
            logger.error("School not found during student setup", { schoolId: dbUser.schoolId });
            return new Response(
              JSON.stringify({ error: "School not found. Please contact support." }),
              { status: 404, headers: { "Content-Type": "application/json" } }
            );
          }

          const school = schoolRecords[0];

          // Check if school is active
          if (!school.isActive) {
            logger.warn("Student attempted to join inactive school", { schoolId: dbUser.schoolId });
            return new Response(
              JSON.stringify({ error: "This school is currently inactive. Please contact your school administrator." }),
              { status: 403, headers: { "Content-Type": "application/json" } }
            );
          }

          // Check if school subscription is active
          if (school.subscriptionStatus !== "active" && school.subscriptionStatus !== "trial") {
            logger.warn("Student attempted to join school with inactive subscription", {
              schoolId: dbUser.schoolId,
              subscriptionStatus: school.subscriptionStatus,
            });
            return new Response(
              JSON.stringify({ error: "This school's subscription is not active. Please contact your school administrator." }),
              { status: 403, headers: { "Content-Type": "application/json" } }
            );
          }

          // Count current enrolled students
          const currentStudentsResult = await db
            .select({ count: sql<number>`count(*)` })
            .from(users)
            .where(
              and(
                eq(users.schoolId, dbUser.schoolId),
                eq(users.type, "student"),
                eq(users.onboardingStatus, "enrolled")
              )
            );

          const currentStudentCount = currentStudentsResult[0]?.count || 0;

          // Check if limit reached
          if (currentStudentCount >= school.maxStudents) {
            logger.warn("School seat limit reached", {
              schoolId: dbUser.schoolId,
              currentStudents: currentStudentCount,
              maxStudents: school.maxStudents,
            });
            return new Response(
              JSON.stringify({
                error: "This school has reached its student capacity limit.",
                details: {
                  currentStudents: currentStudentCount,
                  maxStudents: school.maxStudents,
                },
              }),
              { status: 403, headers: { "Content-Type": "application/json" } }
            );
          }

          const applicationId = `app-${Date.now()}-${nanoid(8)}`;
          const now = new Date();

          await db.insert(studentApplications).values({
            id: applicationId,
            studentId: dbUser.id,
            schoolId: dbUser.schoolId || null,
            status: "pending",
            requestedGrade: dbUser.classGrade || dbUser.grade || null,
            requestedSection: dbUser.section || null,
            guardianName: dbUser.parentContact || null,
            guardianPhone: dbUser.parentPhone || null,
            guardianEmail: null,
            previousSchool: null,
            previousGrade: null,
            specialNeeds: null,
            submittedAt: now,
            reviewedAt: null,
            reviewedBy: null,
            rejectionReason: null,
            notes: null,
            createdAt: now,
            updatedAt: now,
          });

          logger.info("Created student application record", { applicationId, studentId: dbUser.id, schoolId: dbUser.schoolId });

          // Notify school admins about new student application
          await notifySchoolAdminsAboutNewStudent(dbUser.schoolId, dbUser);
        } catch (error) {
          logger.error("Failed to create student application or notify admins", { error });
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    logger.error("Student setup error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to process setup",
        details: error instanceof Error ? error.message : "Unknown error"
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
