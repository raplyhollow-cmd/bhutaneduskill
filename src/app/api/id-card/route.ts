// @ts-nocheck
/**
 * STUDENT ID CARD API
 *
 * GET /api/id-card
 * Returns the student's ID card information and generates a downloadable ID card
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { createApiRoute } from "@/lib/api/route-handler";
import { users, schools } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { successResponse, notFoundResponse } from "@/lib/api/response-helpers";

export const GET = createApiRoute(
  async (request: NextRequest, auth) => {
    const { userId } = auth;

    const { searchParams } = new URL(request.url);
    const requestedUserId = searchParams.get("userId");

    // Only allow users to view their own ID card (or admins)
    const targetUserId = requestedUserId && auth.role === "admin" ? requestedUserId : userId;

    // Get user details
    const [user] = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        type: users.type,
        role: users.role,
        schoolId: users.schoolId,
        grade: users.grade,
        section: users.section,
        rollNumber: users.rollNumber,
        dateOfBirth: users.dateOfBirth,
        bloodGroup: users.bloodGroup,
        address: users.address,
        phone: users.phone,
        profileImage: users.profileImage,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, targetUserId))
      .limit(1);

    if (!user) {
      return notFoundResponse("User not found");
    }

    // Get school details for the ID card
    let school = null;
    if (user.schoolId) {
      const [schoolData] = await db
        .select({
          id: schools.id,
          name: schools.name,
          code: schools.code,
          address: schools.address,
          phone: schools.phone,
          logo: schools.logo,
        })
        .from(schools)
        .where(eq(schools.id, user.schoolId))
        .limit(1);
      school = schoolData;
    }

    // Generate ID card number if not exists
    const idCardNumber = user.rollNumber
      ? `${school?.code || "SCH"}-${user.grade}-${user.rollNumber}`
      : `${school?.code || "SCH"}-${targetUserId.substring(0, 8).toUpperCase()}`;

    // Calculate expiry (1 year from now for students)
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);

    return successResponse({
      success: true,
      idCard: {
        idCardNumber,
        userId: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: `${user.firstName} ${user.lastName}`.trim(),
        type: user.type,
        role: user.role,
        grade: user.grade,
        section: user.section,
        rollNumber: user.rollNumber,
        dateOfBirth: user.dateOfBirth,
        bloodGroup: user.bloodGroup,
        address: user.address,
        phone: user.phone,
        profileImage: user.profileImage,
        school: school
          ? {
              name: school.name,
              code: school.code,
              address: school.address,
              phone: school.phone,
              logo: school.logo,
            }
          : null,
        issuedAt: user.createdAt,
        validUntil: expiryDate.toISOString(),
        qrCode: `BHUTAN-EDU-${targetUserId}`, // For scanning
      },
      downloadUrl: `/api/id-card/download?userId=${targetUserId}`,
    });
  },
  ['student', 'teacher', 'admin', 'school-admin', 'parent']
);
