import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { schools } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { createApiRoute } from "@/lib/api/route-handler";
import { successResponse, errorResponse, badRequestResponse, createdResponse, conflictResponse } from "@/lib/api/response-helpers";
import { logger } from "@/lib/logger";
import { TIER_LIMITS, type SubscriptionTier } from "@/lib/billing-utils";
import { nanoid } from "nanoid";

// ============================================================================
// TYPES
// ============================================================================

interface CreateSchoolRequest {
  name: string;
  code: string;
  type?: string; // Ownership type: "public" | "private"
  schoolType?: string; // School level: "primary" | "middle_secondary" | "higher_secondary"
  level?: string;
  address?: string;
  city?: string;
  districtId?: string;
  contactEmail?: string;
  contactPhone?: string;
  subscriptionTier?: SubscriptionTier;
  maxStudents?: number;
  tenantId?: string;
}

// ============================================================================
// POST /api/admin/schools - Create a new school
// ============================================================================

export const POST = createApiRoute(
  async (request: NextRequest, auth) => {
    if (!auth) {
      return errorResponse("Unauthorized", 401);
    }

    const { userId } = auth;

    try {
      // Parse Request Body
      const body: CreateSchoolRequest = await request.json();

      // Validate Required Fields
      if (!body.name || !body.code) {
        return badRequestResponse("School name and code are required");
      }

      // Validate Subscription Tier
      const tier = body.subscriptionTier || "standard";
      if (!["free", "basic", "standard", "premium", "enterprise"].includes(tier)) {
        return badRequestResponse(`Invalid tier: ${tier}. Must be one of: free, basic, standard, premium, enterprise`);
      }

      // Check for Duplicate Code
      const [existingSchool] = await db
        .select({ id: schools.id })
        .from(schools)
        .where(eq(schools.code, body.code.toUpperCase()))
        .limit(1);

      if (existingSchool) {
        return conflictResponse(`A school with code "${body.code}" already exists`);
      }

      // Calculate Max Students based on Tier
      const tierLimit = (tier as keyof typeof TIER_LIMITS) ? TIER_LIMITS[tier as keyof typeof TIER_LIMITS] : TIER_LIMITS.standard;
      const maxStudents = body.maxStudents || tierLimit || 100;

      // Generate School ID
      const schoolId = `school_${nanoid()}`;

      // Create School Record
      await db
        .insert(schools)
        .values({
          id: schoolId,
          name: body.name,
          code: body.code.toUpperCase(),
          type: body.type || "public", // Ownership type: public/private from form
          schoolType: body.schoolType || "middle_secondary", // School level: primary/middle_secondary/higher_secondary
          level: body.level || body.schoolType === "primary" ? "PP-VI" :
                  body.schoolType === "middle_secondary" ? "PP-X" :
                  body.schoolType === "higher_secondary" ? "XI-XII" : "PP-XII",
          address: body.address || "TBD",
          city: body.city || "Thimphu",
          state: body.city || "Thimphu", // Using city as state for Bhutan
          country: "Bhutan",
          postalCode: "TH001", // Default postal code
          phone: body.contactPhone || "+975-2-322256",
          email: body.contactEmail || "admin@school.edu.bt",
          website: "https://school.edu.bt",
          logo: "/logo.png",
          establishedYear: new Date().getFullYear(),
          accreditationStatus: "registered",
          campusSize: "10 acres",
          board: "BCSE",
          principalName: "TBD",
          principalEmail: body.contactEmail || "principal@school.edu.bt",
          principalPhone: body.contactPhone || "+975-2-322256",
          counselorName: "TBD",
          counselorEmail: "counselor@school.edu.bt",
          counselorPhone: "+975-2-322256",
          vicePrincipalName: "TBD",
          districtId: body.districtId || null,
          contactEmail: body.contactEmail || null,
          contactPhone: body.contactPhone || null,
          tenantId: body.tenantId || schoolId, // Use schoolId as default tenantId for multi-tenancy
          subscriptionTier: tier,
          subscriptionStatus: "active",
          maxStudents,
          isActive: true,
          activatedAt: new Date(), // Explicit activation timestamp
          setupComplete: false, // Explicit setup status
          setupCompletedAt: null, // Will be set when setup is complete
          currentSessionYear: String(new Date().getFullYear()), // Current academic session
          feeGenerationDate: null, // No fees generated yet
          feeGenerationStatus: "pending", // Fee generation status
          facilities: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        });

      // Fetch the created school using select (more reliable than .returning() with neon-http)
      const [createdSchool] = await db
        .select()
        .from(schools)
        .where(eq(schools.id, schoolId))
        .limit(1);

      if (!createdSchool) {
        return errorResponse("School created but failed to retrieve", 500);
      }

      // Log Success
      logger.info("School created successfully", {
        schoolId,
        schoolName: createdSchool.name,
        schoolCode: createdSchool.code,
        tier,
        maxStudents,
        createdBy: userId,
      });

      // Return Response
      return createdResponse({
        school: createdSchool,
        message: `School "${createdSchool.name}" created successfully with ${tier} tier (${maxStudents} student capacity)`
      });

    } catch (error) {
      logger.apiError(error, { route: "/api/admin/schools", method: "POST" });
      // Log the actual error message for debugging
      console.error("School creation error:", error);
      return errorResponse(
        error instanceof Error ? error.message : "Failed to create school",
        500
      );
    }
  },
  ['admin']
);

// ============================================================================
// GET /api/admin/schools - List all schools (optional, for completeness)
// ============================================================================

export const GET = createApiRoute(
  async (request: NextRequest, auth) => {
    if (!auth) {
      return errorResponse("Unauthorized", 401);
    }

    const { userId } = auth;

    try {
      const { searchParams } = new URL(request.url);
      const limit = parseInt(searchParams.get("limit") || "50");
      const offset = parseInt(searchParams.get("offset") || "0");

      // Build query - use raw select since query.schools might not exist
      const schoolsList = await db
        .select()
        .from(schools)
        .limit(limit)
        .offset(offset)
        .orderBy(desc(schools.createdAt));

      logger.info("Schools listed", { userId, count: schoolsList.length });

      return successResponse({
        schools: schoolsList,
        total: schoolsList.length,
        message: `Found ${schoolsList.length} schools`
      });

    } catch (error) {
      logger.apiError(error, { route: "/api/admin/schools", method: "GET" });
      return errorResponse("Failed to fetch schools", 500);
    }
  },
  ['admin']
);
