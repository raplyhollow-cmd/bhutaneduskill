import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { classes, users } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";

// GET /api/classes - Get classes
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const schoolId = searchParams.get("schoolId");
    const teacherId = searchParams.get("teacherId");
    const academicYear = searchParams.get("academicYear");

    const currentUser = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Only admin, counselor, and teachers can view classes
    if (!["admin", "counselor", "teacher"].includes(currentUser.type)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const conditions = [];
    if (schoolId) {
      conditions.push(eq(classes.schoolId, schoolId));
    }
    if (teacherId) {
      conditions.push(eq(classes.teacherId, teacherId));
    }
    if (academicYear) {
      conditions.push(eq(classes.academicYear, academicYear));
    }

    // Teachers can only see their own classes
    if (currentUser.type === "teacher") {
      conditions.push(eq(classes.teacherId, currentUser.id));
    }

    let classList: any[];
    if (conditions.length > 0) {
      classList = await db.query.classes.findMany({
        where: conditions.length === 1 ? conditions[0] : and(...conditions),
        with: {
          teacher: true,
          school: true,
        },
        orderBy: desc(classes.createdAt),
      });
    } else {
      classList = await db.query.classes.findMany({
        with: {
          teacher: true,
          school: true,
        },
        orderBy: desc(classes.createdAt),
      });
    }

    return NextResponse.json({ classes: classList });
  } catch (error) {
    console.error("Classes fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch classes" }, { status: 500 });
  }
}

// POST /api/classes - Create class
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, grade, section, academicYear, students } = body;

    const currentUser = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Only admin and teachers can create classes
    if (!["admin", "teacher"].includes(currentUser.type)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const teacherId = body.teacherId || currentUser.id;
    const schoolId = body.schoolId || currentUser.schoolId;

    const [newClass] = await db
      .insert(classes)
      .values({
        ...({
          id: `class_${Date.now()}`,
        }),
        schoolId,
        teacherId,
        name,
        grade,
        section,
        academicYear,
        students: students || [],
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any)
      .returning();

    return NextResponse.json({ class: newClass }, { status: 201 });
  } catch (error) {
    console.error("Class creation error:", error);
    return NextResponse.json({ error: "Failed to create class" }, { status: 500 });
  }
}
