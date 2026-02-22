import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { schools } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth-utils";
import { requirePermission } from "@/lib/rbac";
import { logger } from "@/lib/logger";
import { TIER_LIMITS, type SubscriptionTier } from "@/lib/billing-utils";
import { eq, sql, desc } from "drizzle-orm";
import { nanoid } from "nanoid";
import type { ApiSuccess, ApiErrorResponse } from "@/types";

// ============================================================================
// TYPES
// ============================================================================

interface CreateSchoolRequest {
  name: string;
  code: string;
  schoolType?: string;
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

export async function POST(request: NextRequest) {
  try {
    // 1. Authentication & Authorization
    const authResult = await requireAuth(["admin"]);
    if ("error" in authResult) {
      return NextResponse.json(
        { error: authResult.error, status: authResult.status } satisfies ApiErrorResponse,
        { status: authResult.status }
      );
    }
    const { userId } = authResult;

    // 2. Permission Check
    const permCheck = await requirePermission(userId, "schools.create");
    if (permCheck) return permCheck;

    // 3. Parse Request Body
    const body: CreateSchoolRequest = await request.json();

    // 4. Validate Required Fields
    if (!body.name || !body.code) {
      return NextResponse.json(
        { error: "School name and code are required", status: 400 } satisfies ApiErrorResponse,
        { status: 400 }
      );
    }

    // 5. Validate Subscription Tier
    const tier = body.subscriptionTier || "standard";
    if (!["free", "basic", "standard", "premium", "enterprise"].includes(tier)) {
      return NextResponse.json(
        { error: `Invalid tier: ${tier}. Must be one of: free, basic, standard, premium, enterprise`, status: 400 } satisfies ApiErrorResponse,
        { status: 400 }
      );
    }

    // 6. Check for Duplicate Code
    const [existingSchool] = await db
      .select({ id: schools.id })
      .from(schools)
      .where(eq(schools.code, body.code.toUpperCase()))
      .limit(1);

    if (existingSchool) {
      return NextResponse.json(
        { error: `A school with code "${body.code}" already exists`, status: 409 } satisfies ApiErrorResponse,
        { status: 409 }
      );
    }

    // 7. Calculate Max Students based on Tier
    const maxStudents = body.maxStudents || TIER_LIMITS[tier] || TIER_LIMITS.standard;

    // 8. Generate School ID
    const schoolId = `school_${nanoid()}`;

    // 9. Create School Record
    const newSchool = await db
      .insert(schools)
      .values({
        id: schoolId,
        name: body.name,
        code: body.code.toUpperCase(),
        type: body.schoolType || "middle_secondary",
        schoolType: body.schoolType || "public",
        level: body.level || "PP-XII",
        address: body.address || "TBD",
        city: body.city || "Thimphu",
        state: body.city || "Thimphu", // Using city as state for Bhutan
        country: "Bhutan",
        postalCode: "TH001", // Default postal code
        phone: body.contactPhone || "+975-2-322256",
        email: body.contactEmail || "admin@school.edu.bt",
        website: "https://school.edu.bt",
        logo: "/logos/default-school-logo.png",
        establishedYear: new Date().getFullYear(),
        accreditationStatus: "registered",
        campusSize: "Standard",
        board: "BCSEA", // Bhutan Council for School Examinations and Assessment
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
        subscriptionTier: tier,
        subscriptionStatus: "active",
        maxStudents,
        isActive: true,
        facilities: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // 10. Log Success
    logger.info("School created successfully", {
      schoolId,
      schoolName: newSchool[0].name,
      schoolCode: newSchool[0].code,
      tier,
      maxStudents,
      createdBy: userId,
    });

    // 11. Return Response
    return NextResponse.json({
      data: newSchool[0],
      message: `School "${newSchool[0].name}" created successfully with ${tier} tier (${maxStudents} student capacity)`,
    } satisfies ApiSuccess<typeof newSchool[0]>);

  } catch (error) {
    logger.apiError(error, { route: "/api/admin/schools", method: "POST" });
    return NextResponse.json(
      { error: "Failed to create school", status: 500 } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}

// ============================================================================
// GET /api/admin/schools - List all schools (optional, for completeness)
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(["admin"]);
    if ("error" in authResult) {
      return NextResponse.json(
        { error: authResult.error, status: authResult.status } satisfies ApiErrorResponse,
        { status: authResult.status }
      );
    }
    const { userId } = authResult;

    const permCheck = await requirePermission(userId, "schools.read");
    if (permCheck) return permCheck;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const tier = searchParams.get("tier");
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

    return NextResponse.json({
      data: schoolsList,
      message: `Found ${schoolsList.length} schools`,
    } satisfies ApiSuccess<typeof schoolsList>);

  } catch (error) {
    logger.apiError(error, { route: "/api/admin/schools", method: "GET" });
    return NextResponse.json(
      { error: "Failed to fetch schools", status: 500 } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}
