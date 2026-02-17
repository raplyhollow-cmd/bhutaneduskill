import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
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

    // Check schools.read permission
    const permCheck = await requirePermission(userId, "schools.read");
    if (permCheck) return permCheck;

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

    // Check schools.create permission
    logger.debug("Checking schools.create permission", { userId });
    const permCheck = await requirePermission(userId, "schools.create");
    logger.debug("Permission check result", { granted: !permCheck });
    if (permCheck) return permCheck;

    const body = await request.json();
    const { name, code, address, contactEmail, contactPhone } = body;

    const [newSchool] = await db
      .insert(schools)
      .values({
        id: `school_${Date.now()}`,
        name,
        code,
        type: "public",
        address,
        city: "Thimphu",
        state: "Thimphu",
        country: "Bhutan",
        postalCode: "12345",
        phone: contactPhone || "123456",
        email: contactEmail || "school@bhutan.edu.bt",
        website: "https://school.bt",
        logo: "/logo.png",
        establishedYear: 2000,
        accreditationStatus: "registered",
        maxStudents: 1000,
        campusSize: "10 acres",
        facilities: [],
        board: "BCSE",
        principalName: "Principal",
        principalEmail: contactEmail || "principal@school.bt",
        principalPhone: contactPhone || "123456",
        counselorName: "Counselor",
        counselorEmail: "counselor@school.bt",
        counselorPhone: "123456",
        vicePrincipalName: "Vice Principal",
        schoolType: "public",
        level: "middle",
        contactEmail,
        contactPhone,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json({ school: newSchool }, { status: 201 });
  } catch (error) {
    logger.error(error, { route: "/api/schools", method: "POST" });
    return NextResponse.json({ error: "Failed to create school" }, { status: 500 });
  }
}
