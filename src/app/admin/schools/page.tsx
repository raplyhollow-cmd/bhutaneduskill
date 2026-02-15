/**
 * PLATFORM ADMIN - SCHOOLS MANAGEMENT
 *
 * Multi-tenant school management page for platform administrators.
 * CRUD operations for all schools in the system.
 */

import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { schools, tenants, districts, users } from "@/lib/db/schema";
import { desc, count, eq, and } from "drizzle-orm";
import { SchoolsClient } from "./schools-client";

// Helper function to get school stats
async function getSchoolStats(schoolId: string) {
  const [
    studentCount,
    teacherCount,
    counselorCount,
  ] = await Promise.all([
    db.select({ count: count() }).from(users).where(and(eq(users.schoolId, schoolId), eq(users.type, "student"))),
    db.select({ count: count() }).from(users).where(and(eq(users.schoolId, schoolId), eq(users.type, "teacher"))),
    db.select({ count: count() }).from(users).where(and(eq(users.schoolId, schoolId), eq(users.type, "counselor"))),
  ]);

  return {
    students: studentCount[0]?.count || 0,
    teachers: teacherCount[0]?.count || 0,
    counselors: counselorCount[0]?.count || 0,
  };
}

export default async function AdminSchoolsPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // Fetch all schools with their tenant and district info
  const allSchools = await db
    .select({
      id: schools.id,
      name: schools.name,
      code: schools.code,
      schoolType: schools.schoolType,
      level: schools.level,
      contactEmail: schools.contactEmail,
      contactPhone: schools.contactPhone,
      address: schools.address,
      createdAt: schools.createdAt,
      tenantId: schools.tenantId,
      tenantName: tenants.name,
      districtId: schools.districtId,
      districtName: districts.name,
    })
    .from(schools)
    .leftJoin(tenants, eq(schools.tenantId, tenants.id))
    .leftJoin(districts, eq(schools.districtId, districts.id))
    .orderBy(desc(schools.createdAt));

  // Get stats for each school
  const schoolsWithStats = await Promise.all(
    allSchools.map(async (school: any) => ({
      ...school,
      stats: await getSchoolStats(school.id),
    }))
  );

  // Calculate platform-wide stats
  const totalSchools = schoolsWithStats.length;
  const totalStudents = schoolsWithStats.reduce((sum, s) => sum + s.stats.students, 0);
  const totalTeachers = schoolsWithStats.reduce((sum, s) => sum + s.stats.teachers, 0);
  const totalCounselors = schoolsWithStats.reduce((sum, s) => sum + s.stats.counselors, 0);

  // School types distribution
  const schoolTypes = schoolsWithStats.reduce((acc, school) => {
    const type = school.schoolType || "Other";
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <SchoolsClient
      schoolsWithStats={schoolsWithStats}
      totalSchools={totalSchools}
      totalStudents={totalStudents}
      totalTeachers={totalTeachers}
      totalCounselors={totalCounselors}
      schoolTypes={schoolTypes}
    />
  );
}
