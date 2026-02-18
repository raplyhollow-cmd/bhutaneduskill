import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { bcseRegistrations, users } from "@/lib/db/schema";
import { db } from "@/lib/db";
import { eq, and } from "drizzle-orm";

/**
 * BCSE (Bhutan Council for School Examinations) Registration API
 *
 * Note: For school-specific management, use /api/school-admin/bcse-registrations
 * This endpoint provides cross-school access for platform admins
 */

export async function GET(req: NextRequest) {
  const authResult = await requireAuth(["admin"]);
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const { searchParams } = new URL(req.url);
  const schoolId = searchParams.get("schoolId");
  const examType = searchParams.get("examType") as "BCSE_10" | "BCSE_12" | null;
  const examYear = searchParams.get("examYear");

  // Build query conditions
  const conditions: any[] = [];
  if (schoolId) conditions.push(eq(bcseRegistrations.schoolId, schoolId));
  if (examType) conditions.push(eq(bcseRegistrations.examType, examType));
  if (examYear) conditions.push(eq(bcseRegistrations.examYear, parseInt(examYear)));

  const registrations = await db
    .select()
    .from(bcseRegistrations)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .limit(100);

  return NextResponse.json({
    success: true,
    data: { registrations },
  });
}

export async function PATCH(req: NextRequest) {
  const authResult = await requireAuth(["school_admin", "admin"]);
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const { userId } = authResult;
  const body = await req.json();
  const { registrationId, status, bcseIndexNumber, bcseRegistrationNumber } = body;

  if (!registrationId) {
    return NextResponse.json({
      error: "Registration ID is required",
    }, { status: 400 });
  }

  // Verify access to this registration
  const [registration] = await db
    .select()
    .from(bcseRegistrations)
    .where(eq(bcseRegistrations.id, registrationId))
    .limit(1);

  if (!registration) {
    return NextResponse.json({
      error: "Registration not found",
    }, { status: 404 });
  }

  // Check school admin access
  if (userId !== "admin") {
    const [user] = await db
      .select({ schoolId: users.schoolId })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (user?.schoolId !== registration.schoolId) {
      return NextResponse.json({
        error: "Access denied",
      }, { status: 403 });
    }
  }

  // Update registration
  const updateData: any = {
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

  return NextResponse.json({
    success: true,
    message: "Registration updated",
  });
}
