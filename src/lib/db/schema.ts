import { pgTable, text, integer, boolean, timestamp, json, jsonb, index, decimal, primaryKey } from "drizzle-orm/pg-core";
import { relations, sql, eq, and, or, desc, like, inArray } from "drizzle-orm";
import { rubColleges, rubScholarships } from "./rub-schema";
import { tenants } from "./tenancy-schema";
import type { CounselorContent, LearningModuleContent, HomeworkContent, QuestionData } from "@/types";

// Re-export tables from separate schema files
export {
  rubColleges,
  rubPrograms,
  rubApplications,
  rubScholarships,
  rubScholarshipApplications,
} from "./rub-schema";

// BCSE (Bhutan Council for School Examinations) tables
export {
  bcseRegistrations,
  bcseResults,
  bcseSubjectMapping,
  bcseCertificates,
  bcseApiConfig,
  bcseSyncLogs,
  bcsePerformanceTracking,
  bcseSubjectCombinations,
  type BCSERegistration,
  type BCSEResult,
  type BCSESubjectMapping,
  type BCSECertificate,
  type BCSEApiConfig,
  type BCSESyncLog,
  type BCSEPerformanceTracking,
  type BCSESubjectCombination,
} from "./bcse-schema";

export {
  busAttendance,
  vehicleMaintenance,
  vehicleTracking,
  transportIncidents,
  drivers,
  vehicles,
  transportRoutes,
  transportAllocations,
  type Vehicle,
  type Driver,
  type TransportRoute,
  type TransportAllocation,
  type BusAttendance,
  type VehicleMaintenance,
  type VehicleTracking,
  type TransportIncident,
} from "./transport-schema";

export {
  hostelBuildings,
  hostelRooms,
  hostelAllocations,
  hostelAttendance,
  hostelLeaveRequests,
  hostelFacilities,
  hostelMess,
  hostelFees,
  hostelPayments,
  roomInspections,
  hostelComplaints,
  hostelRules,
} from "./hostel-schema";

export {
  inventoryItems,
  inventoryCategories,
  inventoryVendors,
  purchaseOrders,
  inventoryTransactions,
  assetAssignments,
  assetMaintenance,
  assetDisposal,
  stockAdjustments,
  inventoryAlerts,
  inventoryReports,
  inventorySettings,
} from "./inventory-schema";

// ============================================================================
// PAYROLL & SALARY MANAGEMENT
// ============================================================================

export {
  allowanceTypes,
  deductionTypes,
  salaryStructures,
  employeeSalaries,
  payrollAttendance,
  payrollRecords,
  payrollRuns,
  leaveEncashment,
  salaryRevisions,
  type AllowanceType,
  type DeductionType,
  type SalaryStructure,
  type EmployeeSalary,
  type PayrollAttendance,
  type PayrollRecord,
  type PayrollRun,
  type LeaveEncashment,
  type SalaryRevision,
} from "./payroll-schema";

// ============================================================================
// RBAC (Role-Based Access Control)
// ============================================================================

export {
  roles,
  permissions,
  rolePermissions,
  userRoles,
  componentAccess,
  auditLog,
} from "./rbac-schema";

// ============================================================================
// NOTIFICATIONS
// ============================================================================

export {
  notifications,
  notificationDeliveries,
  userNotificationSettings,
  notificationTypeEnum,
  notificationPriorityEnum,
  notificationStatusEnum,
  targetAudienceEnum,
  deliveryStatusEnum,
} from "./notifications-schema";

export type {
  Notification,
  NewNotification,
  NotificationDelivery,
  NewNotificationDelivery,
  UserNotificationSettings,
  NewUserNotificationSettings,
} from "./notifications-schema";

// ============================================================================
// PUSH NOTIFICATIONS
// ============================================================================

export {
  pushSubscriptions,
  pushNotifications,
  pushNotificationSettings,
  pushNotificationTypeEnum,
  pushNotificationStatusEnum,
} from "./push-schema";

export type {
  PushSubscription,
  NewPushSubscription,
  PushNotification,
  NewPushNotification,
  PushNotificationSettings,
  NewPushNotificationSettings,
} from "./push-schema";

// ============================================================================
// MULTI-TENANCY & BILLING
// ============================================================================

export {
  tenants,
  verificationRequests,
  tenantUsers,
  tenantSettings,
  tenantAuditLog,
  type Tenant,
} from "./tenancy-schema";

export {
  subscriptionPlans,
  subscriptions,
  paymentMethods,
  discountCodes,
  discountUsages,
  paymentTransactions,
  usageRecords,
} from "./billing-schema";

// Teacher-specific tables
export {
  teacherBehaviorLogs,
  type TeacherBehaviorLog,
  type NewTeacherBehaviorLog,
} from "./teacher-logs-schema";

export {
  lessonPlans,
  syllabusProgress,
  type LessonPlan,
  type NewLessonPlan,
  type SyllabusProgress,
  type NewSyllabusProgress,
} from "./lesson-plan-schema";

// ============================================================================
// DISTRICTS TABLE
// ============================================================================

export const districts = pgTable("districts", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").unique().notNull(),
  dzongkhag: text("dzongkhag").notNull(),
  country: text("country").notNull().default("Bhutan"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export type District = typeof districts.$inferSelect;

// ============================================================================
// USERS TABLE
// ============================================================================

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  clerkUserId: text("clerk_user_id").notNull().unique(),
  type: text("type").notNull(), // "student" | "teacher" | "parent" | "school_admin" | "admin" | "counselor"
  role: text("role").notNull(),
  name: text("name").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  schoolId: text("school_id").references(() => schools.id, { onDelete: "cascade" }),
  profileImage: text("profile_image"),
  dateOfBirth: text("date_of_birth"),
  gender: text("gender"),
  grade: integer("grade").notNull(),
  section: json("section"), // Database has json type
  rollNumber: text("roll_number"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  postalCode: text("postal_code"),
  country: text("country").notNull(),
  parentContact: json("parent_contact"), // Database has json type
  parentPhone: json("parent_phone"), // Database has json type
  emergencyContact: json("emergency_contact"), // Database has json type
  bloodGroup: text("blood_group"),
  enrollmentDate: text("enrollment_date").notNull(),
  lastLogin: text("last_login"),
  employeeId: text("employee_id"),
  subjects: json("subjects"), // Database has json type (not text)
  clerkId: text("clerk_id").unique(), // Clerk user ID (legacy, kept for compatibility)
  tenantId: json("tenant_id"), // Database has json type (not text)
  emailVerified: boolean("email_verified").default(false),
  onboardingComplete: boolean("onboarding_complete").default(false),
  onboardingStatus: text("onboarding_status").default("restricted"),
  classGrade: integer("class_grade"),
  parentId: text("parent_id").references(() => users.id),
  isActive: boolean("is_active").default(true),
  department: text("department"), // Department for staff users
  // Additional profile fields (optional)
  school: text("school"), // School reference for compatibility
  interests: json("interests"), // Database has json type
  goals: json("goals"), // Database has json type
  settings: json("settings"), // Database has json type
  createdAt: timestamp("created_at").notNull(), // Database has timestamp without time zone
  updatedAt: timestamp("updated_at").notNull(), // Database has timestamp without time zone
}, (table) => ({
  // Indexes for frequently queried columns
  clerkUserIdIdx: index("idx_users_clerk_user_id").on(table.clerkUserId),
  schoolIdIdx: index("idx_users_school_id").on(table.schoolId),
  typeIdx: index("idx_users_type").on(table.type),
  parentIdIdx: index("idx_users_parent_id").on(table.parentId),
  emailIdx: index("idx_users_email").on(table.email),
  isActiveIdx: index("idx_users_is_active").on(table.isActive),
  // Composite index for school + type (common query pattern)
  schoolTypeIdx: index("idx_users_school_type").on(table.schoolId, table.type),
}));

export type User = typeof users.$inferSelect;

// usersRelations will be defined at the end of the file after all tables are defined

// ============================================================================
// STUDENT APPLICATIONS TABLE
// ============================================================================

// Student enrollment applications - tracks students who signed up but pending school approval
export const studentApplications = pgTable("student_applications", {
  id: text("id").primaryKey(),
  studentId: text("student_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  schoolId: text("school_id").references(() => schools.id, { onDelete: "cascade" }).notNull(),
  status: text("status").notNull(), // "pending" | "approved" | "rejected"
  requestedGrade: integer("requested_grade"),
  requestedSection: text("requested_section"),
  guardianName: text("guardian_name"),
  guardianPhone: text("guardian_phone"),
  guardianEmail: text("guardian_email"),
  previousSchool: text("previous_school"),
  previousGrade: integer("previous_grade"),
  specialNeeds: text("special_notes"), // Any special requirements or notes
  submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull(),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  reviewedBy: text("reviewed_by").references(() => users.id),
  rejectionReason: text("rejection_reason"),
  notes: text("notes"), // Admin notes during review
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
}, (table) => ({
  studentIdIdx: index("idx_student_apps_student_id").on(table.studentId),
  schoolIdIdx: index("idx_student_apps_school_id").on(table.schoolId),
  statusIdx: index("idx_student_apps_status").on(table.status),
  schoolStatusIdx: index("idx_student_apps_school_status").on(table.schoolId, table.status),
}));

export type StudentApplication = typeof studentApplications.$inferSelect;

// studentApplicationsRelations will be defined at the end of the file after all tables are defined

// ============================================================================
// SCHOOL ADMIN APPLICATIONS TABLE
// ============================================================================

/**
 * School admin applications - tracks users who signed up as school admins
 * Platform admin reviews and approves after payment verification
 */
export const schoolAdminApplications = pgTable("school_admin_applications", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  schoolId: text("school_id").references(() => schools.id, { onDelete: "cascade" }).notNull(),
  status: text("status").notNull().default("pending_approval"), // "pending_approval" | "approved" | "rejected"
  paymentStatus: text("payment_status").notNull().default("pending"), // "pending" | "paid" | "failed"
  paymentAmount: text("payment_amount"), // Store as text to avoid numeric precision issues
  paymentDate: timestamp("payment_date"), // Database uses timestamp without time zone
  paymentMethod: text("payment_method"), // "bank_transfer" | "cheque" | "online" | "cash"
  paymentReference: text("payment_reference"), // Transaction ID / cheque number
  paymentVerifiedBy: text("payment_verified_by").references(() => users.id), // Admin who verified payment
  paymentVerifiedAt: timestamp("payment_verified_at"), // When payment was verified (no timezone)
  bankReferenceNumber: text("bank_reference_number"), // Bank reference number for verification
  appliedAt: timestamp("applied_at").notNull(), // Database uses timestamp without time zone
  reviewedBy: text("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"), // Database uses timestamp without time zone
  rejectionReason: text("rejection_reason"),
  notes: text("notes"), // Admin notes during review
  createdAt: timestamp("created_at").notNull(), // Database uses timestamp without time zone
  updatedAt: timestamp("updated_at").notNull(), // Database uses timestamp without time zone
}, (table) => ({
  userIdIdx: index("idx_school_admin_apps_user_id").on(table.userId),
  schoolIdIdx: index("idx_school_admin_apps_school_id").on(table.schoolId),
  statusIdx: index("idx_school_admin_apps_status").on(table.status),
  paymentStatusIdx: index("idx_school_admin_apps_payment_status").on(table.paymentStatus),
  schoolStatusIdx: index("idx_school_admin_apps_school_status").on(table.schoolId, table.status),
}));

export type SchoolAdminApplication = typeof schoolAdminApplications.$inferSelect;

// schoolAdminApplicationsRelations will be defined at the end of the file after all tables are defined

// ============================================================================
// TEACHER APPLICATIONS TABLE
// ============================================================================

/**
 * Teacher applications - tracks teachers who signed up and await approval
 */
export const teacherApplications = pgTable("teacher_applications", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  schoolId: text("school_id").references(() => schools.id, { onDelete: "cascade" }).notNull(),
  status: text("status").notNull().default("pending"), // "pending" | "approved" | "rejected"
  qualifications: text("qualifications"), // JSON string of qualifications
  experience: integer("experience"), // Years of experience
  subjects: text("subjects"), // JSON array of subject IDs
  desiredClasses: text("desired_classes"), // JSON array of class IDs
  previousSchool: text("previous_school"),
  specialization: text("specialization"), // Subject specialization
  appliedAt: timestamp("applied_at", { withTimezone: true }).notNull(),
  reviewedBy: text("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  rejectionReason: text("rejection_reason"),
  notes: text("notes"), // Admin notes during review
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
}, (table) => ({
  userIdIdx: index("idx_teacher_apps_user_id").on(table.userId),
  schoolIdIdx: index("idx_teacher_apps_school_id").on(table.schoolId),
  statusIdx: index("idx_teacher_apps_status").on(table.status),
  schoolStatusIdx: index("idx_teacher_apps_school_status").on(table.schoolId, table.status),
}));

export type TeacherApplication = typeof teacherApplications.$inferSelect;

// teacherApplicationsRelations will be defined at the end of the file after all tables are defined

// ============================================================================
// DEPARTMENTS TABLE
// ============================================================================

/**
 * Academic departments within a school
 * Organizes subjects and teachers under department heads
 */
export const departments = pgTable("departments", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").references(() => schools.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  code: text("code").notNull(),
  headOfDepartment: text("head_of_department").references(() => users.id, { onDelete: "set null" }),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
}, (table) => ({
  schoolIdIdx: index("idx_departments_school_id").on(table.schoolId),
  codeIdx: index("idx_departments_code").on(table.code),
  schoolCodeIdx: index("idx_departments_school_code").on(table.schoolId, table.code),
  hodIdx: index("idx_departments_hod").on(table.headOfDepartment),
  isActiveIdx: index("idx_departments_is_active").on(table.isActive),
}));

export type Department = typeof departments.$inferSelect;

// departmentsRelations will be defined at the end of the file after all tables are defined

// ============================================================================
// SCHOOLS TABLE
// ============================================================================

export const schools = pgTable("schools", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").unique().notNull(),
  type: text("type").notNull(), // "public" | "private" | "international"
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  country: text("country").notNull(),
  postalCode: text("postal_code").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  website: text("website").notNull(),
  logo: text("logo").notNull(),
  establishedYear: integer("established_year").notNull(),
  accreditationStatus: text("accreditation_status").notNull(),
  maxStudents: integer("max_students").notNull(),
  campusSize: text("campus_size").notNull(),
  facilities: json("facilities").$type<string[]>(),
  board: text("board").notNull(),
  principalName: text("principal_name").notNull(),
  principalEmail: text("principal_email").notNull(),
  principalPhone: text("principal_phone").notNull(),
  counselorName: text("counselor_name").notNull(),
  counselorEmail: text("counselor_email").notNull(),
  counselorPhone: text("counselor_phone").notNull(),
  vicePrincipalName: text("vice_principal_name").notNull(),
  schoolType: text("school_type"), // "public" | "private" | "international"
  level: text("level"), // "primary" | "middle" | "secondary" | "higher_secondary"
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  districtId: text("district_id"), // FK reference removed - will link manually when districts exist
  tenantId: text("tenant_id"), // Multi-tenant isolation
  isActive: boolean("is_active").default(true),
  // Subscription and status fields
  subscriptionStatus: text("subscription_status").default("pending_payment"), // "pending_payment" | "active" | "suspended" | "cancelled"
  subscriptionTier: text("subscription_tier"), // "basic" | "standard" | "premium" | "enterprise"
  activatedAt: timestamp("activated_at", { withTimezone: true }),
  setupComplete: boolean("setup_complete").default(false),
  setupCompletedAt: timestamp("setup_completed_at", { withTimezone: true }),
  // Fee generation session tracking (for annual SDF/termly fees)
  currentSessionYear: text("current_session_year"), // e.g., "2026"
  feeGenerationDate: text("fee_generation_date"), // ISO date string when fees were generated
  feeGenerationStatus: text("fee_generation_status").default("pending"), // "pending" | "generated" | "partial"
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
}, (table) => ({
  // Indexes for frequently queried columns
  codeIdx: index("idx_schools_code").on(table.code),
  isActiveIdx: index("idx_schools_is_active").on(table.isActive),
  subscriptionStatusIdx: index("idx_schools_subscription_status").on(table.subscriptionStatus),
}));

export type School = typeof schools.$inferSelect;

// ============================================================================
// SCHOOL INVOICES TABLE
// ============================================================================

/**
 * School subscription invoices
 * Tracks all billing for school subscriptions
 */
export const invoices = pgTable("invoices", {
  id: text("id").primaryKey(),
  invoiceNumber: text("invoice_number").notNull().unique(),
  schoolId: text("school_id").references(() => schools.id, { onDelete: "cascade" }).notNull(),

  // Invoice details
  subscriptionTier: text("subscription_tier").notNull(), // "basic" | "standard" | "premium" | "enterprise"
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(), // Using decimal for proper currency handling
  taxAmount: decimal("tax_amount", { precision: 12, scale: 2 }).default("0"),
  discountAmount: decimal("discount_amount", { precision: 12, scale: 2 }).default("0"),
  totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).notNull(), // Final amount including tax and discount
  currency: text("currency").default("BTN"), // Bhutanese Ngultrum

  // Billing period
  billingPeriodStart: timestamp("billing_period_start", { withTimezone: true }).notNull(),
  billingPeriodEnd: timestamp("billing_period_end", { withTimezone: true }).notNull(),
  invoiceDate: timestamp("invoice_date", { withTimezone: true }).notNull(), // Date invoice was issued
  dueDate: timestamp("due_date", { withTimezone: true }).notNull(),

  // Status
  status: text("status").notNull(), // "draft" | "sent" | "paid" | "overdue" | "cancelled" | "refunded"

  // Payment details
  paidAt: timestamp("paid_at", { withTimezone: true }),
  paymentMethod: text("payment_method"), // "bank_transfer" | "cash" | "online" | "check"
  paymentReference: text("payment_reference"), // Transaction ID, check number, etc.

  // Refund details
  refundAmount: decimal("refund_amount", { precision: 12, scale: 2 }),
  refundReason: text("refund_reason"),
  refundedAt: timestamp("refunded_at", { withTimezone: true }),

  // PDF
  pdfUrl: text("pdf_url"), // URL to generated PDF invoice

  // Metadata
  notes: text("notes"),
  metadata: json("metadata").$type<Record<string, unknown>>(),

  // Audit
  createdBy: text("created_by"), // Platform admin user ID
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),

  // Soft delete
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
}, (table) => ({
  schoolIdIdx: index("idx_invoices_school_id").on(table.schoolId),
  statusIdx: index("idx_invoices_status").on(table.status),
  dueDateIdx: index("idx_invoices_due_date").on(table.dueDate),
  invoiceNumberIdx: index("idx_invoices_invoice_number").on(table.invoiceNumber),
}));

export type Invoice = typeof invoices.$inferSelect;

// ============================================================================
// STUDENTS TABLE
// ============================================================================

/**
 * Student-specific information
 * Extends the users table with student-specific fields
 */
export const students = pgTable("students", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  schoolId: text("school_id").notNull().references(() => schools.id, { onDelete: "cascade" }),
  studentCode: text("student_code").notNull().unique(), // Unique student identifier within school
  currentClass: text("current_class"), // Current class/grade (e.g., "10", "12")
  section: text("section"), // Section within class (e.g., "A", "B")
  dateOfBirth: timestamp("date_of_birth", { mode: "date" }),
  gender: text("gender"), // "male" | "female" | "other"
  bloodGroup: text("blood_group"), // "A+" | "A-" | "B+" | "B-" | "O+" | "O-" | "AB+" | "AB-"
  address: text("address"),
  emergencyContact: text("emergency_contact"), // Emergency contact person name
  emergencyPhone: text("emergency_phone"), // Emergency contact phone number
  metadata: jsonb("metadata"), // Additional flexible data as JSONB
  status: text("status").notNull().default("active"), // "active" | "inactive" | "graduated" | "transferred" | "suspended"
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
}, (table) => ({
  userIdIdx: index("idx_students_user_id").on(table.userId),
  schoolIdIdx: index("idx_students_school_id").on(table.schoolId),
  studentCodeIdx: index("idx_students_student_code").on(table.studentCode),
  statusIdx: index("idx_students_status").on(table.status),
  // Composite index for school + class queries
  schoolClassIdx: index("idx_students_school_class").on(table.schoolId, table.currentClass),
}));

export type Student = typeof students.$inferSelect;

// ============================================================================
// TEACHERS TABLE
// ============================================================================

/**
 * Teacher-specific information
 * Extends the users table with teacher-specific fields
 */
export const teachers = pgTable("teachers", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  schoolId: text("school_id").notNull().references(() => schools.id, { onDelete: "cascade" }),
  employeeId: text("employee_id").notNull().unique(), // Unique employee identifier
  designation: text("designation").notNull(), // "Lecturer" | "Senior Teacher" | "HOD" | "Principal" etc.
  department: text("department"), // Department name (e.g., "Science", "Mathematics")
  specialization: text("specialization"), // Subject specialization (e.g., "Physics", "Chemistry")
  joiningDate: timestamp("joining_date", { mode: "date" }).notNull(),
  status: text("status").notNull().default("active"), // "active" | "inactive" | "on_leave" | "resigned" | "terminated"
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
}, (table) => ({
  userIdIdx: index("idx_teachers_user_id").on(table.userId),
  schoolIdIdx: index("idx_teachers_school_id").on(table.schoolId),
  employeeIdIdx: index("idx_teachers_employee_id").on(table.employeeId),
  statusIdx: index("idx_teachers_status").on(table.status),
}));

export type Teacher = typeof teachers.$inferSelect;

// ============================================================================
// PARENTS TABLE
// ============================================================================

/**
 * Parent-specific information
 * Extends the users table with parent-specific fields
 */
export const parents = pgTable("parents", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  occupation: text("occupation"),
  workAddress: text("work_address"),
  emergencyContact: text("emergency_contact"), // Primary emergency contact
  relationshipToPrimary: text("relationship_to_primary"), // "father" | "mother" | "guardian" | "other"
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
}, (table) => ({
  userIdIdx: index("idx_parents_user_id").on(table.userId),
}));

export type Parent = typeof parents.$inferSelect;

// ============================================================================
// PARENT TO STUDENT JOIN TABLE
// ============================================================================

/**
 * Parent-Student relationships
 * Links parents to their children with relationship details
 */
export const parentToStudent = pgTable("parent_to_student", {
  parentId: text("parent_id").notNull().references(() => parents.id, { onDelete: "cascade" }),
  studentId: text("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
  isPrimaryContact: boolean("is_primary_contact").default(false),
  relationshipType: text("relationship_type").notNull(), // "father" | "mother" | "guardian" | "stepfather" | "stepmother" | "grandparent"
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.parentId, table.studentId] }),
  parentIdIdx: index("idx_parent_to_student_parent_id").on(table.parentId),
  studentIdIdx: index("idx_parent_to_student_student_id").on(table.studentId),
}));

export type ParentToStudent = typeof parentToStudent.$inferSelect;

// ============================================================================
// LIBRARY BOOKS TABLE
// ============================================================================

/**
 * Library books catalog
 * Tracks all books in the library system
 */
export const libraryBooks = pgTable("library_books", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").notNull().references(() => schools.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  author: text("author").notNull(),
  isbn: text("isbn").unique(),
  publisher: text("publisher"),
  publicationYear: integer("publication_year"),
  category: text("category"), // "fiction" | "non-fiction" | "reference" | "textbook" etc.
  subCategory: text("sub_category"),
  language: text("language").default("en"),
  pages: integer("pages"),
  coverImage: text("cover_image"),
  description: text("description"),
  totalCopies: integer("total_copies").notNull().default(1),
  availableCopies: integer("available_copies").notNull().default(1),
  location: text("location"), // Shelf location (e.g., "A-12", "Reference-3")
  callNumber: text("call_number"), // Library classification number
  tags: jsonb("tags"), // Array of tags for categorization
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
}, (table) => ({
  schoolIdIdx: index("idx_library_books_school_id").on(table.schoolId),
  isbnIdx: index("idx_library_books_isbn").on(table.isbn),
  categoryIdx: index("idx_library_books_category").on(table.category),
  titleIdx: index("idx_library_books_title").on(table.title),
}));

export type LibraryBook = typeof libraryBooks.$inferSelect;

// ============================================================================
// LIBRARY MEMBERS TABLE
// ============================================================================

/**
 * Library membership records
 * Tracks who can borrow books from the library
 */
export const libraryMembers = pgTable("library_members", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").notNull().references(() => schools.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  memberType: text("member_type").notNull(), // "student" | "teacher" | "staff"
  membershipNumber: text("membership_number").notNull().unique(),
  membershipStatus: text("membership_status").notNull().default("active"), // "active" | "inactive" | "suspended"
  joinedDate: timestamp("joined_date", { mode: "date" }).notNull(),
  expiryDate: timestamp("expiry_date", { mode: "date" }),
  borrowingLimit: integer("borrowing_limit").default(5), // Max books allowed
  currentlyBorrowed: integer("currently_borrowed").default(0),
  totalBorrowed: integer("total_borrowed").default(0),
  fineDue: decimal("fine_due", { precision: 10, scale: 2 }).default("0"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
}, (table) => ({
  schoolIdIdx: index("idx_library_members_school_id").on(table.schoolId),
  userIdIdx: index("idx_library_members_user_id").on(table.userId),
  membershipNumberIdx: index("idx_library_members_membership_number").on(table.membershipNumber),
  membershipStatusIdx: index("idx_library_members_membership_status").on(table.membershipStatus),
}));

export type LibraryMember = typeof libraryMembers.$inferSelect;

// ============================================================================
// LIBRARY CIRCULATION TABLE
// ============================================================================

/**
 * Library circulation records
 * Tracks book checkouts, returns, and renewals
 */
export const libraryCirculation = pgTable("library_circulation", {
  id: text("id").primaryKey(),
  bookId: text("book_id").notNull().references(() => libraryBooks.id, { onDelete: "cascade" }),
  memberId: text("member_id").notNull().references(() => libraryMembers.id, { onDelete: "cascade" }),
  schoolId: text("school_id").notNull().references(() => schools.id, { onDelete: "cascade" }),
  checkoutDate: timestamp("checkout_date", { withTimezone: true }).notNull(),
  dueDate: timestamp("due_date", { withTimezone: true }).notNull(),
  returnDate: timestamp("return_date", { withTimezone: true }),
  status: text("status").notNull().default("borrowed"), // "borrowed" | "returned" | "overdue" | "lost"
  renewals: integer("renewals").default(0),
  maxRenewals: integer("max_renewals").notNull().default(3),
  fine: decimal("fine", { precision: 10, scale: 2 }).default("0"),
  finePaid: boolean("fine_paid").default(false),
  notes: text("notes"),
  processedBy: text("processed_by").references(() => users.id), // Staff who processed the transaction
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
}, (table) => ({
  bookIdIdx: index("idx_library_circulation_book_id").on(table.bookId),
  memberIdIdx: index("idx_library_circulation_member_id").on(table.memberId),
  schoolIdIdx: index("idx_library_circulation_school_id").on(table.schoolId),
  statusIdx: index("idx_library_circulation_status").on(table.status),
  dueDateIdx: index("idx_library_circulation_due_date").on(table.dueDate),
}));

export type LibraryCirculation = typeof libraryCirculation.$inferSelect;

// ============================================================================
// STUDENT PORTFOLIOS TABLE
// ============================================================================

/**
 * Student portfolios and achievements
 * Tracks student work, projects, and accomplishments
 */
export const studentPortfolios = pgTable("student_portfolios", {
  id: text("id").primaryKey(),
  studentId: text("student_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  schoolId: text("school_id").notNull().references(() => schools.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").notNull(), // "project" | "assignment" | "competition" | "certificate" | "extracurricular"
  subCategory: text("sub_category"),
  type: text("type").notNull(), // "academic" | "sports" | "arts" | "community" | "leadership" | "other"
  content: jsonb("content"), // Flexible content structure for different portfolio types
  attachments: jsonb("attachments"), // Array of file attachments (images, documents, etc.)
  tags: jsonb("tags"), // Array of tags for categorization
  date: timestamp("date", { mode: "date" }).notNull(), // Date of achievement or completion
  isPublic: boolean("is_public").default(false), // Whether to display publicly
  isFeatured: boolean("is_featured").default(false), // Whether to feature on profile
  status: text("status").notNull().default("draft"), // "draft" | "published" | "archived"
  submittedBy: text("submitted_by").references(() => users.id), // Teacher or student who submitted
  approvedBy: text("approved_by").references(() => users.id), // Teacher who approved
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  viewCount: integer("view_count").default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
}, (table) => ({
  studentIdIdx: index("idx_student_portfolios_student_id").on(table.studentId),
  schoolIdIdx: index("idx_student_portfolios_school_id").on(table.schoolId),
  categoryIdx: index("idx_student_portfolios_category").on(table.category),
  typeIdx: index("idx_student_portfolios_type").on(table.type),
  statusIdx: index("idx_student_portfolios_status").on(table.status),
}));

export type StudentPortfolio = typeof studentPortfolios.$inferSelect;

// ============================================================================
// SCHOOL SETTINGS TABLE
// ============================================================================

/**
 * School configuration and settings
 * Stores academic, fee, notification, integration, and security settings
 */
export const schoolSettings = pgTable("school_settings", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").references(() => schools.id, { onDelete: "cascade" }).notNull(),

  // General Settings
  schoolName: text("school_name").notNull(),
  schoolCode: text("school_code").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  address: text("address").notNull(),
  district: text("district").notNull(),
  website: text("website").notNull(),
  logo: text("logo"),

  // Academic Settings
  academicYearStart: text("academic_year_start").notNull(),
  academicYearEnd: text("academic_year_end").notNull(),
  currentTerm: text("current_term").notNull(),
  gradingSystem: text("grading_system").notNull(), // "percentage" | "gpa" | "cwa" | "grade"
  passMark: text("pass_mark").notNull(),
  workingDays: json("working_days").$type<string[]>(),

  // Fee Settings
  currency: text("currency").notNull(),
  lateFeeEnabled: boolean("late_fee_enabled").default(false),
  lateFeeAmount: text("late_fee_amount").notNull(),
  lateFeeAfter: text("late_fee_after").notNull(),
  discountEnabled: boolean("discount_enabled").default(false),

  // Notification Settings
  emailNotifications: boolean("email_notifications").default(true),
  smsNotifications: boolean("sms_notifications").default(true),
  attendanceAlerts: boolean("attendance_alerts").default(true),
  feeReminders: boolean("fee_reminders").default(true),
  examResults: boolean("exam_results").default(true),

  // Integration Settings
  paymentGateway: text("payment_gateway").notNull(),
  emailService: text("email_service").notNull(),
  smsService: text("sms_service").notNull(),

  // Security Settings
  twoFactorAuth: boolean("two_factor_auth").default(false),
  sessionTimeout: text("session_timeout").notNull(),
  ipRestriction: boolean("ip_restriction").default(false),
  allowedIps: text("allowed_ips"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export type SchoolSettings = typeof schoolSettings.$inferSelect;

// ============================================================================
// ACADEMIC YEARS TABLE
// ============================================================================

/**
 * Academic year configuration
 * Tracks terms and their dates
 */
export const academicYears = pgTable("academic_years", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").references(() => schools.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(), // e.g., "2025-2026"
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  isActive: boolean("is_active").default(false),
  currentTerm: text("current_term"), // e.g., "Spring 2025"
  terms: json("terms").$type<Array<{
    name: string;
    startDate: string;
    endDate: string;
  }>>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export type AcademicYear = typeof academicYears.$inferSelect;

// ============================================================================
// GRADE CONFIGURATIONS TABLE
// ============================================================================

/**
 * Grade configuration for the school's grading system
 * Defines grade ranges and their meanings
 */
export const gradeConfigurations = pgTable("grade_configurations", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").references(() => schools.id, { onDelete: "cascade" }).notNull(),
  gradingSystem: text("grading_system").notNull(), // "percentage" | "gpa" | "cwa" | "grade"
  passMark: text("pass_mark").notNull(),
  grades: json("grades").$type<Array<{
    grade: string; // e.g., "A", "B+", "4.0"
    minScore: number;
    maxScore: number;
    label: string;
    gpa?: number;
  }>>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export type GradeConfiguration = typeof gradeConfigurations.$inferSelect;

// ============================================================================
// BELL SCHEDULES TABLE
// ============================================================================

/**
 * Bell schedule configuration
 * Defines the daily school schedule
 */
export const bellSchedules = pgTable("bell_schedules", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").references(() => schools.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(), // e.g., "Regular Day", "Short Day", "Exam Schedule"
  isActive: boolean("is_active").default(true),
  periods: json("periods").$type<Array<{
    periodNumber: number;
    name: string; // e.g., "Period 1", "Lunch", "Break"
    startTime: string; // HH:MM format
    endTime: string; // HH:MM format
    type: "class" | "break" | "lunch";
  }>>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export type BellSchedule = typeof bellSchedules.$inferSelect;

// ============================================================================
// BOOKS TABLE
// ============================================================================

export const books = pgTable("books", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").references(() => schools.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  author: text("author").notNull(),
  isbn: text("isbn").notNull(),
  publicationYear: integer("publication_year").notNull(),
  category: text("category").notNull(),
  coverImage: text("cover_image").notNull(),
  description: text("description").notNull(),
  totalPages: integer("total_pages").notNull(),
  publisher: text("publisher").notNull(),
  language: text("language").notNull(),
  status: text("status"), // "available" | "borrowed" | "reserved" | "lost"
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export type Book = typeof books.$inferSelect;

// booksRelations will be defined at the end of the file after all tables are defined

// ============================================================================
// CLASSES TABLE
// ============================================================================

export const classes = pgTable("classes", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").references(() => schools.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  grade: integer("grade").notNull(),
  section: text("section").notNull(),
  roomNumber: text("room_number").notNull(),
  capacity: integer("capacity").notNull(),
  homeroomTeacherId: text("homeroom_teacher_id").references(() => users.id),
  homeroomTeacherName: text("homeroom_teacher_name").notNull(),
  classTeacherId: text("class_teacher_id").references(() => users.id),
  classTeacherName: text("class_teacher_name").notNull(),
  teacherId: text("teacher_id").references(() => users.id),
  academicYear: text("academic_year"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
}, (table) => ({
  // Indexes for frequently queried columns
  schoolIdIdx: index("idx_classes_school_id").on(table.schoolId),
  teacherIdIdx: index("idx_classes_teacher_id").on(table.teacherId),
  gradeIdx: index("idx_classes_grade").on(table.grade),
  isActiveIdx: index("idx_classes_is_active").on(table.isActive),
  // Composite index for school + grade (common query pattern)
  schoolGradeIdx: index("idx_classes_school_grade").on(table.schoolId, table.grade),
}));

export type Class = typeof classes.$inferSelect;

// ============================================================================
// SUBJECTS TABLE
// ============================================================================

export const subjects = pgTable("subjects", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").references(() => schools.id, { onDelete: "cascade" }),
  departmentId: text("department_id").references(() => departments.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  code: text("code").unique().notNull(),
  type: text("type").notNull(), // "core" | "elective" | "language" | "additional"
  subjectType: text("subject_type").default("core"), // "core" | "elective" | "language"
  description: text("description").notNull(),
  grade: integer("grade"),
  applicableGrades: text("applicable_grades"), // JSON array of applicable grades
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
}, (table) => ({
  schoolIdIdx: index("idx_subjects_school_id").on(table.schoolId),
  departmentIdIdx: index("idx_subjects_department_id").on(table.departmentId),
  gradeIdx: index("idx_subjects_grade").on(table.grade),
  isActiveIdx: index("idx_subjects_is_active").on(table.isActive),
}));

export type Subject = typeof subjects.$inferSelect;

// ============================================================================
// ASSESSMENT TYPES TABLE
// ============================================================================

export const assessmentTypes = pgTable("assessment_types", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  duration: integer("duration").notNull(), // in minutes
  passingScore: integer("passing_score").notNull(), // out of 100
  totalQuestions: integer("total_questions").notNull(),
  category: text("category"),
  targetAudience: text("target_audience"),
  targetGrade: integer("target_grade"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export type AssessmentType = typeof assessmentTypes.$inferSelect;

// ============================================================================
// ASSESSMENT QUESTIONS TABLE
// ============================================================================

export const assessmentQuestions = pgTable("assessment_questions", {
  id: text("id").primaryKey(),
  assessmentTypeId: text("assessment_type_id").references(() => assessmentTypes.id, { onDelete: "cascade" }),
  questionText: text("question_text").notNull(),
  questionData: json("question_data").$type<Record<string, unknown>>(),
  options: json("options").$type<string[]>(),
  correctAnswer: text("correct_answer").notNull(),
  points: integer("points").notNull(),
  order: integer("order").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export type AssessmentQuestion = typeof assessmentQuestions.$inferSelect;

// ============================================================================
// ASSESSMENTS TABLE
// ============================================================================

export const assessments = pgTable("assessments", {
  id: text("id").primaryKey(),
  classId: text("class_id").references(() => classes.id, { onDelete: "cascade" }),
  assessmentTypeId: text("assessment_type_id").references(() => assessmentTypes.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  dueDate: text("due_date").notNull(),
  totalPoints: integer("total_points").notNull(),
  passingScore: integer("passing_score").notNull(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  status: text("status"), // "draft" | "published" | "archived"
  type: text("type"), // "riasec" | "mbti" | "disc" | "work_values"
  startedAt: timestamp("started_at", { withTimezone: true }), // When the assessment was started
  results: json("results").$type<Array<{
    questionId: string;
    answer: string | string[];
    score: number;
    correct: boolean;
  }>>(), // Assessment results/answers
  completedAt: timestamp("completed_at", { withTimezone: true }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
}, (table) => ({
  // Indexes for frequently queried columns
  userIdIdx: index("idx_assessments_user_id").on(table.userId),
  classIdIdx: index("idx_assessments_class_id").on(table.classId),
  typeIdx: index("idx_assessments_type").on(table.type),
  statusIdx: index("idx_assessments_status").on(table.status),
  // Composite index for user + type (common query pattern)
  userTypeIdx: index("idx_assessments_user_type").on(table.userId, table.type),
}));

export type Assessment = typeof assessments.$inferSelect;

// ============================================================================
// ASSESSMENT RESULTS TABLE
// ============================================================================

export const assessmentResults = pgTable("assessment_results", {
  id: text("id").primaryKey(),
  assessmentId: text("assessment_id").references(() => assessments.id, { onDelete: "cascade" }),
  studentId: text("student_id").references(() => users.id, { onDelete: "cascade" }),
  questionId: text("question_id").references(() => assessmentQuestions.id),
  selectedOptionId: text("selected_option_id"), // References an option ID from the JSON options array (no FK constraint)
  selectedOptionText: text("selected_option_text").notNull(),
  answer: text("answer").notNull(),
  score: integer("score").notNull(),
  points: integer("points").notNull(),
  isPassed: boolean("is_passed").default(true),
  completedAt: timestamp("completed_at", { withTimezone: true }).notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
  timeSpent: integer("time_spent").notNull(), // in seconds
  feedback: text("feedback").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export type AssessmentResult = typeof assessmentResults.$inferSelect;

// ============================================================================
// ASSESSMENT SUBMISSIONS TABLE
// ============================================================================

export const assessmentSubmissions = pgTable("assessment_submissions", {
  id: text("id").primaryKey(),
  assessmentId: text("assessment_id").references(() => assessments.id, { onDelete: "cascade" }),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  assignedBy: text("assigned_by").references(() => users.id, { onDelete: "cascade" }),
  status: text("status").notNull(), // "pending" | "submitted" | "graded" | "returned"
  score: integer("score"),
  answers: json("answers").$type<Array<{
    questionId: string;
    selectedOptionId: string;
    text: string;
  }>>(),
  textAnswers: json("text_answers").$type<Record<string, string>>(),
  feedback: text("feedback"),
  submittedAt: timestamp("submitted_at", { withTimezone: true }),
  gradedAt: timestamp("graded_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export type AssessmentSubmission = typeof assessmentSubmissions.$inferSelect;

// ============================================================================
// ANNOUNCEMENTS TABLE
// ============================================================================

export const announcements = pgTable("announcements", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").references(() => schools.id, { onDelete: "cascade" }),
  classId: text("class_id").references(() => classes.id),
  title: text("title").notNull(),
  content: text("content").notNull(),
  excerpt: text("excerpt").notNull(),
  priority: text("priority").notNull(), // "low" | "normal" | "high" | "urgent"
  targetAudience: text("target_audience").notNull(), // "all" | "students" | "teachers" | "parents" | "staff" | "counselor"
  targetGradeLevel: text("target_grade_level").notNull(), // e.g., "10-12"
  targetClassIds: text("target_class_ids"), // Stored as text, parse as JSON array when needed
  targetUserIds: text("target_user_ids"), // Stored as text, parse as JSON array when needed
  category: text("category").notNull(),
  publishDate: text("publish_date").notNull(),
  expiryDate: text("expiry_date").notNull(),
  isPinned: boolean("is_pinned").default(false),
  isPublished: boolean("is_published").default(false),
  viewCount: integer("view_count").default(0),
  isArchived: boolean("is_archived").default(false),
  publishedAt: timestamp("published_at", { withTimezone: true }).notNull(),
  authorId: text("author_id"), // ID of the user who created the announcement
  authorName: text("author_name"), // Name of the author
  authorRole: text("author_role"), // Role of the author (teacher, admin, etc.)
  attachments: json("attachments").$type<Array<{
    id: string;
    name: string;
    url: string;
    type: string;
  }>>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export type Announcement = typeof announcements.$inferSelect;

// ============================================================================
// USER PROGRESS TABLE
// ============================================================================

export const userProgress = pgTable("user_progress", {
  id: text("id").primaryKey(),
  studentId: text("student_id").references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // "academic" | "career" | "behavioral" | "attendance"
  metricName: text("metric_name").notNull(),
  metricValue: text("metric_value").notNull(),
  targetValue: text("target_value").notNull(),
  date: text("date").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
});

export type UserProgress = typeof userProgress.$inferSelect;

// ============================================================================
// ACHIEVEMENTS TABLE
// ============================================================================

export const achievements = pgTable("achievements", {
  id: text("id").primaryKey(),
  studentId: text("student_id").references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // "academic" | "attendance" | "behavioral" | "extracurricular" | "competition" | "certification"
  title: text("title").notNull(),
  description: text("description").notNull(),
  dateEarned: text("date_earned").notNull(),
  level: text("level").notNull(), // "school" | "class" | "national" | "international"
  certificateUrl: text("certificate_url").notNull(),
  issuer: text("issuer").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
});

export type Achievement = typeof achievements.$inferSelect;

// ============================================================================
// ATTENDANCE RECORDS TABLE
// ============================================================================

export const attendanceRecords = pgTable("attendance_records", {
  id: text("id").primaryKey(),
  studentId: text("student_id").references(() => users.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  status: text("status").notNull(), // "present" | "absent" | "late" | "excused"
  notes: text("notes").notNull(),
  recordedBy: text("recorded_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
});

export type AttendanceRecord = typeof attendanceRecords.$inferSelect;

// ============================================================================
// FEE PAYMENTS TABLE
// ============================================================================

export const feePayments = pgTable("fee_payments", {
  id: text("id").primaryKey(),
  studentFeeId: text("student_fee_id").references(() => studentFees.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(),
  paidDate: text("paid_date").notNull(),
  method: text("method").notNull(), // "cash" | "online" | "bank" | "waived"
  paymentMethod: text("payment_method"), // Alias for method - "cash" | "online" | "bank_transfer" | "upi" | "check"
  transactionId: text("transaction_id").notNull(),
  receiptNumber: text("receipt_number").notNull(),
  status: text("status").notNull(), // "pending" | "paid" | "failed"
  isRecurring: boolean("is_recurring").default(false),
  dueDate: text("due_date").notNull(),
  paidAt: timestamp("paid_at", { withTimezone: true }).notNull(),
  schoolId: text("school_id").references(() => schools.id),
  collectedAt: timestamp("collected_at", { withTimezone: true }),
  lastPaymentDate: text("last_payment_date"),
  amountPending: integer("amount_pending"),
  notes: text("notes"), // Payment notes
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
}, (table) => ({
  schoolIdIdx: index("idx_fee_payments_school_id").on(table.schoolId),
  schoolStatusIdx: index("idx_fee_payments_school_status").on(table.schoolId, table.status),
  schoolStatusPaidAtIdx: index("idx_fee_payments_school_status_paid").on(table.schoolId, table.status, table.paidAt),
}));

export type FeePayment = typeof feePayments.$inferSelect;

// ============================================================================
// STUDENT FEES TABLE
// ============================================================================

export const studentFees = pgTable("student_fees", {
  id: text("id").primaryKey(),
  studentId: text("student_id").references(() => users.id, { onDelete: "cascade" }),
  feeType: text("fee_type").notNull(), // "tuition" | "library" | "lab" | "transport" | "hostel" | "activity" | "uniform" | "exam" | "other" | "sdf" | "rimdro" | "diary" | "sports" | "stationery"
  // SDF = School Development Fund (government schools), Rimdro = annual prayer fee, Diary = school diary & ID card
  amount: integer("amount").notNull(),
  totalAmount: integer("total_amount"),
  amountPaid: integer("amount_paid"),
  amountWaived: integer("amount_waived"),
  entryMethod: text("entry_method"), // "cash" | "card" | "bank_transfer" | "online"
  currency: text("currency").notNull(), // "BTN" | "USD" | "INR"
  frequency: text("frequency").notNull(), // "monthly" | "quarterly" | "yearly" | "one-time"
  dueDate: text("due_date").notNull(),
  year: integer("year").notNull(),
  status: text("status").notNull(), // "pending" | "paid" | "waived" | "partial"
  isRecurring: boolean("is_recurring").default(false),
  description: text("description").notNull(),
  schoolId: text("school_id").references(() => schools.id),
  amountPending: integer("amount_pending"),
  notes: text("notes"), // Fee notes
  lastPaymentDate: text("last_payment_date"), // Date of last payment
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export type StudentFee = typeof studentFees.$inferSelect;

// ============================================================================
// HOMEWORK TABLE
// ============================================================================

export const homework = pgTable("homework", {
  id: text("id").primaryKey(),
  classId: text("class_id").references(() => classes.id, { onDelete: "cascade" }),
  subjectId: text("subject_id").references(() => subjects.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  dueDate: text("due_date").notNull(),
  assignedDate: text("assigned_date").notNull(),
  totalPoints: integer("total_points").notNull(),
  passingScore: integer("passing_score").notNull(),
  questions: json("questions").$type<Array<{
    id: string;
    type: string;
    text: string;
    options?: string[];
    correctAnswer?: string | string[];
    points: number;
  }>>(),
  attachments: json("attachments").$type<Array<{
    id: string;
    name: string;
    type: string;
    url: string;
  }>>(),
  // REMOVED: author_id, author_name, author_role - not in actual database
  // authorId: text("author_id").references(() => users.id),
  // authorName: text("author_name"),
  // authorRole: text("author_role"), // "teacher" | "school_admin"
  isPublished: boolean("is_published").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
}, (table) => ({
  // Indexes for frequently queried columns
  classIdIdx: index("idx_homework_class_id").on(table.classId),
  subjectIdIdx: index("idx_homework_subject_id").on(table.subjectId),
  isPublishedIdx: index("idx_homework_is_published").on(table.isPublished),
  dueDateIdx: index("idx_homework_due_date").on(table.dueDate),
  isActiveIdx: index("idx_homework_is_active").on(table.isActive),
}));

export type Homework = typeof homework.$inferSelect;

// ============================================================================
// HOMEWORK SUBMISSIONS TABLE
// ============================================================================

export const homeworkSubmissions = pgTable("homework_submissions", {
  id: text("id").primaryKey(),
  homeworkId: text("homework_id").references(() => homework.id, { onDelete: "cascade" }),
  studentId: text("student_id").references(() => users.id, { onDelete: "cascade" }),
  submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull(),
  content: json("content").$type<HomeworkContent>(),
  gradedAt: timestamp("graded_at", { withTimezone: true }).notNull(),
  score: integer("score").notNull(),
  feedback: text("feedback").notNull(),
  status: text("status").notNull(), // "submitted" | "graded" | "returned"
  isLate: boolean("is_late").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
}, (table) => ({
  // Indexes for frequently queried columns
  homeworkIdIdx: index("idx_homework_submissions_homework_id").on(table.homeworkId),
  studentIdIdx: index("idx_homework_submissions_student_id").on(table.studentId),
  statusIdx: index("idx_homework_submissions_status").on(table.status),
  // Composite index for homework + student (common query pattern)
  homeworkStudentIdx: index("idx_homework_submissions_homework_student").on(table.homeworkId, table.studentId),
}));

export type HomeworkSubmission = typeof homeworkSubmissions.$inferSelect;

// ============================================================================
// TIME PERIODS TABLE
// ============================================================================

export const timePeriods = pgTable("time_periods", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").references(() => schools.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: text("type").notNull(), // "class" | "break" | "lunch"
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  duration: integer("duration").notNull(), // in minutes
  order: integer("order").notNull(),
  isBreak: boolean("is_break").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export type TimePeriod = typeof timePeriods.$inferSelect;

// ============================================================================
// ROOMS TABLE
// ============================================================================

export const rooms = pgTable("rooms", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").references(() => schools.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  roomNumber: text("room_number").notNull(),
  type: text("type").notNull(), // "classroom" | "lab" | "library" | "office" | "hall" | "other"
  capacity: integer("capacity").notNull(),
  floor: integer("floor").notNull(),
  building: text("building").notNull(),
  hasProjector: boolean("has_projector").default(false),
  hasComputers: boolean("has_computers").default(false),
  hasSmartBoard: boolean("has_smart_board").default(false),
  hasWhiteboard: boolean("has_whiteboard").default(false),
  hasAc: boolean("has_ac").default(false),
  facilities: json("facilities").$type<string[]>(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export type Room = typeof rooms.$inferSelect;

// ============================================================================
// CLASS SUBJECTS TABLE
// ============================================================================

export const classSubjects = pgTable("class_subjects", {
  id: text("id").primaryKey(),
  classId: text("class_id").references(() => classes.id, { onDelete: "cascade" }),
  subjectId: text("subject_id").references(() => subjects.id),
  teacherId: text("teacher_id").references(() => users.id),
  periodsPerWeek: integer("periods_per_week").notNull(),
  isCoreSubject: boolean("is_core_subject").default(true),
  roomId: text("room_id").references(() => rooms.id),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export type ClassSubject = typeof classSubjects.$inferSelect;

// ============================================================================
// TIMETABLE ENTRIES TABLE
// ============================================================================

export const timetableEntries = pgTable("timetable_entries", {
  id: text("id").primaryKey(),
  classId: text("class_id").references(() => classes.id, { onDelete: "cascade" }),
  subjectId: text("subject_id").references(() => subjects.id),
  subjectName: text("subject_name").notNull(),
  teacherId: text("teacher_id").references(() => users.id),
  teacherName: json("teacher_name").notNull(),
  roomId: text("room_id").references(() => rooms.id),
  roomName: json("room_name").notNull(),
  periodId: text("period_id").references(() => timePeriods.id),
  periodName: text("period_name").notNull(),
  dayOfWeek: text("day_of_week").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  isDoublePeriod: boolean("is_double_period").default(false),
  notes: text("notes").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export type TimetableEntry = typeof timetableEntries.$inferSelect;

// ============================================================================
// PARTNERS TABLE
// ============================================================================

export const partners = pgTable("partners", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").references(() => schools.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: text("type").notNull(), // "rub_college" | "industry" | "ngo" | "government"
  description: text("description").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  address: text("address").notNull(),
  contactPerson: text("contact_person"),
  partnershipDate: text("partnership_date").notNull(),
  status: text("status").notNull().default("active"),
  workshopsConducted: integer("workshops_conducted").default(0),
  studentsPlaced: integer("students_placed").default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export type Partner = typeof partners.$inferSelect;

// ============================================================================
// PARTNER COMMISSIONS TABLE
// ============================================================================

export const partnerCommissions = pgTable("partner_commissions", {
  id: text("id").primaryKey(),
  partnerId: text("partner_id").references(() => partners.id, { onDelete: "cascade" }).notNull(),
  period: text("period").notNull(), // Format: "YYYY-MM" (e.g., "2025-12")
  amount: integer("amount").notNull(), // Commission amount in currency units
  status: text("status").notNull().default("pending"), // "pending" | "paid" | "overdue"
  description: text("description").notNull(),
  paidDate: text("paid_date"), // Date when commission was paid
  dueDate: text("due_date"), // Date when commission is due
  metadata: json("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export type PartnerCommission = typeof partnerCommissions.$inferSelect;

// ============================================================================
// PARTNER PORTAL USERS TABLE
// ============================================================================

export const partnerPortalUsers = pgTable("partner_portal_users", {
  id: text("id").primaryKey(),
  partnerId: text("partner_id").references(() => partners.id, { onDelete: "cascade" }).notNull(),
  clerkUserId: text("clerk_user_id").notNull(),
  email: text("email").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  role: text("role").notNull().default("viewer"), // "viewer" | "editor" | "admin"
  isActive: boolean("is_active").default(true),
  lastLoginAt: text("last_login_at"),
  invitedBy: text("invited_by").references(() => users.id),
  invitationAcceptedAt: timestamp("invitation_accepted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export type PartnerPortalUser = typeof partnerPortalUsers.$inferSelect;

// ============================================================================
// COUNSELOR RESOURCES TABLE
// ============================================================================

export const counselorResources = pgTable("counselor_resources", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").references(() => schools.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(),
  category: text("category").notNull(),
  url: text("url").notNull(),
  content: json("content").$type<CounselorContent>(),
  tags: json("tags").$type<string[]>(),
  targetAudience: text("target_audience").notNull(),
  isPublic: boolean("is_public").default(false),
  isActive: boolean("is_active").default(true),
  viewCount: integer("view_count").default(0),
  downloadCount: integer("download_count").default(0),
  createdBy: text("created_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export type CounselorResource = typeof counselorResources.$inferSelect;

// ============================================================================
// ENROLLMENTS TABLE
// ============================================================================

export const enrollments = pgTable("enrollments", {
  id: text("id").primaryKey(),
  studentId: text("student_id").references(() => users.id, { onDelete: "cascade" }),
  classId: text("class_id").references(() => classes.id, { onDelete: "cascade" }),
  academicYear: text("academic_year").notNull(),
  enrollmentDate: text("enrollment_date").notNull(),
  status: text("status").notNull(), // "active" | "withdrawn" | "completed" | "transferred"
  rollNumber: text("roll_number"),
  section: text("section"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
}, (table) => ({
  // Indexes for frequently queried columns
  studentIdIdx: index("idx_enrollments_student_id").on(table.studentId),
  classIdIdx: index("idx_enrollments_class_id").on(table.classId),
  statusIdx: index("idx_enrollments_status").on(table.status),
  academicYearIdx: index("idx_enrollments_academic_year").on(table.academicYear),
  // Composite index for class + status (common query pattern)
  classStatusIdx: index("idx_enrollments_class_status").on(table.classId, table.status),
  // Composite index for student + academic year (common query pattern)
  studentYearIdx: index("idx_enrollments_student_year").on(table.studentId, table.academicYear),
}));

export type Enrollment = typeof enrollments.$inferSelect;

// ============================================================================
// TEACHER ASSIGNMENTS TABLE
// ============================================================================

export const teacherAssignments = pgTable("teacher_assignments", {
  id: text("id").primaryKey(),
  teacherId: text("teacher_id").references(() => users.id, { onDelete: "cascade" }),
  classId: text("class_id").references(() => classes.id, { onDelete: "cascade" }),
  subjectId: text("subject_id").references(() => subjects.id),
  academicYear: text("academic_year").notNull(),
  role: text("role").notNull(), // "homeroom" | "subject_teacher" | "both"
  isPrimary: boolean("is_primary").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export type TeacherAssignment = typeof teacherAssignments.$inferSelect;

// ============================================================================
// COUNSELOR ASSIGNMENTS TABLE
// ============================================================================

export const counselorAssignments = pgTable("counselor_assignments", {
  id: text("id").primaryKey(),
  counselorId: text("counselor_id").references(() => users.id, { onDelete: "cascade" }),
  schoolId: text("school_id").references(() => schools.id, { onDelete: "cascade" }),
  assignedClasses: json("assigned_classes").$type<string[]>(),
  assignedGrades: json("assigned_grades").$type<number[]>(),
  academicYear: text("academic_year").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export type CounselorAssignment = typeof counselorAssignments.$inferSelect;

// ============================================================================
// FEE STRUCTURES TABLE
// ============================================================================

export const feeStructures = pgTable("fee_structures", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").references(() => schools.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description").notNull(),
  academicYear: text("academic_year").notNull(),
  grade: integer("grade").notNull(),
  totalFees: integer("total_fees").notNull(),
  breakdown: json("breakdown").$type<Array<{
    feeType: string;
    amount: number;
    frequency: string;
  }>>(),
  fees: json("fees").$type<Array<{
    feeType: string;
    amount: number;
    frequency: string;
  }>>(), // Alias for breakdown
  isRecurring: boolean("is_recurring").default(false),
  currency: text("currency").notNull().default("BTN"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export type FeeStructure = typeof feeStructures.$inferSelect;

// ============================================================================
// EXAM RESULTS ENHANCED TABLE
// ============================================================================

export const examResultsEnhanced = pgTable("exam_results_enhanced", {
  id: text("id").primaryKey(),
  studentId: text("student_id").references(() => users.id, { onDelete: "cascade" }),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  examName: text("exam_name").notNull(),
  examType: text("exam_type").notNull(), // "midterm" | "final" | "unit_test" | "board_exam"
  academicYear: text("academic_year").notNull(),
  term: text("term").notNull(),
  examDate: text("exam_date").notNull(),
  examYear: integer("exam_year"),
  subjects: json("subjects").$type<Array<{
    subjectId: string;
    subjectName: string;
    marksObtained: number;
    maxMarks: number;
    grade: string;
    percentage: number;
  }>>(),
  // subjectResults removed - doesn't exist in actual database (use subjects instead)
  overallPercentage: integer("overall_percentage"),
  totalMarks: integer("total_marks").notNull(),
  maxTotalMarks: integer("max_total_marks").notNull(),
  totalMaxMarks: integer("total_max_marks"),
  totalMarksObtained: integer("total_marks_obtained"),
  percentage: integer("percentage").notNull(),
  totalPercentage: integer("total_percentage"), // Alias for percentage
  grade: text("grade").notNull(),
  rank: integer("rank"),
  classRank: integer("class_rank"),
  remarks: text("remarks"),
  division: text("division"),
  // traits removed - doesn't exist in actual database
  isVerified: boolean("is_verified").default(false), // Whether results are verified
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
}, (table) => ({
  userIdIdx: index("idx_exam_results_enhanced_user_id").on(table.userId),
  userExamYearIdx: index("idx_exam_results_enhanced_user_year").on(table.userId, table.examYear),
}));

export type ExamResultEnhanced = typeof examResultsEnhanced.$inferSelect;

// ============================================================================
// ACADEMIC TERMS TABLE
// ============================================================================

export const academicTerms = pgTable("academic_terms", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").references(() => schools.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  academicYear: text("academic_year").notNull(),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  isActive: boolean("is_active").default(true),
  isCurrent: boolean("is_current").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export type AcademicTerm = typeof academicTerms.$inferSelect;

// ============================================================================
// ATTENDANCE (simplified alias) TABLE
// ============================================================================

export const attendance = pgTable("attendance", {
  id: text("id").primaryKey(),
  studentId: text("student_id").references(() => users.id, { onDelete: "cascade" }),
  classId: text("class_id").references(() => classes.id, { onDelete: "cascade" }),
  schoolId: text("school_id").references(() => schools.id),
  date: text("date").notNull(),
  checkInTime: text("check_in_time"), // Time when attendance was recorded
  status: text("status").notNull(), // "present" | "absent" | "late" | "excused"
  recordedBy: text("recorded_by").references(() => users.id),
  notes: text("notes"),
  reason: text("reason"), // Reason for absence/late
  entryMethod: text("entry_method"), // How attendance was recorded (manual, biometric, etc.)
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
}, (table) => ({
  // Indexes for frequently queried columns
  studentIdIdx: index("idx_attendance_student_id").on(table.studentId),
  classIdIdx: index("idx_attendance_class_id").on(table.classId),
  schoolIdIdx: index("idx_attendance_school_id").on(table.schoolId),
  dateIdx: index("idx_attendance_date").on(table.date),
  statusIdx: index("idx_attendance_status").on(table.status),
  // Composite index for student + date (common query pattern)
  studentDateIdx: index("idx_attendance_student_date").on(table.studentId, table.date),
  // Composite index for class + date (common query pattern)
  classDateIdx: index("idx_attendance_class_date").on(table.classId, table.date),
}));

export type Attendance = typeof attendance.$inferSelect;

// ============================================================================
// CAREER MATCHES TABLE
// ============================================================================

export const careerMatches = pgTable("career_matches", {
  id: text("id").primaryKey(),
  studentId: text("student_id").references(() => users.id, { onDelete: "cascade" }),
  careerId: text("career_id").notNull(),
  careerTitle: text("career_title").notNull(),
  matchScore: integer("match_score").notNull(),
  matchReason: text("match_reason").notNull(),
  recommendationText: text("recommendation_text"),
  isTopMatch: boolean("is_top_match").default(false),
  assessmentType: text("assessment_type").notNull(), // "riasec" | "mbti" | "work_values"
  assessmentId: text("assessment_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
}, (table) => ({
  assessmentIdIdx: index("idx_career_matches_assessment_id").on(table.assessmentId),
  assessmentMatchScoreIdx: index("idx_career_matches_assessment_score").on(table.assessmentId, table.matchScore),
}));

export type CareerMatch = typeof careerMatches.$inferSelect;

// ============================================================================
// CAREER PLANS TABLE
// ============================================================================

export const careerPlans = pgTable("career_plans", {
  id: text("id").primaryKey(),
  studentId: text("student_id").references(() => users.id, { onDelete: "cascade" }).unique(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  targetCareer: text("target_career").notNull(),
  targetCareerId: text("target_career_id").notNull(),
  shortTermGoals: json("short_term_goals").$type<string[]>(),
  longTermGoals: json("long_term_goals").$type<string[]>(),
  subjects: json("subjects").$type<Array<{
    subject: string;
    importance: string;
  }>>(),
  milestones: json("milestones").$type<Array<{
    title: string;
    deadline: string;
    completed: boolean;
  }>>(),
  notes: text("notes"),
  counselorNotes: text("counselor_notes"),
  counselorId: text("counselor_id").references(() => users.id), // Assigned counselor
  currentPhase: text("current_phase"), // Current phase of the career plan
  actionSteps: json("action_steps").$type<Array<{
    step: string;
    deadline: string;
    completed: boolean;
    completedAt: string;
  }>>(),
  status: text("status").notNull().default("active"), // "active" | "achieved" | "changed"
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export type CareerPlan = typeof careerPlans.$inferSelect;

// ============================================================================
// RIASEC RESULTS TABLE
// ============================================================================

export const riasecResults = pgTable("riasec_results", {
  id: text("id").primaryKey(),
  assessmentId: text("assessment_id").references(() => assessments.id, { onDelete: "cascade" }),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  scores: json("scores").$type<{
    realistic: number;
    investigative: number;
    artistic: number;
    social: number;
    enterprising: number;
    conventional: number;
  }>().notNull(),
  primaryHollandCode: text("primary_holland_code").notNull(),
  secondaryHollandCode: text("secondary_holland_code").notNull(),
  hollandCode: text("holland_code"), // The 3-letter RIASEC code
  recommendedCareers: json("recommended_careers").$type<string[]>().notNull(),
  // traits column removed - doesn't exist in actual database
  completedAt: timestamp("completed_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
}, (table) => ({
  userIdIdx: index("idx_riasec_results_user_id").on(table.userId),
  userCreatedAtIdx: index("idx_riasec_results_user_created").on(table.userId, table.createdAt),
}));

export type RiasecResult = typeof riasecResults.$inferSelect;

// ============================================================================
// MBTI RESULTS TABLE
// ============================================================================

export const mbtiResults = pgTable("mbti_results", {
  id: text("id").primaryKey(),
  assessmentId: text("assessment_id").references(() => assessments.id, { onDelete: "cascade" }),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  personalityType: text("personality_type").notNull(), // "INTJ", "ENFP", etc.
  scores: json("scores").$type<{
    e: number;
    i: number;
    s: number;
    n: number;
    t: number;
    f: number;
    j: number;
    p: number;
  }>().notNull(),
  description: text("description").notNull(),
  strengths: json("strengths").$type<string[]>().notNull(),
  weaknesses: json("weaknesses").$type<string[]>().notNull(),
  recommendedCareers: json("recommended_careers").$type<string[]>().notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
}, (table) => ({
  userIdIdx: index("idx_mbti_results_user_id").on(table.userId),
}));

export type MBTIResult = typeof mbtiResults.$inferSelect;

// ============================================================================
// DISC RESULTS TABLE
// ============================================================================

export const discResults = pgTable("disc_results", {
  id: text("id").primaryKey(),
  assessmentId: text("assessment_id").references(() => assessments.id, { onDelete: "cascade" }),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  dominantStyle: text("dominant_style").notNull(), // "D" | "I" | "S" | "C"
  scores: json("scores").$type<{
    d: number;
    i: number;
    s: number;
    c: number;
  }>().notNull(),
  description: text("description").notNull(),
  strengths: json("strengths").$type<string[]>().notNull(),
  weaknesses: json("weaknesses").$type<string[]>().notNull(),
  recommendedCareers: json("recommended_careers").$type<string[]>().notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
}, (table) => ({
  userIdIdx: index("idx_disc_results_user_id").on(table.userId),
}));

export type DiscResult = typeof discResults.$inferSelect;

// ============================================================================
// WORK VALUES RESULTS TABLE
// ============================================================================

export const workValuesResults = pgTable("work_values_results", {
  id: text("id").primaryKey(),
  assessmentId: text("assessment_id").references(() => assessments.id, { onDelete: "cascade" }),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  topValues: json("top_values").$type<Array<{
    value: string;
    score: number;
  }>>().notNull(),
  description: text("description").notNull(),
  recommendedCareers: json("recommended_careers").$type<string[]>().notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
}, (table) => ({
  userIdIdx: index("idx_work_values_results_user_id").on(table.userId),
}));

export type WorkValuesResult = typeof workValuesResults.$inferSelect;

// ============================================================================
// LEARNING STYLES RESULTS TABLE
// ============================================================================

export const learningStylesResults = pgTable("learning_styles_results", {
  id: text("id").primaryKey(),
  assessmentId: text("assessment_id").references(() => assessments.id, { onDelete: "cascade" }),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  visualScore: integer("visual_score").notNull(),
  auditoryScore: integer("auditory_score").notNull(),
  kinestheticScore: integer("kinesthetic_score").notNull(),
  dominantStyle: text("dominant_style").notNull(), // "visual" | "auditory" | "kinesthetic"
  recommendations: json("recommendations").$type<string[]>().notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
}, (table) => ({
  userIdIdx: index("idx_learning_styles_results_user_id").on(table.userId),
}));

export type LearningStylesResult = typeof learningStylesResults.$inferSelect;

// ============================================================================
// LEARNING MODULES TABLE
// ============================================================================

export const learningModules = pgTable("learning_modules", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  subjectId: text("subject_id").references(() => subjects.id),
  classId: text("class_id").references(() => classes.id),
  teacherId: text("teacher_id").references(() => users.id),
  category: text("category").notNull(), // "subject" | "skill" | "exam_prep" | "career"
  level: text("level").notNull(), // "beginner" | "intermediate" | "advanced"
  duration: integer("duration").notNull(), // in minutes
  content: json("content").$type<LearningModuleContent>(),
  thumbnail: text("thumbnail").notNull(),
  isPublic: boolean("is_public").default(false),
  isPremium: boolean("is_premium").default(false),
  isPublished: boolean("is_published").default(false),
  price: integer("price").default(0),
  tags: json("tags").$type<string[]>(),
  objectives: json("objectives").$type<string[]>(),
  prerequisites: json("prerequisites").$type<string[]>(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export type LearningModule = typeof learningModules.$inferSelect;

// ============================================================================
// MODULE PROGRESS TABLE
// ============================================================================

export const moduleProgress = pgTable("module_progress", {
  id: text("id").primaryKey(),
  studentId: text("student_id").references(() => users.id, { onDelete: "cascade" }),
  moduleId: text("module_id").references(() => learningModules.id, { onDelete: "cascade" }),
  status: text("status").notNull(), // "not_started" | "in_progress" | "completed"
  isCompleted: boolean("is_completed"), // Computed field for easier queries
  progress: integer("progress").notNull(), // 0-100
  completedLessons: json("completed_lessons").$type<string[]>(),
  currentLesson: text("current_lesson"),
  timeSpent: integer("time_spent").notNull(), // in seconds
  lastAccessedAt: timestamp("last_accessed_at", { withTimezone: true }).notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  certificateUrl: text("certificate_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export type ModuleProgress = typeof moduleProgress.$inferSelect;

// ============================================================================
// TUITION COURSES TABLE
// ============================================================================

export const tuitionCourses = pgTable("tuition_courses", {
  id: text("id").primaryKey(),
  tutorId: text("tutor_id").references(() => users.id, { onDelete: "cascade" }),
  subjectId: text("subject_id").references(() => subjects.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // "subject" | "exam_prep" | "skill"
  level: text("level").notNull(), // "class6" | "class7" | ... | "class12"
  grade: integer("grade").notNull(),
  duration: integer("duration").notNull(), // in minutes
  pricePerSession: integer("price_per_session").notNull(),
  price: integer("price"), // Total price for the course
  discountPrice: integer("discount_price"), // Discounted price
  currency: text("currency").notNull().default("BTN"),
  maxStudents: integer("max_students").notNull(),
  currentStudents: integer("current_students").default(0),
  currentEnrollments: integer("current_enrollments").default(0), // Virtual field, computed
  maxEnrollments: integer("max_enrollments"),
  schedule: json("schedule").$type<Array<{
    day: string;
    startTime: string;
    endTime: string;
  }>>(),
  mode: text("mode").notNull(), // "online" | "in_person" | "hybrid"
  location: text("location"), // Can be JSON string with district, area, fullAddress, coordinates
  schoolId: text("school_id"),
  meetingLink: text("meeting_link"),
  thumbnail: text("thumbnail").notNull(),
  tags: json("tags").$type<string[]>(),
  requirements: json("requirements").$type<string[]>(),
  prerequisites: json("prerequisites").$type<string[]>(),
  type: text("type"), // Course type (e.g., "regular", "crash_course")
  gradeLevel: integer("grade_level"), // Target grade level
  status: text("status"), // "draft" | "published" | "archived"
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export type TuitionCourse = typeof tuitionCourses.$inferSelect;

// ============================================================================
// TUITION ENROLLMENTS TABLE
// ============================================================================

export const tuitionEnrollments = pgTable("tuition_enrollments", {
  id: text("id").primaryKey(),
  courseId: text("course_id").references(() => tuitionCourses.id, { onDelete: "cascade" }),
  studentId: text("student_id").references(() => users.id, { onDelete: "cascade" }),
  tutorId: text("tutor_id").references(() => users.id, { onDelete: "cascade" }),
  status: text("status").notNull(), // "active" | "completed" | "cancelled" | "suspended"
  enrollmentDate: text("enrollment_date").notNull(),
  enrolledAt: timestamp("enrolled_at", { withTimezone: true }),
  completionDate: text("completion_date"),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  sessionsCompleted: integer("sessions_completed").default(0),
  totalPaid: integer("total_paid").default(0),
  amountPaid: integer("amount_paid"), // Alias for totalPaid
  tutorEarnings: integer("tutor_earnings"),
  notes: text("notes"),
  rating: integer("rating"), // 1-5
  review: text("review"),
  currentEnrollments: integer("current_enrollments"), // Virtual field, computed
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export type TuitionEnrollment = typeof tuitionEnrollments.$inferSelect;

// ============================================================================
// TUTORS TABLE
// ============================================================================

export const tutors = pgTable("tutors", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }).unique(),
  bio: text("bio").notNull(),
  subjects: json("subjects").$type<Array<{
    subjectId: string;
    subjectName: string;
    proficiency: string; // "beginner" | "intermediate" | "expert"
  }>>().notNull(),
  qualifications: json("qualifications").$type<Array<{
    degree: string;
    institution: string;
    year: number;
  }>>().notNull(),
  experience: integer("experience").notNull(), // in years
  hourlyRate: integer("hourly_rate").notNull(),
  hourlyRateOnline: integer("hourly_rate_online"), // Online session rate
  currency: text("currency").notNull().default("BTN"),
  availability: json("availability").$type<Array<{
    day: string;
    slots: Array<{
      start: string;
      end: string;
    }>;
  }>>(),
  teachingMode: text("teaching_mode").notNull(), // "online" | "in_person" | "both"
  location: text("location"),
  district: text("district"),
  department: text("department"),
  gradeLevels: json("grade_levels").$type<number[]>(), // Grade levels tutor can teach
  averageRating: integer("average_rating"), // 0-500 (5.00 * 100)
  totalReviews: integer("total_reviews").default(0),
  totalStudents: integer("total_students").default(0),
  isVerified: boolean("is_verified").default(false),
  verificationDocument: text("verification_document"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export type Tutor = typeof tutors.$inferSelect;

// ============================================================================
// TUTOR EARNINGS TABLE
// ============================================================================

export const tutorEarnings = pgTable("tutor_earnings", {
  id: text("id").primaryKey(),
  tutorId: text("tutor_id").references(() => users.id, { onDelete: "cascade" }),
  enrollmentId: text("enrollment_id").references(() => tuitionEnrollments.id),
  amount: integer("amount").notNull(),
  netAmount: integer("net_amount"), // Alias for amount - commission/refund adjusted
  currency: text("currency").notNull().default("BTN"),
  type: text("type").notNull(), // "session" | "bonus" | "refund" | "commission"
  status: text("status").notNull(), // "pending" | "available" | "withdrawn"
  payoutStatus: text("payout_status"), // "pending" | "processing" | "paid"
  sessionDate: text("session_date").notNull(),
  earnedAt: timestamp("earned_at", { withTimezone: true }),
  withdrawnAt: timestamp("withdrawn_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
});

export type TutorEarning = typeof tutorEarnings.$inferSelect;

// ============================================================================
// LIVE SESSIONS TABLE
// ============================================================================

export const liveSessions = pgTable("live_sessions", {
  id: text("id").primaryKey(),
  courseId: text("course_id").references(() => tuitionCourses.id, { onDelete: "cascade" }),
  tutorId: text("tutor_id").references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  scheduledStart: text("scheduled_start").notNull(),
  startTime: text("start_time"), // Alias for scheduledStart
  scheduledDate: text("scheduled_date"), // Alias for scheduledStart (date only)
  scheduledEnd: text("scheduled_end").notNull(),
  endTime: text("end_time"), // Session end time
  actualStart: timestamp("actual_start", { withTimezone: true }),
  actualStartTime: timestamp("actual_start_time", { withTimezone: true }), // Alias for actualStart
  actualEnd: timestamp("actual_end", { withTimezone: true }),
  actualEndTime: timestamp("actual_end_time", { withTimezone: true }), // Alias for actualEnd
  meetingLink: text("meeting_link"),
  meetingId: text("meeting_id"),
  meetingPassword: text("meeting_password"), // Meeting password for secure access
  platform: text("platform"), // Meeting platform (zoom, google meet, etc.)
  recordingUrl: text("recording_url"),
  subject: text("subject"), // Session subject
  status: text("status").notNull(), // "scheduled" | "live" | "completed" | "cancelled"
  participants: integer("participants").default(0),
  maxParticipants: integer("maxparticipants"),
  currentParticipants: integer("current_participants"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export type LiveSession = typeof liveSessions.$inferSelect;

// ============================================================================
// TUTOR REVIEWS TABLE
// ============================================================================

export const tutorReviews = pgTable("tutor_reviews", {
  id: text("id").primaryKey(),
  tutorId: text("tutor_id").references(() => users.id, { onDelete: "cascade" }),
  studentId: text("student_id").references(() => users.id, { onDelete: "cascade" }),
  enrollmentId: text("enrollment_id").references(() => tuitionEnrollments.id),
  rating: integer("rating").notNull(), // 1-5
  review: text("review").notNull(),
  response: text("response"),
  isVerified: boolean("is_verified").default(false),
  isPublic: boolean("is_public").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export type TutorReview = typeof tutorReviews.$inferSelect;

// ============================================================================
// LEAVE REQUESTS TABLE
// ============================================================================

export const leaveRequests = pgTable("leave_requests", {
  id: text("id").primaryKey(),
  studentId: text("student_id").references(() => users.id, { onDelete: "cascade" }),
  schoolId: text("school_id").references(() => schools.id),
  applicantId: text("applicant_id").references(() => users.id),
  applicantType: text("applicant_type"), // "student" | "teacher" | "staff"
  type: text("type").notNull(), // "sick" | "vacation" | "emergency" | "family" | "other"
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  reason: text("reason").notNull(),
  status: text("status").notNull(), // "pending" | "approved" | "rejected" | "cancelled"
  approvedBy: text("approved_by").references(() => users.id),
  substituteTeacherId: text("substitute_teacher_id").references(() => users.id), // Teacher covering during leave
  leaveHandoverNotes: text("leave_handover_notes"), // Notes for handover before leaving
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  rejectionReason: text("rejection_reason"),
  documents: json("documents").$type<string[]>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export type LeaveRequest = typeof leaveRequests.$inferSelect;

// ============================================================================
// LEAVE BALANCES TABLE
// ============================================================================

export const leaveBalances = pgTable("leave_balances", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  schoolId: text("school_id").references(() => schools.id),
  leaveType: text("leave_type").notNull(), // "sick" | "vacation" | "emergency" | "family" | "other" | "casual" | "official"
  year: integer("year").notNull(), // Academic/Calendar year
  totalDays: integer("total_days").notNull().default(0), // Total allocated days
  usedDays: integer("used_days").notNull().default(0), // Days used so far
  remainingDays: integer("remaining_days").notNull().default(0), // Calculated remaining
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export type LeaveBalance = typeof leaveBalances.$inferSelect;

// ============================================================================
// CIRCULATION TABLE
// ============================================================================

export const circulation = pgTable("circulation", {
  id: text("id").primaryKey(),
  bookId: text("book_id").references(() => books.id, { onDelete: "cascade" }),
  studentId: text("student_id").references(() => users.id, { onDelete: "cascade" }),
  borrowerId: text("borrower_id").references(() => users.id),
  borrowDate: text("borrow_date").notNull(),
  dueDate: text("due_date").notNull(),
  returnDate: text("return_date"),
  status: text("status").notNull(), // "borrowed" | "returned" | "overdue" | "lost"
  fine: integer("fine").default(0),
  finePaid: boolean("fine_paid").default(false),
  renewals: integer("renewals").default(0),
  maxRenewals: integer("max_renewals").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
}, (table) => ({
  // Indexes for frequently queried columns
  bookIdIdx: index("idx_circulation_book_id").on(table.bookId),
  borrowerIdIdx: index("idx_circulation_borrower_id").on(table.borrowerId),
  statusIdx: index("idx_circulation_status").on(table.status),
  dueDateIdx: index("idx_circulation_due_date").on(table.dueDate),
  // Composite index for borrower + status (common query pattern)
  borrowerStatusIdx: index("idx_circulation_borrower_status").on(table.borrowerId, table.status),
}));

export type Circulation = typeof circulation.$inferSelect;


// ============================================================================
// LIBRARY RESERVATIONS TABLE
// ============================================================================

export const libraryReservations = pgTable("library_reservations", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").references(() => schools.id, { onDelete: "cascade" }),
  bookId: text("book_id").references(() => books.id, { onDelete: "cascade" }),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  reservationDate: text("reservation_date").notNull(),
  expiryDate: text("expiry_date").notNull(),
  status: text("status").notNull(), // "pending" | "ready" | "fulfilled" | "cancelled" | "expired"
  priority: integer("priority").default(1), // Higher priority gets the book first
  notifiedDate: text("notified_date"), // When user was notified book is ready
  fulfilledDate: text("fulfilled_date"), // When reservation was fulfilled
  cancelledDate: text("cancelled_date"),
  cancellationReason: text("cancellation_reason"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
}, (table) => ({
  // Indexes for frequently queried columns
  schoolIdIdx: index("idx_library_reservations_school_id").on(table.schoolId),
  bookIdIdx: index("idx_library_reservations_book_id").on(table.bookId),
  userIdIdx: index("idx_library_reservations_user_id").on(table.userId),
  statusIdx: index("idx_library_reservations_status").on(table.status),
  expiryDateIdx: index("idx_library_reservations_expiry_date").on(table.expiryDate),
  // Composite index for book + status (common query pattern)
  bookStatusIdx: index("idx_library_reservations_book_status").on(table.bookId, table.status),
}));

export type LibraryReservation = typeof libraryReservations.$inferSelect;

// Library relations will be defined at the end of the file after all tables are defined

// ============================================================================
// DIGITAL RESOURCES TABLE
// ============================================================================

export const digitalResources = pgTable("digital_resources", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").references(() => schools.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  resourceType: text("resource_type").notNull(), // "ebook" | "audio" | "video" | "document" | "journal" | "magazine"
  format: text("format").notNull(), // "pdf" | "epub" | "mp3" | "mp4" | "doc" etc.
  fileUrl: text("file_url").notNull(),
  fileSize: integer("file_size"), // in bytes
  duration: integer("duration"), // For audio/video in seconds
  pages: integer("pages"), // For ebooks/documents
  author: text("author"),
  publisher: text("publisher"),
  publicationYear: integer("publication_year"),
  isbn: text("isbn"),
  category: text("category"),
  tags: json("tags").$type<string[]>(),
  language: text("language").default("en"),
  coverImage: text("cover_image"),
  accessLevel: text("access_level").notNull(), // "public" | "student" | "teacher" | "admin"
  downloadAllowed: boolean("download_allowed").default(true),
  viewCount: integer("view_count").default(0),
  downloadCount: integer("download_count").default(0),
  isActive: boolean("is_active").default(true),
  uploadedBy: text("uploaded_by").references(() => users.id),
  licenseInfo: text("license_info"),
  sourceUrl: text("source_url"), // External source URL if applicable
  expirationDate: text("expiration_date"), // For temporary access resources
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
}, (table) => ({
  // Indexes for frequently queried columns
  schoolIdIdx: index("idx_digital_resources_school_id").on(table.schoolId),
  resourceTypeIdx: index("idx_digital_resources_resource_type").on(table.resourceType),
  categoryIdx: index("idx_digital_resources_category").on(table.category),
  accessLevelIdx: index("idx_digital_resources_access_level").on(table.accessLevel),
  isActiveIdx: index("idx_digital_resources_is_active").on(table.isActive),
}));

export type DigitalResource = typeof digitalResources.$inferSelect;

// digitalResourcesRelations will be defined at the end of the file after all tables are defined

// ============================================================================
// CONSENT RECORDS TABLE
// ============================================================================

export const consentRecords = pgTable("consent_records", {
  id: text("id").primaryKey(),
  studentId: text("student_id").references(() => users.id, { onDelete: "cascade" }),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  parentId: text("parent_id").references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // "field_trip" | "photos" | "medical" | "data" | "activities"
  title: text("title").notNull(),
  description: text("description").notNull(),
  status: text("status").notNull(), // "pending" | "approved" | "declined" | "revoked"
  consentGiven: boolean("consent_given").default(false),
  consentDate: timestamp("consent_date", { withTimezone: true }),
  ipAddress: text("ip_address"),
  documentUrl: text("document_url"),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
}, (table) => ({
  // Indexes for frequently queried columns
  userIdIdx: index("idx_consent_records_user_id").on(table.userId),
  parentIdIdx: index("idx_consent_records_parent_id").on(table.parentId),
  studentIdIdx: index("idx_consent_records_student_id").on(table.studentId),
  typeIdx: index("idx_consent_records_type").on(table.type),
  statusIdx: index("idx_consent_records_status").on(table.status),
}));

export type ConsentRecord = typeof consentRecords.$inferSelect;

// ============================================================================
// COUNSELOR NOTES TABLE
// ============================================================================

export const counselorNotes = pgTable("counselor_notes", {
  id: text("id").primaryKey(),
  counselorId: text("counselor_id").references(() => users.id, { onDelete: "cascade" }),
  studentId: text("student_id").references(() => users.id, { onDelete: "cascade" }),
  noteType: text("note_type").notNull(), // "session" | "observation" | "intervention" | "follow_up"
  title: text("title").notNull(),
  note: text("note"), // Main note content
  content: text("content").notNull(),
  isConfidential: boolean("is_confidential").default(false),
  isPrivate: boolean("is_private").default(false),
  tags: json("tags").$type<string[]>(),
  relatedIssues: json("related_issues").$type<string[]>(),
  actionItems: json("action_items").$type<Array<{
    action: string;
    completed: boolean;
    dueDate: string;
  }>>(),
  followUpDate: text("follow_up_date"),
  sessionDate: text("session_date").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
}, (table) => ({
  // Indexes for frequently queried columns
  counselorIdIdx: index("idx_counselor_notes_counselor_id").on(table.counselorId),
  studentIdIdx: index("idx_counselor_notes_student_id").on(table.studentId),
  noteTypeIdx: index("idx_counselor_notes_note_type").on(table.noteType),
  sessionDateIdx: index("idx_counselor_notes_session_date").on(table.sessionDate),
  // Composite index for counselor + student (common query pattern)
  counselorStudentIdx: index("idx_counselor_notes_counselor_student").on(table.counselorId, table.studentId),
}));

export type CounselorNote = typeof counselorNotes.$inferSelect;

// ============================================================================
// COUNSELING SESSIONS TABLE
// ============================================================================

export const counselingSessions = pgTable("counseling_sessions", {
  id: text("id").primaryKey(),
  counselorId: text("counselor_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  studentId: text("student_id").references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull().default("individual"), // "individual" | "group" | "family" | "crisis"
  status: text("status").notNull().default("scheduled"), // "scheduled" | "in_progress" | "completed" | "cancelled" | "no_show"
  sessionDate: timestamp("session_date", { withTimezone: true }).notNull(),
  startTime: text("start_time").notNull(), // Format: "HH:MM"
  endTime: text("end_time").notNull(), // Format: "HH:MM"
  location: text("location"), // Physical location or virtual meeting link
  topic: text("topic"),
  notes: text("notes"),
  outcome: text("outcome"), // Summary of session outcome
  actionItems: json("action_items").$type<Array<{
    action: string;
    assignedTo: string;
    dueDate: string;
    completed: boolean;
  }>>(),
  isRecurring: boolean("is_recurring").default(false),
  recurringPattern: text("recurring_pattern"), // "weekly" | "biweekly" | "monthly"
  recurringEndDate: timestamp("recurring_end_date", { withTimezone: true }),
  parentSessionId: text("parent_session_id").references(() => counselingSessions.id, { onDelete: "cascade" }), // For recurring sessions
  schoolId: text("school_id").references(() => schools.id, { onDelete: "cascade" }),
  confidentialityLevel: text("confidentiality_level").default("standard"), // "standard" | "high" | "critical"
  tags: json("tags").$type<string[]>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
}, (table) => ({
  // Indexes for frequently queried columns
  counselorIdIdx: index("idx_counseling_sessions_counselor_id").on(table.counselorId),
  studentIdIdx: index("idx_counseling_sessions_student_id").on(table.studentId),
  statusIdx: index("idx_counseling_sessions_status").on(table.status),
  sessionDateIdx: index("idx_counseling_sessions_session_date").on(table.sessionDate),
  schoolIdIdx: index("idx_counseling_sessions_school_id").on(table.schoolId),
  // Composite index for counselor + date (common query pattern)
  counselorDateIdx: index("idx_counseling_sessions_counselor_date").on(table.counselorId, table.sessionDate),
  // Composite index for student + status (common query pattern)
  studentStatusIdx: index("idx_counseling_sessions_student_status").on(table.studentId, table.status),
}));

export type CounselingSession = typeof counselingSessions.$inferSelect;

// ============================================================================
// STUDENT INTERVENTIONS TABLE
// ============================================================================

export const studentInterventions = pgTable("student_interventions", {
  id: text("id").primaryKey(),
  counselorId: text("counselor_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  studentId: text("student_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  schoolId: text("school_id").references(() => schools.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // "academic" | "behavioral" | "personal" | "career" | "social"
  category: text("category").notNull(), // e.g., "Grade Improvement", "Attendance Issues", "Social Adjustment"
  priority: text("priority").notNull().default("medium"), // "low" | "medium" | "high" | "urgent"
  status: text("status").notNull().default("active"), // "planned" | "active" | "monitoring" | "completed" | "cancelled"
  description: text("description").notNull(),
  goals: json("goals").$type<Array<{
    id: string;
    text: string;
    status: "pending" | "in_progress" | "completed";
    targetDate?: string;
  }>>(),
  startDate: timestamp("start_date", { withTimezone: true }).notNull(),
  targetDate: timestamp("target_date", { withTimezone: true }).notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  followUpDate: timestamp("follow_up_date", { withTimezone: true }),
  progress: integer("progress").default(0), // 0-100
  notes: json("notes").$type<Array<{
    id: string;
    content: string;
    createdBy: string;
    createdAt: string;
  }>>(),
  outcome: text("outcome"), // Summary of the intervention outcome
  outcomeRating: text("outcome_rating"), // "successful" | "partially_successful" | "unsuccessful"
  tags: json("tags").$type<string[]>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export type StudentIntervention = typeof studentInterventions.$inferSelect;
export type NewStudentIntervention = typeof studentInterventions.$inferInsert;

// ============================================================================
// INTERVENTION PROGRESS NOTES TABLE
// ============================================================================

export const interventionNotes = pgTable("intervention_notes", {
  id: text("id").primaryKey(),
  interventionId: text("intervention_id").references(() => studentInterventions.id, { onDelete: "cascade" }).notNull(),
  counselorId: text("counselor_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  content: text("content").notNull(),
  progressUpdate: integer("progress_update"), // New progress value after this note
  statusChange: text("status_change"), // If status changed with this note
  milestoneReached: boolean("milestone_reached").default(false),
  milestoneDescription: text("milestone_description"),
  isConfidential: boolean("is_confidential").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
});

export type InterventionNote = typeof interventionNotes.$inferSelect;
export type NewInterventionNote = typeof interventionNotes.$inferInsert;

// ============================================================================
// RED FLAGS TABLE (Counselor Portal - GNH Sentinel)
// ============================================================================

/**
 * Red Flags - AI-generated early warning system for at-risk students
 * Part of "The GNH Sentinel" - counselor's proactive student well-being monitoring
 */
export const redFlags = pgTable("red_flags", {
  id: text("id").primaryKey(),
  studentId: text("student_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  counselorId: text("counselor_id").references(() => users.id, { onDelete: "set null" }),
  schoolId: text("school_id").references(() => schools.id, { onDelete: "cascade" }),

  // Flag details
  severity: text("severity").notNull(), // "low" | "medium" | "high" | "critical"
  flagType: text("flag_type").notNull(), // "attendance" | "behavior" | "academic" | "wellness" | "combined"

  // AI-generated analysis
  patternDetected: json("pattern_detected").$type<{
    categories: string[];
    description: string;
    confidence: number;
  }>(),
  aiRecommendation: text("ai_recommendation"),
  gnhPrinciple: text("gnh_principle"), // GNH domain affected (e.g., "psychological wellbeing")

  // Source data
  behaviorLogIds: json("behavior_log_ids").$type<string[]>(),
  attendanceData: json("attendance_data").$type<{
    rate: number;
    lates: number;
    absences: number;
    period: string;
  }>(),
  academicData: json("academic_data").$type<{
    avgMarks: number;
    failingSubjects: string[];
    trend: "declining" | "stable" | "improving";
  }>(),

  // Status
  status: text("status").notNull().default("flagged"), // "flagged" | "reviewed" | "intervention_planned" | "resolved" | "dismissed"

  // Resolution
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  reviewedBy: text("reviewed_by").references(() => users.id, { onDelete: "set null" }),
  interventionId: text("intervention_id"), // Links to studentInterventions
  resolutionNotes: text("resolution_notes"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
}, (table) => ({
  studentIdIdx: index("idx_red_flags_student_id").on(table.studentId),
  counselorIdIdx: index("idx_red_flags_counselor_id").on(table.counselorId),
  schoolIdIdx: index("idx_red_flags_school_id").on(table.schoolId),
  severityIdx: index("idx_red_flags_severity").on(table.severity),
  statusIdx: index("idx_red_flags_status").on(table.status),
  createdAtIdx: index("idx_red_flags_created_at").on(table.createdAt),
}));

export type RedFlag = typeof redFlags.$inferSelect;
export type NewRedFlag = typeof redFlags.$inferInsert;

// ============================================================================
// CAREER APPROVALS TABLE (Counselor Portal - Career Alignment)
// ============================================================================

/**
 * Career Approvals - Human counselor endorsement for student career paths
 * Part of "Career Alignment" - counselor reviews AI career roadmaps before RUB scholarships
 */
export const careerApprovals = pgTable("career_approvals", {
  id: text("id").primaryKey(),
  studentId: text("student_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  counselorId: text("counselor_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  careerMatchId: text("career_match_id"), // References careerMatches table

  // Career details
  careerTitle: text("career_title").notNull(),
  careerField: text("career_field"), // e.g., "engineering", "medicine", "education"
  targetRUBCollege: text("target_rub_college"), // e.g., "CST", "Sherubtse", "Paro College"
  targetProgram: text("target_program"),

  // Counselor assessment
  approvalStatus: text("approval_status").notNull().default("pending"), // "pending" | "approved" | "approved_with_reservations" | "not_recommended"
  suitabilityScore: integer("suitability_score"), // 0-100 counselor's assessment
  counselorNotes: text("counselor_notes"),
  reservations: text("reservations"), // Specific concerns for "approved_with_reservations"

  // Alignment checks
  academicAlignment: text("academic_alignment"), // "well_aligned" | "needs_improvement" | "misaligned"
  skillsGap: json("skills_gap").$type<string[]>(),
  recommendedPreparation: json("recommended_preparation").$type<Array<{
    action: string;
    priority: "high" | "medium" | "low";
    timeline: string;
  }>>(),

  // RUB scholarship linkage
  scholarshipReady: boolean("scholarship_ready").default(false),
  recommendedScholarships: json("recommended_scholarships").$type<Array<{
    scholarshipId: string;
    name: string;
    suitability: string;
  }>>(),

  // Timeline
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  validUntil: timestamp("valid_until", { withTimezone: true }), // Approval expires after 1 year

  // GNH alignment
  gnhAlignment: json("gnh_alignment").$type<string[]>(), // GNH principles this career supports

  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
}, (table) => ({
  studentIdIdx: index("idx_career_approvals_student_id").on(table.studentId),
  counselorIdIdx: index("idx_career_approvals_counselor_id").on(table.counselorId),
  statusIdx: index("idx_career_approvals_status").on(table.approvalStatus),
  careerTitleIdx: index("idx_career_approvals_career_title").on(table.careerTitle),
  createdAtIdx: index("idx_career_approvals_created_at").on(table.createdAt),
}));

export type CareerApproval = typeof careerApprovals.$inferSelect;
export type NewCareerApproval = typeof careerApprovals.$inferInsert;

// ============================================================================
// WIZARD PROGRESS TABLE
// ============================================================================

export const wizardProgress = pgTable("wizard_progress", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }).unique(),
  currentStep: text("current_step").notNull(),
  completedSteps: json("completed_steps").$type<string[]>(),
  data: json("data").$type<Record<string, any>>(),
  isCompleted: boolean("is_completed").default(false),
  completed: boolean("completed").default(false), // Alias for isCompleted
  lastUpdated: timestamp("last_updated", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export type WizardProgress = typeof wizardProgress.$inferSelect;

// ============================================================================
// FILE STORAGE TABLE
// ============================================================================

export const fileStorage = pgTable("file_storage", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  fileName: text("file_name").notNull(),
  originalName: text("original_name").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(), // in bytes
  path: text("path").notNull(),
  url: text("url").notNull(),
  category: text("category").notNull(), // "profile" | "homework" | "document" | "certificate" | "other"
  isPublic: boolean("is_public").default(false),
  accessCount: integer("access_count").default(0), // Number of times the file has been accessed
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
});

export type FileStorage = typeof fileStorage.$inferSelect;

// ============================================================================
// SCHOOL EVENTS TABLE
// ============================================================================

export const schoolEvents = pgTable("school_events", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").references(() => schools.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  eventType: text("event_type").notNull(), // "academic" | "sports" | "cultural" | "holiday" | "exam" | "meeting" | "other"
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  location: text("location").notNull(),
  isAllDay: boolean("is_all_day").default(false),
  targetAudience: json("target_audience").$type<string[]>(), // ["all", "students", "teachers", "parents", "class_X"]
  isRecurring: boolean("is_recurring").default(false),
  recurrencePattern: text("recurrence_pattern"), // "daily" | "weekly" | "monthly" | "yearly"
  status: text("status").notNull(), // "upcoming" | "ongoing" | "completed" | "cancelled"
  reminders: json("reminders").$type<Array<{
    type: string;
    minutes: number;
  }>>(),
  attachments: json("attachments").$type<string[]>(),
  createdBy: text("created_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export type SchoolEvent = typeof schoolEvents.$inferSelect;
export type NewSchoolEvent = typeof schoolEvents.$inferInsert;

// ============================================================================
// EVENT REGISTRATIONS TABLE
// ============================================================================

/**
 * Event registrations / RSVPs
 * Tracks user registrations for school events
 */
export const eventRegistrations = pgTable("event_registrations", {
  id: text("id").primaryKey(),
  eventId: text("event_id").notNull().references(() => schoolEvents.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  schoolId: text("school_id").notNull().references(() => schools.id, { onDelete: "cascade" }),

  // Registration details
  status: text("status").notNull().default("registered"), // "registered" | "confirmed" | "cancelled" | "attended" | "no_show"
  registrationType: text("registration_type").notNull().default("rsvp"), // "rsvp" | "ticketed" | "waitlist"

  // Additional information
  notes: text("notes"), // User notes for registration
  attendees: integer("attendees").default(1), // Number of attendees (for family events)
  guardianName: text("guardian_name"), // For student events requiring guardian
  guardianContact: text("guardian_contact"),

  // Check-in tracking
  checkedInAt: timestamp("checked_in_at", { withTimezone: true }),
  checkedInBy: text("checked_in_by").references(() => users.id),

  // Responses to event questions
  responses: json("responses").$type<Record<string, string | string[]>>(),

  // Communication
  reminderSent: boolean("reminder_sent").default(false),
  reminderSentAt: timestamp("reminder_sent_at", { withTimezone: true }),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
}, (table) => ({
  eventIdIdx: index("idx_event_registrations_event_id").on(table.eventId),
  userIdIdx: index("idx_event_registrations_user_id").on(table.userId),
  schoolIdIdx: index("idx_event_registrations_school_id").on(table.schoolId),
  statusIdx: index("idx_event_registrations_status").on(table.status),
  // Composite index for event + user (ensure unique registration)
  eventUserIdx: index("idx_event_registrations_event_user").on(table.eventId, table.userId),
}));

export type EventRegistration = typeof eventRegistrations.$inferSelect;
export type NewEventRegistration = typeof eventRegistrations.$inferInsert;

// ============================================================================
// DATA SOURCES TABLE
// ============================================================================

export const dataSources = pgTable("data_sources", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // "api" | "database" | "file" | "manual"
  endpoint: text("endpoint").notNull(),
  authMethod: text("auth_method"), // "none" | "api_key" | "oauth" | "basic"
  config: json("config").$type<Record<string, any>>(),
  lastSyncAt: timestamp("last_sync_at", { withTimezone: true }),
  status: text("status").notNull(), // "active" | "inactive" | "error"
  errorMessage: text("error_message"),
  syncFrequency: integer("sync_frequency"), // in minutes
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export type DataSource = typeof dataSources.$inferSelect;

// ============================================================================
// CAREERS TABLE (Job/Career Information)
// ============================================================================

export const careers = pgTable("careers", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  name: text("name").notNull(), // Alias for title, for compatibility
  slug: text("slug").notNull().unique(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  industry: text("industry").notNull(),
  riasecCode: text("riasec_code"), // R, I, A, S, E, C
  hollandCodes: json("holland_codes").$type<string[]>(),
  educationLevel: text("education_level").notNull(), // "high_school" | "certificate" | "diploma" | "bachelor" | "master" | "phd"
  typicalSalary: text("typical_salary"),
  salaryCurrency: text("salary_currency").default("BTN"),
  growthOutlook: text("growth_outlook"), // "growing" | "stable" | "declining"
  skills: json("skills").$type<string[]>(),
  subjects: json("subjects").$type<string[]>(),
  workEnvironment: text("work_environment").notNull(),
  bhutanSpecific: boolean("bhutan_specific").default(false),
  bhutanDemand: text("bhutan_demand"), // "high" | "medium" | "low"
  rubPrograms: json("rub_programs").$type<Array<{
    collegeId: string;
    programId: string;
    programName: string;
  }>>(),
  isActive: boolean("is_active").default(true),
  viewCount: integer("view_count").default(0),
  icon: text("icon").notNull(),
  color: text("color").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export type Career = typeof careers.$inferSelect;

// ============================================================================
// EXPORT ALIASES FOR BACKWARD COMPATIBILITY
// ============================================================================

// These aliases map to the re-exported tables from separate schema files
export const colleges = rubColleges;
export const scholarships = rubScholarships;
export const examResults = examResultsEnhanced;

// Announcement reads table for tracking read receipts
export const announcementReads = pgTable("announcement_reads", {
  id: text("id").primaryKey(),
  announcementId: text("announcement_id").references(() => announcements.id, { onDelete: "cascade" }).notNull(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  readAt: timestamp("read_at", { withTimezone: true }).notNull(),
});

export type AnnouncementRead = typeof announcementReads.$inferSelect;

// Tuition categories table
export const tuitionCategories = pgTable("tuition_categories", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export type TuitionCategory = typeof tuitionCategories.$inferSelect;

// ============================================================================
// MINISTRY PORTAL TABLES
// ============================================================================

// Ministry policies table for national education policies
export const ministryPolicies = pgTable("ministry_policies", {
  id: text("id").primaryKey(),
  category: text("category").notNull(), // assessment, curriculum, calendar, career, etc.
  title: text("title").notNull(),
  description: text("description"),
  effectiveDate: text("effective_date"), // Date as string for compatibility
  status: text("status").notNull().default("active"), // active, draft, archived
  createdBy: text("created_by").notNull(), // userId of ministry user
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  attachments: jsonb("attachments"), // PDFs, documents related to policy
  scope: text("scope").notNull().default("national"), // national, regional, school-level
});

export type MinistryPolicy = typeof ministryPolicies.$inferSelect;
export type NewMinistryPolicy = typeof ministryPolicies.$inferInsert;

// Curriculum standards table for subject requirements per grade
export const curriculumStandards = pgTable("curriculum_standards", {
  id: text("id").primaryKey(),
  subject: text("subject").notNull(), // Mathematics, English, Dzongkha, etc.
  grade: text("grade").notNull(), // PP, 1, 2, ..., 12
  hoursRequired: integer("hours_required").notNull().default(40),
  topics: jsonb("topics"), // Array of topics with hours
  practicalRatio: integer("practical_ratio").notNull().default(20), // % of practical vs theory
  assessmentCriteria: jsonb("assessment_criteria"), // Grading criteria
  effectiveFrom: text("effective_from"), // Date as string
  effectiveTo: text("effective_to"), // Date as string
  status: text("status").notNull().default("active"),
  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export type CurriculumStandard = typeof curriculumStandards.$inferSelect;
export type NewCurriculumStandard = typeof curriculumStandards.$inferInsert;

// ============================================================================
// RE-EXPORT MESSAGING SCHEMA
// ============================================================================

export {
  conversations,
  messages,
  notificationPreferences,
  notificationQueue,
} from "./messaging-schema";

export type {
  Conversation,
  Message,
  NotificationPreference,
  NotificationQueueItem,
} from "./messaging-schema";

// ============================================================================
// PARENT-TEACHER CHAT
// ============================================================================

export {
  parentTeacherConversations,
  parentTeacherMessages,
} from "./parent-teacher-chat-schema";

export type {
  ParentTeacherConversation,
  NewParentTeacherConversation,
  ParentTeacherMessage,
  NewParentTeacherMessage,
} from "./parent-teacher-chat-schema";

// ============================================================================
// AI INTERACTIONS TABLE
// ============================================================================

// AI interactions tracking for analytics and personalization
export const aiInteractions = pgTable("ai_interactions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  featureId: text("feature_id").notNull(), // "ai-career-coach", "skill-gap-analyzer", "scholarship-matcher", etc.
  interactionData: json("interaction_data").$type<Record<string, any>>(), // Stores message, response length, interests, concerns, etc.
  metadata: json("metadata").$type<Record<string, any>>(), // Additional tracking data
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type AIInteraction = typeof aiInteractions.$inferSelect;
export type NewAIInteraction = typeof aiInteractions.$inferInsert;

// ============================================================================
// PLATFORM ADMIN COMMAND CENTER TABLES
// ============================================================================

// Daily SITREP (Situation Report) records for platform admin briefings
export const sitrepReports = pgTable("sitrep_reports", {
  id: text("id").primaryKey(),
  reportDate: text("report_date").notNull().unique(), // Format: YYYY-MM-DD
  healthStatus: text("health_status").notNull(), // "healthy" | "degraded" | "critical"
  growthData: json("growth_data").notNull().$type<{
    newSchools: number;
    newUsers: number;
    newStudents: number;
    newTeachers: number;
    churnedSchools: number;
    growthPercentage: number;
  }>(),
  revenueData: json("revenue_data").notNull().$type<{
    mrr: number; // Monthly Recurring Revenue
    overdueInvoices: number;
    overdueAmount: number;
    paidThisMonth: number;
    pendingInvoices: number;
  }>(),
  activityData: json("activity_data").notNull().$type<{
    aiConsultations: number;
    assessmentsCompleted: number;
    topCareer: string;
    topCareerTrend: "up" | "down" | "stable";
    activeNow: number;
  }>(),
  anomalyCount: integer("anomaly_count").notNull().default(0),
  actionItemCount: integer("action_item_count").notNull().default(0),
  aiGeneratedSummary: text("ai_generated_summary"), // AI-generated narrative
  generatedBy: text("generated_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type SitrepReport = typeof sitrepReports.$inferSelect;
export type NewSitrepReport = typeof sitrepReports.$inferInsert;

// Anomaly alerts detected by the AI Sentinel
export const anomalyAlerts = pgTable("anomaly_alerts", {
  id: text("id").primaryKey(),
  severity: text("severity").notNull(), // "low" | "medium" | "high" | "critical"
  type: text("type").notNull(), // "seat_limit" | "overdue_payment" | "low_engagement" | "api_error" | "system_health"
  entityId: text("entity_id").notNull(), // school_id, invoice_id, etc.
  entityType: text("entity_type").notNull(), // "school" | "invoice" | "user" | "system"
  title: text("title").notNull(),
  message: text("message").notNull(),
  suggestedAction: text("suggested_action"),
  status: text("status").notNull().default("open"), // "open" | "acknowledged" | "resolved" | "dismissed"
  acknowledgedBy: text("acknowledged_by").references(() => users.id, { onDelete: "set null" }),
  acknowledgedAt: timestamp("acknowledged_at", { withTimezone: true }),
  resolvedBy: text("resolved_by").references(() => users.id, { onDelete: "set null" }),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  resolution: text("resolution"),
  metadata: json("metadata").$type<Record<string, any>>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type AnomalyAlert = typeof anomalyAlerts.$inferSelect;
export type NewAnomalyAlert = typeof anomalyAlerts.$inferInsert;

// System health metrics daily snapshots
export const systemHealthMetrics = pgTable("system_health_metrics", {
  id: text("id").primaryKey(),
  snapshotDate: text("snapshot_date").notNull().unique(), // Format: YYYY-MM-DD
  apiLatency: integer("api_latency"), // Average API response time in ms
  errorRate: decimal("error_rate", { precision: 5, scale: 2 }), // Percentage
  activeUsers: integer("active_users").notNull().default(0),
  totalRequests: integer("total_requests").notNull().default(0),
  failedRequests: integer("failed_requests").notNull().default(0),
  aiServiceStatus: text("ai_service_status").notNull(), // "operational" | "degraded" | "down"
  databaseStatus: text("database_status").notNull(), // "operational" | "degraded" | "down"
  storageUsage: integer("storage_usage").notNull().default(0), // In bytes
  storageLimit: integer("storage_limit").notNull().default(0), // In bytes
  uptime: decimal("uptime", { precision: 5, scale: 2 }), // Percentage
  metadata: json("metadata").$type<Record<string, any>>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type SystemHealthMetric = typeof systemHealthMetrics.$inferSelect;
export type NewSystemHealthMetric = typeof systemHealthMetrics.$inferInsert;

// Knowledge drafts for AI-ingested content awaiting review
export const knowledgeDrafts = pgTable("knowledge_drafts", {
  id: text("id").primaryKey(),
  sourceType: text("source_type").notNull(), // "rub" | "scholarship" | "career" | "college"
  sourceUrl: text("source_url"),
  sourceName: text("source_name"), // Display name
  rawContent: text("raw_content"),
  structuredData: json("structured_data").notNull().$type<Record<string, any>>(),
  confidenceScore: decimal("confidence_score", { precision: 3, scale: 2 }), // 0.00 to 1.00
  status: text("status").notNull().default("pending"), // "pending" | "approved" | "rejected"
  reviewedBy: text("reviewed_by").references(() => users.id, { onDelete: "set null" }),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  reviewNotes: text("review_notes"),
  ingestMethod: text("ingest_method").notNull(), // "ai_parse" | "manual" | "bulk_import"
  estimatedRecords: integer("estimated_records"), // How many records will be created
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type KnowledgeDraft = typeof knowledgeDrafts.$inferSelect;
export type NewKnowledgeDraft = typeof knowledgeDrafts.$inferInsert;

// RUB requirement mappings (knowledge base for career matching)
export const rubRequirements = pgTable("rub_requirements", {
  id: text("id").primaryKey(),
  collegeId: text("college_id").notNull(), // References RUB college
  programId: text("program_id"), // References specific program
  programName: text("program_name").notNull(),
  educationLevel: text("education_level").notNull(), // "undergraduate" | "diploma" | "certificate"
  requiredSubjects: json("required_subjects").notNull().$type<Array<{
    subject: string;
    minimumGrade: string; // e.g., "A", "B", "C"
    minimumPercentage: number;
  }>>(),
  aggregateRequirements: json("aggregate_requirements").$type<{
    minimumPercentage?: number;
    subjectsToConsider?: string[];
    englishRequired?: boolean;
    dzongkhaRequired?: boolean;
  }>(),
  additionalRequirements: text("additional_requirements"),
  intakeCapacity: integer("intake_capacity"),
  duration: text("duration"), // e.g., "4 years", "2 years"
  isActive: boolean("is_active").notNull().default(true),
  effectiveFrom: text("effective_from"), // YYYY-MM-DD
  effectiveUntil: text("effective_until"), // YYYY-MM-DD or null for ongoing
  sourceDraftId: text("source_draft_id").references(() => knowledgeDrafts.id, { onDelete: "set null" }),
  metadata: json("metadata").$type<Record<string, any>>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type RubRequirement = typeof rubRequirements.$inferSelect;
export type NewRubRequirement = typeof rubRequirements.$inferInsert;

// National scholarships database (beyond RUB scholarships)
export const nationalScholarships = pgTable("national_scholarships", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  provider: text("provider").notNull(), // e.g., "DAHE", "RUB", "Private"
  type: text("type").notNull(), // "merit" | "need" | "sports" | "specific_field"
  educationLevel: text("education_level").notNull(), // "undergraduate" | "postgraduate"
  eligibilityCriteria: json("eligibility_criteria").notNull().$type<{
    minimumPercentage?: number;
    stream?: string[];
    subjects?: string[];
    familyIncomeLimit?: number;
    district?: string[];
    gender?: string;
  }>(),
  benefits: json("benefits").notNull().$type<{
    covers: string[]; // ["tuition", "living_allowance", "books"]
    amount?: number;
    currency?: string;
    notes?: string;
  }>(),
  applicationDeadline: text("application_deadline"), // YYYY-MM-DD or "rolling"
  applicationUrl: text("application_url"),
  documentsRequired: json("documents_required").$type<string[]>(),
  isActive: boolean("is_active").notNull().default(true),
  academicYear: text("academic_year"), // e.g., "2024-2025"
  sourceDraftId: text("source_draft_id").references(() => knowledgeDrafts.id, { onDelete: "set null" }),
  metadata: json("metadata").$type<Record<string, any>>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type NationalScholarship = typeof nationalScholarships.$inferSelect;
export type NewNationalScholarship = typeof nationalScholarships.$inferInsert;

// ============================================================================
// SUPPORT TICKETS TABLE
// ============================================================================

// Support tickets for managing user support requests
export const supportTickets = pgTable("support_tickets", {
  id: text("id").primaryKey(),
  ticketNumber: text("ticket_number").notNull().unique(), // Format: TKT-YYYY-NNNN
  subject: text("subject").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // "bug" | "feature_request" | "question" | "billing" | "technical" | "account"
  priority: text("priority").notNull().default("medium"), // "critical" | "high" | "medium" | "low"
  status: text("status").notNull().default("open"), // "open" | "in_progress" | "waiting" | "resolved" | "closed"
  schoolId: text("school_id").references(() => schools.id, { onDelete: "set null" }),
  createdById: text("created_by_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdByRole: text("created_by_role").notNull(), // "student" | "teacher" | "parent" | "school_admin" | "counselor"
  assignedToId: text("assigned_to_id").references(() => users.id, { onDelete: "set null" }),
  assignedToName: text("assigned_to_name"), // Display name for team/agent
  resolution: text("resolution"), // Final resolution summary
  resolutionTime: integer("resolution_time"), // Time to resolve in minutes
  satisfactionRating: integer("satisfaction_rating"), // 1-5 stars
  satisfactionFeedback: text("satisfaction_feedback"),
  attachments: json("attachments").$type<Array<{
    id: string;
    name: string;
    url: string;
    type: string;
    size: number;
  }>>(),
  tags: json("tags").$type<string[]>(),
  source: text("source").notNull().default("portal"), // "portal" | "email" | "api" | "phone"
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  closedAt: timestamp("closed_at", { withTimezone: true }),
  lastResponseAt: timestamp("last_response_at", { withTimezone: true }),
  responseCount: integer("response_count").notNull().default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export type SupportTicket = typeof supportTickets.$inferSelect;
export type NewSupportTicket = typeof supportTickets.$inferInsert;

// Support ticket responses for tracking conversation
export const supportTicketResponses = pgTable("support_ticket_responses", {
  id: text("id").primaryKey(),
  ticketId: text("ticket_id").notNull().references(() => supportTickets.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  userRole: text("user_role").notNull(), // "admin" | "agent" | "customer"
  userName: text("user_name").notNull(), // Display name
  message: text("message").notNull(),
  isInternal: boolean("is_internal").notNull().default(false), // Internal notes between agents
  attachments: json("attachments").$type<Array<{
    id: string;
    name: string;
    url: string;
    type: string;
    size: number;
  }>>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
});

export type SupportTicketResponse = typeof supportTicketResponses.$inferSelect;
export type NewSupportTicketResponse = typeof supportTicketResponses.$inferInsert;

// Support agents/team members for ticket assignment
export const supportAgents = pgTable("support_agents", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  role: text("role").notNull(), // "agent" | "lead" | "manager"
  team: text("team").notNull(), // "Support" | "Tech" | "Finance" | "Dev"
  specialties: json("specialties").$type<string[]>(), // Categories they handle
  isActive: boolean("is_active").notNull().default(true),
  maxConcurrentTickets: integer("max_concurrent_tickets").notNull().default(10),
  currentTicketCount: integer("current_ticket_count").notNull().default(0),
  averageResponseTime: integer("average_response_time"), // in minutes
  totalTicketsResolved: integer("total_tickets_resolved").notNull().default(0),
  satisfactionScore: integer("satisfaction_score"), // Average rating 1-5
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export type SupportAgent = typeof supportAgents.$inferSelect;
export type NewSupportAgent = typeof supportAgents.$inferInsert;

// ============================================================================
// REPORT CARDS TABLE
// ============================================================================

export const reportCards = pgTable("report_cards", {
  id: text("id").primaryKey(),
  studentId: text("student_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  schoolId: text("school_id").notNull().references(() => schools.id, { onDelete: "cascade" }),
  classId: text("class_id").references(() => classes.id, { onDelete: "set null" }),
  examId: text("exam_id").references(() => examResultsEnhanced.id, { onDelete: "set null" }),
  term: text("term").notNull(), // "First Term" | "Second Term" | "Final Term"
  academicYear: text("academic_year").notNull(),
  templateType: text("template_type").notNull().default("standard"), // "standard" | "primary" | "secondary" | "custom"
  // Student information (snapshot at time of generation)
  studentName: text("student_name").notNull(),
  rollNumber: text("roll_number"),
  grade: text("grade").notNull(), // Class grade (e.g., "10", "12")
  section: text("section"),
  // Academic performance
  subjects: json("subjects").$type<Array<{
    subjectId: string;
    subjectName: string;
    marksObtained: number;
    maxMarks: number;
    grade: string;
    remarks: string;
    teacherName: string;
  }>>().notNull(),
  overallPercentage: integer("overall_percentage").notNull(),
  overallGrade: text("overall_grade").notNull(),
  totalMarks: integer("total_marks").notNull(),
  maxTotalMarks: integer("max_total_marks").notNull(),
  rank: integer("rank"),
  classRank: integer("class_rank"),
  totalStudents: integer("total_students"),
  // Attendance
  totalDays: integer("total_days").notNull(),
  presentDays: integer("present_days").notNull(),
  absentDays: integer("absent_days").notNull(),
  attendancePercentage: integer("attendance_percentage").notNull(),
  // Remarks and signatures
  classTeacherRemarks: text("class_teacher_remarks"),
  principalRemarks: text("principal_remarks"),
  classTeacherName: text("class_teacher_name"),
  principalName: text("principal_name"),
  // PDF storage
  pdfUrl: text("pdf_url"), // URL to stored PDF
  pdfGeneratedAt: timestamp("pdf_generated_at", { withTimezone: true }),
  // Status
  status: text("status").notNull().default("draft"), // "draft" | "generated" | "sent" | "viewed"
  sentToParentAt: timestamp("sent_to_parent_at", { withTimezone: true }),
  parentViewedAt: timestamp("parent_viewed_at", { withTimezone: true }),
  // Metadata
  generatedBy: text("generated_by").references(() => users.id, { onDelete: "set null" }),
  generatedAt: timestamp("generated_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
}, (table) => ({
  studentIdx: index("idx_report_cards_student").on(table.studentId),
  schoolIdx: index("idx_report_cards_school").on(table.schoolId),
  termYearIdx: index("idx_report_cards_term_year").on(table.term, table.academicYear),
  statusIdx: index("idx_report_cards_status").on(table.status),
}));

export type ReportCard = typeof reportCards.$inferSelect;
export type NewReportCard = typeof reportCards.$inferInsert;

// Report card templates for schools
export const reportCardTemplates = pgTable("report_card_templates", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").notNull().references(() => schools.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  templateType: text("template_type").notNull(), // "primary" | "middle" | "secondary" | "senior_secondary"
  // Layout configuration
  layout: json("layout").$type<{
    showLogo: boolean;
    showSchoolName: boolean;
    showStudentPhoto: boolean;
    showAttendance: boolean;
    showActivities: boolean;
    showRemarks: boolean;
    subjectsPerPage: number;
    orientation: "portrait" | "landscape";
  }>().notNull(),
  // Styling
  colors: json("colors").$type<{
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  }>(),
  // Custom sections
  customSections: json("custom_sections").$type<Array<{
    title: string;
    content: string;
    position: "header" | "footer" | "left" | "right";
  }>>(),
  // Signature configuration
  signatures: json("signatures").$type<{
    showClassTeacher: boolean;
    showPrincipal: boolean;
    showParent: boolean;
    customSignatures: Array<{ title: string; name: string }>;
  }>(),
  isActive: boolean("is_active").notNull().default(true),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export type ReportCardTemplate = typeof reportCardTemplates.$inferSelect;
export type NewReportCardTemplate = typeof reportCardTemplates.$inferInsert;

// ============================================================================
// NOTICES / ANNOUNCEMENTS TABLE
// ============================================================================

export const notices = pgTable("notices", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").notNull().references(() => schools.id, { onDelete: "cascade" }),
  createdBy: text("created_by").notNull().references(() => users.id, { onDelete: "set null" }),

  // Notice content
  title: text("title").notNull(),
  content: text("content").notNull(),
  category: text("category").notNull(), // "general" | "urgent" | "academic" | "events" | "holiday"
  priority: text("priority").notNull().default("normal"), // "low" | "normal" | "high" | "urgent"

  // Target audience
  targetAudience: text("target_audience").notNull().default("all"), // "all" | "students" | "teachers" | "parents" | "specific_class" | "specific_role"
  targetGrade: integer("target_grade"), // For specific class targeting
  targetSection: text("target_section"),
  targetRole: text("target_role"), // For specific role targeting

  // Attachments
  attachments: json("attachments").$type<Array<{
    id: string;
    name: string;
    url: string;
    type: string;
    size: number;
  }>>(),

  // Publishing
  isPublished: boolean("is_published").notNull().default(false),
  publishAt: timestamp("publish_at", { withTimezone: true }),
  expiryDate: timestamp("expiry_date", { withTimezone: true }),

  // Engagement tracking
  viewCount: integer("view_count").notNull().default(0),
  acknowledgements: json("acknowledgements").$type<string[]>(), // User IDs who acknowledged

  // Pinned notices stay at top
  isPinned: boolean("is_pinned").notNull().default(false),
  pinOrder: integer("pin_order"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
}, (table) => ({
  schoolIdx: index("idx_notices_school").on(table.schoolId),
  publishedIdx: index("idx_notices_published").on(table.isPublished),
  priorityIdx: index("idx_notices_priority").on(table.priority),
  expiryIdx: index("idx_notices_expiry").on(table.expiryDate),
}));

export type Notice = typeof notices.$inferSelect;
export type NewNotice = typeof notices.$inferInsert;

// ============================================================================
// EVENTS / CALENDAR TABLE
// ============================================================================

export const events = pgTable("events", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").notNull().references(() => schools.id, { onDelete: "cascade" }),
  createdBy: text("created_by").notNull().references(() => users.id, { onDelete: "set null" }),

  // Event details
  title: text("title").notNull(),
  description: text("description"),
  eventType: text("event_type").notNull(), // "academic" | "holiday" | "exam" | "sports" | "cultural" | "meeting" | "other"
  category: text("category").notNull().default("general"),

  // Date and time
  startDate: timestamp("start_date", { withTimezone: true }).notNull(),
  endDate: timestamp("end_date", { withTimezone: true }),
  isAllDay: boolean("is_all_day").notNull().default(false),
  startTime: text("start_time"), // HH:MM format
  endTime: text("end_time"),

  // Location
  location: text("location"),
  venue: text("venue"),

  // Target audience
  targetAudience: text("target_audience").notNull().default("all"), // "all" | "students" | "teachers" | "parents" | "specific_class"

  // Event status
  status: text("status").notNull().default("upcoming"), // "upcoming" | "ongoing" | "completed" | "cancelled"
  isHoliday: boolean("is_holiday").notNull().default(false),

  // Registration/RSVP
  requiresRegistration: boolean("requires_registration").notNull().default(false),
  registrationDeadline: timestamp("registration_deadline", { withTimezone: true }),
  maxParticipants: integer("max_participants"),
  registeredCount: integer("registered_count").notNull().default(0),

  // Resources
  attachments: json("attachments").$type<Array<{
    id: string;
    name: string;
    url: string;
  }>>(),

  // Recurring events
  isRecurring: boolean("is_recurring").notNull().default(false),
  recurrencePattern: text("recurrence_pattern"), // "daily" | "weekly" | "monthly" | "yearly"
  recurrenceEndDate: timestamp("recurrence_end_date", { withTimezone: true }),

  // Color coding for calendar
  color: text("color"), // Hex color code

  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
}, (table) => ({
  schoolIdx: index("idx_events_school").on(table.schoolId),
  startDateIdx: index("idx_events_start_date").on(table.startDate),
  eventTypeIdx: index("idx_events_type").on(table.eventType),
  statusIdx: index("idx_events_status").on(table.status),
}));

export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;

// ============================================================================
// GATE PASSES TABLE
// ============================================================================

export const gatePasses = pgTable("gate_passes", {
  id: text("id").primaryKey(),
  studentId: text("student_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  schoolId: text("school_id").notNull().references(() => schools.id, { onDelete: "cascade" }),
  requestedBy: text("requested_by").references(() => users.id, { onDelete: "set null" }), // Parent or student
  approvedBy: text("approved_by").references(() => users.id, { onDelete: "set null" }), // Teacher or admin

  // Pass details
  passType: text("pass_type").notNull(), // "exit" | "late_entry" | "early_exit" | "outing"
  reason: text("reason").notNull(),
  destination: text("destination"), // Where student is going
  purpose: text("purpose"), // Detailed purpose

  // Date and time
  requestDate: timestamp("request_date", { withTimezone: true }).notNull(),
  exitTime: timestamp("exit_time", { withTimezone: true }),
  entryTime: timestamp("entry_time", { withTimezone: true }),
  expectedReturn: timestamp("expected_return", { withTimezone: true }),

  // Approval workflow
  status: text("status").notNull().default("pending"), // "pending" | "approved" | "rejected" | "used" | "expired"
  parentApproval: boolean("parent_approval").notNull().default(true), // Whether parent approval is required
  parentApprovedAt: timestamp("parent_approved_at", { withTimezone: true }),
  parentApprovedBy: text("parent_approved_by").references(() => users.id),
  teacherApprovedAt: timestamp("teacher_approved_at", { withTimezone: true }),

  // Verification (at gate)
  qrCode: text("qr_code"), // QR code data for verification
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  verifiedBy: text("verified_by").references(() => users.id), // Gate keeper/security

  // Companion (if going with someone)
  companionName: text("companion_name"),
  companionRelation: text("companion_relation"),
  companionPhone: text("companion_phone"),

  // Notes
  rejectionReason: text("rejection_reason"),
  notes: text("notes"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
}, (table) => ({
  studentIdx: index("idx_gate_passes_student").on(table.studentId),
  schoolIdx: index("idx_gate_passes_school").on(table.schoolId),
  statusIdx: index("idx_gate_passes_status").on(table.status),
  requestDateIdx: index("idx_gate_passes_request_date").on(table.requestDate),
}));

export type GatePass = typeof gatePasses.$inferSelect;
export type NewGatePass = typeof gatePasses.$inferInsert;

// ============================================================================
// MEDICAL RECORDS & INFIRMARY SYSTEM
// ============================================================================

/**
 * Medical visit records for students
 * Tracks all visits to the school infirmary/clinic
 */
export const medicalRecords = pgTable("medical_records", {
  id: text("id").primaryKey(),
  studentId: text("student_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  schoolId: text("school_id").notNull().references(() => schools.id, { onDelete: "cascade" }),
  visitedBy: text("visited_by").references(() => users.id, { onDelete: "set null" }), // School nurse/admin

  // Visit details
  visitDate: timestamp("visit_date", { withTimezone: true }).notNull(),
  visitType: text("visit_type").notNull(), // "routine" | "emergency" | "follow_up" | "scheduled"
  chiefComplaint: text("chief_complaint").notNull(),
  symptoms: json("symptoms").$type<string[]>(), // Array of symptoms

  // Vital signs
  temperature: text("temperature"), // Body temperature in Celsius
  bloodPressure: text("blood_pressure"), // e.g., "120/80"
  pulseRate: integer("pulse_rate"), // BPM
  respiratoryRate: integer("respiratory_rate"), // Breaths per minute
  weight: text("weight"), // In kg
  height: text("height"), // In cm
  oxygenSaturation: integer("oxygen_saturation"), // SpO2 percentage

  // Diagnosis and treatment
  diagnosis: text("diagnosis"),
  treatment: text("treatment").notNull(),
  medicationsPrescribed: json("medications_prescribed").$type<Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
  }>>(),
  notes: text("notes"),

  // Status and follow-up
  status: text("status").notNull().default("completed"), // "completed" | "follow_up_required" | "referred"
  followUpDate: timestamp("follow_up_date", { withTimezone: true }),
  isEmergency: boolean("is_emergency").default(false),
  parentNotified: boolean("parent_notified").default(false),

  // Discharge information
  dischargeCondition: text("discharge_condition"), // "stable" | "improved" | "referred" | "absent"
  dischargeTime: timestamp("discharge_time", { withTimezone: true }),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
}, (table) => ({
  studentIdx: index("idx_medical_records_student").on(table.studentId),
  schoolIdx: index("idx_medical_records_school").on(table.schoolId),
  visitDateIdx: index("idx_medical_records_visit_date").on(table.visitDate),
  statusIdx: index("idx_medical_records_status").on(table.status),
}));

export type MedicalRecord = typeof medicalRecords.$inferSelect;
export type NewMedicalRecord = typeof medicalRecords.$inferInsert;

/**
 * Student allergies and medical conditions
 * Tracks known allergies, chronic conditions, and special medical needs
 */
export const studentAllergies = pgTable("student_allergies", {
  id: text("id").primaryKey(),
  studentId: text("student_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  schoolId: text("school_id").notNull().references(() => schools.id, { onDelete: "cascade" }),

  // Allergy information
  allergenType: text("allergen_type").notNull(), // "food" | "medication" | "environmental" | "other"
  allergenName: text("allergen_name").notNull(),
  severity: text("severity").notNull(), // "mild" | "moderate" | "severe" | "life_threatening"
  reaction: text("reaction").notNull(), // Description of reaction

  // Chronic conditions
  conditionType: text("condition_type"), // "asthma" | "diabetes" | "epilepsy" | "heart_condition" | "other"
  conditionDetails: text("condition_details"),

  // Special medical needs
  specialNeeds: text("special_notes"),
  dietaryRestrictions: json("dietary_restrictions").$type<string[]>(),

  // Emergency management
  requiresEmergencyMedication: boolean("requires_emergency_medication").default(false),
  emergencyMedication: text("emergency_medication"),
  emergencyActionPlan: text("emergency_action_plan"),

  // Verification
  reportedBy: text("reported_by").references(() => users.id, { onDelete: "set null" }), // Parent/guardian
  verifiedBy: text("verified_by").references(() => users.id, { onDelete: "set null" }), // Medical professional
  verifiedAt: timestamp("verified_at", { withTimezone: true }),

  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
}, (table) => ({
  studentIdx: index("idx_student_allergies_student").on(table.studentId),
  schoolIdx: index("idx_student_allergies_school").on(table.schoolId),
  allergenTypeIdx: index("idx_student_allergies_type").on(table.allergenType),
  severityIdx: index("idx_student_allergies_severity").on(table.severity),
  isActiveIdx: index("idx_student_allergies_active").on(table.isActive),
}));

export type StudentAllergy = typeof studentAllergies.$inferSelect;
export type NewStudentAllergy = typeof studentAllergies.$inferInsert;

/**
 * Vaccination records for students
 * Tracks immunizations and vaccination history
 */
export const vaccinationRecords = pgTable("vaccination_records", {
  id: text("id").primaryKey(),
  studentId: text("student_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  schoolId: text("school_id").notNull().references(() => schools.id, { onDelete: "cascade" }),

  // Vaccine details
  vaccineName: text("vaccine_name").notNull(),
  vaccineType: text("vaccine_type").notNull(), // "bcg" | "polio" | "mmr" | "dpt" | "hepatitis_b" | "covid19" | "other"
  manufacturer: text("manufacturer"),
  batchNumber: text("batch_number"),
  lotNumber: text("lot_number"),

  // Administration details
  administrationDate: timestamp("administration_date", { withTimezone: true }).notNull(),
  administeredBy: text("administered_by").references(() => users.id, { onDelete: "set null" }),
  administrationSite: text("administration_site"), // "left_arm" | "right_arm" | "thigh"
  doseNumber: integer("dose_number"), // 1, 2, 3, etc. for multi-dose vaccines

  // Next dose
  requiresFollowUp: boolean("requires_follow_up").default(false),
  nextDoseDue: timestamp("next_dose_due", { withTimezone: true }),

  // Documentation
  certificateNumber: text("certificate_number"),
  certificateIssued: timestamp("certificate_issued", { withTimezone: true }),

  // School vaccination record
  isSchoolProvided: boolean("is_school_provided").default(false),
  recordedBy: text("recorded_by").references(() => users.id, { onDelete: "set null" }),

  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
}, (table) => ({
  studentIdx: index("idx_vaccination_records_student").on(table.studentId),
  schoolIdx: index("idx_vaccination_records_school").on(table.schoolId),
  vaccineTypeIdx: index("idx_vaccination_records_type").on(table.vaccineType),
  administrationDateIdx: index("idx_vaccination_records_date").on(table.administrationDate),
}));

export type VaccinationRecord = typeof vaccinationRecords.$inferSelect;
export type NewVaccinationRecord = typeof vaccinationRecords.$inferInsert;

/**
 * Medicine inventory for school infirmary
 * Tracks medicines, supplies, and stock levels
 */
export const medicineInventory = pgTable("medicine_inventory", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").notNull().references(() => schools.id, { onDelete: "cascade" }),

  // Medicine details
  medicineName: text("medicine_name").notNull(),
  genericName: text("generic_name"),
  category: text("category").notNull(), // "tablet" | "syrup" | "injection" | "ointment" | "drops" | "supplies"
  description: text("description"),

  // Stock information
  currentStock: integer("current_stock").notNull().default(0),
  minimumStock: integer("minimum_stock").notNull().default(10),
  maximumStock: integer("maximum_stock"),
  unit: text("unit").notNull(), // "tablets" | "ml" | "bottles" | "tubes" | "pieces"
  unitCost: text("unit_cost"), // Cost per unit

  // Expiry and batch
  expiryDate: timestamp("expiry_date", { withTimezone: true }),
  batchNumber: text("batch_number"),
  manufacturer: text("manufacturer"),
  supplier: text("supplier"),

  // Storage information
  storageLocation: text("storage_location"), // "shelf_a" | "refrigerator" | "cabinet"
  storageConditions: text("storage_conditions"), // Special storage requirements

  // Status
  status: text("status").notNull().default("available"), // "available" | "low_stock" | "expired" | "expired"
  isPrescriptionRequired: boolean("is_prescription_required").default(false),

  // Usage tracking
  lastRestocked: timestamp("restocked_date", { withTimezone: true }),
  lastUsed: timestamp("last_used", { withTimezone: true }),

  notes: text("notes"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
}, (table) => ({
  schoolIdx: index("idx_medicine_inventory_school").on(table.schoolId),
  categoryIdx: index("idx_medicine_inventory_category").on(table.category),
  statusIdx: index("idx_medicine_inventory_status").on(table.status),
  expiryDateIdx: index("idx_medicine_inventory_expiry").on(table.expiryDate),
}));

export type MedicineInventory = typeof medicineInventory.$inferSelect;
export type NewMedicineInventory = typeof medicineInventory.$inferInsert;

/**
 * Medicine stock transactions
 * Tracks all additions and usage of medicines
 */
export const medicineTransactions = pgTable("medicine_transactions", {
  id: text("id").primaryKey(),
  medicineId: text("medicine_id").notNull().references(() => medicineInventory.id, { onDelete: "cascade" }),
  schoolId: text("school_id").notNull().references(() => schools.id, { onDelete: "cascade" }),

  // Transaction details
  transactionType: text("transaction_type").notNull(), // "restock" | "usage" | "discard" | "adjustment"
  quantity: integer("quantity").notNull(), // Positive for restock, negative for usage
  transactionDate: timestamp("transaction_date", { withTimezone: true }).notNull(),

  // Reference information
  referenceType: text("reference_type"), // "medical_record" | "restock" | "expiry" | "adjustment"
  referenceId: text("reference_id"),

  // Performed by
  performedBy: text("performed_by").references(() => users.id, { onDelete: "set null" }),
  notes: text("notes"),

  // Stock after transaction
  stockAfter: integer("stock_after").notNull(),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
}, (table) => ({
  medicineIdx: index("idx_medicine_transactions_medicine").on(table.medicineId),
  schoolIdx: index("idx_medicine_transactions_school").on(table.schoolId),
  transactionDateIdx: index("idx_medicine_transactions_date").on(table.transactionDate),
  transactionTypeIdx: index("idx_medicine_transactions_type").on(table.transactionType),
}));

export type MedicineTransaction = typeof medicineTransactions.$inferSelect;
export type NewMedicineTransaction = typeof medicineTransactions.$inferInsert;

/**
 * Medical referrals to external healthcare providers
 * Tracks referrals to hospitals, specialists, or external clinics
 */
export const medicalReferrals = pgTable("medical_referrals", {
  id: text("id").primaryKey(),
  studentId: text("student_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  schoolId: text("school_id").notNull().references(() => schools.id, { onDelete: "cascade" }),
  medicalRecordId: text("medical_record_id").references(() => medicalRecords.id, { onDelete: "set null" }),

  // Referral details
  referralDate: timestamp("referral_date", { withTimezone: true }).notNull(),
  referredBy: text("referred_by").notNull().references(() => users.id, { onDelete: "set null" }), // School nurse/admin

  // Destination information
  facilityName: text("facility_name").notNull(),
  facilityType: text("facility_type").notNull(), // "hospital" | "clinic" | "specialist" | "diagnostic_center"
  facilityAddress: text("facility_address"),
  facilityPhone: text("facility_phone"),

  // Referral reason
  reason: text("reason").notNull(),
  urgency: text("urgency").notNull(), // "routine" | "urgent" | "emergency"
  specialty: text("specialty"), // "general" | "pediatrician" | "orthopedic" | "cardiologist" etc.

  // Status tracking
  status: text("status").notNull().default("pending"), // "pending" | "scheduled" | "completed" | "cancelled"
  appointmentDate: timestamp("appointment_date", { withTimezone: true }),
  appointmentTime: text("appointment_time"),

  // Follow-up
  responseReceived: boolean("response_received").default(false),
  responseNotes: text("response_notes"),
  followUpRequired: boolean("follow_up_required").default(false),

  // Parent notification
  parentNotified: boolean("parent_notified").default(false),
  parentNotifiedAt: timestamp("parent_notified_at", { withTimezone: true }),
  parentResponse: text("parent_response"),

  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
}, (table) => ({
  studentIdx: index("idx_medical_referrals_student").on(table.studentId),
  schoolIdx: index("idx_medical_referrals_school").on(table.schoolId),
  statusIdx: index("idx_medical_referrals_status").on(table.status),
  referralDateIdx: index("idx_medical_referrals_date").on(table.referralDate),
}));

export type MedicalReferral = typeof medicalReferrals.$inferSelect;
export type NewMedicalReferral = typeof medicalReferrals.$inferInsert;
