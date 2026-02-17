"use server";

import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { users, counselorAssignments } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { logger } from "@/lib/logger";
import { nanoid } from "nanoid";

export async function createCounselor(data: {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  schoolId?: string;
  department?: string;
}) {
  const authResult = await requireAuth(['admin']);
  if ('error' in authResult) {
    throw new Error(authResult.error);
  }

  const { userId } = authResult;

  try {
    const counselorId = `counselor_${Date.now()}_${nanoid(8)}`;

    const result = await db.insert(users).values({
      id: counselorId,
      clerkUserId: counselorId, // Will be updated when linked to Clerk
      type: "counselor",
      role: "counselor",
      name: `${data.firstName} ${data.lastName}`,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone || null,
      schoolId: data.schoolId || null,
      department: data.department || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    const newCounselor = result[0];

    logger.info("Counselor created", { counselorId, userId });

    revalidatePath("/admin/counselors");

    return newCounselor;
  } catch (error) {
    logger.error(error, { context: "createCounselor", userId });
    throw error;
  }
}

export async function updateCounselor(counselorId: string, data: {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  schoolId?: string;
  department?: string;
  subjects?: string;
}) {
  const authResult = await requireAuth(['admin']);
  if ('error' in authResult) {
    throw new Error(authResult.error);
  }

  const { userId } = authResult;

  try {
    const updateData: Record<string, any> = {
      updatedAt: new Date(),
    };

    if (data.firstName !== undefined) updateData.firstName = data.firstName;
    if (data.lastName !== undefined) updateData.lastName = data.lastName;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.schoolId !== undefined) updateData.schoolId = data.schoolId;
    if (data.department !== undefined) updateData.department = data.department;

    // Update name based on first and last name
    if (data.firstName !== undefined || data.lastName !== undefined) {
      const firstName = data.firstName || "";
      const lastName = data.lastName || "";
      updateData.name = `${firstName} ${lastName}`.trim();
    }

    const [updated] = await db.update(users)
      .set(updateData)
      .where(and(eq(users.id, counselorId), eq(users.type, "counselor")))
      .returning();

    if (!updated) {
      throw new Error("Counselor not found");
    }

    logger.info("Counselor updated", { counselorId, userId });

    revalidatePath("/admin/counselors");

    return updated;
  } catch (error) {
    logger.error(error, { context: "updateCounselor", counselorId, userId });
    throw error;
  }
}

export async function verifyCounselor(counselorId: string) {
  const authResult = await requireAuth(['admin']);
  if ('error' in authResult) {
    throw new Error(authResult.error);
  }

  const { userId } = authResult;

  try {
    const [updated] = await db.update(users)
      .set({ emailVerified: true, updatedAt: new Date() })
      .where(and(eq(users.id, counselorId), eq(users.type, "counselor")))
      .returning();

    if (!updated) {
      throw new Error("Counselor not found");
    }

    logger.info("Counselor verified", { counselorId, userId });

    revalidatePath("/admin/counselors");

    return updated;
  } catch (error) {
    logger.error(error, { context: "verifyCounselor", counselorId, userId });
    throw error;
  }
}

export async function deleteCounselor(counselorId: string) {
  const authResult = await requireAuth(['admin']);
  if ('error' in authResult) {
    throw new Error(authResult.error);
  }

  const { userId } = authResult;

  try {
    await db.delete(users)
      .where(and(eq(users.id, counselorId), eq(users.type, "counselor")));

    logger.info("Counselor deleted", { counselorId, userId });

    revalidatePath("/admin/counselors");

    return { success: true };
  } catch (error) {
    logger.error(error, { context: "deleteCounselor", counselorId, userId });
    throw error;
  }
}

export async function assignCounselorToSchool(counselorId: string, schoolId: string, academicYear: string) {
  const authResult = await requireAuth(['admin']);
  if ('error' in authResult) {
    throw new Error(authResult.error);
  }

  const { userId } = authResult;

  try {
    await db.insert(counselorAssignments).values({
      id: `assignment_${Date.now()}_${nanoid(8)}`,
      counselorId,
      schoolId,
      academicYear,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    logger.info("Counselor assigned to school", { counselorId, schoolId, userId });

    revalidatePath("/admin/counselors");

    return { success: true };
  } catch (error) {
    logger.error(error, { context: "assignCounselorToSchool", counselorId, schoolId, userId });
    throw error;
  }
}
