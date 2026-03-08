/**
 * SCHOOL SETTINGS API
 *
 * GET    /api/school-admin/settings          → get all settings
 * POST   /api/school-admin/settings          → save settings
 * PUT    /api/school-admin/settings          → perform actions (create_academic_year, etc)
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { schools, bellSchedules, academicYears } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { createApiRoute } from "@/lib/api/route-handler";
import { successResponse, errorResponse, badRequestResponse } from "@/lib/api/response-helpers";
import { nanoid } from "nanoid";

interface SchoolSettings {
  schoolName: string;
  schoolCode: string;
  email: string;
  phone: string;
  address: string;
  district: string;
  website: string;
  logo: string;
  academicYearStart: string;
  academicYearEnd: string;
  currentTerm: string;
  gradingSystem: string;
  passMark: string;
  workingDays: string[];
  currency: string;
  lateFeeEnabled: boolean;
  lateFeeAmount: string;
  lateFeeAfter: string;
  discountEnabled: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  attendanceAlerts: boolean;
  feeReminders: boolean;
  examResults: boolean;
  paymentGateway: string;
  emailService: string;
  smsService: string;
  twoFactorAuth: boolean;
  sessionTimeout: string;
  ipRestriction: boolean;
  allowedIps: string;
}

export const GET = createApiRoute(
  async (request: NextRequest, auth) => {
    const { userId, user } = auth;

    if (!user.schoolId) {
      return badRequestResponse("No school associated with your account");
    }

    try {
      // Get school data
      const [school] = await db
        .select()
        .from(schools)
        .where(eq(schools.id, user.schoolId))
        .limit(1);

      if (!school) {
        return errorResponse("School not found", 404);
      }

      // Get academic years
      const academicYearsData = await db
        .select()
        .from(academicYears)
        .where(eq(academicYears.schoolId, user.schoolId))
        .orderBy(academicYears.createdAt);

      // Get bell schedules
      const bellSchedulesData = await db
        .select()
        .from(bellSchedules)
        .where(eq(bellSchedules.schoolId, user.schoolId))
        .orderBy(bellSchedules.createdAt);

      // Map school data to settings format
      const settings: SchoolSettings = {
        schoolName: school.name || "",
        schoolCode: school.code || "",
        email: school.contactEmail || school.email || "",
        phone: school.contactPhone || school.phone || "",
        address: school.address || "",
        district: school.city || "",
        website: school.website || "",
        logo: school.logo || "",
        academicYearStart: "",
        academicYearEnd: "",
        currentTerm: "",
        gradingSystem: "percentage",
        passMark: "40",
        workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        currency: "BTN",
        lateFeeEnabled: false,
        lateFeeAmount: "0",
        lateFeeAfter: "0",
        discountEnabled: false,
        emailNotifications: true,
        smsNotifications: true,
        attendanceAlerts: true,
        feeReminders: true,
        examResults: true,
        paymentGateway: "rma",
        emailService: "resend",
        smsService: "bmobile",
        twoFactorAuth: false,
        sessionTimeout: "60",
        ipRestriction: false,
        allowedIps: "",
      };

      return successResponse({
        settings,
        academicYears: academicYearsData.map((ay) => ({
          id: ay.id,
          name: ay.name,
          startDate: ay.startDate || "",
          endDate: ay.endDate || "",
          currentTerm: ay.currentTerm || "",
          terms: ay.terms || [],
          isActive: ay.isActive,
        })),
        bellSchedules: bellSchedulesData.map((bs) => ({
          id: bs.id,
          name: bs.name,
          isActive: bs.isActive,
          periods: bs.periods || [],
        })),
        gradeConfigurations: [], // TODO: Implement grade configurations
      });
    } catch (error) {
      logger.error("Failed to fetch settings", { error, schoolId: user.schoolId });
      return errorResponse(error instanceof Error ? error.message : "Failed to fetch settings");
    }
  },
  ["school-admin"]
);

export const POST = createApiRoute(
  async (request: NextRequest, auth) => {
    const { userId, user } = auth;

    if (!user.schoolId) {
      return badRequestResponse("No school associated with your account");
    }

    try {
      const body: Partial<SchoolSettings> = await request.json();

      // Update school profile
      await db
        .update(schools)
        .set({
          contactEmail: body.email,
          contactPhone: body.phone,
          address: body.address,
          city: body.district,
          website: body.website,
          updatedAt: new Date(),
        })
        .where(eq(schools.id, user.schoolId));

      return successResponse({ message: "Settings saved successfully" });
    } catch (error) {
      logger.error("Failed to save settings", { error, schoolId: user.schoolId });
      return errorResponse(error instanceof Error ? error.message : "Failed to save settings");
    }
  },
  ["school-admin"]
);

export const PUT = createApiRoute(
  async (request: NextRequest, auth) => {
    const { userId, user } = auth;

    if (!user.schoolId) {
      return badRequestResponse("No school associated with your account");
    }

    try {
      const body = await request.json();
      const { action } = body;

      if (!action) {
        return badRequestResponse("Action is required");
      }

      switch (action) {
        case "create_academic_year":
          return await createAcademicYear(body, user.schoolId);
        case "create_grade_configuration":
          return await createGradeConfiguration(body, user.schoolId);
        case "create_bell_schedule":
          return await createBellSchedule(body, user.schoolId);
        default:
          return badRequestResponse("Invalid action");
      }
    } catch (error) {
      logger.error("Failed to perform settings action", { error, schoolId: user.schoolId });
      return errorResponse(error instanceof Error ? error.message : "Action failed");
    }
  },
  ["school-admin"]
);

async function createAcademicYear(body: any, schoolId: string) {
  const { name, startDate, endDate, currentTerm, terms, workingDays } = body;

  if (!name || !startDate || !endDate) {
    return badRequestResponse("Missing required fields for academic year");
  }

  const academicYearId = `ay-${nanoid()}`;
  await db.insert(academicYears).values({
    id: academicYearId,
    schoolId,
    name,
    startDate: startDate, // Store as string (YYYY-MM-DD format)
    endDate: endDate,     // Store as string (YYYY-MM-DD format)
    isActive: true,
    currentTerm,
    terms,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return successResponse({
    academicYear: {
      id: academicYearId,
      name,
      startDate,
      endDate,
      currentTerm,
      terms,
      isActive: true,
    },
  });
}

async function createGradeConfiguration(body: any, schoolId: string) {
  const { gradingSystem, passMark, grades } = body;

  // TODO: Implement grade configurations table
  // For now, just return success
  return successResponse({
    gradeConfiguration: {
      id: `gc-${nanoid()}`,
      gradingSystem,
      passMark,
      grades,
    },
  });
}

async function createBellSchedule(body: any, schoolId: string) {
  const { name, periods } = body;

  if (!name || !periods) {
    return badRequestResponse("Missing required fields for bell schedule");
  }

  const bellScheduleId = `bs-${nanoid()}`;
  await db.insert(bellSchedules).values({
    id: bellScheduleId,
    schoolId,
    name,
    isActive: true,
    periods,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return successResponse({
    bellSchedule: {
      id: bellScheduleId,
      name,
      periods,
      isActive: true,
    },
  });
}
