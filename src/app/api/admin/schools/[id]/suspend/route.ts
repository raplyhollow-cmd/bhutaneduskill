import { createApiRoute } from "@/lib/api/route-handler";
import { db } from "@/lib/db";
import { schools } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { logger } from "@/lib/logger";

// POST /api/admin/schools/[id]/suspend - Suspend school subscription
export const POST = createApiRoute<{ id: string }>(
  async (req, auth, context) => {
    const { userId: adminId } = auth;
    const { id: schoolId } = await (context?.params || Promise.resolve({ id: "" }));

    // Check if school exists
    const existingSchool = await db
      .select()
      .from(schools)
      .where(eq(schools.id, schoolId))
      .limit(1);

    if (existingSchool.length === 0) {
      return { error: 'School not found', status: 404 };
    }

    // Suspend school
    const [updatedSchool] = await db
      .update(schools)
      .set({
        subscriptionStatus: 'suspended',
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(schools.id, schoolId))
      .returning();

    logger.info('School suspended', {
      schoolId,
      schoolName: existingSchool[0].name,
      suspendedBy: adminId,
    });

    return {
      data: updatedSchool,
      message: 'School suspended successfully',
    };
  },
  ["admin"]
);
