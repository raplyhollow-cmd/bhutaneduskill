import { createApiRoute } from "@/lib/api/route-handler";
import { db } from "@/lib/db";
import { schools, users } from "@/lib/db/schema";
import { eq, count, and } from "drizzle-orm";
import { logger } from "@/lib/logger";

// GET /api/admin/schools/[id]/seat-usage - Get real seat usage for a school
export const GET = createApiRoute<{ id: string }>(
  async (req, auth, context) => {
    const { userId: adminId } = auth;
    const { id: schoolId } = await (context?.params || Promise.resolve({ id: "" }));

    // Get school details
    const [school] = await db
      .select({
        maxStudents: schools.maxStudents,
        subscriptionTier: schools.subscriptionTier,
      })
      .from(schools)
      .where(eq(schools.id, schoolId))
      .limit(1);

    if (!school) {
      return { error: 'School not found', status: 404 };
    }

    // Count active students
    const [studentResult] = await db
      .select({ count: count() })
      .from(users)
      .where(
        and(
          eq(users.schoolId, schoolId),
          eq(users.type, 'student'),
          eq(users.isActive, true)
        )
      );

    // Count active teachers
    const [teacherResult] = await db
      .select({ count: count() })
      .from(users)
      .where(
        and(
          eq(users.schoolId, schoolId),
          eq(users.type, 'teacher'),
          eq(users.isActive, true)
        )
      );

    // Calculate usage percentage
    const maxStudents = school.maxStudents || 500;
    const studentCountValue = studentResult?.count || 0;
    const teacherCountValue = teacherResult?.count || 0;
    const usagePercentage = Math.min(100, Math.round((studentCountValue / maxStudents) * 100));

    return {
      data: {
        schoolId,
        maxStudents,
        studentCount: studentCountValue,
        teacherCount: teacherCountValue,
        totalUsers: studentCountValue + teacherCountValue,
        usagePercentage,
        subscriptionTier: school.subscriptionTier || 'standard',
        remainingSeats: Math.max(0, maxStudents - studentCountValue),
        isAtCapacity: studentCountValue >= maxStudents,
        needsUpgrade: studentCountValue >= (maxStudents * 0.9), // Alert at 90%
      },
    };
  },
  ["admin"]
);
