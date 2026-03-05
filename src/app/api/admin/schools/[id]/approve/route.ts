import { createApiRoute } from "@/lib/api/route-handler";
import { db } from "@/lib/db";
import { schools } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { logger } from "@/lib/logger";

// POST /api/admin/schools/[id]/approve - Approve school and activate subscription
export const POST = createApiRoute<{ id: string }>(
  async (req, auth, context) => {
    const { userId: adminId } = auth;
    const { id: schoolId } = await (context?.params || Promise.resolve({ id: "" }));

    const body = await req.json();
    const { subscriptionTier = "standard" } = body;

    // Check if school exists
    const existingSchool = await db
      .select()
      .from(schools)
      .where(eq(schools.id, schoolId))
      .limit(1);

    if (existingSchool.length === 0) {
      return { error: 'School not found', status: 404 };
    }

    const school = existingSchool[0];

    // Update school to active
    const [updatedSchool] = await db
      .update(schools)
      .set({
        subscriptionStatus: 'active',
        subscriptionTier,
        activatedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(schools.id, schoolId))
      .returning();

    logger.info('School approved and activated', {
      schoolId,
      schoolName: school.name,
      subscriptionTier,
      approvedBy: adminId,
    });

    return {
      data: updatedSchool,
      message: 'School approved successfully',
    };
  },
  ["admin"]
);
