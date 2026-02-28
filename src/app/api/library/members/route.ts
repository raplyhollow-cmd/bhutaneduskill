import { logger } from "@/lib/logger";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { libraryMembers, users, circulation, schools } from "@/lib/db/schema";
import { eq, and, sql, desc, or } from "drizzle-orm";
import { z } from "zod";
import { createApiRoute } from "@/lib/api/route-handler";

// Valid library member types and statuses
type MemberType = "student" | "teacher" | "staff";
type MembershipStatus = "active" | "inactive" | "suspended";

const memberSchema = z.object({
  userId: z.string().optional(),
  memberType: z.enum(["student", "teacher", "staff"]),
  borrowingLimit: z.number().min(1).max(20).default(5),
  membershipStatus: z.enum(["active", "inactive", "suspended"]).default("active"),
  expiryDate: z.string().optional(), // ISO string, will be converted to Date
  notes: z.string().optional(),
});

// GET /api/library/members - Get library members
export const GET = createApiRoute(
  async (request: NextRequest, auth) => {
    const { user } = auth;
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
      conditions.push(eq(libraryMembers.membershipStatus, status as MembershipStatus));
    }

    if (memberType) {
      conditions.push(eq(libraryMembers.memberType, memberType as MemberType));
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

    const members = await db
      .select({
        id: libraryMembers.id,
        schoolId: libraryMembers.schoolId,
        userId: libraryMembers.userId,
        memberType: libraryMembers.memberType,
        membershipNumber: libraryMembers.membershipNumber,
        membershipStatus: libraryMembers.membershipStatus,
        joinedDate: libraryMembers.joinedDate,
        expiryDate: libraryMembers.expiryDate,
        borrowingLimit: libraryMembers.borrowingLimit,
        currentlyBorrowed: libraryMembers.currentlyBorrowed,
        totalBorrowed: libraryMembers.totalBorrowed,
        fineDue: libraryMembers.fineDue,
        notes: libraryMembers.notes,
        createdAt: libraryMembers.createdAt,
        updatedAt: libraryMembers.updatedAt,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
          type: users.type,
          classGrade: users.classGrade,
        },
        school: {
          id: schools.id,
          name: schools.name,
        },
      })
      .from(libraryMembers)
      .leftJoin(users, eq(libraryMembers.userId, users.id))
      .leftJoin(schools, eq(libraryMembers.schoolId, schools.id))
      .where(whereClause)
      .orderBy(desc(libraryMembers.createdAt));

    return {
      members: members.map(m => ({
        ...m,
        user: m.user || null,
        school: m.school || null,
      })),
      stats: {
        total: members.length,
        active: members.filter((m) => m.membershipStatus === "active").length,
        students: members.filter((m) => m.memberType === "student").length,
        teachers: members.filter((m) => m.memberType === "teacher").length,
        staff: members.filter((m) => m.memberType === "staff").length,
      },
    };
  },
  ['admin', 'school-admin']
);

// POST /api/library/members - Create library membership (school-admin only)
export const POST = createApiRoute(
  async (request: NextRequest, auth) => {
    const { user } = auth;
    const body = await request.json();
    const validatedData = memberSchema.parse(body);

    // If userId is provided, check if user exists and doesn't have membership
    if (validatedData.userId) {
      const existingMember = await db
        .select()
        .from(libraryMembers)
        .where(
          and(
            eq(libraryMembers.userId, validatedData.userId),
            eq(libraryMembers.schoolId, user.schoolId || "")
          )
        )
        .limit(1)
        .then(rows => rows[0] || null);

      if (existingMember) {
        return { error: "User already has a library membership", status: 400 };
      }

      const userExists = await db
        .select()
        .from(users)
        .where(eq(users.id, validatedData.userId))
        .limit(1)
        .then(rows => rows[0] || null);

      if (!userExists) {
        return { error: "User not found", status: 404 };
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
    const now = new Date();

    const [newMember] = await db.insert(libraryMembers).values({
      id: memberId,
      schoolId: user.schoolId || "",
      userId: validatedData.userId || user.id,
      memberType: validatedData.memberType,
      membershipNumber,
      membershipStatus: validatedData.membershipStatus,
      joinedDate: now,
      expiryDate: validatedData.expiryDate ? new Date(validatedData.expiryDate) : undefined,
      borrowingLimit: validatedData.borrowingLimit,
      currentlyBorrowed: 0,
      totalBorrowed: 0,
      fineDue: "0",
      notes: validatedData.notes,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    logger.info("Library membership created", {
      memberId,
      membershipNumber,
      userId: validatedData.userId || user.id,
    });

    return { member: newMember };
  },
  ['admin', 'school-admin']
);

// PATCH /api/library/members - Update library membership
export const PATCH = createApiRoute(
  async (request: NextRequest, auth) => {
    const { user } = auth;
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return { error: "Member ID is required", status: 400 };
    }

    const validatedData = memberSchema.partial().parse(updateData);

    // Convert expiryDate string to Date if provided
    const updateValues: Record<string, unknown> = { ...validatedData };
    if (validatedData.expiryDate) {
      updateValues.expiryDate = new Date(validatedData.expiryDate);
    }

    const updatedMember = await db
      .update(libraryMembers)
      .set({
        ...updateValues,
        updatedAt: new Date(),
      })
      .where(eq(libraryMembers.id, id))
      .returning();

    if (updatedMember.length === 0) {
      return { error: "Library member not found", status: 404 };
    }

    logger.info("Library membership updated", { memberId: id, userId: user.id });

    return { member: updatedMember[0] };
  },
  ['admin', 'school-admin']
);

// DELETE /api/library/members - Delete library membership
export const DELETE = createApiRoute(
  async (request: NextRequest, auth) => {
    const { user } = auth;
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return { error: "Member ID is required", status: 400 };
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
      return { error: "Cannot delete membership with active borrowed books", status: 400 };
    }

    const deletedMember = await db
      .delete(libraryMembers)
      .where(eq(libraryMembers.id, id))
      .returning();

    if (deletedMember.length === 0) {
      return { error: "Library member not found", status: 404 };
    }

    logger.info("Library membership deleted", { memberId: id, userId: user.id });

    return { message: "Library membership deleted successfully" };
  },
  ['admin', 'school-admin']
);
