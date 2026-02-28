/**
 * SCHOOL ADMIN SETTINGS API
 *
 * GET /api/school-admin/settings - Fetch all settings for the school
 * POST /api/school-admin/settings - Create or update school settings
 * PUT /api/school-admin/settings - Create academic years, grade configs, bell schedules
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 */

import { logger } from "@/lib/logger";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { schools, schoolSettings, academicYears, gradeConfigurations, bellSchedules } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { z } from "zod";
import { createApiRoute } from "@/lib/api/route-handler";
import { successResponse, errorResponse, badRequestResponse } from "@/lib/api/response-helpers";

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

// Helper to normalize optional strings - convert undefined/empty to empty string
const normalizeString = (value: string | undefined | null): string => value?.trim() || "";

const schoolSettingsSchema = z.object({
  // General Settings
  schoolName: z.string().min(1, "School name is required"),
  schoolCode: z.string().min(1, "School code is required"),
  email: z.string().optional(),
  phone: z.string().min(1, "Phone number is required"),
  address: z.string().min(1, "Address is required"),
  district: z.string().min(1, "District is required"),
  website: z.string().optional(),
  logo: z.string().optional(),

  // Academic Settings
  academicYearStart: z.string().optional(),
  academicYearEnd: z.string().optional(),
  currentTerm: z.string().optional(),
  gradingSystem: z.enum(["percentage", "gpa", "cwa", "grade"]),
  passMark: z.string().min(1, "Pass mark is required"),
  workingDays: z.array(z.string()).default([]),

  // Fee Settings
  currency: z.string().min(1, "Currency is required"),
  lateFeeEnabled: z.boolean().default(false),
  lateFeeAmount: z.string().default("0"),
  lateFeeAfter: z.string().default("0"),
  discountEnabled: z.boolean().default(false),

  // Notification Settings
  emailNotifications: z.boolean().default(true),
  smsNotifications: z.boolean().default(true),
  attendanceAlerts: z.boolean().default(true),
  feeReminders: z.boolean().default(true),
  examResults: z.boolean().default(true),

  // Integration Settings
  paymentGateway: z.string().default("rma"),
  emailService: z.string().default("resend"),
  smsService: z.string().default("bmobile"),

  // Security Settings
  twoFactorAuth: z.boolean().default(false),
  sessionTimeout: z.string().default("60"),
  ipRestriction: z.boolean().default(false),
  allowedIps: z.string().optional(),
});

// Type for validated and normalized settings
type ValidatedSchoolSettings = z.infer<typeof schoolSettingsSchema> & {
  email: string;
  website: string;
  logo: string;
  academicYearStart: string;
  academicYearEnd: string;
  currentTerm: string;
  allowedIps: string;
};

/**
 * Default values for school settings
 * Used when creating new settings records with partial data
 */
const DEFAULT_SETTINGS_VALUES = {
  schoolName: "",
  schoolCode: "",
  email: "",
  phone: "",
  address: "",
  district: "",
  website: "",
  logo: "",
  academicYearStart: "",
  academicYearEnd: "",
  currentTerm: "",
  gradingSystem: "percentage",
  passMark: "40",
  workingDays: [] as string[],
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
} as const;

/**
 * Normalize validated settings data for database operations
 */
function normalizeSettings<T extends Record<string, unknown>>(
  data: T,
  includeDefaults = false
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  if (includeDefaults) {
    Object.assign(result, DEFAULT_SETTINGS_VALUES);
  }

  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) {
      result[key] = "";
    } else if (typeof value === "string") {
      result[key] = value;
    } else {
      result[key] = value;
    }
  }

  return result;
}

const academicYearSchema = z.object({
  name: z.string().min(1, "Academic year name is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  isActive: z.boolean().default(false),
  currentTerm: z.string().optional(),
  terms: z.array(z.object({
    name: z.string(),
    startDate: z.string(),
    endDate: z.string(),
  })).optional(),
});

const gradeConfigurationSchema = z.object({
  gradingSystem: z.enum(["percentage", "gpa", "cwa", "grade"]),
  passMark: z.string().min(1, "Pass mark is required"),
  grades: z.array(z.object({
    grade: z.string(),
    minScore: z.number(),
    maxScore: z.number(),
    label: z.string(),
    gpa: z.number().optional(),
  })).optional(),
});

const bellScheduleSchema = z.object({
  name: z.string().min(1, "Schedule name is required"),
  isActive: z.boolean().default(true),
  periods: z.array(z.object({
    periodNumber: z.number(),
    name: z.string(),
    startTime: z.string(),
    endTime: z.string(),
    type: z.enum(["class", "break", "lunch"]),
  })).optional(),
});

// ============================================================================
// GET - Fetch all settings for the school
// ============================================================================

export const GET = createApiRoute(
  async (request: NextRequest, auth) => {
    const { user } = auth;

    if (!user.schoolId) {
      return errorResponse("School not found for user", 404);
    }

    const { searchParams } = new URL(request.url);
    const section = searchParams.get("section"); // "general", "academic", "fees", etc.

    // Fetch school info
    const [school] = await db
      .select()
      .from(schools)
      .where(eq(schools.id, user.schoolId))
      .limit(1);

    if (!school) {
      return errorResponse("School not found", 404);
    }

    // Fetch school settings
    const [settings] = await db
      .select()
      .from(schoolSettings)
      .where(eq(schoolSettings.schoolId, user.schoolId))
      .limit(1);

    // Fetch related data
    const [academicYearData, gradeConfigData, bellScheduleData] = await Promise.all([
      db.select()
        .from(academicYears)
        .where(eq(academicYears.schoolId, user.schoolId))
        .orderBy(desc(academicYears.createdAt)),
      db.select()
        .from(gradeConfigurations)
        .where(eq(gradeConfigurations.schoolId, user.schoolId))
        .limit(1),
      db.select()
        .from(bellSchedules)
        .where(eq(bellSchedules.schoolId, user.schoolId)),
    ]);

    // Return specific section if requested
    if (section === "general") {
      return successResponse({
        school: {
          name: school.name,
          code: school.code,
          email: school.email,
          phone: school.phone,
          address: school.address,
          website: school.website,
          logo: school.logo,
        },
        settings: settings ? {
          schoolName: settings.schoolName,
          schoolCode: settings.schoolCode,
          email: settings.email,
          phone: settings.phone,
          address: settings.address,
          district: settings.district,
          website: settings.website,
          logo: settings.logo,
        } : null,
      });
    }

    if (section === "academic") {
      return successResponse({
        settings: settings ? {
          academicYearStart: settings.academicYearStart,
          academicYearEnd: settings.academicYearEnd,
          currentTerm: settings.currentTerm,
          gradingSystem: settings.gradingSystem,
          passMark: settings.passMark,
          workingDays: settings.workingDays,
        } : null,
        academicYears: academicYearData,
        gradeConfiguration: gradeConfigData,
        bellSchedules: bellScheduleData,
      });
    }

    // Return all data
    return successResponse({
      school,
      settings,
      academicYears: academicYearData,
      gradeConfiguration: gradeConfigData,
      bellSchedules: bellScheduleData,
    });
  },
  ['school-admin', 'admin']
);

// ============================================================================
// POST - Create or update school settings
// ============================================================================

export const POST = createApiRoute(
  async (request: NextRequest, auth) => {
    const { user } = auth;

    if (!user.schoolId) {
      return errorResponse("School not found for user", 404);
    }

    const body = await request.json();
    const { section, ...data } = body;

    if (section === "general") {
      // Update school info and general settings
      const validatedData = schoolSettingsSchema.pick({
        schoolName: true,
        schoolCode: true,
        email: true,
        phone: true,
        address: true,
        district: true,
        website: true,
        logo: true,
      }).parse(data);

      // Update school table
      await db.update(schools)
        .set({
          name: validatedData.schoolName,
          email: validatedData.email,
          phone: validatedData.phone,
          address: validatedData.address,
          website: validatedData.website,
          logo: validatedData.logo || "",
          updatedAt: new Date(),
        })
        .where(eq(schools.id, user.schoolId));

      // Update or create settings
      const [existing] = await db
        .select()
        .from(schoolSettings)
        .where(eq(schoolSettings.schoolId, user.schoolId))
        .limit(1);

      if (existing) {
        const [updated] = await db.update(schoolSettings)
          .set({
            ...normalizeSettings(validatedData),
            updatedAt: new Date(),
          })
          .where(eq(schoolSettings.id, existing.id))
          .returning();
        return successResponse({ settings: updated });
      } else {
        const [created] = await db.insert(schoolSettings)
          .values({
            id: `settings_${Date.now()}`,
            schoolId: user.schoolId,
            ...DEFAULT_SETTINGS_VALUES,
            ...normalizeSettings(validatedData),
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();
        return successResponse({ settings: created }, 201);
      }
    }

    if (section === "academic") {
      const validatedData = schoolSettingsSchema.pick({
        academicYearStart: true,
        academicYearEnd: true,
        currentTerm: true,
        gradingSystem: true,
        passMark: true,
        workingDays: true,
      }).parse(data);

      const [existing] = await db
        .select()
        .from(schoolSettings)
        .where(eq(schoolSettings.schoolId, user.schoolId))
        .limit(1);

      if (existing) {
        const normalizedData = normalizeSettings(validatedData);
        const [updated] = await db.update(schoolSettings)
          .set({
            ...(normalizedData as typeof DEFAULT_SETTINGS_VALUES),
            updatedAt: new Date(),
          })
          .where(eq(schoolSettings.id, existing.id))
          .returning();
        return successResponse({ settings: updated });
      } else {
        const normalizedData = normalizeSettings(validatedData, true);
        const [created] = await db.insert(schoolSettings)
          .values({
            id: `settings_${Date.now()}`,
            schoolId: user.schoolId,
            ...(normalizedData as typeof DEFAULT_SETTINGS_VALUES),
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();
        return successResponse({ settings: created }, 201);
      }
    }

    // Full settings update (all sections)
    const validatedData = schoolSettingsSchema.parse(data);

    const [existing] = await db
      .select()
      .from(schoolSettings)
      .where(eq(schoolSettings.schoolId, user.schoolId))
      .limit(1);

    if (existing) {
      const normalizedData = normalizeSettings(validatedData);
      const [updated] = await db.update(schoolSettings)
        .set({
          ...(normalizedData as typeof DEFAULT_SETTINGS_VALUES),
          updatedAt: new Date(),
        })
        .where(eq(schoolSettings.id, existing.id))
        .returning();
      return successResponse({ settings: updated });
    } else {
      const normalizedData = normalizeSettings(validatedData, true);
      const [created] = await db.insert(schoolSettings)
        .values({
          id: `settings_${Date.now()}`,
          schoolId: user.schoolId,
          ...(normalizedData as typeof DEFAULT_SETTINGS_VALUES),
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
      return successResponse({ settings: created }, 201);
    }
  },
  ['school-admin', 'admin']
);

// ============================================================================
// PUT - Create academic years, grade configs, bell schedules
// ============================================================================

export const PUT = createApiRoute(
  async (request: NextRequest, auth) => {
    const { user } = auth;

    if (!user.schoolId) {
      return errorResponse("School not found for user", 404);
    }

    const body = await request.json();
    const { action, ...data } = body;

    if (action === "create_academic_year") {
      const validatedData = academicYearSchema.parse(data);

      // If this is set as active, deactivate all others
      if (validatedData.isActive) {
        await db.update(academicYears)
          .set({ isActive: false })
          .where(eq(academicYears.schoolId, user.schoolId));
      }

      const [created] = await db.insert(academicYears)
        .values({
          id: `ay_${Date.now()}`,
          schoolId: user.schoolId,
          ...validatedData,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      return successResponse({ academicYear: created }, 201);
    }

    if (action === "create_grade_configuration") {
      const validatedData = gradeConfigurationSchema.parse(data);

      // Delete existing grade configuration for this school (one per school)
      await db.delete(gradeConfigurations)
        .where(eq(gradeConfigurations.schoolId, user.schoolId));

      const [created] = await db.insert(gradeConfigurations)
        .values({
          id: `gradeconfig_${Date.now()}`,
          schoolId: user.schoolId,
          ...validatedData,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      return successResponse({ gradeConfiguration: created }, 201);
    }

    if (action === "create_bell_schedule") {
      const validatedData = bellScheduleSchema.parse(data);

      // If this is set as active, deactivate all others
      if (validatedData.isActive) {
        await db.update(bellSchedules)
          .set({ isActive: false })
          .where(eq(bellSchedules.schoolId, user.schoolId));
      }

      const [created] = await db.insert(bellSchedules)
        .values({
          id: `bell_${Date.now()}`,
          schoolId: user.schoolId,
          ...validatedData,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      return successResponse({ bellSchedule: created }, 201);
    }

    return badRequestResponse("Invalid action");
  },
  ['school-admin', 'admin']
);
