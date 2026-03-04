/**
 * SCHOOL ADMIN - ATTENDANCE MANAGEMENT
 *
 * Modern grid-based attendance tracking with:
 * - Student grid view with one-click marking
 * - Bulk attendance marking (Present/Absent/Late)
 * - Color-coded attendance status badges
 * - Date picker and class selector
 * - Visual progress bar for attendance stats
 * - Export functionality
 *
 * Server component that fetches initial data and passes to client component.
 */

import { AttendanceClient } from "./attendance-client";
import { db } from "@/lib/db";
import { classes, users, enrollments, attendance as attendanceTable } from "@/lib/db/schema";
import { eq, sql, and, desc } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";

// Force dynamic rendering - this page requires database access
export const dynamic = 'force-dynamic';

export default async function SchoolAdminAttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; classId?: string; view?: string }>;
}) {
  // Get filter values from URL
  const params = await searchParams;
  const selectedDate = params.date || new Date().toISOString().split("T")[0];
  const selectedClassId = params.classId || "";
  const view = params.view || "grid"; // grid | list

  // Get current school ID from auth
  const { userId } = await auth();
  let schoolId = "";

  if (userId) {
    const schoolAdmins = await db
      .select({ schoolId: users.schoolId })
      .from(users)
      .where(eq(users.clerkUserId, userId))
      .limit(1);

    schoolId = schoolAdmins[0]?.schoolId || "";
  }

  // Fetch all classes for this school
  const allClasses = schoolId
    ? await db
        .select({
          id: classes.id,
          name: classes.name,
          grade: classes.grade,
          section: classes.section,
        })
        .from(classes)
        .where(eq(classes.schoolId, schoolId))
        .orderBy(classes.grade, classes.section)
    : [];

  // Fetch students for selected class via enrollments
  let students: Array<{
    id: string;
    name: string;
    rollNumber?: string;
    avatarUrl?: string;
  }> = [];

  if (selectedClassId && schoolId) {
    const studentData = await db
      .select({
        id: users.id,
        name: users.name,
        imageUrl: users.imageUrl,
        rollNumber: enrollments.rollNumber,
      })
      .from(enrollments)
      .innerJoin(users, eq(enrollments.studentId, users.id))
      .where(
        and(
          eq(enrollments.classId, selectedClassId),
          eq(enrollments.status, "active"),
          eq(users.schoolId, schoolId)
        )
      )
      .orderBy(enrollments.rollNumber, users.name);

    students = studentData.map((s) => ({
      id: s.id,
      name: s.name,
      rollNumber: s.rollNumber || undefined,
      avatarUrl: s.imageUrl || undefined,
    }));
  }

  // Get total student count for the school
  let totalStudents = 0;
  if (schoolId) {
    const [studentCountResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(and(eq(users.type, "student"), eq(users.schoolId, schoolId)));
    totalStudents = studentCountResult?.count || 0;
  }

  // Get attendance summary for selected date
  let attendanceSummary = {
    present: 0,
    absent: 0,
    late: 0,
    pending: 0,
  };

  if (schoolId && selectedClassId) {
    const records = await db
      .select({
        status: attendanceTable.status,
      })
      .from(attendanceTable)
      .where(
        and(
          eq(attendanceTable.schoolId, schoolId),
          eq(attendanceTable.classId, selectedClassId),
          eq(attendanceTable.date, selectedDate)
        )
      );

    records.forEach((r) => {
      if (r.status === "present") attendanceSummary.present++;
      else if (r.status === "absent") attendanceSummary.absent++;
      else if (r.status === "late") attendanceSummary.late++;
    });

    // Calculate pending (students without attendance record)
    const totalInClass = students.length;
    attendanceSummary.pending = totalInClass - records.length;
  }

  return (
    <AttendanceClient
      initialDate={selectedDate}
      initialClassId={selectedClassId}
      initialView={view}
      classes={allClasses}
      students={students}
      totalStudents={totalStudents}
      attendanceSummary={attendanceSummary}
    />
  );
}
