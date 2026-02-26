/**
 * SCHOOLS API
 *
 * GET /api/schools - Get schools
 * POST /api/schools - Create school (admin only)
 *
 * MIGRATED: Now uses createApiRoute wrapper for cleaner code
 * FIXED: No longer uses disabled db.query API
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { schools, users } from "@/lib/db/schema";
import { eq, like, or, desc } from "drizzle-orm";
import { requirePermission } from "@/lib/rbac";
import { logger } from "@/lib/logger";
import { createApiRoute, getAuth } from "@/lib/api/route-handler";
import { successResponse, errorResponse, createdResponse, badRequestResponse } from "@/lib/api/response-helpers";

// ============================================================================
// GET /api/schools - Get schools
// ============================================================================

export const GET = createApiRoute(
  async (request: NextRequest, auth) => {
    const { user, userId } = auth;

    // Check schools.read permission - skip for platform admins and counselors
    if (user.type !== "admin" && user.type !== "counselor") {
      const permCheck = await requirePermission(userId, "schools.read");
      if (permCheck) return permCheck;
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "50");

    // Only admin and counselors can list all schools
    if (!["admin", "counselor"].includes(user.type)) {
      // Non-admin users can only see their own school
      if (user.schoolId) {
        const schoolList = await db
          .select()
          .from(schools)
          .where(eq(schools.id, user.schoolId))
          .limit(1);
        return successResponse({ schools: schoolList });
      }
      return successResponse({ schools: [] });
    }

    // Use db.select() instead of db.query.schools.findMany()
    type SchoolRecord = typeof schools.$inferSelect;
    let schoolList: SchoolRecord[];
    if (search) {
      schoolList = await db
        .select()
        .from(schools)
        .where(or(
          like(schools.name, `%${search}%`),
          like(schools.code, `%${search}%`)
        ))
        .limit(limit)
        .orderBy(desc(schools.createdAt));
    } else {
      schoolList = await db
        .select()
        .from(schools)
        .limit(limit)
        .orderBy(desc(schools.createdAt));
    }

    return successResponse({ schools: schoolList });
  },
  ['admin', 'school-admin', 'teacher', 'counselor']
);

// ============================================================================
// POST /api/schools - Create school (admin only)
// ============================================================================

export const POST = createApiRoute(
  async (request: NextRequest, auth) => {
    const { user, userId } = auth;
    logger.debug("School creation auth check", { userId, userType: user?.type });

    const body = await request.json();
    const { name, code, address, contactEmail, contactPhone, subscriptionStatus, subscriptionTier, district, maxStudents } = body;

    // Validate required fields
    if (!name) {
      return badRequestResponse("School name is required");
    }

    // Auto-generate school code in format: ABC-DIST-YYYY
    const currentYear = new Date().getFullYear();
    const districtCode = district ? district.substring(0, 3).toUpperCase() : "THI";
    const nameCode = code || name.substring(0, 3).toUpperCase();
    let generatedCode = `${nameCode}-${districtCode}-${currentYear}`;

    // Check if code already exists - use db.select() instead of db.query
    const existingSchool = await db
      .select()
      .from(schools)
      .where(eq(schools.code, generatedCode))
      .limit(1);

    if (existingSchool.length > 0) {
      const randomSuffix = Math.random().toString(36).substring(2, 4).toUpperCase();
      generatedCode = `${nameCode}-${districtCode}-${currentYear}-${randomSuffix}`;
    }

    // Generate a unique school ID
    const schoolId = `school_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

    // Build school data
    interface SchoolCreateData {
      id: string;
      name: string;
      code: string;
      type: string;
      address: string;
      city: string;
      state: string;
      country: string;
      postalCode: string;
      phone: string;
      email: string;
      website: string;
      logo: string;
      establishedYear: number;
      accreditationStatus: string;
      maxStudents: number;
      campusSize: string;
      facilities: string;
      principalName: string;
      principalPhone: string;
      principalEmail: string;
      domain: string;
      isActive: boolean;
    }
    const schoolData: SchoolCreateData = {
      id: schoolId,
      name,
      code: generatedCode,
      type: "public",
      address: address || "",
      city: district || "Thimphu",
      state: district || "Thimphu",
      country: "Bhutan",
      postalCode: "12345",
      phone: contactPhone || "+975 2 123456",
      email: contactEmail || `${generatedCode.toLowerCase()}@school.bt`,
      website: "https://school.bt",
      logo: "/logo.png",
      establishedYear: currentYear,
      accreditationStatus: "registered",
      maxStudents: maxStudents || 1000,
      campusSize: "10 acres",
      facilities: "[]",
      board: "BCSE",
      principalName: "TBD",
      principalEmail: contactEmail || `principal@${generatedCode.toLowerCase()}.bt`,
      principalPhone: contactPhone || "+975 2 123456",
      counselorName: "TBD",
      counselorEmail: `counselor@${generatedCode.toLowerCase()}.bt`,
      counselorPhone: "+975 2 123456",
      vicePrincipalName: "TBD",
      schoolType: "public",
      level: "middle",
      contactEmail: contactEmail || null,
      contactPhone: contactPhone || null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insert(schools).values(schoolData as any);

    // Query the created school using db.select() instead of db.query
    const createdSchoolList = await db
      .select()
      .from(schools)
      .where(eq(schools.id, schoolId))
      .limit(1);

    const createdSchool = createdSchoolList[0];

    logger.info("School created successfully", { schoolId, code: generatedCode, name });

    return createdResponse({ school: createdSchool });
  },
  ['admin']
);
