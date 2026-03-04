/**
 * SCHOOL ADMIN ID CARDS API
 * Generate and manage ID cards for students, teachers, and staff
 */

import { NextRequest } from "next/server";
import { createApiRoute } from "@/lib/api/route-handler";
import { logger } from "@/lib/logger";
import { users, schools } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { generateIDCardPDF } from "@/lib/id-cards/generator";
import type { IDCardData } from "@/lib/id-cards/generator";

/**
 * GET /api/school-admin/id-cards
 * Get list of users for ID card generation
 */
export const GET = createApiRoute(
  async (req: NextRequest, auth) => {
    const { userId } = auth;

    const { searchParams } = new URL(req.url);
    const userType = searchParams.get("userType") || "student";
    const grade = searchParams.get("grade");

    // Get school ID from requesting user
    const [requester] = await db
      .select({ schoolId: users.schoolId })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!requester?.schoolId) {
      return { error: "School not found" };
    }

    // Build query conditions
    const conditions = [
      eq(users.schoolId, requester.schoolId),
      eq(users.type, userType),
    ];

    // Add grade filter for students
    if (userType === "student" && grade) {
      conditions.push(eq(users.classGrade, parseInt(grade)));
    }

    // Fetch users
    const userList = await db
      .select({
        id: users.id,
        name: users.name,
        type: users.type,
        employeeId: users.employeeId,
        rollNumber: users.rollNumber,
        grade: users.classGrade,
        section: users.section,
        department: users.department,
        profileImage: users.profileImage,
        dateOfBirth: users.dateOfBirth,
        bloodGroup: users.bloodGroup,
        phone: users.phone,
        emergencyContact: users.emergencyContact,
      })
      .from(users)
      .where(and(...conditions))
      .limit(100);

    logger.info("Fetched users for ID cards", { userId, userType, count: userList.length });

    return {
      success: true,
      data: { users: userList, schoolId: requester.schoolId },
    };
  },
  ["school-admin", "admin"]
);

/**
 * POST /api/school-admin/id-cards/generate
 * Generate ID card PDF for a user
 */
export const POST = createApiRoute(
  async (req: NextRequest, auth) => {
    const { userId } = auth;

    const body = await req.json();
    const { targetUserId } = body;

    if (!targetUserId) {
      return { error: "User ID is required" };
    }

    // Get user details
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, targetUserId))
      .limit(1);

    if (!user) {
      return { error: "User not found" };
    }

    // Get school details
    const [school] = await db
      .select()
      .from(schools)
      .where(eq(schools.id, user.schoolId!))
      .limit(1);

    if (!school) {
      return { error: "School not found" };
    }

    // Prepare ID card data
    const idCardData: IDCardData = {
      userId: user.id,
      name: user.name,
      type: user.type,
      employeeId: user.employeeId || undefined,
      rollNumber: user.rollNumber || undefined,
      grade: user.classGrade?.toString(),
      section: user.section || undefined,
      department: user.department || undefined,
      photo: user.profileImage || undefined,
      dateOfBirth: user.dateOfBirth || undefined,
      bloodGroup: user.bloodGroup || undefined,
      phone: user.phone || undefined,
      emergencyContact: user.emergencyContact || undefined,
      schoolId: school.id,
      schoolName: school.name,
      schoolCode: school.code || undefined,
      schoolAddress: school.address || undefined,
      schoolLogo: school.logo || undefined,
      principalName: school.principalName || undefined,
    };

    // Generate PDF
    const pdf = await generateIDCardPDF(idCardData, {
      doubleSided: true,
      includeTerms: true,
    });

    // Convert to base64
    const arrayBuffer = await pdf.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    logger.info("ID card generated", { userId, targetUserId });

    return {
      success: true,
      data: {
        pdf: `data:application/pdf;base64,${base64}`,
        filename: `IDCard_${user.name.replace(/\s+/g, "_")}.pdf`,
      },
    };
  },
  ["school-admin", "admin"]
);
