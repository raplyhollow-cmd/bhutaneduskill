/**
 * Data Export Service
 * Export school data in various formats (CSV, JSON, Excel)
 */

import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { users, schools, classes, homework, attendance, examResultsEnhanced } from "@/lib/db/schema";
import { eq, and, sql, or } from "drizzle-orm";
import type { School } from "@/types";

// ============================================================================
// TYPES
// ============================================================================

export type ExportFormat = "csv" | "json" | "excel";
export type ExportDataType =
  | "students"
  | "teachers"
  | "classes"
  | "examResults"
  | "attendance"
  | "homework"
  | "results"
  | "all";

export interface ExportOptions {
  format: ExportFormat;
  dataType: ExportDataType;
  schoolId: string;
  academicYear?: string;
  classId?: string;
  includeHeaders?: boolean;
}

export interface ExportResult {
  success: boolean;
  data?: string; // File content
  filename: string;
  mimeType: string;
  recordCount?: number;
  error?: string;
}

/**
 * Generic record type for CSV/JSON export data
 */
export type ExportRecord = Record<string, string | number | boolean | null | undefined>;

/**
 * Export data container with metadata
 */
export interface ExportData {
  data: ExportRecord[];
  filename: string;
  headers: string[];
}

// ============================================================================
// CSV EXPORTER
// ============================================================================

/**
 * Convert array of objects to CSV
 */
function arrayToCSV(data: ExportRecord[], headers: string[] = []): string {
  if (data.length === 0) return "";

  // Use provided headers or extract from first object
  const csvHeaders = headers.length > 0 ? headers : Object.keys(data[0]);

  // Build CSV rows
  const rows = data.map((obj) => {
    return csvHeaders.map((header) => {
      const value = obj[header];
      // Handle nested objects, arrays, and special characters
      if (value === null || value === undefined) return "";
      if (typeof value === "object") return JSON.stringify(value);
      if (typeof value === "string" && (value.includes(",") || value.includes('"') || value.includes("\n"))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return String(value);
    });
  });

  // Combine headers and rows
  return [csvHeaders.join(","), ...rows.map((row) => row.join(","))].join("\n");
}

/**
 * Convert array of objects to JSON
 */
function arrayToJSON(data: ExportRecord[]): string {
  return JSON.stringify(data, null, 2);
}

// ============================================================================
// DATA EXPORTERS
// ============================================================================

/**
 * Export student data
 */
async function exportStudents(schoolId: string, academicYear?: string, classId?: string) {
  const conditions = [eq(users.schoolId, schoolId), eq(users.type, "student")];

  const students = await db
    .select({
      id: users.id,
      name: users.name,
      cidNumber: users.cidNumber,
      email: users.email,
      phone: users.phone,
      gender: users.gender,
      dateOfBirth: users.dateOfBirth,
      classGrade: users.classGrade,
      section: users.section,
      rollNumber: users.rollNumber,
      address: users.address,
      dzongkhag: users.dzongkhag,
      gewog: users.gewog,
      village: users.village,
      fatherName: users.fatherName,
      fatherPhone: users.fatherPhone,
      motherName: users.motherName,
      motherPhone: users.motherPhone,
      guardianName: users.guardianName,
      guardianPhone: users.guardianPhone,
      admissionDate: users.admissionDate,
    })
    .from(users)
    .where(and(...conditions));

  return {
    data: students,
    filename: `students_${schoolId}_${new Date().toISOString().split("T")[0]}`,
    headers: [
      "ID", "Name", "CID", "Email", "Phone", "Gender", "DOB", "Class", "Section", "Roll No",
      "Address", "Dzongkhag", "Gewog", "Village",
      "Father Name", "Father Phone", "Mother Name", "Mother Phone",
      "Guardian Name", "Guardian Phone", "Admission Date"
    ],
  };
}

/**
 * Export teacher data
 */
async function exportTeachers(schoolId: string) {
  const conditions = [eq(users.schoolId, schoolId), eq(users.type, "teacher")];

  const teachers = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      gender: users.gender,
      employeeId: users.employeeId,
      designation: users.designation,
      department: users.department,
      qualification: users.qualification,
      subjects: users.subjects,
      joiningDate: users.joiningDate,
    })
    .from(users)
    .where(and(...conditions));

  return {
    data: teachers,
    filename: `teachers_${schoolId}_${new Date().toISOString().split("T")[0]}`,
    headers: [
      "ID", "Name", "Email", "Phone", "Gender", "Employee ID", "Designation",
      "Department", "Qualification", "Subjects", "Joining Date"
    ],
  };
}

/**
 * Export class data
 */
async function exportClasses(schoolId: string) {
  const classData = await db
    .select()
    .from(classes)
    .where(eq(classes.schoolId, schoolId));

  return {
    data: classData,
    filename: `classes_${schoolId}_${new Date().toISOString().split("T")[0]}`,
    headers: [
      "ID", "Name", "Grade", "Section", "Class Teacher", "Academic Year", "Room Number"
    ],
  };
}

/**
 * Export attendance data
 */
async function exportAttendance(schoolId: string, academicYear?: string, classId?: string) {
  // Note: attendance table doesn't have academicYear field
  // Filter by date range if academicYear is provided (assuming YYYY format)
  const conditions = [eq(attendance.schoolId, schoolId)];

  if (classId) {
    conditions.push(eq(attendance.classId, classId));
  }

  // If academicYear provided, filter by date (assuming format like "2024" or "2024-2025")
  if (academicYear) {
    const year = academicYear.split("-")[0]; // Extract first year from "2024-2025" format
    conditions.push(sql`${attendance.date} LIKE ${year + "%"}`);
  }

  const attendanceData = await db
    .select()
    .from(attendance)
    .where(and(...conditions))
    .limit(10000);

  return {
    data: attendanceData,
    filename: `attendance_${schoolId}_${new Date().toISOString().split("T")[0]}`,
    headers: [
      "ID", "Student ID", "Class ID", "Date", "Status", "Remarks"
    ],
  };
}

/**
 * Export exam results
 */
async function exportResults(schoolId: string, academicYear?: string, classId?: string) {
  // examResultsEnhanced doesn't have schoolId directly, need to join with users
  const conditions = [eq(users.schoolId, schoolId)];

  if (academicYear) {
    conditions.push(eq(examResultsEnhanced.academicYear, academicYear));
  }

  if (classId) {
    // Filter by students in the specified class through users.classGrade
    conditions.push(eq(users.classGrade, classId));
  }

  const examData = await db
    .select({
      id: examResultsEnhanced.id,
      studentId: examResultsEnhanced.studentId,
      userId: examResultsEnhanced.userId,
      examName: examResultsEnhanced.examName,
      examType: examResultsEnhanced.examType,
      academicYear: examResultsEnhanced.academicYear,
      term: examResultsEnhanced.term,
      examDate: examResultsEnhanced.examDate,
      totalMarks: examResultsEnhanced.totalMarks,
      maxTotalMarks: examResultsEnhanced.maxTotalMarks,
      totalMarksObtained: examResultsEnhanced.totalMarksObtained,
      percentage: examResultsEnhanced.percentage,
      grade: examResultsEnhanced.grade,
      rank: examResultsEnhanced.rank,
      classRank: examResultsEnhanced.classRank,
    })
    .from(examResultsEnhanced)
    .innerJoin(users, eq(examResultsEnhanced.userId, users.id))
    .where(and(...conditions))
    .limit(10000);

  return {
    data: examData,
    filename: `results_${schoolId}_${new Date().toISOString().split("T")[0]}`,
    headers: [
      "ID", "Student ID", "User ID", "Exam Name", "Exam Type", "Academic Year",
      "Term", "Exam Date", "Total Marks", "Max Marks", "Obtained Marks",
      "Percentage", "Grade", "Rank", "Class Rank"
    ],
  };
}

// ============================================================================
// MAIN EXPORT FUNCTION
// ============================================================================

/**
 * Export school data
 */
export async function exportData(options: ExportOptions): Promise<ExportResult> {
  const { format, dataType, schoolId, academicYear, classId } = options;

  try {
    let exportData: ExportData;

    switch (dataType) {
      case "students":
        exportData = await exportStudents(schoolId, academicYear, classId);
        break;
      case "teachers":
        exportData = await exportTeachers(schoolId);
        break;
      case "classes":
        exportData = await exportClasses(schoolId);
        break;
      case "attendance":
        exportData = await exportAttendance(schoolId, academicYear, classId);
        break;
      case "results":
        exportData = await exportResults(schoolId, academicYear, classId);
        break;
      default:
        return {
          success: false,
          filename: "",
          mimeType: "",
          error: `Data type "${dataType}" not yet supported`,
        };
    }

    // Convert to requested format
    let content: string;
    let mimeType: string;

    switch (format) {
      case "csv":
        content = arrayToCSV(exportData.data, exportData.headers);
        mimeType = "text/csv";
        break;
      case "json":
        content = arrayToJSON(exportData.data);
        mimeType = "application/json";
        break;
      case "excel":
        // For now, return CSV (true Excel would need a library like xlsx)
        content = arrayToCSV(exportData.data, exportData.headers);
        mimeType = "text/csv"; // Excel can open CSV
        break;
      default:
        return {
          success: false,
          filename: "",
          mimeType: "",
          error: `Format "${format}" not supported`,
        };
    }

    logger.info("Data exported successfully", {
      schoolId,
      dataType,
      format,
      recordCount: exportData.data.length,
    });

    return {
      success: true,
      data: content,
      filename: `${exportData.filename}.${format === "excel" ? "csv" : format}`,
      mimeType,
      recordCount: exportData.data.length,
    };

  } catch (error) {
    logger.error("Data export failed", { error, options });

    return {
      success: false,
      filename: "",
      mimeType: "",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// ============================================================================
// DATA IMPORT
// ============================================================================

export interface ImportOptions {
  format: "csv" | "json";
  dataType: ExportDataType;
  schoolId: string;
  data: string; // File content
  academicYear?: string;
  skipDuplicates?: boolean;
}

export interface ImportResult {
  success: boolean;
  imported: number;
  failed: number;
  errors: Array<{ row: number; error: string }>;
  filename?: string;
}

/**
 * Parse CSV content to array of objects
 */
function parseCSVContent(content: string): ExportRecord[] {
  const lines = content.trim().split("\n");
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]);
  const result: ExportRecord[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const obj: ExportRecord = {};

    headers.forEach((header, index) => {
      obj[header] = values[index];
    });

    result.push(obj);
  }

  return result;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

/**
 * Import student data from CSV/JSON
 */
export async function importStudents(options: {
  schoolId: string;
  data: ExportRecord[];
  skipDuplicates?: boolean;
}): Promise<ImportResult> {
  const { schoolId, data, skipDuplicates = true } = options;
  const errors: Array<{ row: number; error: string }> = [];
  let imported = 0;

  for (let i = 0; i < data.length; i++) {
    const row = data[i];

    try {
      // Validate required fields
      if (!row.Name && !row.name) {
        errors.push({ row: i + 1, error: "Name is required" });
        continue;
      }

      // Check for duplicate CID
      if (skipDuplicates && (row.CID || row.cidNumber)) {
        const [existing] = await db
          .select()
          .from(users)
          .where(eq(users.cidNumber, row.CID || row.cidNumber))
          .limit(1);

        if (existing) {
          continue; // Skip duplicate
        }
      }

      // Insert student
      await db.insert(users).values({
        id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        schoolId,
        name: row.Name || row.name,
        cidNumber: row.CID || row.cidNumber,
        email: row.Email || row.email,
        phone: row.Phone || row.phone,
        gender: row.Gender || row.gender || "other",
        type: "student",
        role: "student",
        classGrade: row.Class || row.classGrade,
        section: row.Section || row.section,
        rollNumber: row["Roll Number"] || row.rollNumber,
        address: row.Address || row.address,
        dzongkhag: row.Dzongkhag || row.dzongkhag,
        fatherName: row["Father Name"] || row.fatherName,
        fatherPhone: row["Father Phone"] || row.fatherPhone,
        motherName: row["Mother Name"] || row.motherName,
        motherPhone: row["Mother Phone"] || row.motherPhone,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      imported++;
    } catch (error) {
      errors.push({
        row: i + 1,
        error: error instanceof Error ? error.message : "Failed to import row",
      });
    }
  }

  return {
    success: errors.length === 0 || imported > 0,
    imported,
    failed: errors.length,
    errors,
  };
}

/**
 * Import data from CSV/JSON
 */
export async function importData(options: ImportOptions): Promise<ImportResult> {
  const { format, dataType, schoolId, data, skipDuplicates = true } = options;

  try {
    let parsedData: ExportRecord[];

    // Parse data based on format
    if (format === "csv") {
      parsedData = parseCSVContent(data);
    } else if (format === "json") {
      parsedData = JSON.parse(data);
      if (!Array.isArray(parsedData)) {
        return {
          success: false,
          imported: 0,
          failed: 0,
          errors: [{ row: 0, error: "JSON must be an array of objects" }],
        };
      }
    } else {
      return {
        success: false,
        imported: 0,
        failed: 0,
        errors: [{ row: 0, error: `Format "${format}" not supported` }],
      };
    }

    // Import based on data type
    switch (dataType) {
      case "students":
        return await importStudents({ schoolId, data: parsedData, skipDuplicates });
      default:
        return {
          success: false,
          imported: 0,
          failed: 0,
          errors: [{ row: 0, error: `Data type "${dataType}" import not yet supported` }],
        };
    }

  } catch (error) {
    logger.error("Data import failed", { error, options });

    return {
      success: false,
      imported: 0,
      failed: 1,
      errors: [{ row: 0, error: error instanceof Error ? error.message : "Unknown error" }],
    };
  }
}
