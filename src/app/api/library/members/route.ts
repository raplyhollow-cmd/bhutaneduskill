import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { libraryMembers, users, circulation } from "@/lib/db/schema";
import { eq, and, sql, desc, or } from "drizzle-orm";
import { z } from "zod";

const memberSchema = z.object({
  userId: z.string().optional(),
  memberType: z.enum(["student", "teacher", "staff"]),
  borrowingLimit: z.number().min(1).max(20).default(5),
  membershipStatus: z.enum(["active", "inactive", "suspended"]).default("active"),
  expiryDate: z.string().optional(),
  notes: z.string().optional(),
});

// GET /api/library/members - Get library members
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(['admin', 'school-admin']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { user } = authResult;
    const { searchParams } = new URL(request.url);

    const status = searchParams.get("status") || "";
    const memberType = searchParams.get("memberType") || "";
    const search = searchParams.get("search") || "";
    const myMembership = searchParams.get("my") === "true";

    // Build conditions
    const conditions = [];

    // Filter by school
    conditions.push(eq(libraryMembers.schoolId, user.schoolId || ""));

    // For students/teachers checking their own membership
    if (myMembership) {
      conditions.push(eq(libraryMembers.userId, user.id));
    }

    if (status) {
      conditions.push(eq(libraryMembers.membershipStatus, status as any));
    }

    if (memberType) {
      conditions.push(eq(libraryMembers.memberType, memberType as any));
    }

    if (search) {
      // Search by membership number or user name
      conditions.push(
        or(
          sql`${libraryMembers.membershipNumber} ILIKE ${`%${search}%`}`,
          sql`${users.name} ILIKE ${`%${search}%`}`
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const members = await db.query.libraryMembers.findMany({
      where: whereClause,
      with: {
        user: {
          columns: {
            id: true,
            name: true,
            email: true,
            type: true,
            classGrade: true,
          },
        },
        school: {
          columns: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [desc(libraryMembers.createdAt)],
    });

    return NextResponse.json({
      success: true,
      data: {
        members,
        stats: {
          total: members.length,
          active: members.filter((m) => m.membershipStatus === "active").length,
          students: members.filter((m) => m.memberType === "student").length,
          teachers: members.filter((m) => m.memberType === "teacher").length,
          staff: members.filter((m) => m.memberType === "staff").length,
        },
      },
    });
  } catch (error) {
    logger.error("Library members fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch library members" },
      { status: 500 }
    );
  }
}

// POST /api/library/members - Create library membership (school-admin only)
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(['admin', 'school-admin']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { user } = authResult;
    const body = await request.json();
    const validatedData = memberSchema.parse(body);

    // If userId is provided, check if user exists and doesn't have membership
    if (validatedData.userId) {
      const existingMember = await db.query.libraryMembers.findFirst({
        where: and(
          eq(libraryMembers.userId, validatedData.userId),
          eq(libraryMembers.schoolId, user.schoolId || "")
        ),
      });

      if (existingMember) {
        return NextResponse.json(
          { success: false, error: "User already has a library membership" },
          { status: 400 }
        );
      }

      const userExists = await db.query.users.findFirst({
        where: eq(users.id, validatedData.userId),
      });

      if (!userExists) {
        return NextResponse.json(
          { success: false, error: "User not found" },
          { status: 404 }
        );
      }
    }

    // Generate membership number
    const memberCount = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(libraryMembers)
      .where(eq(libraryMembers.schoolId, user.schoolId || ""));

    const year = new Date().getFullYear();
    const membershipNumber = `LIB-${year}-${String((memberCount[0]?.count || 0) + 1).padStart(4, "0")}`;

    const memberId = `lib_mem_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    const now = new Date().toISOString();

    const [newMember] = await db.insert(libraryMembers).values({
      id: memberId,
      schoolId: user.schoolId || "",
      userId: validatedData.userId || user.id,
      memberType: validatedData.memberType,
      membershipNumber,
      membershipStatus: validatedData.membershipStatus,
      joinedDate: now,
      expiryDate: validatedData.expiryDate,
      borrowingLimit: validatedData.borrowingLimit,
      currentlyBorrowed: 0,
      totalBorrowed: 0,
      fineDue: 0,
      notes: validatedData.notes,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    logger.info("Library membership created", {
      memberId,
      membershipNumber,
      userId: validatedData.userId || user.id,
    });

    return NextResponse.json({
      success: true,
      data: { member: newMember },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }
    logger.error("Library membership creation error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create library membership" },
      { status: 500 }
    );
  }
}

// PATCH /api/library/members - Update library membership
export async function PATCH(request: NextRequest) {
  try {
    const authResult = await requireAuth(['admin', 'school-admin']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { user } = authResult;
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Member ID is required" },
        { status: 400 }
      );
    }

    const validatedData = memberSchema.partial().parse(updateData);

    const updatedMember = await db
      .update(libraryMembers)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(eq(libraryMembers.id, id))
      .returning();

    if (updatedMember.length === 0) {
      return NextResponse.json(
        { success: false, error: "Library member not found" },
        { status: 404 }
      );
    }

    logger.info("Library membership updated", { memberId: id, userId: user.id });

    return NextResponse.json({
      success: true,
      data: { member: updatedMember[0] },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }
    logger.error("Library membership update error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update library membership" },
      { status: 500 }
    );
  }
}

// DELETE /api/library/members - Delete library membership
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireAuth(['admin', 'school-admin']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { user } = authResult;
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Member ID is required" },
        { status: 400 }
      );
    }

    // Check if member has borrowed books
    const activeBorrows = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(circulation)
      .where(and(
        eq(circulation.borrowerId, id),
        eq(circulation.status, "borrowed")
      ));

    if (activeBorrows[0]?.count > 0) {
      return NextResponse.json(
        { success: false, error: "Cannot delete membership with active borrowed books" },
        { status: 400 }
      );
    }

    const deletedMember = await db
      .delete(libraryMembers)
      .where(eq(libraryMembers.id, id))
      .returning();

    if (deletedMember.length === 0) {
      return NextResponse.json(
        { success: false, error: "Library member not found" },
        { status: 404 }
      );
    }

    logger.info("Library membership deleted", { memberId: id, userId: user.id });

    return NextResponse.json({
      success: true,
      data: { message: "Library membership deleted successfully" },
    });
  } catch (error) {
    logger.error("Library membership deletion error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete library membership" },
      { status: 500 }
    );
  }
}
