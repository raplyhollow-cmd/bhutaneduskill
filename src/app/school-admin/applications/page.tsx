/**
 * SCHOOL ADMIN - UNIFIED APPROVAL DASHBOARD
 *
 * Central hub for school admins to approve student, teacher, and staff applications.
 * Part of the hierarchical ecosystem approval workflow.
 */

import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { users, schools, departments, classes } from "@/lib/db/schema";
import { eq, and, desc, count } from "drizzle-orm";
import { ApplicationsClient } from "./applications-client";
import { logger } from "@/lib/logger";

export default async function SchoolAdminApplicationsPage() {
  const authResult = await requireAuth(['school-admin']);

  if ('error' in authResult) {
    logger.security("unauthorized_applications_access_attempt", { error: authResult.error });
    redirect("/sign-in");
  }

  const { userId, user } = authResult;

  if (!user?.schoolId) {
    redirect("/setup/school-admin");
  }

  // Get pending student applications (users with type student, onboardingComplete false)
  const pendingStudents = await db
    .select({
      id: users.id,
      name: users.name,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      phone: users.phone,
      classGrade: users.classGrade,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(
      and(
        eq(users.schoolId, user.schoolId),
        eq(users.type, "student"),
        eq(users.onboardingComplete, false)
      )
    )
    .orderBy(desc(users.createdAt));

  // Get pending teacher applications
  const pendingTeachers = await db
    .select({
      id: users.id,
      name: users.name,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      phone: users.phone,
      subjects: users.subjects,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(
      and(
        eq(users.schoolId, user.schoolId),
        eq(users.type, "teacher"),
        eq(users.onboardingComplete, false)
      )
    )
    .orderBy(desc(users.createdAt));

  // Get total counts (including approved)
  const [totalStudents, totalTeachers, approvedStudents, approvedTeachers, schoolDepartments, schoolClasses] = await Promise.all([
    db.select({ count: count() }).from(users).where(and(eq(users.schoolId, user.schoolId), eq(users.type, "student"))),
    db.select({ count: count() }).from(users).where(and(eq(users.schoolId, user.schoolId), eq(users.type, "teacher"))),
    db.select({ count: count() }).from(users).where(
      and(
        eq(users.schoolId, user.schoolId),
        eq(users.type, "student"),
        eq(users.onboardingComplete, true)
      )
    ),
    db.select({ count: count() }).from(users).where(
      and(
        eq(users.schoolId, user.schoolId),
        eq(users.type, "teacher"),
        eq(users.onboardingComplete, true)
      )
    ),
    // Fetch departments for teacher assignment
    db.select({
      id: departments.id,
      name: departments.name,
      code: departments.code,
    }).from(departments).where(eq(departments.schoolId, user.schoolId)),
    // Fetch classes for student assignment
    db.select({
      id: classes.id,
      name: classes.name,
      grade: classes.grade,
      section: classes.section,
    }).from(classes).where(eq(classes.schoolId, user.schoolId)).then((rows) =>
      rows.map((row) => ({
        ...row,
        grade: String(row.grade),
      }))
    ),
  ]);

  return (
    <ApplicationsClient
      pendingStudents={pendingStudents}
      pendingTeachers={pendingTeachers}
      departments={schoolDepartments}
      classes={schoolClasses}
      stats={{
        totalStudents: totalStudents[0]?.count || 0,
        totalTeachers: totalTeachers[0]?.count || 0,
        approvedStudents: approvedStudents[0]?.count || 0,
        approvedTeachers: approvedTeachers[0]?.count || 0,
        pendingStudents: pendingStudents.length,
        pendingTeachers: pendingTeachers.length,
      }}
    />
  );
}
