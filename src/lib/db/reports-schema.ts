/**
 * Government Reports Database Schema
 * Handles generation and submission of reports to Bhutan government agencies
 */

import { pgTable, text, integer, boolean, timestamp, pgEnum , json} from "drizzle-orm/pg-core";

// ============================================================================
// REPORT TEMPLATES
// ============================================================================

/**
 * Pre-defined report templates for government submissions
 */
export const reportTemplates = pgTable("report_templates", {
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
  dataFields: json("data_fields").$type<Array<{
    field: string;
    label: string;
    type: string;
    required: boolean;
    source: string; // "students", "teachers", "exams", etc.
  }>>(),

  // Format
  format: text("format").notNull(), // "pdf", "excel", "xml", "json", "online_form"
  templateStructure: json("template_structure").$type<Record<string, any>>(),

  // Validation
  validationRules: json("validation_rules").$type<Array<{
    field: string;
    rule: string;
    message: string;
  }>>(),

  // Status
  isActive: boolean("is_active").default(true),
  version: text("version").default("1.0"),
  effectiveFrom: text("effective_from"),
  effectiveUntil: text("effective_until"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

// ============================================================================
// GENERATED REPORTS
// ============================================================================

/**
 * Generated government reports
 */
export const generatedReports = pgTable("generated_reports", {
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
  reportData: json("report_data").$type<Record<string, any>>(),
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
  clarificationRequired: json("clarification_required").$type<Array<{
    section: string;
    issue: string;
    clarificationNeeded: string;
  }>>(),

  // Files
  reportFileUrl: text("report_file_url"), // Generated report file
  supportingDocuments: json("supporting_documents").$type<Array<{
    name: string;
    url: string;
    type: string;
  }>>(),

  // Revisions
  isRevision: boolean("is_revision").default(false),
  parentReportId: text("parent_report_id"),
  revisionNumber: integer("revision_number").default(0),
  revisionReason: text("revision_reason"),

  // Metadata
  agency: text("agency").notNull(),
  reportType: text("report_type").notNull(),
  frequency: text("frequency").notNull(),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

// ============================================================================
// REPORT SCHEDULES
// ============================================================================

/**
 * Automated report generation schedules
 */
export const reportSchedules = pgTable("report_schedules", {
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
  autoGenerate: boolean("auto_generate").default(false),
  autoSubmit: boolean("auto_submit").default(false),

  // Notification
  notifyBeforeDays: integer("notify_before_days"),
  notifyEmails: json("notify_emails").$type<string[]>(),

  // Status
  isActive: boolean("is_active").default(true),
  lastGeneratedDate: text("last_generated_date"),
  nextDueDate: text("next_due_date"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

// ============================================================================
// STUDENT ATTENDANCE REPORTS
// ============================================================================

/**
 * Student attendance reports for government
 */
export const studentAttendanceReports = pgTable("student_attendance_reports", {
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
  classWiseData: json("class_wise_data").$type<Array<{
    class: number;
    section: string;
    totalStudents: number;
    averageAttendance: number;
    chronicAbsentees: number;
  }>>(),

  // Chronic absentees (>30 days absent)
  chronicAbsentees: json("chronic_absentees").$type<Array<{
    studentId: string;
    studentName: string;
    class: number;
    section: string;
    totalAbsent: number;
    attendanceRate: number;
  }>>(),

  // Reasons for absence
  absenceReasons: json("absence_reasons").$type<Array<{
    reason: string;
    count: number;
    percentage: number;
  }>>(),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
});

// ============================================================================
// STUDENT PERFORMANCE REPORTS
// ============================================================================

/**
 * Student academic performance reports
 */
export const studentPerformanceReports = pgTable("student_performance_reports", {
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
  subjectPerformance: json("subject_performance").$type<Array<{
    subject: string;
    totalAppeared: number;
    totalPassed: number;
    passPercentage: number;
    averageMarks: number;
    highestMarks: number;
    lowestMarks: number;
  }>>(),

  // Class-wise performance
  classPerformance: json("class_performance").$type<Array<{
    class: number;
    section: string;
    totalStudents: number;
    passPercentage: number;
    averageMarks: number;
    distinctions: number;
  }>>(),

  // Top performers
  topPerformers: json("top_performers").$type<Array<{
    studentId: string;
    studentName: string;
    class: number;
    section: string;
    percentage: number;
    rank: number;
  }>>(),

  // Comparison with previous year
  yearComparison: json("year_comparison").$type<{
    previousYearPassPercentage: number;
    currentYearPassPercentage: number;
    change: number;
  }>(),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
});

// ============================================================================
// INFRASTRUCTURE REPORTS
// ============================================================================

/**
 * School infrastructure and facility reports
 */
export const infrastructureReports = pgTable("infrastructure_reports", {
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
  roomBreakdown: json("room_breakdown").$type<Array<{
    roomType: string;
    count: number;
    totalArea: number;
    condition: string;
  }>>(),

  // Facilities
  hasLibrary: boolean("has_library"),
  libraryArea: integer("library_area"),
  hasScienceLab: boolean("has_science_lab"),
  hasComputerLab: boolean("has_computer_lab"),
  computerCount: integer("computer_count"),
  hasPlayground: boolean("has_playground"),
  playgroundArea: integer("playground_area"),

  // Utilities
  drinkingWaterSource: text("drinking_water_source"),
  hasElectricity: boolean("has_electricity"),
  hasInternet: boolean("has_internet"),
  internetSpeed: text("internet_speed"),
  hasToilets: boolean("has_toilets"),
  toiletDetails: json("toilet_details").$type<{
    male: number;
    female: number;
    staff: number;
    functional: number;
  }>(),

  // Safety
  hasFireSafety: boolean("has_fire_safety"),
  hasFirstAid: boolean("has_first_aid"),
  hasBoundaryWall: boolean("has_boundary_wall"),

  // Furniture and equipment
  studentFurnitureCount: integer("student_furniture_count"),
  teacherFurnitureCount: integer("teacher_furniture_count"),
  projectorCount: integer("projector_count"),

  // Condition assessment
  buildingCondition: text("building_condition"), // "excellent", "good", "fair", "poor"
  maintenanceRequired: json("maintenance_required").$type<Array<{
    item: string;
    issue: string;
    priority: string;
    estimatedCost: number;
  }>>(),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
});

// ============================================================================
// STAFF REPORTS
// ============================================================================

/**
 * Teacher and staff reports
 */
export const staffReports = pgTable("staff_reports", {
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
  teachingStaffBreakdown: json("teaching_staff_breakdown").$type<Array<{
    level: string; // "PP", "primary", "lower_secondary", "higher_secondary"
    male: number;
    female: number;
    total: number;
    trained: number;
    untrained: number;
  }>>(),

  // Qualifications
  qualificationBreakdown: json("qualification_breakdown").$type<Array<{
    qualification: string;
    count: number;
    percentage: number;
  }>>(),

  // Subject-wise teachers
  subjectTeachers: json("subject_teachers").$type<Array<{
    subject: string;
    teachersCount: number;
    qualifiedCount: number;
  }>>(),

  // Experience
  experienceBreakdown: json("experience_breakdown").$type<Array<{
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
  vacancyDetails: json("vacancy_details").$type<Array<{
    subject: string;
    level: string;
    vacancies: number;
  }>>(),

  // Training
  trainingConducted: json("training_conducted").$type<Array<{
    programName: string;
    participants: number;
    duration: string;
  }>>(),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
});

// ============================================================================
// FINANCIAL REPORTS
// ============================================================================

/**
 * School financial reports for government
 */
export const financialReports = pgTable("financial_reports", {
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
  grantDetails: json("grant_details").$type<Array<{
    grantType: string;
    amountReceived: number;
    amountUtilized: number;
    balance: number;
  }>>(),

  // Audit
  audited: boolean("audited"),
  auditDate: text("audit_date"),
  auditorName: text("auditor_name"),
  auditObservations: text("audit_observations"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
});

// ============================================================================
// DEMOGRAPHIC REPORTS
// ============================================================================

/**
 * Student demographic reports
 */
export const demographicReports = pgTable("demographic_reports", {
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
  genderBreakdown: json("gender_breakdown").$type<{
    male: number;
    female: number;
    other: number;
    malePercentage: number;
    femalePercentage: number;
  }>(),

  // Dzongkhag breakdown
  dzongkhagBreakdown: json("dzongkhag_breakdown").$type<Array<{
    dzongkhag: string;
    count: number;
    percentage: number;
  }>>(),

  // Age distribution
  ageDistribution: json("age_distribution").$type<Array<{
    ageGroup: string;
    count: number;
  }>>(),

  // Special needs
  specialNeedsStudents: integer("special_needs_students"),
  specialNeedsBreakdown: json("special_needs_breakdown").$type<Array<{
    disabilityType: string;
    count: number;
  }>>(),

  // ECCD (Early Childhood Care and Development)
  eccdEnrollment: integer("eccd_enrollment"),

  // Dropout data
  dropoutData: json("dropout_data").$type<Array<{
    class: number;
    dropoutCount: number;
    reasons: string[];
  }>>(),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
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
