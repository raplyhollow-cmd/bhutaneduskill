"use server";

import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { logger } from "@/lib/logger";

export async function updateTeacher(teacherId: string, data: {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  employeeId?: string;
  department?: string;
  schoolId?: string;
  subjects?: string;
}) {
  const authResult = await requireAuth(['admin']);
  if ('error' in authResult) {
    throw new Error(authResult.error);
  }

  const { userId } = authResult;

  try {
    // Build update object with only provided fields
    const updateData: Record<string, any> = {
      updatedAt: new Date(),
    };

    if (data.firstName !== undefined) updateData.firstName = data.firstName;
    if (data.lastName !== undefined) updateData.lastName = data.lastName;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.employeeId !== undefined) updateData.employeeId = data.employeeId;
    if (data.department !== undefined) updateData.department = data.department;
    if (data.schoolId !== undefined) updateData.schoolId = data.schoolId;
    if (data.subjects !== undefined) {
      // Store subjects as JSON string
      const subjectsArray = data.subjects.split(',').map(s => s.trim()).filter(s => s);
      updateData.subjects = JSON.stringify(subjectsArray);
    }

    // Update name based on first and last name
    if (data.firstName !== undefined || data.lastName !== undefined) {
      // Get current teacher data to preserve unchanged values
      const [currentTeacher] = await db
        .select()
        .from(users)
        .where(and(eq(users.id, teacherId), eq(users.type, "teacher")))
        .limit(1);

      const firstName = data.firstName || currentTeacher?.firstName || '';
      const lastName = data.lastName || currentTeacher?.lastName || '';
      updateData.name = `${firstName} ${lastName}`.trim();
    }

    const [updated] = await db.update(users)
      .set(updateData)
      .where(and(eq(users.id, teacherId), eq(users.type, "teacher")))
      .returning();

    if (!updated) {
      throw new Error("Teacher not found");
    }

    logger.info("Teacher updated", { teacherId, userId });

    revalidatePath("/admin/teachers");

    return updated;
  } catch (error) {
    logger.error(error, { context: "updateTeacher", teacherId, userId });
    throw error;
  }
}

export async function verifyTeacher(teacherId: string) {
  const authResult = await requireAuth(['admin']);
  if ('error' in authResult) {
    throw new Error(authResult.error);
  }

  const { userId } = authResult;

  try {
    const [updated] = await db.update(users)
      .set({ emailVerified: true, updatedAt: new Date() })
      .where(and(eq(users.id, teacherId), eq(users.type, "teacher")))
      .returning();

    if (!updated) {
      throw new Error("Teacher not found");
    }

    logger.info("Teacher verified", { teacherId, userId });

    revalidatePath("/admin/teachers");

    return updated;
  } catch (error) {
    logger.error(error, { context: "verifyTeacher", teacherId, userId });
    throw error;
  }
}

export async function deleteTeacher(teacherId: string) {
  const authResult = await requireAuth(['admin']);
  if ('error' in authResult) {
    throw new Error(authResult.error);
  }

  const { userId } = authResult;

  try {
    await db.delete(users)
      .where(and(eq(users.id, teacherId), eq(users.type, "teacher")));

    logger.info("Teacher deleted", { teacherId, userId });

    revalidatePath("/admin/teachers");

    return { success: true };
  } catch (error) {
    logger.error(error, { context: "deleteTeacher", teacherId, userId });
    throw error;
  }
}
