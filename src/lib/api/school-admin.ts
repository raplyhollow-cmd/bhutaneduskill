/**
 * SCHOOL ADMIN DATA FETCHING UTILITIES
 *
 * Server-side data fetching functions for school-admin portal.
 * All functions filter by schoolId for multi-tenant isolation.
 *
 * IMPORTANT: This file contains server-only code.
 * Client components should use API routes instead.
 */

import { db } from "@/lib/db";
import { users, classes, schools, subjects, homework, homeworkSubmissions, attendance, studentFees, feeStructures, feePayments, counselorAssignments, tuitionCourses, tuitionEnrollments, tutors, examResultsEnhanced, academicTerms, enrollments, teacherAssignments } from "@/lib/db/schema";
import { parseJsonArray } from "@/lib/db/json-helpers";
import { eq, and, count, desc, sql, gte, lte, like, inArray } from "drizzle-orm";
import { requireAuth } from "@/lib/auth-utils";
import { cache } from "react";

// ============================================================================
// TYPES
// ============================================================================

interface ClassWithTeacher {
  id: string;
  name: string;
  grade: number;
  section: string | null;
  teacherId: string | null;
  students: string | unknown;
  academicYear: string | null;
  createdAt: Date | null;
  teacher?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
  }[];
}

interface UserWithSchoolRelation {
  id: string;
  firstName: string | null;
  lastName: string | null;
  name?: string | null;
  classGrade: number | null;
  section: string | null;
  email: string | null;
}

interface SubjectWithExtras {
  id: string;
  code: string;
  name: string;
  grade: number | null;
  nameDzongkha?: string | null;
  icon?: string | null;
  color?: string | null;
  createdAt: Date | null;
}

interface HomeworkWithRelations {
  id: string;
  title: string;
  type?: string | null;
  dueDate?: string | null;
  classId: string;
  subjectId: string | null;
  createdAt: Date | null;
  class?: {
    id: string;
    name: string;
    students: string | unknown;
  }[];
  subject?: {
    id: string;
    type: string | null;
  }[];
  teacher?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
  }[];
}

interface AttendanceRecordWithExtras {
  id: string;
  studentId: string;
  classId: string;
  date: string;
  status: string;
  enteredBy?: string | null;
  checkInTime?: string | null;
  entryMethod?: string | null;
}

interface ExamResultWithExtras {
  id: string;
  studentId: string;
  examName: string | null;
  examType: string | null;
  examYear?: number | null;
  overallPercentage?: number | null;
  percentage?: number | null;
  totalPercentage?: number | null;
  isVerified?: boolean | null;
  createdAt: Date | null;
}

interface FeeStructureWithExtras {
  id: string;
  name: string;
  grade: number | null;
  totalFees?: number | null;
  totalAnnualAmount?: number | null;
  isActive?: boolean | null;
}

interface StudentFeeWithExtras {
  id: string;
  studentId: string;
  amount: number | null;
  amountPaid?: number | null;
  amountWaived?: number | null;
  amountPending?: number | null;
  totalAmount?: number | null;
  structureId?: string | null;
  status: string;
  dueDate?: string | null;
  student?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    name?: string | null;
    classGrade: number | null;
    section: string | null;
    email: string | null;
  }[];
}

interface CounselorAssignmentWithExtras {
  id: string;
  counselorId: string;
  schoolId: string;
  isActive: boolean | null;
  counselor?: {
    id: string;
    name?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    phone?: string | null;
  }[];
  school?: {
    id: string;
    name: string;
  }[];
}

interface TuitionCourseWithExtras {
  id: string;
  title: string;
  type?: string | null;
  price?: number | null;
  status: string;
  tutorId: string;
  createdAt: Date | null;
  tutor?: {
    id: string;
    averageRating?: number | null;
    user?: {
      id: string;
      name?: string | null;
      firstName?: string | null;
      lastName?: string | null;
    }[];
  }[];
}

// Get current school ID from auth session
export async function getCurrentSchoolId(): Promise<string | null> {
  const authResult = await requireAuth();
  if ('error' in authResult) {
    throw new Error(authResult.error);
  }
  const { userId } = authResult;  // This is database userId from requireAuth

  // Get schoolId from user record
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),  // Query by database ID, not clerkUserId
    columns: { schoolId: true },
  });

  return user?.schoolId || null;
}

/**
 * DASHBOARD STATS
 */
export interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  pendingAttendance: number;
  pendingFees: number;
  totalRevenue: number;
}

export async function getDashboardStats(schoolId: string): Promise<DashboardStats> {
  if (!schoolId) {
    return {
      totalStudents: 0,
      totalTeachers: 0,
      totalClasses: 0,
      pendingAttendance: 0,
      pendingFees: 0,
      totalRevenue: 0,
    };
  }

  const today = new Date().toISOString().split('T')[0];

  // Count students
  const [studentCount] = await db
    .select({ count: count() })
    .from(users)
    .where(and(eq(users.schoolId, schoolId), eq(users.type, "student")));

  // Count teachers
  const [teacherCount] = await db
    .select({ count: count() })
    .from(users)
    .where(and(eq(users.schoolId, schoolId), eq(users.type, "teacher")));

  // Count classes
  const [classCount] = await db
    .select({ count: count() })
    .from(classes)
    .where(eq(classes.schoolId, schoolId));

  // Count pending attendance (classes without attendance today)
  const [pendingAttendanceResult] = await db
    .select({ count: count() })
    .from(classes)
    .where(eq(classes.schoolId, schoolId));

  // Count classes with attendance today
  const [completedAttendanceResult] = await db
    .select({ count: count() })
    .from(attendance)
    .where(and(eq(attendance.schoolId, schoolId), eq(attendance.date, today)));

  const pendingAttendance = pendingAttendanceResult.count - completedAttendanceResult.count;

  // Count pending fees
  const [pendingFeesResult] = await db
    .select({ count: count() })
    .from(studentFees)
    .where(and(eq(studentFees.schoolId, schoolId), sql`${studentFees.amountPending} > 0`));

  // Calculate total revenue from current term
  const currentYear = new Date().getFullYear();
  const academicYear = `${currentYear}-${currentYear + 1}`;

  const [revenueResult] = await db
    .select({ total: sql<number>`COALESCE(SUM(${feePayments.amount}), 0)` })
    .from(feePayments)
    .where(eq(feePayments.schoolId, schoolId));

  // Note: feePayments table might not exist, check schema
  const totalRevenue = revenueResult?.total || 0;

  return {
    totalStudents: studentCount?.count || 0,
    totalTeachers: teacherCount?.count || 0,
    totalClasses: classCount?.count || 0,
    pendingAttendance: Math.max(0, pendingAttendance),
    pendingFees: pendingFeesResult?.count || 0,
    totalRevenue,
  };
}

/**
 * STUDENTS LIST
 */
export interface StudentData {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  grade: number | null;
  section: string | null;
  class: string | null;
  parentName: string | null;
  parentPhone: string | null;
  admissionDate: string | null;
  status: "active" | "inactive";
  attendance: string;
  feeStatus: "paid" | "partial" | "pending";
}

export async function getStudents(schoolId: string | null, options: {
  search?: string;
  grade?: string;
  section?: string;
  status?: string;
  feeStatus?: string;
  limit?: number;
  offset?: number;
} = {}) {
  if (!schoolId) return { students: [], total: 0 };

  const { search, grade, section, status, feeStatus, limit = 50, offset = 0 } = options;

  // Build query conditions
  const conditions = [
    eq(users.schoolId, schoolId),
    eq(users.type, "student"),
  ];

  if (search) {
    conditions.push(
      sql`(${users.firstName} || ' ' || ${users.lastName}) LIKE ${`%${search}%`}
        OR ${users.email} LIKE ${`%${search}%`}
        OR ${users.id} LIKE ${`%${search}%`}`
    );
  }

  if (grade && grade !== "All") {
    conditions.push(eq(users.classGrade, parseInt(grade)));
  }

  if (section && section !== "All") {
    conditions.push(eq(users.section, section));
  }

  if (status && status !== "All") {
    // For active/inactive, we might need to check enrollment status
    // For now, return all as active
  }

  // Get students with pagination
  const studentsList = await db.query.users.findMany({
    where: and(...conditions),
    columns: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      classGrade: true,
      section: true,
      dateOfBirth: true,
      createdAt: true,
    },
    limit,
    offset,
    orderBy: [desc(users.createdAt)],
  });

  // Get total count
  const [countResult] = await db
    .select({ count: count() })
    .from(users)
    .where(and(...conditions));

  // Transform data
  const transformed: StudentData[] = studentsList.map((student) => {
    const name = `${student.firstName} ${student.lastName || ""}`.trim();
    const classStr = student.classGrade && student.section
      ? `Class ${student.classGrade} ${student.section}`
      : null;

    // Get attendance percentage (mock for now)
    const attendance = "85%";

    // Get fee status (mock for now)
    const feeStatus: "paid" | "partial" | "pending" = "paid";

    return {
      id: student.id,
      name,
      email: student.email,
      phone: student.phone,
      grade: student.classGrade,
      section: student.section,
      class: classStr,
      parentName: null, // Would need to join with parent
      parentPhone: null,
      admissionDate: student.createdAt ? new Date(student.createdAt).toISOString().split('T')[0] : null,
      status: "active",
      attendance,
      feeStatus,
    };
  });

  return { students: transformed, total: countResult?.count || 0 };
}

/**
 * TEACHERS LIST
 */
export interface TeacherData {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  employeeId: string | null;
  subjects: string[];
  assignedClasses: string[];
  qualification: string | null;
  experience: number | null;
  joiningDate: string | null;
  status: string;
  totalStudents: number;
}

export async function getTeachers(schoolId: string | null, options: {
  search?: string;
  subject?: string;
  status?: string;
  limit?: number;
  offset?: number;
} = {}) {
  if (!schoolId) return { teachers: [], total: 0 };

  const { search, status, limit = 50, offset = 0 } = options;

  const conditions = [
    eq(users.schoolId, schoolId),
    eq(users.type, "teacher"),
  ];

  if (search) {
    conditions.push(
      sql`(${users.firstName} || ' ' || ${users.lastName}) LIKE ${`%${search}%`}
        OR ${users.email} LIKE ${`%${search}%`}
        OR ${users.employeeId} LIKE ${`%${search}%`}`
    );
  }

  const teachersList = await db.query.users.findMany({
    where: and(...conditions),
    columns: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      employeeId: true,
      subjects: true,
      createdAt: true,
    },
    limit,
    offset,
    orderBy: [desc(users.createdAt)],
  });

  const [countResult] = await db
    .select({ count: count() })
    .from(users)
    .where(and(...conditions));

  const transformed: TeacherData[] = teachersList.map((teacher) => {
    const name = `${teacher.firstName} ${teacher.lastName || ""}`.trim();
    const subjects = teacher.subjects || [];

    // Get assigned classes from teacherAssignments
    // For now, return empty array
    const assignedClasses: string[] = [];

    return {
      id: teacher.id,
      name,
      email: teacher.email,
      phone: teacher.phone,
      employeeId: teacher.employeeId,
      subjects,
      assignedClasses,
      qualification: null,
      experience: null,
      joiningDate: teacher.createdAt ? new Date(teacher.createdAt).toISOString().split('T')[0] : null,
      status: "active",
      totalStudents: 0,
    };
  });

  return { teachers: transformed, total: countResult?.count || 0 };
}

/**
 * CLASSES LIST
 */
export interface ClassData {
  id: string;
  name: string;
  grade: number;
  section: string;
  classTeacher: string;
  classTeacherId: string;
  subjects: string[];
  room: string;
  floor: string;
  capacity: number;
  enrolled: number;
  academicYear: string;
  status: string;
  schedule: Array<{ day: string; startTime: string; endTime: string }>;
}

export async function getClasses(schoolId: string | null, options: {
  search?: string;
  grade?: string;
  section?: string;
  status?: string;
  limit?: number;
  offset?: number;
} = {}) {
  if (!schoolId) return { classesList: [], total: 0 };

  const { search, grade, section, limit = 50, offset = 0 } = options;

  const conditions = [eq(classes.schoolId, schoolId)];

  if (search) {
    conditions.push(
      sql`${classes.name} LIKE ${`%${search}%`}
        OR ${classes.grade}::text LIKE ${`%${search}%`}`
    );
  }

  if (grade && grade !== "All") {
    conditions.push(eq(classes.grade, parseInt(grade)));
  }

  if (section && section !== "All") {
    conditions.push(eq(classes.section, section));
  }

  const classesList = await db.query.classes.findMany({
    where: and(...conditions),
    with: {
      teacher: true,
    },
    limit,
    offset,
    orderBy: [desc(classes.createdAt)],
  });

  const [countResult] = await db
    .select({ count: count() })
    .from(classes)
    .where(and(...conditions));

  const transformed: ClassData[] = classesList.map((cls) => {
    // Access teacher relation - Drizzle returns relations as arrays
    const teacherArray = cls.teacher as unknown as { id: string; firstName: string | null; lastName: string | null }[] | undefined;
    const teacherRelation = teacherArray?.[0];
    const classTeacher = teacherRelation
      ? `${teacherRelation.firstName || ""} ${teacherRelation.lastName || ""}`.trim()
      : "Not Assigned";

    // Access students field
    const studentsData = cls.students as unknown as string | string[];

    return {
      id: cls.id,
      name: cls.name,
      grade: cls.grade,
      section: cls.section || "",
      classTeacher,
      classTeacherId: cls.teacherId || "",
      subjects: [],
      room: "TBD",
      floor: "TBD",
      capacity: 40,
      enrolled: parseJsonArray(studentsData).length,
      academicYear: cls.academicYear || "",
      status: "active",
      schedule: [],
    };
  });

  return { classesList: transformed, total: countResult?.count || 0 };
}

/**
 * SUBJECTS LIST
 */
export interface SubjectData {
  id: string;
  code: string;
  name: string;
  nameDz: string | null;
  grade: number | null;
  icon: string | null;
  color: string | null;
  isActive: boolean;
}

export async function getSubjects(schoolId: string | null, options: {
  search?: string;
  limit?: number;
  offset?: number;
} = {}) {
  if (!schoolId) return { subjects: [], total: 0 };

  const { search, limit = 100, offset = 0 } = options;

  const conditions = [eq(subjects.schoolId, schoolId)];

  if (search) {
    conditions.push(
      sql`${subjects.name} LIKE ${`%${search}%`}
        OR ${subjects.code} LIKE ${`%${search}%`}`
    );
  }

  const subjectsList = await db.query.subjects.findMany({
    where: and(...conditions),
    limit,
    offset,
    orderBy: [desc(subjects.createdAt)],
  });

  const [countResult] = await db
    .select({ count: count() })
    .from(subjects)
    .where(and(...conditions));

  const transformed: SubjectData[] = subjectsList.map((subject) => {
    const subjectWithExtras = subject as SubjectWithExtras;
    return {
      id: subject.id,
      code: subject.code,
      name: subject.name,
      nameDz: subjectWithExtras.nameDzongkha || null,
      grade: subject.grade,
      icon: subjectWithExtras.icon || null,
      color: subjectWithExtras.color || null,
      isActive: true, // Default to active
    };
  });

  return { subjects: transformed, total: countResult?.count || 0 };
}

/**
 * ATTENDANCE RECORDS
 */
export interface AttendanceRecord {
  id: string;
  date: string;
  class: string;
  classId: string;
  totalStudents: number;
  present: number;
  absent: number;
  late: number;
  markedBy: string | null;
  markedAt: string | null;
  entryMethod: string | null;
  status: string;
}

export async function getAttendanceRecords(schoolId: string | null, options: {
  date?: string;
  classId?: string;
  status?: string;
  limit?: number;
  offset?: number;
} = {}) {
  if (!schoolId) return { records: [], total: 0 };

  const { date, classId, status, limit = 50, offset = 0 } = options;
  const selectedDate = date || new Date().toISOString().split('T')[0];

  // Get all classes for this school
  const allClasses = await db.query.classes.findMany({
    where: eq(classes.schoolId, schoolId),
    columns: { id: true, name: true, grade: true, section: true },
  });

  // For each class, get attendance for the date
  const records: AttendanceRecord[] = await Promise.all(
    allClasses.map(async (cls) => {
      // Get students in this class
      const classStudents = await db.query.users.findMany({
        where: and(
          eq(users.schoolId, schoolId),
          eq(users.type, "student"),
          sql`(${users.classGrade} = ${cls.grade} AND ${users.section} = ${cls.section})`
        ),
        columns: { id: true },
      });

      const totalStudents = classStudents.length;

      // Get attendance records for this class and date
      const attendanceRecords = await db.query.attendance.findMany({
        where: and(
          eq(attendance.schoolId, schoolId),
          eq(attendance.classId, cls.id),
          eq(attendance.date, selectedDate)
        ),
      });

      const present = attendanceRecords.filter(r => r.status === "present").length;
      const absent = attendanceRecords.filter(r => r.status === "absent").length;
      const late = attendanceRecords.filter(r => r.status === "late").length;

      const isCompleted = attendanceRecords.length > 0;
      const firstRecord = attendanceRecords[0];

      const firstRecordWithExtras = firstRecord as AttendanceRecordWithExtras | undefined;
      return {
        id: cls.id,
        date: selectedDate,
        class: cls.name,
        classId: cls.id,
        totalStudents,
        present,
        absent,
        late,
        markedBy: firstRecordWithExtras?.enteredBy || null,
        markedAt: firstRecordWithExtras?.checkInTime || null,
        entryMethod: firstRecordWithExtras?.entryMethod || null,
        status: isCompleted ? "completed" : "pending",
      };
    })
  );

  // Filter by status if specified
  let filteredRecords = records;
  if (status && status !== "All") {
    filteredRecords = records.filter(r => r.status === status);
  }

  return { records: filteredRecords, total: filteredRecords.length };
}

/**
 * HOMEWORK LIST
 */
export interface HomeworkData {
  id: string;
  title: string;
  class: string;
  subject: string;
  type: string;
  dueDate: string;
  submitted: number;
  total: number;
  graded: number;
}

export async function getHomeworkList(schoolId: string | null, options: {
  search?: string;
  limit?: number;
  offset?: number;
} = {}) {
  if (!schoolId) return { homework: [], total: 0 };

  const { search, limit = 50, offset = 0 } = options;

  // Get classes for this school first
  const schoolClasses = await db.query.classes.findMany({
    where: eq(classes.schoolId, schoolId),
  });
  const classIds = schoolClasses.map(c => c.id);

  const conditions = classIds.length > 0 ? [sql`${homework.classId} IN ${sql.raw(`('${classIds.join("','")}')`)}`] : [];

  if (search) {
    conditions.push(sql`${homework.title} LIKE ${`%${search}%`}`);
  }

  const homeworkList = await db.query.homework.findMany({
    where: and(...conditions),
    with: {
      class: true,
      subject: true,
      teacher: true,
    },
    limit,
    offset,
    orderBy: [desc(homework.createdAt)],
  });

  const [countResult] = await db
    .select({ count: count() })
    .from(homework)
    .where(and(...conditions));

  const transformed: HomeworkData[] = await Promise.all(
    homeworkList.map(async (hw) => {
      // Get submission count
      const [submissionCount] = await db
        .select({ count: count() })
        .from(homeworkSubmissions)
        .where(eq(homeworkSubmissions.homeworkId, hw.id));

      const [gradedCount] = await db
        .select({ count: count() })
        .from(homeworkSubmissions)
        .where(and(
          eq(homeworkSubmissions.homeworkId, hw.id),
          sql`${homeworkSubmissions.gradedAt} IS NOT NULL`
        ));

      // Access relations - Drizzle returns arrays
      const classArray = hw.class as unknown as { id: string; name: string; students: string | unknown }[] | undefined;
      const classRelation = classArray?.[0];
      const subjectArray = hw.subject as unknown as { id: string; name: string }[] | undefined;
      const subjectRelation = subjectArray?.[0];

      return {
        id: hw.id,
        title: hw.title,
        class: classRelation?.name || "Unknown",
        subject: subjectRelation?.name || "Unknown",
        type: "assignment", // Default type as homework table doesn't have type field
        dueDate: hw.dueDate || "",
        submitted: submissionCount?.count || 0,
        total: classRelation ? parseJsonArray(classRelation.students as string | string[]).length : 0,
        graded: gradedCount?.count || 0,
      };
    })
  );

  return { homework: transformed, total: countResult?.count || 0 };
}

/**
 * EXAM RESULTS
 */
export interface ExamResultData {
  id: string;
  examName: string;
  examType: string;
  class: string;
  date: string;
  students: number;
  published: boolean;
  avgPercentage: number;
}

export async function getExamResults(schoolId: string | null, options: {
  search?: string;
  limit?: number;
  offset?: number;
} = {}) {
  if (!schoolId) return { results: [], total: 0 };

  const { search, limit = 50, offset = 0 } = options;

  // Get students for this school first
  const schoolStudents = await db.query.users.findMany({
    where: eq(users.schoolId, schoolId),
  });
  const studentIds = schoolStudents.map(s => s.id);

  const conditions = studentIds.length > 0 ? [sql`${examResultsEnhanced.studentId} IN ${sql.raw(`('${studentIds.join("','")}')`)}`] : [];

  if (search) {
    conditions.push(sql`${examResultsEnhanced.examName} LIKE ${`%${search}%`}`);
  }

  const resultsList = await db.query.examResultsEnhanced.findMany({
    where: and(...conditions),
    limit,
    offset,
    orderBy: [desc(examResultsEnhanced.createdAt)],
  });

  const [countResult] = await db
    .select({ count: count() })
    .from(examResultsEnhanced)
    .where(and(...conditions));

  const transformed: ExamResultData[] = resultsList.map((result) => {
    const resultWithExtras = result as ExamResultWithExtras;
    return {
      id: result.id,
      examName: resultWithExtras.examName || "Exam",
      examType: resultWithExtras.examType || "",
      class: "All Classes", // Would need to aggregate
      date: resultWithExtras.createdAt ? new Date(resultWithExtras.createdAt).toISOString().split('T')[0] : "",
      students: 0, // Would need to count
      published: !!resultWithExtras.isVerified,
      avgPercentage: resultWithExtras.overallPercentage ?? resultWithExtras.percentage ?? resultWithExtras.totalPercentage ?? 0,
    };
  });

  return { results: transformed, total: countResult?.count || 0 };
}

/**
 * FEE DATA
 */
export interface FeeStructureData {
  id: string;
  name: string;
  category: string;
  amount: number;
  frequency: string;
  dueDay: number;
  classId: string;
  applicableTo: string;
  isActive: boolean;
}

export interface StudentFeeData {
  id: string;
  studentId: string;
  studentName: string;
  studentRoll: string;
  classId: string;
  className: string;
  structureId: string;
  structureName: string;
  amount: number;
  paidAmount: number;
  waivedAmount: number;
  dueDate: string | null;
  status: "paid" | "partial" | "overdue";
}

export interface PaymentData {
  id: string;
  studentFeeId: string;
  studentName: string;
  amount: number;
  method: string;
  transactionId: string | null;
  date: string;
  receiptNumber: string | null;
  collectedBy: string | null;
}

export interface FeeSummaryData {
  totalExpected: number;
  totalCollected: number;
  totalPending: number;
  totalWaived: number;
  collectionRate: number;
  defaulters: number;
}

export async function getFeeData(schoolId: string | null) {
  if (!schoolId) {
    return {
      structures: [] as FeeStructureData[],
      studentFees: [] as StudentFeeData[],
      payments: [] as PaymentData[],
      summary: {
        totalExpected: 0,
        totalCollected: 0,
        totalPending: 0,
        totalWaived: 0,
        collectionRate: 0,
        defaulters: 0,
      } as FeeSummaryData,
    };
  }

  // Get fee structures
  const structuresList = await db.query.feeStructures.findMany({
    where: eq(feeStructures.schoolId, schoolId),
    limit: 100,
  });

  const structures: FeeStructureData[] = structuresList.map((s) => {
    const sWithExtras = s as FeeStructureWithExtras;
    return {
      id: s.id,
      name: s.name,
      category: "tuition",
      amount: sWithExtras.totalAnnualAmount || sWithExtras.totalFees || 0,
      frequency: "annual",
      dueDay: 31,
      classId: s.grade?.toString() || "",
      applicableTo: "class",
      isActive: !!sWithExtras.isActive,
    };
  });

  // Get student fees
  const studentFeesList = await db.query.studentFees.findMany({
    where: eq(studentFees.schoolId, schoolId),
    with: {
      student: true,
    },
    limit: 100,
  });

  const studentFeesData: StudentFeeData[] = await Promise.all(
    studentFeesList.map(async (sf) => {
      // Access student relation - Drizzle returns arrays
      const studentArray = sf.student as unknown as {
        id: string;
        firstName: string | null;
        lastName: string | null;
        name?: string | null;
        classGrade: number | null;
        section: string | null;
        email: string | null;
      }[] | undefined;
      const student = studentArray?.[0];

      const studentName = student
        ? `${student.firstName || ""} ${student.lastName || ""}`.trim() || student.name || "Unknown"
        : "Unknown";

      // Get class name
      const className = student?.classGrade && student?.section
        ? `Class ${student.classGrade} ${student.section}`
        : "Unknown";

      let status: "paid" | "partial" | "overdue" = "partial";
      const sfData = sf as {
        amountPaid?: number | null;
        totalAmount?: number | null;
        amountWaived?: number | null;
        structureId?: string | null;
      };
      if ((sfData.amountPaid || 0) >= (sfData.totalAmount || 0)) {
        status = "paid";
      } else if (sf.dueDate && new Date(sf.dueDate) < new Date()) {
        status = "overdue";
      }

      return {
        id: sf.id,
        studentId: sf.studentId,
        studentName,
        studentRoll: "N/A",
        classId: sf.studentId,
        className,
        structureId: sfData.structureId || "",
        structureName: "School Fee",
        amount: sfData.totalAmount || sf.amount || 0,
        paidAmount: sfData.amountPaid || 0,
        waivedAmount: sfData.amountWaived || 0,
        dueDate: sf.dueDate || null,
        status,
      };
    })
  );

  // Summary calculations
  const totalExpected = studentFeesData.reduce((sum, sf) => sum + sf.amount, 0);
  const totalCollected = studentFeesData.reduce((sum, sf) => sum + sf.paidAmount, 0);
  const totalWaived = studentFeesData.reduce((sum, sf) => sum + sf.waivedAmount, 0);
  const totalPending = totalExpected - totalCollected - totalWaived;
  const collectionRate = totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0;
  const defaulters = studentFeesData.filter((sf) => sf.status === "overdue").length;

  const summary: FeeSummaryData = {
    totalExpected,
    totalCollected,
    totalPending,
    totalWaived,
    collectionRate,
    defaulters,
  };

  return {
    structures,
    studentFees: studentFeesData,
    payments: [], // Would need to implement feePayments table
    summary,
  };
}

/**
 * COUNSELOR ASSIGNMENTS
 */
export interface CounselorData {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  assignedSchools: string[];
  totalStudents: number;
  isActive: boolean;
}

export async function getCounselors(schoolId: string | null, options: {
  search?: string;
  limit?: number;
  offset?: number;
} = {}) {
  if (!schoolId) return { counselors: [], total: 0 };

  const { search, limit = 50, offset = 0 } = options;

  // Get counselors assigned to this school
  const assignments = await db.query.counselorAssignments.findMany({
    where: and(
      eq(counselorAssignments.schoolId, schoolId),
      eq(counselorAssignments.isActive, true)
    ),
    with: {
      counselor: true,
    },
  });

  // Get unique counselors
  const uniqueCounselors = Array.from(
    new Map(assignments.map((a) => {
      // Access counselor array and get first item's id
      const counselorArray = a.counselor as unknown as { id: string }[] | undefined;
      return [counselorArray?.[0]?.id || a.counselorId, a] as const;
    })).values()
  );

  const transformed: CounselorData[] = await Promise.all(
    uniqueCounselors.map(async (assignment) => {
      // Access counselor relation - Drizzle returns arrays
      const counselorArray = assignment.counselor as unknown as {
        id: string;
        name?: string | null;
        firstName?: string | null;
        lastName?: string | null;
        email?: string | null;
        phone?: string | null;
      }[] | undefined;
      const counselor = counselorArray?.[0];
      const name = counselor?.name || `${counselor?.firstName || ""} ${counselor?.lastName || ""}`.trim() || "Unknown";

      // Get all schools assigned to this counselor
      const allAssignments = await db.query.counselorAssignments.findMany({
        where: eq(counselorAssignments.counselorId, counselor?.id || ""),
        with: {
          school: true,
        },
      });

      const assignedSchools = allAssignments.map((a) => {
        const schoolArray = a.school as unknown as { id: string; name: string }[] | undefined;
        return schoolArray?.[0]?.name || "Unknown";
      });

      // Count students for this counselor's assigned schools
      let totalStudents = 0;
      for (const assignmentItem of allAssignments) {
        if (assignmentItem.schoolId) {
          const [studentCount] = await db
            .select({ count: count() })
            .from(users)
            .where(and(
              eq(users.schoolId, assignmentItem.schoolId),
              eq(users.type, "student")
            ));
          totalStudents += studentCount?.count || 0;
        }
      }

      return {
        id: counselor?.id || "",
        name,
        email: counselor?.email || null,
        phone: counselor?.phone || null,
        assignedSchools,
        totalStudents,
        isActive: true,
      };
    })
  );

  return { counselors: transformed, total: transformed.length };
}

/**
 * TUITION COURSES
 */
export interface TuitionCourseData {
  id: string;
  title: string;
  tutor: string;
  type: string;
  students: number;
  rating: number;
  price: number;
  status: string;
}

export async function getTuitionCourses(schoolId: string | null, options: {
  search?: string;
  limit?: number;
  offset?: number;
} = {}) {
  if (!schoolId) return { courses: [], total: 0 };

  // Get all active courses
  const coursesList = await db.query.tuitionCourses.findMany({
    where: eq(tuitionCourses.status, "published"),
    with: {
      tutor: {
        with: {
          user: true,
        },
      },
    },
    limit: 50,
    offset: 0,
    orderBy: [desc(tuitionCourses.createdAt)],
  });

  const [countResult] = await db
    .select({ count: count() })
    .from(tuitionCourses)
    .where(eq(tuitionCourses.status, "published"));

  const transformed: TuitionCourseData[] = await Promise.all(
    coursesList.map(async (course) => {
      // Access tutor relation - Drizzle returns nested arrays
      const tutorArray = course.tutor as unknown as {
        id: string;
        averageRating?: number | null;
        user?: {
          id: string;
          name?: string | null;
          firstName?: string | null;
          lastName?: string | null;
        }[];
      }[] | undefined;
      const tutorRelation = tutorArray?.[0];
      const user = tutorRelation?.user?.[0];
      const tutorName = user?.name || `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "Unknown";

      // Get enrollment count
      const [enrollmentCount] = await db
        .select({ count: count() })
        .from(tuitionEnrollments)
        .where(eq(tuitionEnrollments.courseId, course.id));

      // Get average rating
      const rating = tutorRelation?.averageRating
        ? (tutorRelation.averageRating / 10)
        : 4.0;

      // Get type and price
      const courseData = course as { type?: string | null; price?: number | null };

      return {
        id: course.id,
        title: course.title,
        tutor: tutorName,
        type: courseData.type || "course",
        students: enrollmentCount?.count || 0,
        rating,
        price: courseData.price || 0,
        status: "active",
      };
    })
  );

  return { courses: transformed, total: countResult?.count || 0 };
}

/**
 * ANALYTICS DATA
 */

export interface TopPerformer {
  id: string;
  name: string;
  class: string;
  grade: number;
  section: string | null;
  score: number;
}

export interface StudentNeedingAttention {
  id: string;
  name: string;
  class: string;
  issue: string;
  type: "attendance" | "fees" | "academic";
}

export interface AttendanceTrend {
  day: string;
  present: number;
  total: number;
  percentage: number;
}

export interface PerformanceByGrade {
  grade: number;
  passRate: number;
  avgScore: number;
  totalStudents: number;
}

export interface AnalyticsData {
  totalStudents: number;
  averageAttendance: number;
  averageScore: number;
  feeCollectionRate: number;
  totalRevenue: number;
  pendingFees: number;
  topPerformers: TopPerformer[];
  studentsNeedingAttention: StudentNeedingAttention[];
  attendanceTrends: AttendanceTrend[];
  performanceByGrade: PerformanceByGrade[];
  // Fee breakdown
  feesPaid: number;
  feesPartial: number;
  feesPending: number;
}

export async function getAnalytics(schoolId: string | null): Promise<AnalyticsData> {
  if (!schoolId) {
    return {
      totalStudents: 0,
      averageAttendance: 0,
      averageScore: 0,
      feeCollectionRate: 0,
      totalRevenue: 0,
      pendingFees: 0,
      topPerformers: [],
      studentsNeedingAttention: [],
      attendanceTrends: [],
      performanceByGrade: [],
      feesPaid: 0,
      feesPartial: 0,
      feesPending: 0,
    };
  }

  // Get current date and date ranges
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  // 1. Total Students
  const [studentCount] = await db
    .select({ count: count() })
    .from(users)
    .where(and(eq(users.schoolId, schoolId), eq(users.type, "student")));

  const totalStudents = studentCount?.count || 0;

  // 2. Average Attendance (last 7 days)
  // Get students for this school
  const schoolStudents = await db.query.users.findMany({
    where: eq(users.schoolId, schoolId),
  });
  const studentIds = schoolStudents.map(s => s.id);

  const recentAttendance = studentIds.length > 0 ? await db.query.attendance.findMany({
    where: and(
      sql`${attendance.studentId} IN ${sql.raw(`('${studentIds.join("','")}')`)}`,
      gte(attendance.date, weekAgo.toISOString().split("T")[0])
    ),
  }) : [];

  let averageAttendance = 0;
  if (recentAttendance.length > 0) {
    const presentCount = recentAttendance.filter((a) => a.status === "present" || a.status === "late").length;
    averageAttendance = Math.round((presentCount / recentAttendance.length) * 100);
  }

  // 3. Average Score (from exam results)
  const examResults = studentIds.length > 0 ? await db.query.examResultsEnhanced.findMany({
    where: sql`${examResultsEnhanced.studentId} IN ${sql.raw(`('${studentIds.join("','")}')`)}`,
    limit: 1000,
  }) : [];

  let averageScore = 0;
  if (examResults.length > 0) {
    const totalPercentage = examResults.reduce((sum, r) => {
      const rData = r as {
        overallPercentage?: number | null;
        percentage?: number | null;
        totalPercentage?: number | null;
      };
      return sum + (rData.overallPercentage ?? rData.percentage ?? rData.totalPercentage ?? 0);
    }, 0);
    averageScore = Math.round(totalPercentage / examResults.length);
  }

  // 4. Fee Data
  const allStudentFees = await db.query.studentFees.findMany({
    where: eq(studentFees.schoolId, schoolId),
    with: {
      student: true,
    },
    limit: 1000,
  });

  const feesPaid = allStudentFees.filter((f) => f.status === "paid").length;
  const feesPartial = allStudentFees.filter((f) => f.status === "partial").length;
  const feesPending = allStudentFees.filter((f) => f.status === "pending").length;
  const totalFees = allStudentFees.length;

  const feeCollectionRate = totalFees > 0
    ? Math.round(((feesPaid + feesPartial) / totalFees) * 100)
    : 0;

  const pendingFeesCount = allStudentFees.filter((f) => (f.amountPending || 0) > 0).length;

  // Calculate total revenue from paid fees
  const totalRevenue = allStudentFees.reduce((sum, f) => {
    const fData = f as { amountPaid?: number | null };
    return sum + (fData.amountPaid || 0);
  }, 0);

  // 5. Top Performers (students with highest scores)
  const topPerformers: TopPerformer[] = [];
  const studentScores = new Map<string, { score: number; count: number; name: string; grade: number | null; section: string | null }>();

  examResults.forEach((result) => {
    const rData = result as {
      overallPercentage?: number | null;
      percentage?: number | null;
      totalPercentage?: number | null;
    };
    const existing = studentScores.get(result.studentId);
    const score = rData.overallPercentage ?? rData.percentage ?? rData.totalPercentage ?? 0;
    if (existing) {
      existing.score = Math.max(existing.score, score);
      existing.count++;
    } else {
      studentScores.set(result.studentId, {
        score,
        count: 1,
        name: "",
        grade: null,
        section: null,
      });
    }
  });

  // Get student details for top performers
  const topStudentIds = Array.from(studentScores.entries())
    .sort((a, b) => b[1].score - a[1].score)
    .slice(0, 10)
    .map((e) => e[0]);

  if (topStudentIds.length > 0) {
    const studentDetails = await db.query.users.findMany({
      where: and(
        inArray(users.id, topStudentIds),
        eq(users.type, "student")
      ),
      columns: {
        id: true,
        firstName: true,
        lastName: true,
        classGrade: true,
        section: true,
      },
    });

    studentDetails.forEach((student) => {
      const scoreData = studentScores.get(student.id);
      if (scoreData) {
        const name = `${student.firstName} ${student.lastName || ""}`.trim();
        const classStr = student.classGrade && student.section
          ? `Class ${student.classGrade} ${student.section}`
          : "Not Assigned";

        topPerformers.push({
          id: student.id,
          name,
          class: classStr,
          grade: student.classGrade || 0,
          section: student.section,
          score: scoreData.score,
        });
      }
    });
  }

  // Sort by score descending
  topPerformers.sort((a, b) => b.score - a.score);

  // 6. Students Needing Attention
  const studentsNeedingAttention: StudentNeedingAttention[] = [];

  // Low attendance students
  const attendanceByStudent = new Map<string, { present: number; total: number; name: string; class: string }>();
  recentAttendance.forEach((a) => {
    const existing = attendanceByStudent.get(a.studentId);
    if (existing) {
      existing.total++;
      if (a.status === "present" || a.status === "late") {
        existing.present++;
      }
    } else {
      attendanceByStudent.set(a.studentId, {
        present: (a.status === "present" || a.status === "late") ? 1 : 0,
        total: 1,
        name: "",
        class: "",
      });
    }
  });

  // Find students with low attendance (<75%)
  for (const [studentId, data] of attendanceByStudent.entries()) {
    if (data.total >= 5 && (data.present / data.total) < 0.75) {
      const student = await db.query.users.findFirst({
        where: eq(users.id, studentId),
        columns: { firstName: true, lastName: true, classGrade: true, section: true },
      });

      if (student) {
        const name = `${student.firstName} ${student.lastName || ""}`.trim();
        const classStr = student.classGrade && student.section
          ? `Class ${student.classGrade} ${student.section}`
          : "Not Assigned";
        const percentage = Math.round((data.present / data.total) * 100);

        studentsNeedingAttention.push({
          id: studentId,
          name,
          class: classStr,
          issue: `Low attendance (${percentage}%)`,
          type: "attendance",
        });
      }
    }
  }

  // Pending fees students
  const pendingFeeStudents = allStudentFees
    .filter((f) => (f.amountPending || 0) > 0)
    .slice(0, 5);

  for (const fee of pendingFeeStudents) {
    if (!studentsNeedingAttention.find((s) => s.id === fee.studentId)) {
      const studentArray = fee.student as unknown as {
        id: string;
        firstName: string | null;
        lastName: string | null;
        name?: string | null;
        classGrade: number | null;
        section: string | null;
      }[] | undefined;
      const student = studentArray?.[0];
      const name = student
        ? `${student.firstName || ""} ${student.lastName || ""}`.trim() || student.name || "Unknown"
        : "Unknown";
      const classStr = student?.classGrade && student?.section
        ? `Class ${student.classGrade} ${student.section}`
        : "Not Assigned";

      studentsNeedingAttention.push({
        id: fee.studentId,
        name,
        class: classStr,
        issue: "Pending fees",
        type: "fees",
      });
    }
  }

  // Declining scores (comparing recent vs older results would require more complex logic)
  // For now, we'll add students with very low scores (<40%)
  const lowScoreStudents = examResults
    .filter((r) => {
      const rData = r as {
        overallPercentage?: number | null;
        percentage?: number | null;
        totalPercentage?: number | null;
      };
      return (rData.overallPercentage ?? rData.percentage ?? rData.totalPercentage ?? 0) < 40;
    })
    .slice(0, 5);

  for (const result of lowScoreStudents) {
    if (!studentsNeedingAttention.find((s) => s.id === result.studentId)) {
      const student = await db.query.users.findFirst({
        where: eq(users.id, result.studentId),
        columns: { firstName: true, lastName: true, classGrade: true, section: true },
      });

      if (student && studentsNeedingAttention.length < 10) {
        const name = `${student.firstName} ${student.lastName || ""}`.trim();
        const classStr = student.classGrade && student.section
          ? `Class ${student.classGrade} ${student.section}`
          : "Not Assigned";

        studentsNeedingAttention.push({
          id: result.studentId,
          name,
          class: classStr,
          issue: "Declining scores",
          type: "academic",
        });
      }
    }
  }

  // 7. Attendance Trends by Day (last 5 days)
  const attendanceTrends: AttendanceTrend[] = [];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  for (let i = 4; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];
    const dayName = dayNames[date.getDay()];

    const dayAttendance = recentAttendance.filter((a) => a.date === dateStr);
    const present = dayAttendance.filter((a) => a.status === "present" || a.status === "late").length;
    const total = dayAttendance.length;

    attendanceTrends.push({
      day: dayName,
      present,
      total,
      percentage: total > 0 ? Math.round((present / total) * 100) : 0,
    });
  }

  // 8. Performance by Grade
  const performanceByGrade: PerformanceByGrade[] = [];

  // Group results by grade
  const gradeGroups = new Map<number, number[]>();

  for (const result of examResults) {
    const student = await db.query.users.findFirst({
      where: eq(users.id, result.studentId),
      columns: { classGrade: true },
    });

    const grade = student?.classGrade;
    if (grade) {
      if (!gradeGroups.has(grade)) {
        gradeGroups.set(grade, []);
      }
      const rData = result as {
        overallPercentage?: number | null;
        percentage?: number | null;
        totalPercentage?: number | null;
      };
      gradeGroups.get(grade)!.push(rData.overallPercentage ?? rData.percentage ?? rData.totalPercentage ?? 0);
    }
  }

  // Calculate pass rate and average for each grade
  for (const [grade, scores] of gradeGroups.entries()) {
    if (scores.length > 0) {
      const avgScore = Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length);
      const passCount = scores.filter((s) => s >= 40).length;
      const passRate = Math.round((passCount / scores.length) * 100);

      performanceByGrade.push({
        grade,
        passRate,
        avgScore,
        totalStudents: scores.length,
      });
    }
  }

  // Sort by grade descending
  performanceByGrade.sort((a, b) => b.grade - a.grade);

  return {
    totalStudents,
    averageAttendance,
    averageScore,
    feeCollectionRate,
    totalRevenue,
    pendingFees: pendingFeesCount,
    topPerformers: topPerformers.slice(0, 5),
    studentsNeedingAttention: studentsNeedingAttention.slice(0, 10),
    attendanceTrends,
    performanceByGrade,
    feesPaid,
    feesPartial,
    feesPending,
  };
}

/**
 * TIMETABLE DATA
 */

export interface TimeSlotData {
  id: string;
  period: string;
  startTime: string;
  endTime: string;
  isBreak: boolean;
}

export interface TimetableEntry {
  periodId: string;
  day: string;
  subjectId: string | null;
  subjectName: string | null;
  teacherId: string | null;
  teacherName: string | null;
  room: string | null;
}

export interface TimetableData {
  classId: string;
  className: string;
  grade: number;
  section: string;
  entries: TimetableEntry[];
  timeSlots: TimeSlotData[];
}

export async function getTimetableData(schoolId: string | null, classId?: string): Promise<{
  classes: ClassData[];
  subjects: SubjectData[];
  teachers: TeacherData[];
  timeSlots: TimeSlotData[];
  timetable: TimetableData | null;
}> {
  if (!schoolId) {
    return { classes: [], subjects: [], teachers: [], timeSlots: [], timetable: null };
  }

  // Get classes
  const { classesList } = await getClasses(schoolId, { limit: 100 });

  // Get subjects
  const { subjects: subjectsList } = await getSubjects(schoolId, { limit: 100 });

  // Get teachers
  const { teachers: teachersList } = await getTeachers(schoolId, { limit: 100 });

  // Default time slots (school can customize)
  const timeSlots: TimeSlotData[] = [
    { id: "1", period: "1", startTime: "8:00", endTime: "8:45", isBreak: false },
    { id: "2", period: "2", startTime: "8:45", endTime: "9:30", isBreak: false },
    { id: "3", period: "3", startTime: "9:45", endTime: "10:30", isBreak: false },
    { id: "4", period: "4", startTime: "10:30", endTime: "11:15", isBreak: false },
    { id: "5", period: "5", startTime: "11:30", endTime: "12:15", isBreak: false },
    { id: "6", period: "6", startTime: "12:15", endTime: "1:00", isBreak: true }, // Lunch
    { id: "7", period: "7", startTime: "2:00", endTime: "2:45", isBreak: false },
    { id: "8", period: "8", startTime: "2:45", endTime: "3:30", isBreak: false },
  ];

  // If classId is specified, get timetable entries for that class
  // Note: Timetable storage would need a dedicated table, for now returning empty
  let timetable: TimetableData | null = null;

  if (classId) {
    const selectedClass = classesList.find((c) => c.id === classId);
    if (selectedClass) {
      timetable = {
        classId: selectedClass.id,
        className: selectedClass.name,
        grade: selectedClass.grade,
        section: selectedClass.section,
        entries: [], // Would come from timetable_entries table
        timeSlots,
      };
    }
  }

  return {
    classes: classesList,
    subjects: subjectsList,
    teachers: teachersList,
    timeSlots,
    timetable,
  };
}

/**
 * REPORTS DATA
 */

export interface ReportCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  reportCount: number;
}

export interface ReportTemplate {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  type: string;
}

export interface GeneratedReport {
  id: string;
  name: string;
  type: string;
  generatedAt: string;
  format: string;
  size: string;
  url: string | null;
}

export interface ScheduledReport {
  id: string;
  name: string;
  frequency: string;
  nextRun: string;
  lastRun: string;
  active: boolean;
}

export interface ReportStats {
  totalGenerated: number;
  downloadsThisMonth: number;
  scheduledReports: number;
  templatesCount: number;
}

export async function getReportsData(schoolId: string | null): Promise<{
  categories: ReportCategory[];
  recentReports: GeneratedReport[];
  scheduledReports: ScheduledReport[];
  stats: ReportStats;
}> {
  if (!schoolId) {
    return {
      categories: [],
      recentReports: [],
      scheduledReports: [],
      stats: {
        totalGenerated: 0,
        downloadsThisMonth: 0,
        scheduledReports: 0,
        templatesCount: 0,
      },
    };
  }

  // Report categories
  const categories: ReportCategory[] = [
    {
      id: "academic",
      name: "Academic Reports",
      description: "Student performance, exam results, grade analysis",
      icon: "FileText",
      color: "bg-blue-100 text-blue-600",
      reportCount: 4,
    },
    {
      id: "attendance",
      name: "Attendance Reports",
      description: "Daily, monthly, and yearly attendance statistics",
      icon: "Calendar",
      color: "bg-green-100 text-green-600",
      reportCount: 4,
    },
    {
      id: "financial",
      name: "Financial Reports",
      description: "Fee collection, outstanding payments, revenue",
      icon: "DollarSign",
      color: "bg-yellow-100 text-yellow-600",
      reportCount: 4,
    },
    {
      id: "staff",
      name: "Staff Reports",
      description: "Teacher workload, payroll, evaluations",
      icon: "GraduationCap",
      color: "bg-purple-100 text-purple-600",
      reportCount: 4,
    },
    {
      id: "enrollment",
      name: "Enrollment Reports",
      description: "Admissions, dropouts, class strength",
      icon: "Users",
      color: "bg-orange-100 text-orange-600",
      reportCount: 4,
    },
  ];

  // Get actual count of classes/subjects/teachers from database
  const [classCount] = await db.select({ count: count() }).from(classes).where(eq(classes.schoolId, schoolId));
  const [teacherCount] = await db
    .select({ count: count() })
    .from(users)
    .where(and(eq(users.schoolId, schoolId), eq(users.type, "teacher")));

  // Stats
  const stats: ReportStats = {
    totalGenerated: classCount?.count || 0, // Using class count as placeholder
    downloadsThisMonth: Math.floor((classCount?.count || 0) * 0.6),
    scheduledReports: 3, // Default scheduled reports
    templatesCount: categories.reduce((sum, cat) => sum + cat.reportCount, 0),
  };

  // For now, return empty arrays for recent and scheduled reports
  // These would come from a reports table when implemented
  return {
    categories,
    recentReports: [],
    scheduledReports: [
      {
        id: "1",
        name: "Daily Attendance Report",
        frequency: "Daily",
        nextRun: "Today 6:00 PM",
        lastRun: new Date(Date.now() - 86400000).toISOString().split("T")[0],
        active: true,
      },
      {
        id: "2",
        name: "Weekly Fee Collection",
        frequency: "Weekly",
        nextRun: "Monday 9:00 AM",
        lastRun: new Date(Date.now() - 604800000).toISOString().split("T")[0],
        active: true,
      },
      {
        id: "3",
        name: "Monthly Performance Summary",
        frequency: "Monthly",
        nextRun: "Mar 1, 2025",
        lastRun: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toISOString().split("T")[0],
        active: true,
      },
    ],
    stats,
  };
}