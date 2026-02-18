/**
 * Payroll and Salary Management Database Schema
 * Handles teacher salary structures, allowances, deductions, and payroll processing
 * Supports monthly payroll generation and payslip creation
 */

import { pgTable, text, integer, boolean, timestamp, json, index } from "drizzle-orm/pg-core";
import { users } from "./schema";
import { schools } from "./schema";

// ============================================================================
// ALLOWANCE TYPES TABLE
// ============================================================================

/**
 * Predefined allowance types (DA, HRA, TA, etc.)
 * Schools can customize allowance percentages
 */
export const allowanceTypes = pgTable("allowance_types", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").references(() => schools.id, { onDelete: "cascade" }),

  // Allowance details
  code: text("code").notNull(), // "DA" | "HRA" | "TA" | "MA" | "OA"
  name: text("name").notNull(), // "Dearness Allowance" | "House Rent Allowance"
  nameDzongkha: text("name_dzongkha"), // Dzongkha translation
  description: text("description"),

  // Calculation type
  calculationType: text("calculation_type").notNull(), // "percentage" | "fixed" | "tiered"
  percentage: integer("percentage"), // For percentage-based (e.g., DA = 50% of basic)
  fixedAmount: integer("fixed_amount"), // For fixed amount (in cents)

  // Tiered calculation (for advanced allowances)
  tiers: json("tiers").$type<Array<{
    minSalary: number;
    maxSalary: number;
    amount: number;
    percentage?: number;
  }>>(),

  // Taxability
  isTaxable: boolean("is_taxable").default(true),
  isFullyTaxable: boolean("is_fully_taxable").default(false),
  taxableLimit: integer("taxable_limit"), // Amount limit before tax applies

  // Conditions
  requiresMetroCity: boolean("requires_metro_city").default(false), // e.g., HRA
  isOptional: boolean("is_optional").default(false), // Employee can opt-out
  isActive: boolean("is_active").default(true),

  // Display order
  displayOrder: integer("display_order").default(0),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
}, (table) => ({
  schoolIdx: index("idx_allowance_types_school").on(table.schoolId),
  codeIdx: index("idx_allowance_types_code").on(table.code),
}));

// ============================================================================
// DEDUCTION TYPES TABLE
// ============================================================================

/**
 * Predefined deduction types (PF, Tax, Insurance, etc.)
 * Schools can configure deduction rules
 */
export const deductionTypes = pgTable("deduction_types", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").references(() => schools.id, { onDelete: "cascade" }),

  // Deduction details
  code: text("code").notNull(), // "PF" | "TAX" | "INS" | "LOAN" | "OTHER"
  name: text("name").notNull(), // "Provident Fund" | "Income Tax"
  nameDzongkha: text("name_dzongkha"),
  description: text("description"),

  // Calculation type
  calculationType: text("calculation_type").notNull(), // "percentage" | "fixed" | "tiered" | "slab"
  percentage: integer("percentage"), // For percentage-based
  fixedAmount: integer("fixed_amount"), // For fixed amount

  // Employer contribution (for PF, etc.)
  employerContributionType: text("employer_contribution_type"), // "percentage" | "fixed" | "same_as_employee"
  employerContributionPercentage: integer("employer_contribution_percentage"),
  employerContributionFixedAmount: integer("employer_contribution_fixed_amount"),

  // Tax slab (for income tax)
  taxSlabs: json("tax_slabs").$type<Array<{
    minIncome: number;
    maxIncome: number;
    rate: number;
  }>>(),

  // Conditions
  isMandatory: boolean("is_mandatory").default(true),
  isOptional: boolean("is_optional").default(false),
  minSalaryThreshold: integer("min_salary_threshold"), // Only apply above this salary
  maxSalaryThreshold: integer("max_salary_threshold"),

  // Display
  isActive: boolean("is_active").default(true),
  displayOrder: integer("display_order").default(0),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
}, (table) => ({
  schoolIdx: index("idx_deduction_types_school").on(table.schoolId),
  codeIdx: index("idx_deduction_types_code").on(table.code),
}));

// ============================================================================
// SALARY STRUCTURES TABLE
// ============================================================================

/**
 * Salary structure templates for different teacher categories
 * e.g., "PGT", "TGT", "PRT", "Principal", "Vice Principal"
 */
export const salaryStructures = pgTable("salary_structures", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").notNull().references(() => schools.id, { onDelete: "cascade" }),

  // Structure details
  name: text("name").notNull(), // e.g., "PGT - Post Graduate Teacher"
  code: text("code").notNull().unique(), // e.g., "PGT", "TGT", "PRT"
  category: text("category").notNull(), // "teaching" | "non-teaching" | "administrative"
  level: text("level"), // "primary" | "middle" | "secondary" | "higher_secondary"

  // Salary components (in cents, e.g., 250000 = BTN 2,500.00)
  basicSalary: integer("basic_salary").notNull(),

  // Grade pay (for government schools)
  gradePay: integer("grade_pay").default(0),

  // Allowances (can be overridden per employee)
  allowances: json("allowances").$type<Array<{
    allowanceTypeId: string;
    amount: number; // in cents
    percentage?: number;
    isPercentage: boolean;
  }>>(),

  // Deductions (can be overridden per employee)
  deductions: json("deductions").$type<Array<{
    deductionTypeId: string;
    amount: number; // in cents
    percentage?: number;
    isPercentage: boolean;
  }>>(),

  // Eligibility
  minQualification: text("min_qualification"), // e.g., "Post Graduate", "Graduate"
  minExperience: integer("min_experience").default(0), // in years

  // Increment policy
  annualIncrement: integer("annual_increment").default(0), // Annual increment in cents
  incrementType: text("increment_type").default("fixed"), // "fixed" | "percentage"

  // Status
  isActive: boolean("is_active").default(true),
  isDefault: boolean("is_default").default(false),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
}, (table) => ({
  schoolIdx: index("idx_salary_structures_school").on(table.schoolId),
  codeIdx: index("idx_salary_structures_code").on(table.code),
  categoryIdx: index("idx_salary_structures_category").on(table.category),
}));

// ============================================================================
// EMPLOYEE SALARY TABLE
// ============================================================================

/**
 * Individual employee salary assignment
 * Links teachers to salary structures with customizations
 */
export const employeeSalaries = pgTable("employee_salaries", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").notNull().references(() => schools.id, { onDelete: "cascade" }),
  employeeId: text("employee_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  salaryStructureId: text("salary_structure_id").references(() => salaryStructures.id),

  // Effective period
  effectiveFrom: timestamp("effective_from", { withTimezone: true }).notNull(),
  effectiveTo: timestamp("effective_to", { withTimezone: true }),

  // Base salary (can override structure)
  basicSalary: integer("basic_salary").notNull(), // in cents
  gradePay: integer("grade_pay").default(0),

  // Custom allowances (overrides structure)
  customAllowances: json("custom_allowances").$type<Array<{
    allowanceTypeId: string;
    amount: number; // in cents
    isPercentage: boolean;
    isApplicable: boolean;
  }>>(),

  // Custom deductions (overrides structure)
  customDeductions: json("custom_deductions").$type<Array<{
    deductionTypeId: string;
    amount: number; // in cents
    isPercentage: boolean;
    isApplicable: boolean;
  }>>(),

  // Additional fixed components
  additionalAllowances: json("additional_allowances").$type<Array<{
    name: string;
    amount: number;
    recurring: boolean;
  }>>(),

  additionalDeductions: json("additional_deductions").$type<Array<{
    name: string;
    amount: number;
    recurring: boolean;
  }>>(),

  // Payment details
  bankName: text("bank_name"),
  bankAccountNumber: text("bank_account_number"),
  bankAccountType: text("bank_account_type"), // "savings" | "current"
  ifscCode: text("ifsc_code"),
  bankBranch: text("bank_branch"),

  // Status
  status: text("status").notNull().default("active"), // "active" | "inactive" | "on_hold"
  notes: text("notes"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
}, (table) => ({
  schoolIdx: index("idx_employee_salaries_school").on(table.schoolId),
  employeeIdx: index("idx_employee_salaries_employee").on(table.employeeId),
  structureIdx: index("idx_employee_salaries_structure").on(table.salaryStructureId),
  statusIdx: index("idx_employee_salaries_status").on(table.status),
  effectivePeriodIdx: index("idx_employee_salaries_period").on(table.effectiveFrom, table.effectiveTo),
}));

// ============================================================================
// ATTENDANCE FOR PAYROLL TABLE
// ============================================================================

/**
 * Monthly attendance records for payroll calculation
 * Tracks present days, leaves, and loss of pay
 */
export const payrollAttendance = pgTable("payroll_attendance", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").notNull().references(() => schools.id, { onDelete: "cascade" }),
  employeeId: text("employee_id").notNull().references(() => users.id, { onDelete: "cascade" }),

  // Period
  month: integer("month").notNull(), // 1-12
  year: integer("year").notNull(),

  // Attendance details
  totalWorkingDays: integer("total_working_days").notNull(),
  daysPresent: integer("days_present").notNull(),
  daysAbsent: integer("days_absent").notNull().default(0),
  daysPaidLeave: integer("days_paid_leave").notNull().default(0),
  daysUnpaidLeave: integer("days_unpaid_leave").notNull().default(0),
  daysHoliday: integer("days_holiday").notNull().default(0),

  // Overtime
  overtimeHours: integer("overtime_hours").default(0),
  overtimeAmount: integer("overtime_amount").default(0), // in cents

  // Loss of pay calculation
  lossOfPayDays: integer("loss_of_pay_days").default(0),
  lossOfPayAmount: integer("loss_of_pay_amount").default(0), // in cents

  // Attendance verification
  verifiedBy: text("verified_by").references(() => users.id),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  isLocked: boolean("is_locked").default(false), // Prevents further modifications

  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
}, (table) => ({
  schoolIdx: index("idx_payroll_attendance_school").on(table.schoolId),
  employeeIdx: index("idx_payroll_attendance_employee").on(table.employeeId),
  periodIdx: index("idx_payroll_attendance_period").on(table.month, table.year),
  uniquePeriod: index("idx_payroll_attendance_unique").on(table.employeeId, table.month, table.year),
}));

// ============================================================================
// PAYROLL RECORDS TABLE
// ============================================================================

/**
 * Main payroll records - generated monthly for each employee
 * Contains complete salary breakdown for a specific month
 */
export const payrollRecords = pgTable("payroll_records", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").notNull().references(() => schools.id, { onDelete: "cascade" }),
  employeeId: text("employee_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  attendanceId: text("attendance_id").references(() => payrollAttendance.id),

  // Payroll period
  payrollMonth: integer("payroll_month").notNull(), // 1-12
  payrollYear: integer("payroll_year").notNull(),
  payrollRunId: text("payroll_run_id"), // Links to payroll batch run

  // Employee details snapshot
  employeeName: text("employee_name").notNull(),
  employeeCode: text("employee_code"), // Employee ID
  designation: text("designation"),
  department: text("department"),

  // EARNINGS
  // Basic salary
  basicSalary: integer("basic_salary").notNull(), // in cents
  gradePay: integer("grade_pay").default(0), // in cents

  // Gross earnings before deductions
  grossEarnings: integer("gross_earnings").notNull(), // in cents

  // Allowances breakdown
  allowances: json("allowances").$type<Array<{
    allowanceTypeId: string;
    allowanceCode: string;
    allowanceName: string;
    amount: number; // in cents
    isPercentage: boolean;
    percentage?: number;
  }>>(),

  totalAllowances: integer("total_allowances").notNull().default(0), // in cents

  // Leave encashment
  leaveEncashmentAmount: integer("leave_encashment_amount").default(0), // in cents
  leaveEncashmentDays: integer("leave_encashment_days").default(0),

  // Bonus/Arrears
  bonus: integer("bonus").default(0), // in cents
  arrears: integer("arrears").default(0), // in cents
  otherEarnings: integer("other_earnings").default(0), // in cents

  // Total Earnings
  totalEarnings: integer("total_earnings").notNull(), // in cents

  // DEDUCTIONS
  deductions: json("deductions").$type<Array<{
    deductionTypeId: string;
    deductionCode: string;
    deductionName: string;
    amount: number; // in cents
    isPercentage: boolean;
    percentage?: number;
    employeeShare: number;
    employerShare?: number;
  }>>(),

  totalDeductions: integer("total_deductions").notNull().default(0), // in cents

  // Specific deductions
  pfDeduction: integer("pf_deduction").default(0), // Provident Fund
  taxDeduction: integer("tax_deduction").default(0), // Income Tax
  insuranceDeduction: integer("insurance_deduction").default(0), // Insurance
  loanDeduction: integer("loan_deduction").default(0), // Loan repayment
  otherDeductions: integer("other_deductions").default(0), // Other deductions

  // NET PAY
  netPay: integer("net_pay").notNull(), // in cents (Total Earnings - Total Deductions)

  // Payment details
  paymentMethod: text("payment_method"), // "bank_transfer" | "cash" | "cheque"
  paymentStatus: text("payment_status").notNull().default("pending"), // "pending" | "processing" | "paid" | "failed"
  paidAt: timestamp("paid_at", { withTimezone: true }),
  transactionId: text("transaction_id"),

  // Bank details snapshot
  bankName: text("bank_name"),
  bankAccountNumber: text("bank_account_number"),
  bankAccountType: text("bank_account_type"),
  ifscCode: text("ifsc_code"),

  // Payslip
  payslipGenerated: boolean("payslip_generated").default(false),
  payslipUrl: text("payslip_url"),
  payslipPassword: text("payslip_password"), // For PDF protection

  // Verification
  verifiedBy: text("verified_by").references(() => users.id),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  isLocked: boolean("is_locked").default(false), // Prevents modifications after verification

  // Notes
  notes: text("notes"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
}, (table) => ({
  schoolIdx: index("idx_payroll_records_school").on(table.schoolId),
  employeeIdx: index("idx_payroll_records_employee").on(table.employeeId),
  periodIdx: index("idx_payroll_records_period").on(table.payrollMonth, table.payrollYear),
  runIdIdx: index("idx_payroll_records_run_id").on(table.payrollRunId),
  statusIdx: index("idx_payroll_records_status").on(table.paymentStatus),
  uniquePeriod: index("idx_payroll_records_unique").on(table.employeeId, table.payrollMonth, table.payrollYear),
}));

// ============================================================================
// PAYROLL RUNS TABLE
// ============================================================================

/**
 * Payroll batch runs - tracks monthly payroll processing
 * One record per month per school
 */
export const payrollRuns = pgTable("payroll_runs", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").notNull().references(() => schools.id, { onDelete: "cascade" }),

  // Payroll period
  month: integer("month").notNull(), // 1-12
  year: integer("year").notNull(),

  // Run details
  runType: text("run_type").notNull().default("monthly"), // "monthly" | "supplementary" | "bonus"
  runNumber: integer("run_number").default(1), // For supplementary runs

  // Status
  status: text("status").notNull().default("draft"), // "draft" | "processing" | "completed" | "failed"

  // Statistics
  totalEmployees: integer("total_employees").default(0),
  processedEmployees: integer("processed_employees").default(0),
  failedEmployees: integer("failed_employees").default(0),

  // Financial summary (in cents)
  totalBasicSalary: integer("total_basic_salary").default(0),
  totalAllowances: integer("total_allowances").default(0),
  totalDeductions: integer("total_deductions").default(0),
  totalNetPay: integer("total_net_pay").default(0),
  totalEmployerContributions: integer("total_employer_contributions").default(0),

  // Processing
  initiatedBy: text("initiated_by").references(() => users.id),
  initiatedAt: timestamp("initiated_at", { withTimezone: true }).notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  processingTime: integer("processing_time"), // Processing time in seconds

  // Payment
  paymentBatchId: text("payment_batch_id"), // For bank transfers
  paymentStatus: text("payment_status").default("pending"), // "pending" | "initiated" | "completed" | "failed"

  // Errors
  errors: json("errors").$type<Array<{
    employeeId: string;
    employeeName: string;
    error: string;
  }>>(),

  // Notes
  notes: text("notes"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
}, (table) => ({
  schoolIdx: index("idx_payroll_runs_school").on(table.schoolId),
  periodIdx: index("idx_payroll_runs_period").on(table.month, table.year),
  statusIdx: index("idx_payroll_runs_status").on(table.status),
  uniquePeriod: index("idx_payroll_runs_unique").on(table.schoolId, table.month, table.year, table.runNumber),
}));

// ============================================================================
// LEAVE ENCASHMENT TABLE
// ============================================================================

/**
 * Leave encashment records
 * Teachers can encash unused leave days
 */
export const leaveEncashment = pgTable("leave_encashment", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").notNull().references(() => schools.id, { onDelete: "cascade" }),
  employeeId: text("employee_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  payrollRecordId: text("payroll_record_id").references(() => payrollRecords.id),

  // Leave details
  leaveType: text("leave_type").notNull(), // "earned_leave" | "casual_leave" | "sick_leave"
  daysEncashed: integer("days_encashed").notNull(),
  encashmentRate: integer("encashment_rate").notNull(), // Daily rate in cents

  // Financials
  amount: integer("amount").notNull(), // in cents
  taxDeducted: integer("tax_deducted").default(0), // in cents
  netAmount: integer("net_amount").notNull(), // in cents

  // Approval
  requestedAt: timestamp("requested_at", { withTimezone: true }).notNull(),
  approvedBy: text("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  status: text("status").notNull().default("pending"), // "pending" | "approved" | "rejected" | "processed"

  // Period for which leave is being encashed
  forYear: integer("for_year").notNull(),

  notes: text("notes"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
}, (table) => ({
  schoolIdx: index("idx_leave_encashment_school").on(table.schoolId),
  employeeIdx: index("idx_leave_encashment_employee").on(table.employeeId),
  statusIdx: index("idx_leave_encashment_status").on(table.status),
  yearIdx: index("idx_leave_encashment_year").on(table.forYear),
}));

// ============================================================================
// SALARY REVISIONS TABLE
// ============================================================================

/**
 * Employee salary revision history
 * Tracks promotions, increments, and other salary changes
 */
export const salaryRevisions = pgTable("salary_revisions", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").notNull().references(() => schools.id, { onDelete: "cascade" }),
  employeeId: text("employee_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  employeeSalaryId: text("employee_salary_id").references(() => employeeSalaries.id),

  // Revision details
  revisionType: text("revision_type").notNull(), // "increment" | "promotion" | "demotion" | "correction" | "revision"
  reason: text("reason").notNull(),

  // Salary changes
  oldBasicSalary: integer("old_basic_salary").notNull(),
  newBasicSalary: integer("new_basic_salary").notNull(),
  oldGradePay: integer("old_grade_pay").default(0),
  newGradePay: integer("new_grade_pay").default(0),

  // Effective date
  effectiveFrom: timestamp("effective_from", { withTimezone: true }).notNull(),

  // Approval
  approvedBy: text("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  status: text("status").notNull().default("pending"), // "pending" | "approved" | "rejected" | "implemented"

  // Reference
  referenceNumber: text("reference_number"), // HR reference or order number
  documentUrl: text("document_url"), // Supporting document

  notes: text("notes"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
}, (table) => ({
  schoolIdx: index("idx_salary_revisions_school").on(table.schoolId),
  employeeIdx: index("idx_salary_revisions_employee").on(table.employeeId),
  statusIdx: index("idx_salary_revisions_status").on(table.status),
  effectiveIdx: index("idx_salary_revisions_effective").on(table.effectiveFrom),
}));

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type AllowanceType = typeof allowanceTypes.$inferSelect;
export type NewAllowanceType = typeof allowanceTypes.$inferInsert;

export type DeductionType = typeof deductionTypes.$inferSelect;
export type NewDeductionType = typeof deductionTypes.$inferInsert;

export type SalaryStructure = typeof salaryStructures.$inferSelect;
export type NewSalaryStructure = typeof salaryStructures.$inferInsert;

export type EmployeeSalary = typeof employeeSalaries.$inferSelect;
export type NewEmployeeSalary = typeof employeeSalaries.$inferInsert;

export type PayrollAttendance = typeof payrollAttendance.$inferSelect;
export type NewPayrollAttendance = typeof payrollAttendance.$inferInsert;

export type PayrollRecord = typeof payrollRecords.$inferSelect;
export type NewPayrollRecord = typeof payrollRecords.$inferInsert;

export type PayrollRun = typeof payrollRuns.$inferSelect;
export type NewPayrollRun = typeof payrollRuns.$inferInsert;

export type LeaveEncashment = typeof leaveEncashment.$inferSelect;
export type NewLeaveEncashment = typeof leaveEncashment.$inferInsert;

export type SalaryRevision = typeof salaryRevisions.$inferSelect;
export type NewSalaryRevision = typeof salaryRevisions.$inferInsert;
