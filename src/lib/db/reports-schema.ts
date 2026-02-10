/**
 * Government Reports Database Schema
 * Handles generation and submission of reports to Bhutan government agencies
 */

import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

// ============================================================================
// REPORT TEMPLATES
// ============================================================================

/**
 * Pre-defined report templates for government submissions
 */
export const reportTemplates = sqliteTable("report_templates", {
  id: text("id").primaryKey(),

  // Template details
  name: text("name").notNull(),
  code: text("code").unique().notNull(),
  description: text("description"),

  // Organization
  agency: text("agency").notNull(), // "MOE", "BCSE", "RUB", "RRCO", "DSO", "NBC"
  department: text("department"),

  // Report type
  reportType: text("report_type").notNull(), // "annual", "quarterly", "monthly", "ad_hoc", "census", "examination"
  reportCategory: text("report_category").notNull(), // "academic", "financial", "infrastructural", "staff", "student", "examination"

  // Schedule
  frequency: text("frequency").notNull(), // "annual", "semi_annual", "quarterly", "monthly", "on_demand"
  dueMonth: integer("due_month"), // 1-12
  dueDay: integer("due_day"), // Day of month
  dueDescription: text("due_description"), // e.g., "Within 30 days of academic year end"

  // Data requirements
  dataFields: text("data_fields", { mode: "json" }).$type<Array<{
    field: string;
    label: string;
    type: string;
    required: boolean;
    source: string; // "students", "teachers", "exams", etc.
  }>>(),

  // Format
  format: text("format").notNull(), // "pdf", "excel", "xml", "json", "online_form"
  templateStructure: text("template_structure", { mode: "json" }).$type<Record<string, any>>(),

  // Validation
  validationRules: text("validation_rules", { mode: "json" }).$type<Array<{
    field: string;
    rule: string;
    message: string;
  }>>(),

  // Status
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  version: text("version").default("1.0"),
  effectiveFrom: text("effective_from"),
  effectiveUntil: text("effective_until"),

  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

// ============================================================================
// GENERATED REPORTS
// ============================================================================

/**
 * Generated government reports
 */
export const generatedReports = sqliteTable("generated_reports", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").notNull(),
  templateId: text("template_id").notNull(),

  // Report details
  reportName: text("report_name").notNull(),
  reportCode: text("report_code").notNull(),
  reportPeriod: text("report_period").notNull(), // "2023-2024", "Q1-2024", "January-2024"

  // Dates
  reportingPeriodStart: text("reporting_period_start"),
  reportingPeriodEnd: text("reporting_period_end"),
  generatedDate: text("generated_date").notNull(),
  dueDate: text("due_date"),

  // Status
  status: text("status").notNull().default("draft"), // "draft", "pending_review", "approved", "submitted", "accepted", "rejected", "resubmission_required"

  // Report data
  reportData: text("report_data", { mode: "json" }).$type<Record<string, any>>(),
  summary: text("summary"), // Text summary of key figures

  // Approvals
  preparedBy: text("prepared_by"), // User ID
  preparedDate: text("prepared_date"),
  reviewedBy: text("reviewed_by"), // User ID (Principal)
  reviewedDate: text("reviewed_date"),
  approvedBy: text("approved_by"), // User ID (DEO/MOE)
  approvedDate: text("approved_date"),

  // Submission
  submissionDate: text("submission_date"),
  submissionMethod: text("submission_method"), // "online", "email", "post", "in_person"
  submissionReference: text("submission_reference"), // Reference number from agency
  submissionReceipt: text("submission_receipt"), // Receipt URL

  // Agency response
  agencyResponseDate: text("agency_response_date"),
  agencyResponse: text("agency_response"), // "accepted", "rejected", "clarification_required"
  agencyComments: text("agency_comments"),
  clarificationRequired: text("clarification_required", { mode: "json" }).$type<Array<{
    section: string;
    issue: string;
    clarificationNeeded: string;
  }>>(),

  // Files
  reportFileUrl: text("report_file_url"), // Generated report file
  supportingDocuments: text("supporting_documents", { mode: "json" }).$type<Array<{
    name: string;
    url: string;
    type: string;
  }>>(),

  // Revisions
  isRevision: integer("is_revision", { mode: "boolean" }).default(false),
  parentReportId: text("parent_report_id"),
  revisionNumber: integer("revision_number").default(0),
  revisionReason: text("revision_reason"),

  // Metadata
  agency: text("agency").notNull(),
  reportType: text("report_type").notNull(),
  frequency: text("frequency").notNull(),

  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

// ============================================================================
// REPORT SCHEDULES
// ============================================================================

/**
 * Automated report generation schedules
 */
export const reportSchedules = sqliteTable("report_schedules", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").notNull(),
  templateId: text("template_id").notNull(),

  // Schedule details
  name: text("name").notNull(),
  description: text("description"),

  // Timing
  frequency: text("frequency").notNull(), // "annually", "semi_annually", "quarterly", "monthly"
  generationDay: integer("generation_day"), // Day of month/period
  generationMonth: integer("generation_month"), // For annual reports
  autoGenerate: integer("auto_generate", { mode: "boolean" }).default(false),
  autoSubmit: integer("auto_submit", { mode: "boolean" }).default(false),

  // Notification
  notifyBeforeDays: integer("notify_before_days"),
  notifyEmails: text("notify_emails", { mode: "json" }).$type<string[]>(),

  // Status
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  lastGeneratedDate: text("last_generated_date"),
  nextDueDate: text("next_due_date"),

  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

// ============================================================================
// STUDENT ATTENDANCE REPORTS
// ============================================================================

/**
 * Student attendance reports for government
 */
export const studentAttendanceReports = sqliteTable("student_attendance_reports", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").notNull(),
  reportId: text("report_id").notNull(), // Link to generated_reports

  // Period
  academicYear: text("academic_year").notNull(),
  period: text("period").notNull(), // "annual", "term1", "term2", "term3"
  periodStart: text("period_start").notNull(),
  periodEnd: text("period_end").notNull(),

  // Summary data
  totalStudents: integer("total_students").notNull(),
  totalPresentDays: integer("total_present_days"),
  totalAbsentDays: integer("total_absent_days"),
  overallAttendanceRate: integer("overall_attendance_rate"), // In hundredths

  // Class-wise breakdown
  classWiseData: text("class_wise_data", { mode: "json" }).$type<Array<{
    class: number;
    section: string;
    totalStudents: number;
    averageAttendance: number;
    chronicAbsentees: number;
  }>>(),

  // Chronic absentees (>30 days absent)
  chronicAbsentees: text("chronic_absentees", { mode: "json" }).$type<Array<{
    studentId: string;
    studentName: string;
    class: number;
    section: string;
    totalAbsent: number;
    attendanceRate: number;
  }>>(),

  // Reasons for absence
  absenceReasons: text("absence_reasons", { mode: "json" }).$type<Array<{
    reason: string;
    count: number;
    percentage: number;
  }>>(),

  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// ============================================================================
// STUDENT PERFORMANCE REPORTS
// ============================================================================

/**
 * Student academic performance reports
 */
export const studentPerformanceReports = sqliteTable("student_performance_reports", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").notNull(),
  reportId: text("report_id").notNull(),

  // Period
  academicYear: text("academic_year").notNull(),
  examType: text("exam_type").notNull(), // "mid_term", "final", "bcse"

  // Overall performance
  totalStudents: integer("total_students").notNull(),
  totalAppeared: integer("total_appeared"),
  overallPassPercentage: integer("overall_pass_percentage"),
  overallDistinctionPercentage: integer("overall_distinction_percentage"),

  // Division breakdown
  firstDivisionCount: integer("first_division_count"),
  secondDivisionCount: integer("second_division_count"),
  thirdDivisionCount: integer("third_division_count"),
  failedCount: integer("failed_count"),

  // Subject-wise performance
  subjectPerformance: text("subject_performance", { mode: "json" }).$type<Array<{
    subject: string;
    totalAppeared: number;
    totalPassed: number;
    passPercentage: number;
    averageMarks: number;
    highestMarks: number;
    lowestMarks: number;
  }>>(),

  // Class-wise performance
  classPerformance: text("class_performance", { mode: "json" }).$type<Array<{
    class: number;
    section: string;
    totalStudents: number;
    passPercentage: number;
    averageMarks: number;
    distinctions: number;
  }>>(),

  // Top performers
  topPerformers: text("top_performers", { mode: "json" }).$type<Array<{
    studentId: string;
    studentName: string;
    class: number;
    section: string;
    percentage: number;
    rank: number;
  }>>(),

  // Comparison with previous year
  yearComparison: text("year_comparison", { mode: "json" }).$type<{
    previousYearPassPercentage: number;
    currentYearPassPercentage: number;
    change: number;
  }>(),

  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// ============================================================================
// INFRASTRUCTURE REPORTS
// ============================================================================

/**
 * School infrastructure and facility reports
 */
export const infrastructureReports = sqliteTable("infrastructure_reports", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").notNull(),
  reportId: text("report_id").notNull(),

  // General
  reportingDate: text("reporting_date").notNull(),
  academicYear: text("academic_year").notNull(),

  // Land and building
  totalLandArea: integer("total_land_area"), // Square feet
  totalBuildingArea: integer("total_building_area"),
  totalClassrooms: integer("total_classrooms"),
  totalOtherRooms: integer("total_other_rooms"),

  // Room details
  roomBreakdown: text("room_breakdown", { mode: "json" }).$type<Array<{
    roomType: string;
    count: number;
    totalArea: number;
    condition: string;
  }>>(),

  // Facilities
  hasLibrary: integer("has_library", { mode: "boolean" }),
  libraryArea: integer("library_area"),
  hasScienceLab: integer("has_science_lab", { mode: "boolean" }),
  hasComputerLab: integer("has_computer_lab", { mode: "boolean" }),
  computerCount: integer("computer_count"),
  hasPlayground: integer("has_playground", { mode: "boolean" }),
  playgroundArea: integer("playground_area"),

  // Utilities
  drinkingWaterSource: text("drinking_water_source"),
  hasElectricity: integer("has_electricity", { mode: "boolean" }),
  hasInternet: integer("has_internet", { mode: "boolean" }),
  internetSpeed: text("internet_speed"),
  hasToilets: integer("has_toilets", { mode: "boolean" }),
  toiletDetails: text("toilet_details", { mode: "json" }).$type<{
    male: number;
    female: number;
    staff: number;
    functional: number;
  }>(),

  // Safety
  hasFireSafety: integer("has_fire_safety", { mode: "boolean" }),
  hasFirstAid: integer("has_first_aid", { mode: "boolean" }),
  hasBoundaryWall: integer("has_boundary_wall", { mode: "boolean" }),

  // Furniture and equipment
  studentFurnitureCount: integer("student_furniture_count"),
  teacherFurnitureCount: integer("teacher_furniture_count"),
  computerCount: integer("computer_count"),
  projectorCount: integer("projector_count"),

  // Condition assessment
  buildingCondition: text("building_condition"), // "excellent", "good", "fair", "poor"
  maintenanceRequired: text("maintenance_required", { mode: "json" }).$type<Array<{
    item: string;
    issue: string;
    priority: string;
    estimatedCost: number;
  }>>(),

  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// ============================================================================
// STAFF REPORTS
// ============================================================================

/**
 * Teacher and staff reports
 */
export const staffReports = sqliteTable("staff_reports", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").notNull(),
  reportId: text("report_id").notNull(),

  // Period
  academicYear: text("academic_year").notNull(),
  reportingDate: text("reporting_date").notNull(),

  // Summary
  totalStaff: integer("total_staff").notNull(),
  totalTeachers: integer("total_teachers"),
  totalNonTeachingStaff: integer("total_non_teaching_staff"),

  // Teaching staff
  teachingStaffBreakdown: text("teaching_staff_breakdown", { mode: "json" }).$type<Array<{
    level: string; // "PP", "primary", "lower_secondary", "higher_secondary"
    male: number;
    female: number;
    total: number;
    trained: number;
    untrained: number;
  }>>(),

  // Qualifications
  qualificationBreakdown: text("qualification_breakdown", { mode: "json" }).$type<Array<{
    qualification: string;
    count: number;
    percentage: number;
  }>>(),

  // Subject-wise teachers
  subjectTeachers: text("subject_teachers", { mode: "json" }).$type<Array<{
    subject: string;
    teachersCount: number;
    qualifiedCount: number;
  }>>(),

  // Experience
  experienceBreakdown: text("experience_breakdown", { mode: "json" }).$type<Array<{
    experienceRange: string; // "0-5", "5-10", "10-15", "15+"
    count: number;
  }>>(),

  // Recruitment
  newRecruits: integer("new_recruits"),
  resigned: integer("resigned"),
  retired: integer("retired"),
  transferred: integer("transferred"),

  // Vacancies
  totalVacancies: integer("total_vacancies"),
  vacancyDetails: text("vacancy_details", { mode: "json" }).$type<Array<{
    subject: string;
    level: string;
    vacancies: number;
  }>>(),

  // Training
  trainingConducted: text("training_conducted", { mode: "json" }).$type<Array<{
    programName: string;
    participants: number;
    duration: string;
  }>>(),

  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// ============================================================================
// FINANCIAL REPORTS
// ============================================================================

/**
 * School financial reports for government
 */
export const financialReports = sqliteTable("financial_reports", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").notNull(),
  reportId: text("report_id").notNull(),

  // Period
  financialYear: text("financial_year").notNull(),
  reportingDate: text("reporting_date").notNull(),

  // Income
  governmentGrant: integer("government_grant"),
  schoolFees: integer("school_fees"),
  otherIncome: integer("other_income"),
  totalIncome: integer("total_income"),

  // Expenditure
  salaries: integer("salaries"),
  utilities: integer("utilities"),
  maintenance: integer("maintenance"),
  supplies: integer("supplies"),
  capitalExpenditure: integer("capital_expenditure"),
  otherExpenditure: integer("other_expenditure"),
  totalExpenditure: integer("total_expenditure"),

  // Balance
  openingBalance: integer("opening_balance"),
  closingBalance: integer("closing_balance"),
  surplusDeficit: integer("surplus_deficit"),

  // Grants
  grantDetails: text("grant_details", { mode: "json" }).$type<Array<{
    grantType: string;
    amountReceived: number;
    amountUtilized: number;
    balance: number;
  }>>(),

  // Audit
  audited: integer("audited", { mode: "boolean" }),
  auditDate: text("audit_date"),
  auditorName: text("auditor_name"),
  auditObservations: text("audit_observations"),

  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// ============================================================================
// DEMOGRAPHIC REPORTS
// ============================================================================

/**
 * Student demographic reports
 */
export const demographicReports = sqliteTable("demographic_reports", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").notNull(),
  reportId: text("report_id").notNull(),

  // Period
  academicYear: text("academic_year").notNull(),
  asOfDate: text("as_of_date").notNull(),

  // Total enrollment
  totalEnrollment: integer("total_enrollment").notNull(),
  newEnrollment: integer("new_enrollment"),

  // Gender breakdown
  genderBreakdown: text("gender_breakdown", { mode: "json" }).$type<{
    male: number;
    female: number;
    other: number;
    malePercentage: number;
    femalePercentage: number;
  }>(),

  // Dzongkhag breakdown
  dzongkhagBreakdown: text("dzongkhag_breakdown", { mode: "json" }).$type<Array<{
    dzongkhag: string;
    count: number;
    percentage: number;
  }>>(),

  // Age distribution
  ageDistribution: text("age_distribution", { mode: "json" }).$type<Array<{
    ageGroup: string;
    count: number;
  }>>(),

  // Special needs
  specialNeedsStudents: integer("special_needs_students"),
  specialNeedsBreakdown: text("special_needs_breakdown", { mode: "json" }).$type<Array<{
    disabilityType: string;
    count: number;
  }>>(),

  // ECCD (Early Childhood Care and Development)
  eccdEnrollment: integer("eccd_enrollment"),

  // Dropout data
  dropoutData: text("dropout_data", { mode: "json" }).$type<Array<{
    class: number;
    dropoutCount: number;
    reasons: string[];
  }>>(),

  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type ReportTemplate = typeof reportTemplates.$inferSelect;
export type GeneratedReport = typeof generatedReports.$inferSelect;
export type ReportSchedule = typeof reportSchedules.$inferSelect;
export type StudentAttendanceReport = typeof studentAttendanceReports.$inferSelect;
export type StudentPerformanceReport = typeof studentPerformanceReports.$inferSelect;
export type InfrastructureReport = typeof infrastructureReports.$inferSelect;
export type StaffReport = typeof staffReports.$inferSelect;
export type FinancialReport = typeof financialReports.$inferSelect;
export type DemographicReport = typeof demographicReports.$inferSelect;
