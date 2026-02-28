/**
 * SCHOOLS VALIDATE CODE API
 *
 * POST /api/schools/validate-code - Validate a school code WITHOUT authentication
 *
 * This is used during the signup flow before user creates an account
 * Returns limited school information (name, location) for display purposes
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { schools } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { createApiRoute } from "@/lib/api/route-handler";
import { badRequestResponse } from "@/lib/api/response-helpers";
import { logger } from "@/lib/logger";

export const POST = createApiRoute(
  async (request: NextRequest) => {
    const body = await request.json();
    const { code } = body;

    if (!code || typeof code !== "string") {
      return badRequestResponse("School code is required");
    }

    const trimmedCode = code.trim().toUpperCase();

    if (trimmedCode.length < 3) {
      return {
        error: "Invalid school code format",
        details: "School code must be at least 3 characters",
        status: 400,
      };
    }

    // Query for school by code
    const schoolRecords = await db
      .select({
        id: schools.id,
        name: schools.name,
        city: schools.city,
        state: schools.state,
        code: schools.code,
        isActive: schools.isActive,
        subscriptionStatus: schools.subscriptionStatus,
      })
      .from(schools)
      .where(eq(schools.code, trimmedCode))
      .limit(1);

    if (schoolRecords.length === 0) {
      logger.info("School code not found", { code: trimmedCode });
      return {
        valid: false,
        message: "School code not found. Please check with your school administrator.",
      };
    }

    const school = schoolRecords[0];

    // Check if school is active
    if (!school.isActive) {
      logger.info("School is inactive", { schoolId: school.id, code: trimmedCode });
      return {
        valid: false,
        message: "This school is currently inactive. Please contact your school administrator.",
      };
    }

    // Check subscription status
    if (school.subscriptionStatus === "suspended" || school.subscriptionStatus === "cancelled") {
      logger.info("School subscription issue", {
        schoolId: school.id,
        code: trimmedCode,
        subscriptionStatus: school.subscriptionStatus
      });
      return {
        valid: false,
        message: `This school's subscription is ${school.subscriptionStatus}. Please contact the platform administrator.`,
      };
    }

    logger.info("School code validated successfully", { schoolId: school.id, code: trimmedCode });

    return {
      data: {
        valid: true,
        school: {
          id: school.id,
          name: school.name,
          city: school.city,
          state: school.state,
          code: school.code,
        }
      }
    };
  },
  [] // Open endpoint - no auth required
);
