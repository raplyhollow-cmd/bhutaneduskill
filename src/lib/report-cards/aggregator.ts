/**
 * REPORT CARD DATA AGGREGATOR
 * Collects and aggregates student data for report card generation
 */

import { nanoid } from "nanoid";
import type {
  ReportCard,
  NewReportCard,
  ExamResultEnhanced,
  User,
  School,
} from "@/lib/db/schema";
import {
  reportCards,
  examResultsEnhanced,
  users,
  schools,
  classes,
  attendanceRecords,
  subjects,
  homework,
} from "@/lib/db/schema";
import { db } from "@/lib/db";
import { eq, and, desc, count, sql } from "drizzle-orm";
import { getTemplateByGrade, getGradeFromPercentage, getGradeRemarks } from "./templates";

export interface ReportCardSubject {
  subjectId: string;
  subjectName: string;
  marksObtained: number;
  maxMarks: number;
  grade: string;
  remarks: string;
  teacherName: string;
}

export interface ReportCardData {
  // Student information
  studentId: string;
  studentName: string;
  rollNumber?: string | null;
  grade: string;
  section?: string | null;
  photo?: string | null;

  // School information
  schoolId: string;
  schoolName: string;
  schoolCode?: string | null;
  schoolAddress?: string | null;
  schoolLogo?: string | null;
  principalName?: string | null;

  // Class information
  classId?: string | null;
  className?: string | null;
  classTeacherName?: string | null;

  // Exam information
  examId: string;
  examName: string;
  term: string;
  academicYear: string;

  // Performance data
  subjects: ReportCardSubject[];
  overallPercentage: number;
  overallGrade: string;
  totalMarks: number;
  maxTotalMarks: number;
  rank?: number | null;
  classRank?: number | null;
  totalStudents?: number | null;

  // Attendance data
  totalDays: number;
  presentDays: number;
  absentDays: number;
  attendancePercentage: number;

  // Remarks
  classTeacherRemarks?: string | null;
  principalRemarks?: string | null;
}

/**
 * Aggregate all data needed for a report card
 */
export async function aggregateReportCardData(
  studentId: string,
  examId: string
): Promise<ReportCardData> {
  // Fetch student details
  const [student] = await db
    .select()
    .from(users)
    .where(eq(users.id, studentId))
    .limit(1);

  if (!student) {
    throw new Error("Student not found");
  }

  // Fetch school details
  const [school] = await db
    .select()
    .from(schools)
    .where(eq(schools.id, student.schoolId!))
    .limit(1);

  if (!school) {
    throw new Error("School not found");
  }

  // Fetch exam results
  const [examResult] = await db
    .select()
    .from(examResultsEnhanced)
    .where(
      and(
        eq(examResultsEnhanced.userId, studentId),
        eq(examResultsEnhanced.id, examId)
      )
    )
    .limit(1);

  if (!examResult) {
    throw new Error("Exam result not found");
  }

  // Fetch class details
  let classData = null;
  if (student.classGrade) {
    const [classInfo] = await db
      .select()
      .from(classes)
      .where(eq(classes.id, student.classGrade.toString()))
      .limit(1);
    classData = classInfo;
  }

  // Fetch class teacher name
  let classTeacherName = null;
  if (classData?.classTeacherId) {
    const [teacher] = await db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, classData.classTeacherId!))
      .limit(1);
    classTeacherName = teacher?.name;
  }

  // Fetch attendance for the term
  const termStartDate = getTermStartDate(examResult.term, examResult.academicYear);
  const termEndDate = getTermEndDate(examResult.term, examResult.academicYear);

  const attendanceData = await db
    .select({
      total: count(),
      present: count(sql`CASE WHEN status = 'present' THEN 1 END`),
    })
    .from(attendanceRecords)
    .where(
      and(
        eq(attendanceRecords.studentId, studentId),
        sql`${attendanceRecords.date} >= ${termStartDate}`,
        sql`${attendanceRecords.date} <= ${termEndDate}`
      )
    )
    .limit(1);

  const attendance = attendanceData[0];
  const totalDays = Number(attendance?.total) || 0;
  const presentDays = Number(attendance?.present) || 0;
  const absentDays = totalDays - presentDays;
  const attendancePercentage = totalDays > 0
    ? Math.round((presentDays / totalDays) * 100)
    : 0;

  // Calculate ranks if not already in exam results
  let classRank = examResult.classRank;
  let totalStudents = examResult.rank ? null : undefined;

  if (!classRank && student.classGrade) {
    // Get class rank from same grade students
    const rankResults = await db
      .select({ rank: examResultsEnhanced.rank })
      .from(examResultsEnhanced)
      .where(
        and(
          eq(examResultsEnhanced.examName, examResult.examName),
          eq(examResultsEnhanced.academicYear, examResult.academicYear)
        )
      )
      .orderBy(desc(examResultsEnhanced.percentage));

    const studentRank = rankResults.findIndex(
      (r) => r.rank === examResult.rank
    );
    if (studentRank >= 0) {
      classRank = studentRank + 1;
      totalStudents = rankResults.length;
    }
  }

  // Format subjects with teacher names
  const subjectsWithTeachers: ReportCardSubject[] = await Promise.all(
    (examResult.subjects || []).map(async (subject) => {
      // TODO: Get teacher info from class-subject assignments
      // For now, return N/A for teacher name
      return {
        subjectId: subject.subjectId,
        subjectName: subject.subjectName,
        marksObtained: subject.marksObtained,
        maxMarks: subject.maxMarks,
        grade: subject.grade,
        remarks: getGradeRemarks(subject.percentage),
        teacherName: "N/A",
      };
    })
  );

  return {
    studentId: student.id,
    studentName: student.name,
    rollNumber: student.rollNumber,
    grade: String(student.classGrade || ""),
    section: student.section,
    photo: student.profileImage,

    schoolId: school.id,
    schoolName: school.name,
    schoolCode: school.code,
    schoolAddress: school.address,
    schoolLogo: school.logo,
    principalName: school.principalName,

    classId: classData?.id,
    className: classData?.name,
    classTeacherName,

    examId: examResult.id,
    examName: examResult.examName,
    term: examResult.term,
    academicYear: examResult.academicYear,

    subjects: subjectsWithTeachers,
    overallPercentage: examResult.percentage,
    overallGrade: examResult.grade,
    totalMarks: examResult.totalMarksObtained || examResult.totalMarks,
    maxTotalMarks: examResult.totalMaxMarks || examResult.maxTotalMarks,
    rank: examResult.rank,
    classRank,
    totalStudents,

    totalDays,
    presentDays,
    absentDays,
    attendancePercentage,

    classTeacherRemarks: examResult.remarks,
    principalRemarks: null, // To be filled by school admin
  };
}

/**
 * Create a report card record in the database
 */
export async function createReportCardRecord(
  data: ReportCardData,
  generatedBy: string
): Promise<ReportCard> {
  const template = getTemplateByGrade(parseInt(data.grade) || 0);

  const newReportCard: NewReportCard = {
    id: nanoid(),
    studentId: data.studentId,
    schoolId: data.schoolId,
    classId: data.classId,
    examId: data.examId,
    term: data.term,
    academicYear: data.academicYear,
    templateType: template.templateType,

    // Student snapshot
    studentName: data.studentName,
    rollNumber: data.rollNumber,
    grade: data.grade,
    section: data.section,

    // Performance
    subjects: data.subjects,
    overallPercentage: data.overallPercentage,
    overallGrade: data.overallGrade,
    totalMarks: data.totalMarks,
    maxTotalMarks: data.maxTotalMarks,
    rank: data.rank,
    classRank: data.classRank,
    totalStudents: data.totalStudents,

    // Attendance
    totalDays: data.totalDays,
    presentDays: data.presentDays,
    absentDays: data.absentDays,
    attendancePercentage: data.attendancePercentage,

    // Remarks
    classTeacherRemarks: data.classTeacherRemarks,
    principalRemarks: data.principalRemarks,
    classTeacherName: data.classTeacherName,
    principalName: data.principalName,

    status: "draft",
    generatedBy,
    generatedAt: new Date(),
    updatedAt: new Date(),
  };

  const [created] = await db
    .insert(reportCards)
    .values(newReportCard)
    .returning();

  return created;
}

/**
 * Get term start date
 */
function getTermStartDate(term: string, academicYear: string): string {
  const [startYear] = academicYear.split("-").map(Number);
  const year = startYear || new Date().getFullYear();

  switch (term.toLowerCase()) {
    case "first term":
    case "term 1":
    case "1st term":
      return `${year}-01-01`;
    case "second term":
    case "term 2":
    case "2nd term":
      return `${year}-05-01`;
    case "third term":
    case "term 3":
    case "3rd term":
      return `${year}-09-01`;
    case "final term":
    case "term 4":
      return `${year}-09-01`;
    default:
      return `${year}-01-01`;
  }
}

/**
 * Get term end date
 */
function getTermEndDate(term: string, academicYear: string): string {
  const [startYear] = academicYear.split("-").map(Number);
  const year = startYear || new Date().getFullYear();

  switch (term.toLowerCase()) {
    case "first term":
    case "term 1":
    case "1st term":
      return `${year}-04-30`;
    case "second term":
    case "term 2":
    case "2nd term":
      return `${year}-08-31`;
    case "third term":
    case "term 3":
    case "3rd term":
      return `${year}-12-15`;
    case "final term":
    case "term 4":
      return `${year}-12-31`;
    default:
      return `${year}-12-31`;
  }
}

/**
 * Get report cards for a class
 */
export async function getClassReportCards(
  classId: string,
  term: string,
  academicYear: string
): Promise<ReportCard[]> {
  const results = await db
    .select()
    .from(reportCards)
    .where(
      and(
        eq(reportCards.classId, classId),
        eq(reportCards.term, term),
        eq(reportCards.academicYear, academicYear)
      )
    )
    .orderBy(desc(reportCards.overallPercentage));

  return results;
}

/**
 * Get student report cards
 */
export async function getStudentReportCards(
  studentId: string
): Promise<ReportCard[]> {
  const results = await db
    .select()
    .from(reportCards)
    .where(eq(reportCards.studentId, studentId))
    .orderBy(desc(reportCards.generatedAt));

  return results;
}
