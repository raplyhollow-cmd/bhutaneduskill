import { createApiRoute } from "@/lib/api/route-handler";
import { db } from "@/lib/db";
import { schools } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { logger } from "@/lib/logger";

// PATCH /api/admin/schools/[id]/tier - Update school subscription tier
export const PATCH = createApiRoute<{ id: string }>(
  async (req, auth, context) => {
    const { userId: adminId } = auth;
    const { id: schoolId } = await (context?.params || Promise.resolve({ id: "" }));

    const body = await req.json();
    const { tier } = body;

    if (!tier || !['basic', 'standard', 'premium'].includes(tier)) {
      return { error: 'Invalid tier. Must be basic, standard, or premium', status: 400 };
    }

    // Get current school
    const [currentSchool] = await db
      .select()
      .from(schools)
      .where(eq(schools.id, schoolId))
      .limit(1);

    if (!currentSchool) {
      return { error: 'School not found', status: 404 };
    }

    // Update maxStudents based on tier
    const tierCapacity = {
      basic: 100,
      standard: 500,
      premium: 1000,
    };
    const newMaxStudents = tierCapacity[tier as keyof typeof tierCapacity] || 500;

    // Update school
    const [updatedSchool] = await db
      .update(schools)
      .set({
        subscriptionTier: tier,
        maxStudents: newMaxStudents,
        updatedAt: new Date(),
      })
      .where(eq(schools.id, schoolId))
      .returning();

    logger.info('School tier updated', {
      schoolId,
      oldTier: currentSchool.subscriptionTier,
      newTier: tier,
      oldMaxStudents: currentSchool.maxStudents,
      newMaxStudents,
      updatedBy: adminId,
    });

    return {
      data: updatedSchool,
      message: `School tier updated to ${tier}`,
    };
  },
  ["admin"]
);
