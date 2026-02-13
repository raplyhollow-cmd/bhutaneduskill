/**
 * RUB (Royal University of Bhutan) Integration Schema
 * Handles college applications, admissions, and scholarship tracking
 */

import { pgTable, text, integer, boolean, timestamp, pgEnum , json} from "drizzle-orm/pg-core";

// ============================================================================
// RUB COLLEGES
// ============================================================================

/**
 * RUB constituent colleges
 */
export const rubColleges = pgTable("rub_colleges", {
  id: text("id").primaryKey(),

  // College details
  name: text("name").notNull(),
  code: text("code").unique().notNull(),
  type: text("type").notNull(), // "constituent", "affiliated"

  // Location
  dzongkhag: text("dzongkhag").notNull(),
  location: text("location").notNull(),
  latitude: text("latitude"),
  longitude: text("longitude"),

  // Contact
  website: text("website"),
  email: text("email"),
  phone: text("phone"),

  // Programs offered
  programs: json("programs").$type<Array<{
    code: string;
    name: string;
    level: "certificate" | "diploma" | "bachelor" | "master" | "phd";
    duration: number;
    capacity: number;
  }>>(),

  // Facilities
  hasHostel: boolean("has_hostel").default(false),
  hasLibrary: boolean("has_library").default(true),
  hasLab: boolean("has_lab").default(false),
  hasSports: boolean("has_sports").default(false),

  // Description
  description: text("description"),

  // Status
  isActive: boolean("is_active").default(true),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

// ============================================================================
// RUB PROGRAMS
// ============================================================================

/**
 * Programs offered by RUB colleges
 */
export const rubPrograms = pgTable("rub_programs", {
  id: text("id").primaryKey(),

  // Program details
  name: text("name").notNull(),
  code: text("code").unique().notNull(),
  collegeId: text("college_id").notNull(),

  // Program classification
  level: text("level").notNull(), // "certificate", "diploma", "bachelor", "master", "phd"
  field: text("field").notNull(), // "engineering", "arts", "science", "business", "education", "medicine"
  discipline: text("discipline"), // Specific discipline e.g., "computer_science"

  // Duration
  duration: integer("duration").notNull(), // In years
  durationType: text("duration_type").notNull(), // "years", "semesters", "months"

  // Capacity and intake
  totalSeats: integer("total_seats"),
  reservedSeats: json("reserved_seats").$type<Array<{
    category: string;
    seats: number;
  }>>(),

  // Eligibility
  minPercentage: integer("min_percentage"), // Minimum percentage required
  requiredSubjects: json("required_subjects").$type<string[]>(),
  eligibilityCriteria: json("eligibility_criteria").$type<Record<string, any>>(),

  // Fees
  tuitionFee: integer("tuition_fee"), // Per semester
  hostelFee: integer("hostel_fee"), // Per semester
  otherFees: integer("other_fees"),
  totalFee: integer("total_fee"),

  // Description
  description: text("description"),
  careerProspects: json("career_prospects").$type<string[]>(),

  // Status
  isActive: boolean("is_active").default(true),
  admissionOpen: boolean("admission_open").default(false),
  academicYear: text("academic_year"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

// ============================================================================
// RUB APPLICATIONS
// ============================================================================

/**
 * Student applications to RUB colleges
 */
export const rubApplications = pgTable("rub_applications", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").notNull(),
  studentId: text("student_id").notNull(),

  // Application details
  applicationNumber: text("application_number").unique(),
  applicationYear: integer("application_year").notNull(),
  academicYear: text("academic_year").notNull(),

  // Program preferences
  preferences: json("preferences").$type<Array<{
    collegeId: string;
    collegeName: string;
    programId: string;
    programName: string;
    priority: number;
  }>>(),

  // Student details
  studentName: text("student_name").notNull(),
  cidNumber: text("cid_number").notNull(),
  dateOfBirth: text("date_of_birth").notNull(),
  gender: text("gender").notNull(),
  bloodGroup: text("blood_group"),
  photo: text("photo"),

  // Contact
  phone: text("phone").notNull(),
  email: text("email"),
  presentAddress: text("present_address"),
  permanentAddress: text("permanent_address"),
  dzongkhag: text("dzongkhag"),
  gewog: text("gewog"),
  village: text("village"),

  // Parent details
  fatherName: text("father_name"),
  fatherOccupation: text("father_occupation"),
  fatherPhone: text("father_phone"),
  fatherCID: text("father_cid"),
  motherName: text("mother_name"),
  motherOccupation: text("mother_occupation"),
  motherPhone: text("mother_phone"),
  motherCID: text("mother_cid"),
  guardianName: text("guardian_name"),
  guardianPhone: text("guardian_phone"),
  guardianCID: text("guardian_cid"),

  // Academic details
  examType: text("exam_type").notNull(), // "BCSE_10", "BCSE_12"
  examYear: integer("exam_year").notNull(),
  indexNumber: text("index_number"),
  schoolAttended: text("school_attended").notNull(),
  percentage: integer("percentage"), // In hundredths
  division: text("division"),

  // Subject marks
  subjectMarks: json("subject_marks").$type<Array<{
    subject: string;
    marks: number;
    total: number;
    grade: string;
  }>>(),

  // Documents
  documents: json("documents").$type<Array<{
    documentType: string;
    documentUrl: string;
    verified: boolean;
  }>>(),

  // Special categories
  category: text("category"), // "general", "sc", "st", "ewh"
  hasDisability: boolean("has_disability").default(false),
  disabilityType: text("disability_type"),
  disabilityCertificate: text("disability_certificate"),

  // Scholarship
  scholarshipApplied: boolean("scholarship_applied").default(false),
  scholarshipType: text("scholarship_type"),
  scholarshipDocuments: json("scholarship_documents").$type<string[]>(),

  // Application status
  status: text("status").notNull().default("draft"), // "draft", "submitted", "under_review", "document_verified", "interview_scheduled", "selected", "rejected", "waitlisted", "admitted", "declined"
  submittedDate: text("submitted_date"),
  lastModifiedDate: text("last_modified_date"),

  // Admission result
  admittedCollegeId: text("admitted_college_id"),
  admittedProgramId: text("admitted_program_id"),
  admittedCollegeName: text("admitted_college_name"),
  admittedProgramName: text("admitted_program_name"),
  admissionDate: text("admission_date"),
  admissionDeadline: text("admission_deadline"),
  meritRank: integer("merit_rank"),

  // Verification
  verifiedBy: text("verified_by"),
  verifiedDate: text("verified_date"),
  verificationNotes: text("verification_notes"),

  // Interview
  interviewScheduled: boolean("interview_scheduled").default(false),
  interviewDate: text("interview_date"),
  interviewTime: text("interview_time"),
  interviewVenue: text("interview_venue"),
  interviewResult: text("interview_result"),
  interviewScore: integer("interview_score"),
  interviewNotes: text("interview_notes"),

  // Rejection
  rejectionReason: text("rejection_reason"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

// ============================================================================
// RUB SCHOLARSHIPS
// ============================================================================

/**
 * Available scholarships for RUB programs
 */
export const rubScholarships = pgTable("rub_scholarships", {
  id: text("id").primaryKey(),

  // Scholarship details
  name: text("name").notNull(),
  code: text("code").unique().notNull(),
  type: text("type").notNull(), // "merit", "need_based", "sports", "arts", "government", "private"

  // Provider
  provider: text("provider").notNull(), // "RUB", "Govt", "Private Organization"
  providerName: text("provider_name"),

  // Coverage
  coversTuition: boolean("covers_tuition").default(false),
  coversHostel: boolean("covers_hostel").default(false),
  coversBooks: boolean("covers_books").default(false),
  coversLiving: boolean("covers_living").default(false),
  coveragePercentage: integer("coverage_percentage"), // 0-100

  // Eligibility
  minPercentage: integer("min_percentage"),
  annualIncomeLimit: integer("annual_income_limit"), // For need-based
  categories: json("categories").$type<string[]>(),

  // Duration
  duration: text("duration"), // "program_duration", "1_year", "renewable"

  // Application
  applicationOpenDate: text("application_open_date"),
  applicationCloseDate: text("application_close_date"),
  requiredDocuments: json("required_documents").$type<string[]>(),

  // Description
  description: text("description"),
  termsAndConditions: text("terms_and_conditions"),

  // Status
  isActive: boolean("is_active").default(true),
  academicYear: text("academic_year"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

// ============================================================================
// RUB SCHOLARSHIP APPLICATIONS
// ============================================================================

/**
 * Student scholarship applications
 */
export const rubScholarshipApplications = pgTable("rub_scholarship_applications", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").notNull(),
  studentId: text("student_id").notNull(),
  scholarshipId: text("scholarship_id").notNull(),
  rubApplicationId: text("rub_application_id"), // Link to main application

  // Application details
  applicationNumber: text("application_number").unique(),
  applicationYear: integer("application_year").notNull(),
  academicYear: text("academic_year").notNull(),

  // Student info
  studentName: text("student_name").notNull(),
  cidNumber: text("cid_number").notNull(),

  // Financial need assessment
  annualFamilyIncome: integer("annual_family_income"),
  familyMembers: integer("family_members"),
  earningMembers: integer("earning_members"),
  propertyDetails: text("property_details"),
  financialHardship: text("financial_hardship"),

  // Supporting documents
  documents: json("documents").$type<Array<{
    documentType: string;
    documentUrl: string;
  }>>(),

  // Recommendation
  schoolRecommendation: text("school_recommendation"),
  recommendedBy: text("recommended_by"), // Principal user ID
  recommendationDate: text("recommendation_date"),

  // Status
  status: text("status").notNull().default("pending"), // "pending", "under_review", "approved", "rejected", "disbursed"
  submittedDate: text("submitted_date"),
  approvedDate: text("approved_date"),
  approvedAmount: integer("approved_amount"),

  // Disbursement
  disbursementSchedule: json("disbursement_schedule").$type<Array<{
    installment: number;
    dueDate: string;
    amount: number;
    disbursed: boolean;
    disbursedDate?: string;
  }>>(),

  // Rejection
  rejectionReason: text("rejection_reason"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

// ============================================================================
// RUB API CONFIG
// ============================================================================

/**
 * RUB API configuration
 */
export const rubApiConfig = pgTable("rub_api_config", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").notNull(),

  // API credentials
  apiKey: text("api_key").notNull(),
  apiSecret: text("api_secret").notNull(),
  apiEndpoint: text("api_endpoint").notNull(),
  schoolCode: text("school_code").notNull(),

  // Configuration
  isEnabled: boolean("is_enabled").default(true),
  autoSubmitApplications: boolean("auto_submit_applications").default(false),
  autoFetchResults: boolean("auto_fetch_results").default(true),

  // Last sync
  lastSyncDate: text("last_sync_date"),
  lastSubmissionDate: text("last_submission_date"),

  // Webhook
  webhookUrl: text("webhook_url"),
  webhookSecret: text("webhook_secret"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

// ============================================================================
// RUB SYNC LOGS
// ============================================================================

/**
 * RUB API synchronization logs
 */
export const rubSyncLogs = pgTable("rub_sync_logs", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").notNull(),

  // Sync details
  syncType: text("sync_type").notNull(), // "programs", "application", "results", "scholarships"
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
// RUB COUNSELING RECORDS
// ============================================================================

/**
 * Career counseling records for RUB applications
 */
export const rubCounselingRecords = pgTable("rub_counseling_records", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").notNull(),
  studentId: text("student_id").notNull(),

  // Counseling session
  counselingDate: text("counseling_date").notNull(),
  counselorId: text("counselor_id").notNull(), // Staff user ID
  counselorName: text("counselor_name"),

  // Session details
  sessionType: text("session_type").notNull(), // "career_guidance", "program_selection", "application_help", "interview_prep"
  sessionNotes: text("session_notes"),

  // Discussed programs
  discussedPrograms: json("discussed_programs").$type<Array<{
    collegeId: string;
    collegeName: string;
    programId: string;
    programName: string;
    suitabilityScore: number;
  }>>(),

  // Career assessment
  interests: json("interests").$type<string[]>(),
  strengths: json("strengths").$type<string[]>(),
  recommendedFields: json("recommended_fields").$type<string[]>(),
  recommendedColleges: json("recommended_colleges").$type<string[]>(),

  // Follow-up
  followUpRequired: boolean("follow_up_required").default(false),
  followUpDate: text("follow_up_date"),
  followUpAction: text("follow_up_action"),

  // Documents shared
  documentsShared: json("documents_shared").$type<string[]>(),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
});

// ============================================================================
// RUB ADMISSION STATISTICS
// ============================================================================

/**
 * Track admission statistics for school
 */
export const rubAdmissionStats = pgTable("rub_admission_stats", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").notNull(),
  academicYear: text("academic_year").notNull(),

  // Application stats
  totalApplicants: integer("total_applicants").default(0),
  totalSubmitted: integer("total_submitted").default(0),

  // Results
  totalSelected: integer("total_selected").default(0),
  totalRejected: integer("total_rejected").default(0),
  totalWaitlisted: integer("total_waitlisted").default(0),
  totalAdmitted: integer("total_admitted").default(0),

  // College-wise selection
  collegeSelections: json("college_selections").$type<Array<{
    collegeId: string;
    collegeName: string;
    selected: number;
    admitted: number;
  }>>(),

  // Program-wise selection
  programSelections: json("program_selections").$type<Array<{
    programId: string;
    programName: string;
    field: string;
    selected: number;
    admitted: number;
  }>>(),

  // Scholarship
  totalScholarshipApplications: integer("total_scholarship_applications").default(0),
  totalScholarshipsReceived: integer("total_scholarships_received").default(0),
  totalScholarshipAmount: integer("total_scholarship_amount").default(0),

  // Success rate
  selectionRate: integer("selection_rate"), // In hundredths
  admissionRate: integer("admission_rate"), // In hundredths

  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type RUBCollege = typeof rubColleges.$inferSelect;
export type RUBProgram = typeof rubPrograms.$inferSelect;
export type RUBApplication = typeof rubApplications.$inferSelect;
export type RUBScholarship = typeof rubScholarships.$inferSelect;
export type RUBScholarshipApplication = typeof rubScholarshipApplications.$inferSelect;
export type RUBApiConfig = typeof rubApiConfig.$inferSelect;
export type RUBSyncLog = typeof rubSyncLogs.$inferSelect;
export type RUBCounselingRecord = typeof rubCounselingRecords.$inferSelect;
export type RUBAdmissionStats = typeof rubAdmissionStats.$inferSelect;
