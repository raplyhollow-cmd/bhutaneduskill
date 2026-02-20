/**
 * SCHOOL ADMIN - DEPARTMENTS MANAGEMENT
 *
 * Manage academic departments within the school.
 * Create, edit, delete departments and assign department heads.
 */

import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { users, departments, subjects, schools } from "@/lib/db/schema";
import { desc, eq, count, and } from "drizzle-orm";
import { DepartmentsClient } from "./departments-client";
import { logger } from "@/lib/logger";

export default async function SchoolAdminDepartmentsPage() {
  const authResult = await requireAuth(['school-admin']);

  if ('error' in authResult) {
    logger.security("unauthorized_departments_access_attempt", { error: authResult.error });
    redirect("/sign-in");
  }

  const { userId, user } = authResult;

  if (!user?.schoolId) {
    redirect("/setup/school-admin");
  }

  // Get all departments with subject counts
  const departmentList = await db
    .select({
      id: departments.id,
      name: departments.name,
      code: departments.code,
      description: departments.description,
      headOfDepartment: departments.headOfDepartment,
      createdAt: departments.createdAt,
      subjectCount: count(subjects.id),
    })
    .from(departments)
    .leftJoin(subjects, eq(departments.id, subjects.departmentId))
    .where(eq(departments.schoolId, user.schoolId))
    .groupBy(departments.id)
    .orderBy(desc(departments.createdAt));

  // Get teachers (potential department heads)
  const teachers = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
    })
    .from(users)
    .where(and(eq(users.schoolId, user.schoolId), eq(users.type, "teacher")))
    .orderBy(users.name);

  return (
    <DepartmentsClient
      departments={departmentList}
      teachers={teachers}
      schoolId={user.schoolId}
    />
  );
}
