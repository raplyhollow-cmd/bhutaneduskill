/**
 * BCSE (Bhutan Council for School Examinations) Integration Schema
 * Handles BCSE exam registrations, results, and compliance
 */

import { pgTable, text, integer, boolean, timestamp, pgEnum , json} from "drizzle-orm/pg-core";

// ============================================================================
// BCSE STUDENT REGISTRATIONS
// ============================================================================

/**
 * Student registrations for BCSE examinations
 */
export const bcseRegistrations = pgTable("bcse_registrations", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").notNull(),
  studentId: text("student_id").notNull(),

  // Exam details
  examType: text("exam_type").notNull(), // "BCSE_10", "BCSE_12"
  academicYear: text("academic_year").notNull(),
  examYear: integer("exam_year").notNull(),

  // BCSE registration details
  bcseRegistrationNumber: text("bcse_registration_number").unique(),
  bcseIndexNumber: text("bcse_index_number"),
  bcseStudentCode: text("bcse_student_code"),

  // Registration status
  registrationStatus: text("registration_status").notNull().default("pending"), // "pending", "submitted", "confirmed", "rejected", "approved"
  submittedDate: text("submitted_date"),
  confirmedDate: text("confirmed_date"),

  // Subjects registered
  subjects: json("subjects").$type<Array<{
    subjectCode: string;
    subjectName: string;
    isCompulsory: boolean;
    examDate?: string;
  }>>(),

  // Student details for BCSE
  studentName: text("student_name").notNull(),
  cidNumber: text("cid_number").notNull(),
  dateOfBirth: text("date_of_birth").notNull(), // ISO date
  gender: text("gender").notNull(), // "male", "female", "other"
  bloodGroup: text("blood_group"),
  photo: text("photo"), // Photo URL

  // Parent details
  fatherName: text("father_name"),
  fatherCID: text("father_cid"),
  fatherOccupation: text("father_occupation"),
  fatherPhone: text("father_phone"),
  motherName: text("mother_name"),
  motherCID: text("mother_cid"),
  motherOccupation: text("mother_occupation"),
  motherPhone: text("mother_phone"),
  guardianName: text("guardian_name"),
  guardianCID: text("guardian_cid"),
  guardianPhone: text("guardian_phone"),

  // Contact
  permanentAddress: text("permanent_address"),
  currentAddress: text("current_address"),
  dzongkhag: text("dzongkhag"),
  gewog: text("gewog"),
  village: text("village"),

  // Special needs
  hasSpecialNeeds: boolean("has_special_needs").default(false),
  specialNeedsType: text("special_needs_type"), // "visual", "hearing", "physical", "learning", "other"
  specialNeedsDetails: text("special_needs_details"),
  requiresSpecialArrangements: boolean("requires_special_arrangements").default(false),
  specialArrangements: text("special_arrangements"),

  // Fees
  registrationFee: integer("registration_fee"),
  feeStatus: text("fee_status").notNull().default("unpaid"), // "unpaid", "partial", "paid", "waived"
  feePaidDate: text("fee_paid_date"),
  feeReceiptNumber: text("fee_receipt_number"),
  feeWaiverReason: text("fee_waiver_reason"),

  // Documents
  documents: json("documents").$type<Array<{
    documentType: string;
    documentUrl: string;
    uploadDate: string;
    verified: boolean;
  }>>(),

  // Verification
  verifiedBy: text("verified_by"), // Staff user ID
  verifiedDate: text("verified_date"),
  verificationNotes: text("verification_notes"),

  // Rejection
  rejectionReason: text("rejection_reason"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

// ============================================================================
// BCSE EXAM RESULTS
// ============================================================================

/**
 * BCSE examination results
 */
export const bcseResults = pgTable("bcse_results", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").notNull(),
  studentId: text("student_id").notNull(),
  registrationId: text("registration_id").notNull(),

  // Exam details
  examType: text("exam_type").notNull(), // "BCSE_10", "BCSE_12"
  examYear: integer("exam_year").notNull(),
  academicYear: text("academic_year").notNull(),

  // Index number
  indexNumber: text("index_number").notNull(),

  // Result declaration
  resultDeclaredDate: text("result_declared_date"),
  fetchedDate: text("fetched_date"),

  // Overall result
  division: text("division"), // "First Division", "Second Division", "Third Division", "Failed"
  aggregateMarks: integer("aggregate_marks"),
  totalMarks: integer("total_marks"),
  percentage: integer("percentage"), // In hundredths (e.g., 7850 = 78.50%)

  // Subject results
  subjectResults: json("subject_results").$type<Array<{
    subjectCode: string;
    subjectName: string;
    marksObtained: number;
    totalMarks: number;
    grade: string;
    remarks: string;
  }>>(),

  // Pass/Fail
  passed: boolean("passed").notNull(),
  passedSubjects: integer("passed_subjects").default(0),
  failedSubjects: integer("failed_subjects").default(0),

  // Remarks
  remarks: text("remarks"),
  transcriptUrl: text("transcript_url"),
  certificateUrl: text("certificate_url"),

  // GPA (if applicable)
  gpa: text("gpa"), // String to handle decimal precision

  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

// ============================================================================
// BCSE SUBJECT MAPPING
// ============================================================================

/**
 * Mapping between school subjects and BCSE subject codes
 */
export const bcseSubjectMapping = pgTable("bcse_subject_mapping", {
  id: text("id").primaryKey(),

  // BCSE subject details
  bcseSubjectCode: text("bcse_subject_code").notNull().unique(),
  bcseSubjectName: text("bcse_subject_name").notNull(),
  examType: text("exam_type").notNull(), // "BCSE_10", "BCSE_12"

  // School subject mapping
  schoolSubjectId: text("school_subject_id"), // Reference to school's subject
  schoolSubjectName: text("school_subject_name"),

  // Subject type
  isCompulsory: boolean("is_compulsory").default(false),
  subjectGroup: text("subject_group"), // "core", "elective", "optional"

  // Max marks
  theoryMarks: integer("theory_marks"),
  practicalMarks: integer("practical_marks"),
  totalMarks: integer("total_marks"),

  // Pass marks
  passTheory: integer("pass_theory"),
  passPractical: integer("pass_practical"),
  passTotal: integer("pass_total"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

// ============================================================================
// BCSE CERTIFICATES
// ============================================================================

/**
 * BCSE certificates and documents
 */
export const bcseCertificates = pgTable("bcse_certificates", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").notNull(),
  studentId: text("student_id").notNull(),
  resultId: text("result_id").notNull(),

  // Certificate details
  certificateType: text("certificate_type").notNull(), // "pass_certificate", "marksheet", "migration_certificate"
  certificateNumber: text("certificate_number"),
  issueDate: text("issue_date"),

  // Documents
  documentUrl: text("document_url").notNull(),
  documentVerified: boolean("document_verified").default(false),

  // Verification
  verificationHash: text("verification_hash"), // For blockchain/digital verification
  qrCodeData: text("qr_code_data"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
});

// ============================================================================
// BCSE API CONFIG
// ============================================================================

/**
 * BCSE API configuration and credentials
 */
export const bcseApiConfig = pgTable("bcse_api_config", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").notNull(),

  // API credentials
  apiKey: text("api_key").notNull(),
  apiSecret: text("api_secret").notNull(),
  apiEndpoint: text("api_endpoint").notNull(),
  schoolCode: text("school_code").notNull(),

  // Configuration
  isEnabled: boolean("is_enabled").default(true),
  autoSyncResults: boolean("auto_sync_results").default(true),
  autoSubmitRegistrations: boolean("auto_submit_registrations").default(false),

  // Last sync
  lastSyncDate: text("last_sync_date"),
  lastRegistrationSubmit: text("last_registration_submit"),

  // Webhook
  webhookUrl: text("webhook_url"),
  webhookSecret: text("webhook_secret"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

// ============================================================================
// BCSE SYNC LOGS
// ============================================================================

/**
 * BCSE API synchronization logs
 */
export const bcseSyncLogs = pgTable("bcse_sync_logs", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").notNull(),

  // Sync details
  syncType: text("sync_type").notNull(), // "registration", "results", "certificates"
  syncDirection: text("sync_direction").notNull(), // "push", "pull"

  // Status
  status: text("status").notNull(), // "success", "failed", "partial"

  // Records
  totalRecords: integer("total_records"),
  successRecords: integer("success_records"),
  failedRecords: integer("failed_records"),

  // Error details
  errorCode: text("error_code"),
  errorMessage: text("error_message"),
  errorDetails: json("error_details").$type<Record<string, any>>(),

  // Request/Response
  requestData: json("request_data").$type<Record<string, any>>(),
  responseData: json("response_data").$type<Record<string, any>>(),

  // Timing
  startedAt: text("started_at").notNull(),
  completedAt: text("completed_at"),
  duration: integer("duration"), // Seconds

  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
});

// ============================================================================
// BCSE ACADEMIC PERFORMANCE TRACKING
// ============================================================================

/**
 * Track BCSE performance trends for school improvement
 */
export const bcsePerformanceTracking = pgTable("bcse_performance_tracking", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").notNull(),

  // Period
  academicYear: text("academic_year").notNull(),
  examYear: integer("exam_year").notNull(),
  examType: text("exam_type").notNull(),

  // Student statistics
  totalRegistered: integer("total_registered").default(0),
  totalAppeared: integer("total_appeared").default(0),
  totalPassed: integer("total_passed").default(0),

  // Pass rate
  passPercentage: integer("pass_percentage"), // In hundredths

  // Division breakdown
  firstDivision: integer("first_division").default(0),
  secondDivision: integer("second_division").default(0),
  thirdDivision: integer("third_division").default(0),
  failed: integer("failed").default(0),

  // Top performers
  topScorers: json("top_scorers").$type<Array<{
    studentId: string;
    studentName: string;
    percentage: number;
    rank: number;
  }>>(),

  // Subject-wise performance
  subjectPerformance: json("subject_performance").$type<Array<{
    subjectCode: string;
    subjectName: string;
    averageMarks: number;
    passPercentage: number;
    distinctionCount: number;
  }>>(),

  // Comparison
  comparedToPreviousYear: json("compared_to_previous_year").$type<{
    passRateChange: number; // In hundredths
    totalPassedChange: number;
    ranking?: number;
    totalSchools?: number;
  }>(),

  // National comparison
  nationalRanking: integer("national_ranking"),
  dzongkhagRanking: integer("dzongkhag_ranking"),
  totalSchoolsInDzongkhag: integer("total_schools_in_dzongkhag"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

// ============================================================================
// BCSE SUBJECT COMBINATIONS
// ============================================================================

/**
 * Valid subject combinations for BCSE exams
 */
export const bcseSubjectCombinations = pgTable("bcse_subject_combinations", {
  id: text("id").primaryKey(),

  // Combination details
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  examType: text("exam_type").notNull(), // "BCSE_10", "BCSE_12"
  stream: text("stream"), // "science", "commerce", "arts", "technical"

  // Subjects
  compulsorySubjects: json("compulsory_subjects").$type<string[]>(), // Subject codes
  electiveSubjects: json("elective_subjects").$type<string[]>(), // Subject codes
  minElectives: integer("min_electives"),
  maxElectives: integer("max_electives"),

  // Rules
  description: text("description"),
  eligibility: json("eligibility").$type<string[]>(),

  // Status
  isActive: boolean("is_active").default(true),
  effectiveFrom: text("effective_from"), // ISO date
  effectiveUntil: text("effective_until"), // ISO date

  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type BCSERegistration = typeof bcseRegistrations.$inferSelect;
export type BCSEResult = typeof bcseResults.$inferSelect;
export type BCSESubjectMapping = typeof bcseSubjectMapping.$inferSelect;
export type BCSECertificate = typeof bcseCertificates.$inferSelect;
export type BCSEApiConfig = typeof bcseApiConfig.$inferSelect;
export type BCSESyncLog = typeof bcseSyncLogs.$inferSelect;
export type BCSEPerformanceTracking = typeof bcsePerformanceTracking.$inferSelect;
export type BCSESubjectCombination = typeof bcseSubjectCombinations.$inferSelect;
