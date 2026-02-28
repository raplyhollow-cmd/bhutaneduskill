/**
 * TEACHER SETUP API
 *
 * POST /api/setup/teacher - Handle teacher onboarding/setup
 *
 * MIGRATED: Now uses createApiRoute wrapper for error handling
 * Note: Uses Clerk auth directly to handle new users not in DB yet
 */

import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users, wizardProgress, teacherApplications, notifications, notificationDeliveries, schools } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { logger } from "@/lib/logger";

// ============================================================================
// TYPES
// ============================================================================

interface ClerkJSEmailAddress {
  id: string;
  emailAddress: string;
}

interface ClerkJSUser {
  id: string;
  primaryEmailAddressId?: string;
  emailAddresses?: ClerkJSEmailAddress[];
  firstName?: string | null;
  lastName?: string | null;
  imageUrl?: string;
}

interface WizardProgressRecord {
  id: string;
  userId: string;
  currentStep: string;
  completedSteps: string[];
  data: Record<string, unknown>;
  isCompleted: boolean;
  lastUpdated: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Notify school admins when a new teacher applies for enrollment
 */
async function notifySchoolAdminsAboutNewTeacher(schoolId: string, teacher: typeof users.$inferInsert) {
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
    const teacherName = teacher.firstName && teacher.lastName
      ? `${teacher.firstName} ${teacher.lastName}`
      : teacher.name;

    // Create a single notification for all school admins
    const notificationId = `notif-${Date.now()}-${nanoid(8)}`;
    const now = new Date();

    await db.insert(notifications).values({
      id: notificationId,
      title: "New Teacher Application",
      message: `${teacherName} has applied for enrollment and needs your approval.`,
      type: "alert",
      category: "enrollment",
      targetAudience: "specific",
      targetUserIds: JSON.stringify(schoolAdmins.map(a => a.id)),
      priority: "high",
      status: "sent",
      senderId: teacher.id,
      senderName: teacherName,
      senderRole: "teacher",
      actionUrl: "/school-admin/teachers/pending",
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

    logger.info("Notified school admins about new teacher application", {
      schoolId,
      teacherId: teacher.id,
      adminsNotified: schoolAdmins.length
    });
  } catch (error) {
    logger.error("Failed to notify school admins", { error });
  }
}

// ============================================================================
// POST /api/setup/teacher - Handle teacher setup
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { step, data } = body;

    // Get user from database
    const userRecord = await db
      .select()
      .from(users)
      .where(eq(users.clerkUserId, user.id))
      .limit(1);

    let dbUser;

    if (userRecord.length === 0) {
      // User doesn't exist - create them
      logger.info("Creating new teacher user", { clerkUserId: user.id });

      const newUserId = `user-${Date.now()}`;
      const firstName = user.firstName || "";
      const lastName = user.lastName || "";
      // Defensive email extraction
      const email = user.primaryEmailAddress?.emailAddress
        || user.emailAddresses?.find((e: ClerkJSEmailAddress) => e.id === user.primaryEmailAddressId)?.emailAddress
        || user.emailAddresses?.[0]?.emailAddress
        || "";

      // Create the user
      await db.insert(users).values({
        id: newUserId,
        clerkUserId: user.id,
        type: "teacher",
        role: "teacher",
        name: `${firstName} ${lastName}`.trim() || "Teacher",
        firstName,
        lastName,
        email,
        phone: data.personalDetails?.phone || "",
        profileImage: user.imageUrl || "",
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
        department: "",
        employeeId: data.personalDetails?.employeeId || "",
        subjects: data.subjects || [],
        ...(data.personalDetails?.fullName && {
          firstName: data.personalDetails.fullName.split(" ")[0],
          lastName: data.personalDetails.fullName.split(" ").slice(1).join(" "),
          name: data.personalDetails.fullName,
        }),
        ...(data.personalDetails?.email && { email: data.personalDetails.email }),
        ...(data.personalDetails?.phone && { phone: data.personalDetails.phone }),
      });

      dbUser = (await db.select().from(users).where(eq(users.id, newUserId)).limit(1))[0];

      logger.info("Created new teacher user", { userId: dbUser.id });
    } else {
      dbUser = userRecord[0];
    }

    // Verify school code if provided and link user to school
    if (data?.schoolCode) {
      const schoolRecord = await db
        .select({
          id: schools.id,
          name: schools.name,
          code: schools.code,
        })
        .from(schools)
        .where(eq(schools.code, data.schoolCode))
        .limit(1);

      if (schoolRecord.length === 0) {
        return NextResponse.json({ error: "Invalid school code" }, { status: 400 });
      }

      // Link user to school
      await db
        .update(users)
        .set({ schoolId: schoolRecord[0].id })
        .where(eq(users.id, dbUser.id));

      // Update dbUser with the new schoolId
      dbUser.schoolId = schoolRecord[0].id;

      logger.info("Linked teacher to school", {
        userId: dbUser.id,
        schoolId: schoolRecord[0].id,
        schoolCode: data.schoolCode,
      });
    }

    // Update or create wizard progress
    let existingProgress: WizardProgressRecord[] = [];
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
            currentStep: step === "complete" ? "5" : String((parseInt(existingProgress[0].currentStep) || 0) + 1),
            data: { ...(existingProgress[0].data || {}), ...data },
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
      const fullName = data.personalDetails.fullName || "";
      const nameParts = fullName.trim().split(" ");
      await db
        .update(users)
        .set({
          firstName: nameParts[0] || "",
          lastName: nameParts.slice(1).join(" ") || "",
          email: data.personalDetails.email || "",
          phone: data.personalDetails.phone || "",
          employeeId: data.personalDetails.employeeId || "",
          subjects: data.subjects || [],
        })
        .where(eq(users.id, dbUser.id));
    }

    // Mark onboarding as complete when step is "complete"
    if (step === "complete") {
      await db
        .update(users)
        .set({ onboardingComplete: true })
        .where(eq(users.id, dbUser.id));
      logger.info("Marked onboarding as complete for teacher", { userId: dbUser.id });

      // Create teacher application record if schoolId is available
      if (dbUser.schoolId) {
        try {
          // Verify school is active and subscription is valid
          const schoolRecords = await db
            .select({
              isActive: schools.isActive,
              subscriptionStatus: schools.subscriptionStatus,
            })
            .from(schools)
            .where(eq(schools.id, dbUser.schoolId))
            .limit(1);

          if (schoolRecords.length === 0) {
            logger.error("School not found during teacher setup", { schoolId: dbUser.schoolId });
            return NextResponse.json(
              { error: "School not found. Please contact support." },
              { status: 404 }
            );
          }

          const school = schoolRecords[0];

          // Check if school is active
          if (!school.isActive) {
            logger.warn("Teacher attempted to join inactive school", { schoolId: dbUser.schoolId });
            return NextResponse.json(
              { error: "This school is currently inactive. Please contact your school administrator." },
              { status: 403 }
            );
          }

          // Check if school subscription is active
          if (school.subscriptionStatus !== "active" && school.subscriptionStatus !== "trial") {
            logger.warn("Teacher attempted to join school with inactive subscription", {
              schoolId: dbUser.schoolId,
              subscriptionStatus: school.subscriptionStatus,
            });
            return NextResponse.json(
              { error: "This school's subscription is not active. Please contact your school administrator." },
              { status: 403 }
            );
          }

          const applicationId = `teacher-app-${Date.now()}-${nanoid(8)}`;
          const now = new Date();

          // Parse subjects as JSON array
          const subjectsArray = Array.isArray(data.subjects)
            ? data.subjects
            : (typeof data.subjects === 'string' ? JSON.parse(data.subjects || '[]') : []);

          await db.insert(teacherApplications).values({
            id: applicationId,
            userId: dbUser.id,
            schoolId: dbUser.schoolId,
            status: "pending",
            qualifications: data.qualifications || null,
            experience: data.experience ? parseInt(String(data.experience)) : null,
            subjects: JSON.stringify(subjectsArray),
            desiredClasses: data.desiredClasses ? JSON.stringify(data.desiredClasses) : null,
            previousSchool: data.previousSchool || null,
            specialization: data.specialization || null,
            appliedAt: now,
            reviewedBy: null,
            reviewedAt: null,
            rejectionReason: null,
            notes: null,
            createdAt: now,
            updatedAt: now,
          });

          logger.info("Created teacher application record", { applicationId, userId: dbUser.id, schoolId: dbUser.schoolId });

          // Notify school admins about new teacher application
          await notifySchoolAdminsAboutNewTeacher(dbUser.schoolId, dbUser);
        } catch (error) {
          logger.error("Failed to create teacher application or notify admins", { error });
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Teacher setup error:", error);
    return NextResponse.json(
      {
        error: "Failed to process setup",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
