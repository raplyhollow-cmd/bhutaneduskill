import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { bcseRegistrations, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { createApiRoute, getAuth } from "@/lib/api/route-handler";
import { successResponse, errorResponse, badRequestResponse, forbiddenResponse, notFoundResponse } from "@/lib/api/response-helpers";

/**
 * BCSE (Bhutan Council for School Examinations) Registration API
 *
 * Note: For school-specific management, use /api/school-admin/bcse-registrations
 * This endpoint provides cross-school access for platform admins
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 */

export const GET = createApiRoute(
  async (req: NextRequest) => {
    const { searchParams } = new URL(req.url);
    const schoolId = searchParams.get("schoolId");
    const examType = searchParams.get("examType") as "BCSE_10" | "BCSE_12" | null;
    const examYear = searchParams.get("examYear");

    // Build query conditions
    type QueryCondition = ReturnType<typeof eq>;
    const conditions: QueryCondition[] = [];
    if (schoolId) conditions.push(eq(bcseRegistrations.schoolId, schoolId));
    if (examType) conditions.push(eq(bcseRegistrations.examType, examType));
    if (examYear) conditions.push(eq(bcseRegistrations.examYear, parseInt(examYear)));

    const registrations = await db
      .select()
      .from(bcseRegistrations)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .limit(100);

    return successResponse({ registrations });
  },
  ['admin']
);

export const PATCH = createApiRoute(
  async (req: NextRequest) => {
    const auth = getAuth(req);
    if (!auth) {
      return errorResponse("Unauthorized", 401);
    }

    const { userId, user } = auth;

    const body = await req.json();
    const { registrationId, status, bcseIndexNumber, bcseRegistrationNumber } = body;

    if (!registrationId) {
      return badRequestResponse("Registration ID is required");
    }

    // Verify access to this registration
    const [registration] = await db
      .select()
      .from(bcseRegistrations)
      .where(eq(bcseRegistrations.id, registrationId))
      .limit(1);

    if (!registration) {
      return notFoundResponse("Registration");
    }

    // Check school admin access
    if (user.type !== 'admin') {
      const [userRecord] = await db
        .select({ schoolId: users.schoolId })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (userRecord?.schoolId !== registration.schoolId) {
        return forbiddenResponse("Access denied");
      }
    }

    // Update registration
    const updateData: Record<string, string | Date | null> = {
      updatedAt: new Date(),
    };

    if (status) updateData.registrationStatus = status;
    if (bcseIndexNumber) updateData.bcseIndexNumber = bcseIndexNumber;
    if (bcseRegistrationNumber) updateData.bcseRegistrationNumber = bcseRegistrationNumber;
    if (status === "confirmed") updateData.confirmedDate = new Date().toISOString();

    await db
      .update(bcseRegistrations)
      .set(updateData)
      .where(eq(bcseRegistrations.id, registrationId));

    return successResponse({ message: "Registration updated" });
  },
  ['school-admin', 'admin']
);
