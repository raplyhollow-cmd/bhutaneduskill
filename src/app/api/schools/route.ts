import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { schools, users } from "@/lib/db/schema";
import { eq, like, or } from "drizzle-orm";

// GET /api/schools - Get schools
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "50");

    const currentUser = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Only admin and counselors can list all schools
    if (!["admin", "counselor"].includes(currentUser.type)) {
      // Non-admin users can only see their own school
      if (currentUser.schoolId) {
        const school = await db.query.schools.findFirst({
          where: eq(schools.id, currentUser.schoolId),
        });
        return NextResponse.json({ schools: school ? [school] : [] });
      }
      return NextResponse.json({ schools: [] });
    }

    let schoolList;
    if (search) {
      schoolList = await db.query.schools.findMany({
        where: or(
          like(schools.name, `%${search}%`),
          like(schools.code, `%${search}%`)
        ),
        limit,
        orderBy: [schools.createdAt, "desc"],
      });
    } else {
      schoolList = await db.query.schools.findMany({
        limit,
        orderBy: [schools.createdAt, "desc"],
      });
    }

    return NextResponse.json({ schools: schoolList });
  } catch (error) {
    console.error("Schools fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch schools" }, { status: 500 });
  }
}

// POST /api/schools - Create school (admin only)
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, code, domain, address, contactEmail, contactPhone } = body;

    const currentUser = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
    });

    if (!currentUser || currentUser.type !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [newSchool] = await db
      .insert(schools)
      .values({
        id: `school_${Date.now()}`,
        tenantId: "default",
        name,
        code,
        domain,
        address,
        contactEmail,
        contactPhone,
        createdAt: new Date(),
      })
      .returning();

    return NextResponse.json({ school: newSchool }, { status: 201 });
  } catch (error) {
    console.error("School creation error:", error);
    return NextResponse.json({ error: "Failed to create school" }, { status: 500 });
  }
}
