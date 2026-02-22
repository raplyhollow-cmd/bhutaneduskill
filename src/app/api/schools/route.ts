import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { schools, users } from "@/lib/db/schema";
import { eq, like, or, desc } from "drizzle-orm";
import { requireAuth } from "@/lib/auth-utils";
import { requirePermission } from "@/lib/rbac";
import { logger } from "@/lib/logger";

// GET /api/schools - Get schools
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if ("error" in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { user, userId } = authResult;

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
        const school = await db.query.schools.findFirst({
          where: eq(schools.id, user.schoolId),
        });
        return NextResponse.json({ schools: school ? [school] : [] });
      }
      return NextResponse.json({ schools: [] });
    }

    let schoolList: any[];
    if (search) {
      schoolList = await db.query.schools.findMany({
        where: or(
          like(schools.name, `%${search}%`),
          like(schools.code, `%${search}%`)
        ),
        limit,
        orderBy: desc(schools.createdAt),
      });
    } else {
      schoolList = await db.query.schools.findMany({
        limit,
        orderBy: desc(schools.createdAt),
      });
    }

    return NextResponse.json({ schools: schoolList });
  } catch (error) {
    logger.error(error, { route: "/api/schools", method: "GET" });
    return NextResponse.json({ error: "Failed to fetch schools" }, { status: 500 });
  }
}

// POST /api/schools - Create school (admin only)
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(["admin"]);

    if ("error" in authResult) {
      logger.security("unauthorized_school_creation_attempt", { error: authResult.error });
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { user, userId } = authResult;
    logger.debug("School creation auth check", { userId, userType: user?.type });

    // Platform admins already verified by requireAuth(["admin"]) - skip RBAC check
    // RBAC permission check is only needed for non-admin roles

    const body = await request.json();
    const { name, code, address, contactEmail, contactPhone, subscriptionStatus, subscriptionTier, district, maxStudents } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json({ error: "School name is required" }, { status: 400 });
    }

    // Auto-generate school code in format: ABC-DIST-YYYY
    // Flow diagram: Generate ABC-DIST-2024 code
    const currentYear = new Date().getFullYear();
    const districtCode = district ? district.substring(0, 3).toUpperCase() : "THI"; // Default to Thimphu
    const nameCode = code || name.substring(0, 3).toUpperCase();
    let generatedCode = `${nameCode}-${districtCode}-${currentYear}`;

    // Check if code already exists
    const existingSchool = await db.query.schools.findFirst({
      where: eq(schools.code, generatedCode),
    });

    if (existingSchool) {
      // Add random suffix if code exists
      const randomSuffix = Math.random().toString(36).substring(2, 4).toUpperCase();
      generatedCode = `${nameCode}-${districtCode}-${currentYear}-${randomSuffix}`;
    }

    // Generate a unique school ID
    const schoolId = `school_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

    // Build school data with fields that exist in database
    // Note: subscriptionStatus, subscriptionTier, activatedAt, setupComplete fields
    // are NOT in the database yet - they need to be added via migration
    const schoolData: any = {
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
      facilities: "[]", // Store as JSON string (db column is text type)
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
      // Note: subscription status and tier will be stored in a separate table or added later
      isActive: true, // Default to active since subscription columns don't exist yet
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insert(schools).values(schoolData);

    // Query the created school to return it
    const createdSchool = await db.query.schools.findFirst({
      where: eq(schools.id, schoolId),
    });

    logger.info("School created successfully", { schoolId, code: generatedCode, name });

    return NextResponse.json({ school: createdSchool }, { status: 201 });
  } catch (error) {
    logger.error(error, { route: "/api/schools", method: "POST" });
    console.error("School creation error:", error);
    // Log the actual error for debugging
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    return NextResponse.json({ error: "Failed to create school" }, { status: 500 });
  }
}
