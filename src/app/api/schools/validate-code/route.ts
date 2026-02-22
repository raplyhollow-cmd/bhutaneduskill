import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { schools } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import type { ApiSuccess, ApiErrorResponse } from "@/types";

/**
 * POST /api/schools/validate-code
 * Validate a school code WITHOUT authentication
 * This is used during the signup flow before user creates an account
 *
 * Returns limited school information (name, location) for display purposes
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code } = body;

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { error: "School code is required", status: 400 } satisfies ApiErrorResponse,
        { status: 400 }
      );
    }

    const trimmedCode = code.trim().toUpperCase();

    if (trimmedCode.length < 3) {
      return NextResponse.json(
        {
          error: "Invalid school code format",
          status: 400,
          details: "School code must be at least 3 characters"
        } satisfies ApiErrorResponse,
        { status: 400 }
      );
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
      return NextResponse.json(
        {
          valid: false,
          message: "School code not found. Please check with your school administrator."
        },
        { status: 200 }
      );
    }

    const school = schoolRecords[0];

    // Check if school is active
    if (!school.isActive) {
      logger.info("School is inactive", { schoolId: school.id, code: trimmedCode });
      return NextResponse.json(
        {
          valid: false,
          message: "This school is currently inactive. Please contact your school administrator."
        },
        { status: 200 }
      );
    }

    // Check subscription status
    if (school.subscriptionStatus === "suspended" || school.subscriptionStatus === "cancelled") {
      logger.info("School subscription issue", {
        schoolId: school.id,
        code: trimmedCode,
        subscriptionStatus: school.subscriptionStatus
      });
      return NextResponse.json(
        {
          valid: false,
          message: `This school's subscription is ${school.subscriptionStatus}. Please contact the platform administrator.`
        },
        { status: 200 }
      );
    }

    logger.info("School code validated successfully", { schoolId: school.id, code: trimmedCode });

    return NextResponse.json(
      {
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
      } satisfies ApiSuccess<{ valid: boolean; school: { id: string; name: string; city: string | null; state: string | null; code: string } }>,
      { status: 200 }
    );

  } catch (error) {
    logger.error("School code validation error:", error);
    return NextResponse.json(
      {
        error: "Unable to validate school code. Please try again.",
        status: 500
      } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}
