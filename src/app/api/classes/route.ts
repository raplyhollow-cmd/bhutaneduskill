import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { requirePermission } from "@/lib/rbac";
import { db } from "@/lib/db";
import { classes } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";

// GET /api/classes - Get classes
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(['admin', 'school-admin', 'teacher', 'counselor']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { user: currentUser, userId } = authResult;

    // Check classes.read permission
    const permCheck = await requirePermission(userId, "classes.read");
    if (permCheck) return permCheck;

    const { searchParams } = new URL(request.url);
    const schoolId = searchParams.get("schoolId");
    const teacherId = searchParams.get("teacherId");
    const academicYear = searchParams.get("academicYear");

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
    logger.apiError(error, { route: "/", method: "GET" });
    return NextResponse.json({ error: "Failed to fetch classes" }, { status: 500 });
  }
}

// POST /api/classes - Create class
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(['admin', 'school-admin', 'teacher']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { user: currentUser, userId } = authResult;

    // Check classes.create permission
    const permCheck = await requirePermission(userId, "classes.create");
    if (permCheck) return permCheck;

    const body = await request.json();
    const { name, grade, section, academicYear, students } = body;

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
    logger.apiError(error, { route: "/", method: "GET" });
    return NextResponse.json({ error: "Failed to create class" }, { status: 500 });
  }
}
