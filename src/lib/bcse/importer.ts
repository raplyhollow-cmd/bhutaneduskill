/**
 * BCSE Result Import Service
 * Handles CSV/Excel import of BCSE examination results
 */

import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import {
  bcseResults,
  bcseRegistrations,
  users,
  schools,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";

// ============================================================================
// TYPES
// ============================================================================

export interface BCSEResultImportRow {
  indexNumber: string;
  cidNumber: string;
  studentName: string;
  examType: "BCSE_10" | "BCSE_12";
  examYear: number;
  academicYear: string;
  schoolCode: string;
  division: string;
  aggregateMarks: number;
  totalMarks: number;
  percentage: number;
  passed: boolean;
  subjects: Array<{
    subjectCode: string;
    subjectName: string;
    marksObtained: number;
    totalMarks: number;
    grade: string;
    remarks: string;
  }>;
}

export interface ImportError {
  row: number;
  indexNumber: string;
  error: string;
}

export interface ImportResult {
  success: boolean;
  totalRows: number;
  imported: number;
  failed: number;
  errors: ImportError[];
}

export interface ImportOptions {
  schoolId: string;
  academicYear: string;
  examType: "BCSE_10" | "BCSE_12";
  skipExisting?: boolean;
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate CID number format (Bhutan CID is 11 digits)
 */
export function validateCID(cid: string): boolean {
  return /^\d{11}$/.test(cid);
}

/**
 * Validate index number format
 */
export function validateIndexNumber(indexNumber: string): boolean {
  // Format: SCHOOLCODE-SEQUENCE-YEAR (e.g., "ABC-0001-2026")
  return /^[\w\d]+-\d{4}-\d{4}$/.test(indexNumber);
}

/**
 * Validate BCSE result row
 */
export function validateResultRow(row: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!row.indexNumber || typeof row.indexNumber !== "string") {
    errors.push("Index number is required");
  } else if (!validateIndexNumber(row.indexNumber)) {
    errors.push("Invalid index number format");
  }

  if (!row.cidNumber || typeof row.cidNumber !== "string") {
    errors.push("CID number is required");
  } else if (!validateCID(row.cidNumber)) {
    errors.push("Invalid CID number format (must be 11 digits)");
  }

  if (!row.studentName || typeof row.studentName !== "string") {
    errors.push("Student name is required");
  }

  if (!row.examType || !["BCSE_10", "BCSE_12"].includes(row.examType)) {
    errors.push("Exam type must be BCSE_10 or BCSE_12");
  }

  if (!row.examYear || typeof row.examYear !== "number") {
    errors.push("Exam year is required");
  }

  if (row.percentage === undefined || typeof row.percentage !== "number") {
    errors.push("Percentage is required");
  }

  if (row.passed === undefined || typeof row.passed !== "boolean") {
    errors.push("Passed status is required");
  }

  if (!Array.isArray(row.subjects) || row.subjects.length === 0) {
    errors.push("At least one subject result is required");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Parse CSV string to result rows
 */
export function parseCSV(csvContent: string): BCSEResultImportRow[] {
  const lines = csvContent.trim().split("\n");
  if (lines.length < 2) {
    throw new Error("CSV must have at least a header and one data row");
  }

  // Parse header
  const headers = parseCSVLine(lines[0]);
  const rows: BCSEResultImportRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row: any = {};

    headers.forEach((header, index) => {
      row[header] = values[index];
    });

    // Parse subjects from JSON string if present
    if (row.subjects && typeof row.subjects === "string") {
      try {
        row.subjects = JSON.parse(row.subjects);
      } catch {
        row.subjects = [];
      }
    }

    // Convert types
    if (row.examYear) row.examYear = parseInt(row.examYear, 10);
    if (row.aggregateMarks) row.aggregateMarks = parseInt(row.aggregateMarks, 10);
    if (row.totalMarks) row.totalMarks = parseInt(row.totalMarks, 10);
    if (row.percentage) row.percentage = parseFloat(row.percentage);
    if (row.passed) row.passed = row.passed === "true" || row.passed === "TRUE" || row.passed === true;

    rows.push(row as BCSEResultImportRow);
  }

  return rows;
}

/**
 * Parse a single CSV line handling quoted values
 */
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

// ============================================================================
// IMPORT SERVICE
// ============================================================================

/**
 * Import BCSE results from array of rows
 */
export async function importBCSEResults(
  rows: BCSEResultImportRow[],
  options: ImportOptions
): Promise<ImportResult> {
  const { schoolId, academicYear, examType, skipExisting = true } = options;
  const errors: ImportError[] = [];
  let imported = 0;
  let failed = 0;

  logger.info("Starting BCSE result import", {
    schoolId,
    academicYear,
    examType,
    totalRows: rows.length,
  });

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    try {
      // Validate row
      const validation = validateResultRow(row);
      if (!validation.valid) {
        errors.push({
          row: i + 1,
          indexNumber: row.indexNumber || "unknown",
          error: validation.errors.join(", "),
        });
        failed++;
        continue;
      }

      // Check if result already exists
      if (skipExisting) {
        const existing = await db
          .select()
          .from(bcseResults)
          .where(
            and(
              eq(bcseResults.indexNumber, row.indexNumber),
              eq(bcseResults.examType, row.examType),
              eq(bcseResults.examYear, row.examYear)
            )
          )
          .limit(1);

        if (existing.length > 0) {
          logger.debug("Skipping existing result", { indexNumber: row.indexNumber });
          continue;
        }
      }

      // Find matching registration if exists
      const [registration] = await db
        .select()
        .from(bcseRegistrations)
        .where(
          and(
            eq(bcseRegistrations.bcseIndexNumber, row.indexNumber),
            eq(bcseRegistrations.examType, row.examType),
            eq(bcseRegistrations.examYear, row.examYear)
          )
        )
        .limit(1);

      // Find or create student record
      let studentId = registration?.studentId;

      if (!studentId) {
        // Try to find student by CID
        const [student] = await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.cidNumber, row.cidNumber))
          .limit(1);

        studentId = student?.id;
      }

      // Create result record
      const resultId = `bcse_result_${nanoid()}`;
      await db.insert(bcseResults).values({
        id: resultId,
        schoolId,
        studentId: studentId || null,
        registrationId: registration?.id || null,
        examType: row.examType,
        examYear: row.examYear,
        academicYear,
        indexNumber: row.indexNumber,
        resultDeclaredDate: new Date().toISOString().split("T")[0],
        fetchedDate: new Date().toISOString(),
        division: row.division,
        aggregateMarks: row.aggregateMarks,
        totalMarks: row.totalMarks,
        percentage: Math.round(row.percentage * 100), // Store as hundredths
        subjectResults: row.subjects,
        passed: row.passed,
        passedSubjects: row.subjects.filter((s) => s.grade !== "F" && s.remarks !== "Fail").length,
        failedSubjects: row.subjects.filter((s) => s.grade === "F" || s.remarks === "Fail").length,
        remarks: row.division === "Failed" ? "Did not pass" : "Passed",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      imported++;
      logger.debug("Imported BCSE result", {
        row: i + 1,
        indexNumber: row.indexNumber,
        studentName: row.studentName,
      });

    } catch (error) {
      logger.error("Failed to import row", {
        row: i + 1,
        indexNumber: row.indexNumber,
        error: error instanceof Error ? error.message : String(error),
      });

      errors.push({
        row: i + 1,
        indexNumber: row.indexNumber,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      failed++;
    }
  }

  logger.info("BCSE result import completed", {
    totalRows: rows.length,
    imported,
    failed,
    errorCount: errors.length,
  });

  return {
    success: failed === 0,
    totalRows: rows.length,
    imported,
    failed,
    errors,
  };
}

/**
 * Import BCSE results from CSV content
 */
export async function importBCSEFromCSV(
  csvContent: string,
  options: ImportOptions
): Promise<ImportResult> {
  try {
    const rows = parseCSV(csvContent);
    return importBCSEResults(rows, options);
  } catch (error) {
    logger.error("Failed to parse CSV", { error });
    return {
      success: false,
      totalRows: 0,
      imported: 0,
      failed: 0,
      errors: [
        {
          row: 0,
          indexNumber: "N/A",
          error: error instanceof Error ? error.message : "Failed to parse CSV",
        },
      ],
    };
  }
}

// ============================================================================
// TEMPLATE GENERATION
// ============================================================================

/**
 * Generate CSV template for BCSE result import
 */
export function generateCSVTemplate(examType: "BCSE_10" | "BCSE_12"): string {
  const headers = [
    "indexNumber",
    "cidNumber",
    "studentName",
    "examType",
    "examYear",
    "academicYear",
    "schoolCode",
    "division",
    "aggregateMarks",
    "totalMarks",
    "percentage",
    "passed",
    "subjects",
  ];

  const sampleRow = {
    indexNumber: "SCHL-0001-2026",
    cidNumber: "11111111111",
    studentName: "Karma Wangchuk",
    examType,
    examYear: "2026",
    academicYear: "2025-2026",
    schoolCode: "SCHL",
    division: "First Division",
    aggregateMarks: "580",
    totalMarks: "700",
    percentage: "82.86",
    passed: "true",
    subjects: JSON.stringify([
      { subjectCode: "ENG", subjectName: "English", marksObtained: 85, totalMarks: 100, grade: "A", remarks: "Excellent" },
      { subjectCode: "DZO", subjectName: "Dzongkha", marksObtained: 78, totalMarks: 100, grade: "B+", remarks: "Good" },
      { subjectCode: "MAT", subjectName: "Mathematics", marksObtained: 92, totalMarks: 100, grade: "A+", remarks: "Outstanding" },
      { subjectCode: "SCI", subjectName: "Science", marksObtained: 88, totalMarks: 100, grade: "A", remarks: "Excellent" },
      { subjectCode: "SOC", subjectName: "Social Studies", marksObtained: 82, totalMarks: 100, grade: "A", remarks: "Excellent" },
    ]),
  };

  return [
    headers.join(","),
    headers.map((h) => `"${sampleRow[h as keyof typeof sampleRow]}"`).join(","),
  ].join("\n");
}

/**
 * Get BCSE import statistics for a school
 */
export async function getBCSEImportStats(schoolId: string) {
  const results = await db
    .select()
    .from(bcseResults)
    .where(eq(bcseResults.schoolId, schoolId));

  if (results.length === 0) {
    return {
      total: 0,
      passed: 0,
      failed: 0,
      passPercentage: 0,
      byYear: {},
    };
  }

  const passed = results.filter((r) => r.passed).length;
  const byYear: Record<number, { total: number; passed: number }> = {};

  results.forEach((r) => {
    if (!byYear[r.examYear]) {
      byYear[r.examYear] = { total: 0, passed: 0 };
    }
    byYear[r.examYear].total++;
    if (r.passed) {
      byYear[r.examYear].passed++;
    }
  });

  return {
    total: results.length,
    passed,
    failed: results.length - passed,
    passPercentage: Math.round((passed / results.length) * 100),
    byYear,
  };
}
