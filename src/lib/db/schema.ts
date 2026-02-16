import { pgTable, text, integer, boolean, timestamp, json, jsonb } from "drizzle-orm/pg-core";
import { sql, eq, and, or, desc, like, inArray } from "drizzle-orm";
import { rubColleges, rubScholarships } from "./rub-schema";
import { tenants } from "./tenancy-schema";

// Re-export tables from separate schema files
export {
  rubColleges,
  rubPrograms,
  rubApplications,
  rubScholarships,
  rubScholarshipApplications,
} from "./rub-schema";

export {
  busAttendance,
  vehicleMaintenance,
  vehicleTracking,
  transportIncidents,
} from "./transport-schema";

export {
  hostelBuildings,
  hostelRooms,
  hostelAllocations,
  hostelAttendance,
  hostelLeaveRequests,
  hostelFacilities,
  hostelMess,
} from "./hostel-schema";

export {
  inventoryItems,
  inventoryCategories,
  inventoryVendors, // CHANGED: was "inventoryVendors as vendors" - actual DB table is inventory_vendors
  purchaseOrders,
  inventoryTransactions, // CHANGED: was "inventoryTransactions as stockMovements" - actual DB table is inventory_transactions
} from "./inventory-schema";

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
  invoices,
  paymentMethods,
  discountCodes,
  discountUsages,
  paymentTransactions,
  usageRecords,
} from "./billing-schema";

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
  section: text("section"),
  rollNumber: text("roll_number"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  postalCode: text("postal_code"),
  country: text("country").notNull(),
  parentContact: text("parent_contact"),
  parentPhone: text("parent_phone"),
  emergencyContact: text("emergency_contact"),
  bloodGroup: text("blood_group"),
  enrollmentDate: text("enrollment_date").notNull(),
  lastLogin: text("last_login"),
  employeeId: text("employee_id"),
  // subjects: json("subjects").$type<string[]>(), // REMOVED: DB has text type, not json
  subjects: text("subjects"), // Database has text type
  tenantId: text("tenant_id").references(() => tenants.id),
  emailVerified: boolean("email_verified").default(false),
  onboardingComplete: boolean("onboarding_complete").default(false),
  classGrade: integer("class_grade"),
  parentId: text("parent_id").references(() => users.id),
  isActive: boolean("is_active").default(true),
  department: text("department"), // For teachers
  // Additional profile fields (optional)
  school: text("school"), // School name (free text field)
  interests: json("interests").$type<string[]>(), // Array of interests
  goals: text("goals"), // Career/education goals
  settings: json("settings").$type<Record<string, any>>(), // User settings including bio
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export type User = typeof users.$inferSelect;

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
  tenantId: text("tenant_id").references(() => tenants.id),
  districtId: text("district_id").references(() => districts.id),
  // domain: text("domain"), // REMOVED: Not in actual database
  isActive: boolean("is_active").default(true),
  // verifiedAt: timestamp("verified_at", { withTimezone: true }), // REMOVED: Not in actual database
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export type School = typeof schools.$inferSelect;

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
  students: json("students").$type<Array<{
    id: string;
    name: string;
    rollNumber: string;
  }>>(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export type Class = typeof classes.$inferSelect;

// ============================================================================
// SUBJECTS TABLE
// ============================================================================

export const subjects = pgTable("subjects", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").references(() => schools.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  nameDzongkha: text("name_dzongkha"), // Dzongkha translation
  code: text("code").unique().notNull(),
  type: text("type").notNull(), // "core" | "elective" | "language" | "additional"
  description: text("description").notNull(),
  grade: integer("grade"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

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
  questionData: json("question_data").$type<any>(),
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
});

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
  targetClassIds: json("target_class_ids").$type<string[]>(),
  targetUserIds: json("target_user_ids").$type<string[]>(),
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
});

export type FeePayment = typeof feePayments.$inferSelect;

// ============================================================================
// STUDENT FEES TABLE
// ============================================================================

export const studentFees = pgTable("student_fees", {
  id: text("id").primaryKey(),
  studentId: text("student_id").references(() => users.id, { onDelete: "cascade" }),
  feeType: text("fee_type").notNull(), // "tuition" | "library" | "lab" | "transport" | "hostel" | "activity" | "uniform" | "exam" | "other"
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
});

export type Homework = typeof homework.$inferSelect;

// ============================================================================
// HOMEWORK SUBMISSIONS TABLE
// ============================================================================

export const homeworkSubmissions = pgTable("homework_submissions", {
  id: text("id").primaryKey(),
  homeworkId: text("homework_id").references(() => homework.id, { onDelete: "cascade" }),
  studentId: text("student_id").references(() => users.id, { onDelete: "cascade" }),
  submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull(),
  content: json("content").$type<any>(),
  gradedAt: timestamp("graded_at", { withTimezone: true }).notNull(),
  score: integer("score").notNull(),
  feedback: text("feedback").notNull(),
  status: text("status").notNull(), // "submitted" | "graded" | "returned"
  isLate: boolean("is_late").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

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
  content: json("content").$type<any>(),
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
});

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
  subjectResults: json("subject_results").$type<Array<{
    subjectId: string;
    subjectName: string;
    marksObtained: number;
    maxMarks: number;
    grade: string;
    percentage: number;
  }>>(),
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
  traits: json("traits").$type<string[]>(),
  isVerified: boolean("is_verified").default(false), // Whether results are verified
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

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
});

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
});

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
  traits: json("traits").$type<string[]>(), // Personality traits based on results
  completedAt: timestamp("completed_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
});

export type RiasecResult = typeof riasecResults.$inferSelect;

// ============================================================================
// MBTI RESULTS TABLE
// ============================================================================

export const mbtiResults = pgTable("mbti_results", {
  id: text("id").primaryKey(),
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
});

export type MBTIResult = typeof mbtiResults.$inferSelect;

// ============================================================================
// DISC RESULTS TABLE
// ============================================================================

export const discResults = pgTable("disc_results", {
  id: text("id").primaryKey(),
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
});

export type DiscResult = typeof discResults.$inferSelect;

// ============================================================================
// WORK VALUES RESULTS TABLE
// ============================================================================

export const workValuesResults = pgTable("work_values_results", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  topValues: json("top_values").$type<Array<{
    value: string;
    score: number;
  }>>().notNull(),
  description: text("description").notNull(),
  recommendedCareers: json("recommended_careers").$type<string[]>().notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
});

export type WorkValuesResult = typeof workValuesResults.$inferSelect;

// ============================================================================
// LEARNING STYLES RESULTS TABLE
// ============================================================================

export const learningStylesResults = pgTable("learning_styles_results", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  visualScore: integer("visual_score").notNull(),
  auditoryScore: integer("auditory_score").notNull(),
  kinestheticScore: integer("kinesthetic_score").notNull(),
  dominantStyle: text("dominant_style").notNull(), // "visual" | "auditory" | "kinesthetic"
  recommendations: json("recommendations").$type<string[]>().notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
});

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
  content: json("content").$type<any>(),
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
// VEHICLES TABLE
// ============================================================================

export const vehicles = pgTable("vehicles", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").references(() => schools.id, { onDelete: "cascade" }),
  routeId: text("route_id").notNull(),
  assignedRouteId: text("assigned_route_id"), // Currently assigned route (can change)
  registrationNumber: text("registration_number").unique().notNull(),
  vehicleNumber: text("vehicle_number"), // Alias for registrationNumber
  vehicleType: text("vehicle_type").notNull(), // "bus" | "van" | "mini_bus"
  capacity: integer("capacity").notNull(),
  driverName: text("driver_name").notNull(),
  driverPhone: text("driver_phone").notNull(),
  driverLicense: text("driver_license").notNull(),
  conductorName: text("conductor_name"),
  conductorPhone: text("conductor_phone"),
  status: text("status").notNull(), // "active" | "maintenance" | "inactive"
  gpsEnabled: boolean("gps_enabled").default(true),
  trackingDeviceId: text("tracking_device_id"),
  insuranceExpiry: text("insurance_expiry"),
  pollutionExpiry: text("pollution_expiry"),
  fitnessExpiry: text("fitness_expiry"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export type Vehicle = typeof vehicles.$inferSelect;

// ============================================================================
// TRANSPORT ROUTES TABLE
// ============================================================================

export const transportRoutes = pgTable("transport_routes", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").references(() => schools.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  routeName: text("route_name"), // Alias for name
  routeNumber: text("route_number").unique().notNull(),
  startLocation: text("start_location").notNull(),
  endLocation: text("end_location").notNull(),
  stops: json("stops").$type<Array<{
    name: string;
    location: { lat: string; lng: string };
    time: string;
  }>>().notNull(),
  distance: integer("distance").notNull(), // in km
  estimatedTime: integer("estimated_time").notNull(), // in minutes
  fee: integer("fee").notNull(),
  morningStartTime: text("morning_start_time"), // Morning pickup start time
  afternoonEndTime: text("afternoon_end_time"), // Afternoon drop end time
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export type TransportRoute = typeof transportRoutes.$inferSelect;

// ============================================================================
// TRANSPORT ALLOCATIONS TABLE
// ============================================================================

export const transportAllocations = pgTable("transport_allocations", {
  id: text("id").primaryKey(),
  studentId: text("student_id").references(() => users.id, { onDelete: "cascade" }).unique(),
  routeId: text("route_id").references(() => transportRoutes.id, { onDelete: "cascade" }),
  vehicleId: text("vehicle_id").references(() => vehicles.id, { onDelete: "set null" }),
  schoolId: text("school_id").references(() => schools.id),
  stopName: text("stop_name").notNull(),
  pickupTime: text("pickup_time").notNull(),
  dropTime: text("drop_time").notNull(),
  academicYear: text("academic_year").notNull(),
  fee: integer("fee").notNull(),
  isPaid: boolean("is_paid").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export type TransportAllocation = typeof transportAllocations.$inferSelect;

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
});

export type Circulation = typeof circulation.$inferSelect;

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
});

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
});

export type CounselorNote = typeof counselorNotes.$inferSelect;

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

// Re-export additional tables from transport-schema
export {
  drivers,
} from "./transport-schema";

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
// RE-EXPORT NOTIFICATIONS SCHEMA
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
