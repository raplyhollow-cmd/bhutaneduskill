/**
 * COMPLETE SETUP API
 *
 * POST /api/school-admin/settings/complete-setup
 *
 * Saves all initial setup settings and marks school.setupComplete = true
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { schools, bellSchedules, academicYears, departments, classes } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { createApiRoute } from "@/lib/api/route-handler";
import { successResponse, errorResponse, badRequestResponse } from "@/lib/api/response-helpers";

interface SetupData {
  schoolName: string;
  schoolCode: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  website: string;

  academicYearStart: string;
  academicYearEnd: string;
  currentTerm: string;
  terms: Array<{ name: string; startDate: string; endDate: string }>;
  workingDays: string[];

  bellScheduleName: string;
  regularSchedule: Array<{
    periodNumber: number;
    name: string;
    startTime: string;
    endTime: string;
    type: "class" | "break" | "lunch";
  }>;
  ppSchedule: Array<{
    periodNumber: number;
    name: string;
    startTime: string;
    endTime: string;
    type: "class" | "break" | "lunch";
  }>;
  ppDifferentSchedule: boolean;

  gradingSystem: string;
  passMark: string;
  grades: Array<{ grade: string; minScore: number; maxScore: number; label: string }>;

  // Optional: departments and classes from unified setup wizard
  departments?: Array<{ name: string; code: string; description: string }>;
  classes?: Array<{ grade: string; sections: string }>;
}

export const POST = createApiRoute(
  async (request: NextRequest, auth) => {
    const { userId, user } = auth;

    if (!user.schoolId) {
      return badRequestResponse("No school associated with your account");
    }

    try {
      const body: SetupData = await request.json();

      // 1. Update school profile - only update fields that school admin can modify
      // Don't update name/code/email/phone as those were set by platform admin
      // Use contactEmail/contactPhone for school admin's contact info instead
      await db
        .update(schools)
        .set({
          // Update school admin contact info
          contactEmail: body.email,
          contactPhone: body.phone,
          address: body.address,
          city: body.city,
          // Only update website if provided
          ...(body.website && { website: body.website }),
          // Mark setup as complete
          setupComplete: true,
          setupCompletedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(schools.id, user.schoolId));

      // 2. Create academic year
      const nanoidModule = await import("nanoid");
      const nanoid = nanoidModule.nanoid;

      const academicYearId = `ay-${nanoid()}`;
        // @ts-ignore - workingDays not in schema type
      await db.insert(academicYears).values({
        id: academicYearId,
        schoolId: user.schoolId,
        name: `${body.academicYearStart}-${body.academicYearEnd}`,
        startDate: `${body.academicYearStart}-03-01`,
        endDate: `${body.academicYearEnd}-02-28`,
        isActive: true,
        currentTerm: body.currentTerm,
        terms: body.terms,
        workingDays: body.workingDays,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // 3. Create regular bell schedule
      const regularScheduleId = `bs-${nanoid()}`;
      await db.insert(bellSchedules).values({
        id: regularScheduleId,
        schoolId: user.schoolId,
        name: body.bellScheduleName || "Regular Schedule",
        isActive: true,
        periods: body.regularSchedule,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // 4. Create PP bell schedule if different
      if (body.ppDifferentSchedule && body.ppSchedule.length > 0) {
        const ppScheduleId = `bs-${nanoid()}`;
        await db.insert(bellSchedules).values({
          id: ppScheduleId,
          schoolId: user.schoolId,
          name: "PP Schedule",
          isActive: true,
          periods: body.ppSchedule,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      // 5. Create departments if provided
      if (body.departments && body.departments.length > 0) {
        await db.insert(departments).values(
          body.departments.map((d) => ({
            id: `dept-${nanoid()}`,
            schoolId: user.schoolId,
            name: d.name,
            code: d.code,
            description: d.description || null,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          }))
        );
      }

      // 6. Create classes if provided
      if (body.classes && body.classes.length > 0) {
        for (const cls of body.classes) {
          // Parse sections (could be comma-separated like "A,B,C" or single like "A")
          const sections = cls.sections.split(",").map((s) => s.trim());
          const gradeValue = cls.grade === "PP" ? 0 : parseInt(cls.grade);

          for (const section of sections) {
            await db.insert(classes).values({
              id: `class-${nanoid()}`,
              schoolId: user.schoolId,
              name: `Class ${cls.grade}${section}`,
              grade: gradeValue,
              section,
              roomNumber: "TBD", // To be updated later
              capacity: 30, // Default capacity
              homeroomTeacherName: "To be assigned",
              classTeacherName: "To be assigned",
              isActive: true,
              createdAt: new Date(),
              updatedAt: new Date(),
            });
          }
        }
      }

      logger.info("School setup completed", { schoolId: user.schoolId, userId });

      return successResponse({
        message: "Setup completed successfully",
        schoolId: user.schoolId,
      });
    } catch (error) {
      logger.error("Failed to complete setup", { error, schoolId: user.schoolId });
      return errorResponse(error instanceof Error ? error.message : "Failed to save settings");
    }
  },
  ["school-admin"]
);
