import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql, eq, and, or, desc, like, inArray } from "drizzle-orm";
import { rubColleges, rubScholarships } from "./rub-schema";

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
  inventoryVendors as vendors,
  purchaseOrders,
  inventoryTransactions as stockMovements,
} from "./inventory-schema";

// ============================================================================
// USERS TABLE
// ============================================================================

export const users = sqliteTable("users", {
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
  profileImage: text("profile_image").notNull(),
  dateOfBirth: text("date_of_birth").notNull(),
  gender: text("gender").notNull(),
  grade: integer("grade").notNull(),
  section: text("section").notNull(),
  rollNumber: text("roll_number").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  postalCode: text("postal_code").notNull(),
  country: text("country").notNull(),
  parentContact: text("parent_contact").notNull(),
  parentPhone: text("parent_phone").notNull(),
  emergencyContact: text("emergency_contact").notNull(),
  bloodGroup: text("blood_group").notNull(),
  enrollmentDate: text("enrollment_date").notNull(),
  lastLogin: text("last_login").notNull(),
  employeeId: text("employee_id"),
  subjects: text("subjects", { mode: "json" }).$type<string[]>(),
  tenantId: text("tenant_id").references(() => tenants.id),
  emailVerified: integer("email_verified", { mode: "boolean" }).default(false),
  onboardingComplete: integer("onboarding_complete", { mode: "boolean" }).default(false),
  clerkId: text("clerk_id").unique(),
  classGrade: integer("class_grade"),
  parentId: text("parent_id").references(() => users.id),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export type User = typeof users.$inferSelect;

// ============================================================================
// SCHOOLS TABLE
// ============================================================================

export const schools = sqliteTable("schools", {
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
  facilities: text("facilities", { mode: "json" }).$type<string[]>(),
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
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export type School = typeof schools.$inferSelect;

// ============================================================================
// BOOKS TABLE
// ============================================================================

export const books = sqliteTable("books", {
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
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export type Book = typeof books.$inferSelect;

// ============================================================================
// CLASSES TABLE
// ============================================================================

export const classes = sqliteTable("classes", {
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
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export type Class = typeof classes.$inferSelect;

// ============================================================================
// SUBJECTS TABLE
// ============================================================================

export const subjects = sqliteTable("subjects", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").references(() => schools.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  code: text("code").unique().notNull(),
  type: text("type").notNull(), // "core" | "elective" | "language" | "additional"
  description: text("description").notNull(),
  grade: integer("grade"),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export type Subject = typeof subjects.$inferSelect;

// ============================================================================
// ASSESSMENT TYPES TABLE
// ============================================================================

export const assessmentTypes = sqliteTable("assessment_types", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  duration: integer("duration").notNull(), // in minutes
  passingScore: integer("passing_score").notNull(), // out of 100
  totalQuestions: integer("total_questions").notNull(),
  category: text("category"),
  targetAudience: text("target_audience"),
  targetGrade: integer("target_grade"),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export type AssessmentType = typeof assessmentTypes.$inferSelect;

// ============================================================================
// ASSESSMENT QUESTIONS TABLE
// ============================================================================

export const assessmentQuestions = sqliteTable("assessment_questions", {
  id: text("id").primaryKey(),
  assessmentTypeId: text("assessment_type_id").references(() => assessmentTypes.id, { onDelete: "cascade" }),
  questionText: text("question_text").notNull(),
  questionData: text("question_data", { mode: "json" }).$type<any>(),
  options: text("options", { mode: "json" }).$type<string[]>(),
  correctAnswer: text("correct_answer").notNull(),
  points: integer("points").notNull(),
  order: integer("order").notNull(),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export type AssessmentQuestion = typeof assessmentQuestions.$inferSelect;

// ============================================================================
// ASSESSMENT RESULTS TABLE
// ============================================================================

export const assessmentResults = sqliteTable("assessment_results", {
  id: text("id").primaryKey(),
  assessmentId: text("assessment_id").references(() => assessments.id, { onDelete: "cascade" }),
  studentId: text("student_id").references(() => users.id, { onDelete: "cascade" }),
  questionId: text("question_id").references(() => assessmentQuestions.id),
  selectedOptionId: text("selected_option_id").references(() => assessmentQuestions.options),
  selectedOptionText: text("selected_option_text").notNull(),
  answer: text("answer").notNull(),
  score: integer("score").notNull(),
  points: integer("points").notNull(),
  isPassed: integer("is_passed", { mode: "boolean" }).default(true),
  completedAt: integer("completed_at", { mode: "timestamp" }).notNull(),
  startedAt: integer("started_at", { mode: "timestamp" }).notNull(),
  timeSpent: integer("time_spent").notNull(), // in seconds
  feedback: text("feedback").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export type AssessmentResult = typeof assessmentResults.$inferSelect;

// ============================================================================
// ASSESSMENT SUBMISSIONS TABLE
// ============================================================================

export const assessmentSubmissions = sqliteTable("assessment_submissions", {
  id: text("id").primaryKey(),
  assessmentId: text("assessment_id").references(() => assessments.id, { onDelete: "cascade" }),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  assignedBy: text("assigned_by").references(() => users.id, { onDelete: "cascade" }),
  status: text("status").notNull(), // "pending" | "submitted" | "graded" | "returned"
  score: integer("score"),
  feedback: text("feedback"),
  submittedAt: integer("submitted_at", { mode: "timestamp" }),
  gradedAt: integer("graded_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export type AssessmentSubmission = typeof assessmentSubmissions.$inferSelect;

// ============================================================================
// ASSESSMENTS TABLE
// ============================================================================

export const assessments = sqliteTable("assessments", {
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
  completedAt: integer("completed_at", { mode: "timestamp" }),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export type Assessment = typeof assessments.$inferSelect;

// ============================================================================
// ANNOUNCEMENTS TABLE
// ============================================================================

export const announcements = sqliteTable("announcements", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").references(() => schools.id, { onDelete: "cascade" }),
  classId: text("class_id").references(() => classes.id),
  title: text("title").notNull(),
  content: text("content").notNull(),
  excerpt: text("excerpt").notNull(),
  priority: text("priority").notNull(), // "low" | "normal" | "high" | "urgent"
  targetAudience: text("target_audience").notNull(), // "all" | "students" | "teachers" | "parents" | "staff" | "counselor"
  targetGradeLevel: text("target_grade_level").notNull(), // e.g., "10-12"
  targetClassIds: text("target_class_ids", { mode: "json" }).$type<string[]>(),
  targetUserIds: text("target_user_ids", { mode: "json" }).$type<string[]>(),
  category: text("category").notNull(),
  publishDate: text("publish_date").notNull(),
  expiryDate: text("expiry_date").notNull(),
  isPinned: integer("is_pinned", { mode: "boolean" }).default(false),
  isPublished: integer("is_published", { mode: "boolean" }).default(false),
  viewCount: integer("view_count").default(0),
  isArchived: integer("is_archived", { mode: "boolean" }).default(false),
  publishedAt: integer("published_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export type Announcement = typeof announcements.$inferSelect;

// ============================================================================
// USER PROGRESS TABLE
// ============================================================================

export const userProgress = sqliteTable("user_progress", {
  id: text("id").primaryKey(),
  studentId: text("student_id").references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // "academic" | "career" | "behavioral" | "attendance"
  metricName: text("metric_name").notNull(),
  metricValue: text("metric_value").notNull(),
  targetValue: text("target_value").notNull(),
  date: text("date").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export type UserProgress = typeof userProgress.$inferSelect;

// ============================================================================
// ACHIEVEMENTS TABLE
// ============================================================================

export const achievements = sqliteTable("achievements", {
  id: text("id").primaryKey(),
  studentId: text("student_id").references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // "academic" | "attendance" | "behavioral" | "extracurricular" | "competition" | "certification"
  title: text("title").notNull(),
  description: text("description").notNull(),
  dateEarned: text("date_earned").notNull(),
  level: text("level").notNull(), // "school" | "class" | "national" | "international"
  certificateUrl: text("certificate_url").notNull(),
  issuer: text("issuer").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export type Achievement = typeof achievements.$inferSelect;

// ============================================================================
// ATTENDANCE RECORDS TABLE
// ============================================================================

export const attendanceRecords = sqliteTable("attendance_records", {
  id: text("id").primaryKey(),
  studentId: text("student_id").references(() => users.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  status: text("status").notNull(), // "present" | "absent" | "late" | "excused"
  notes: text("notes").notNull(),
  recordedBy: text("recorded_by").references(() => users.id),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export type AttendanceRecord = typeof attendanceRecords.$inferSelect;

// ============================================================================
// FEE PAYMENTS TABLE
// ============================================================================

export const feePayments = sqliteTable("fee_payments", {
  id: text("id").primaryKey(),
  studentFeeId: text("student_fee_id").references(() => studentFees.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(),
  paidDate: text("paid_date").notNull(),
  method: text("method").notNull(), // "cash" | "online" | "bank" | "waived"
  transactionId: text("transaction_id").notNull(),
  receiptNumber: text("receipt_number").notNull(),
  status: text("status").notNull(), // "pending" | "paid" | "failed"
  isRecurring: integer("is_recurring", { mode: "boolean" }).default(false),
  dueDate: text("due_date").notNull(),
  paidAt: integer("paid_at", { mode: "timestamp" }).notNull(),
  schoolId: text("school_id").references(() => schools.id),
  collectedAt: integer("collected_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export type FeePayment = typeof feePayments.$inferSelect;

// ============================================================================
// STUDENT FEES TABLE
// ============================================================================

export const studentFees = sqliteTable("student_fees", {
  id: text("id").primaryKey(),
  studentId: text("student_id").references(() => users.id, { onDelete: "cascade" }),
  feeType: text("fee_type").notNull(), // "tuition" | "library" | "lab" | "transport" | "hostel" | "activity" | "uniform" | "exam" | "other"
  amount: integer("amount").notNull(),
  currency: text("currency").notNull(), // "BTN" | "USD" | "INR"
  frequency: text("frequency").notNull(), // "monthly" | "quarterly" | "yearly" | "one-time"
  dueDate: text("due_date").notNull(),
  year: integer("year").notNull(),
  status: text("status").notNull(), // "pending" | "paid" | "waived" | "partial"
  isRecurring: integer("is_recurring", { mode: "boolean" }).default(false),
  description: text("description").notNull(),
  schoolId: text("school_id").references(() => schools.id),
  amountPending: integer("amount_pending"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export type StudentFee = typeof studentFees.$inferSelect;

// ============================================================================
// HOMEWORK TABLE
// ============================================================================

export const homework = sqliteTable("homework", {
  id: text("id").primaryKey(),
  classId: text("class_id").references(() => classes.id, { onDelete: "cascade" }),
  subjectId: text("subject_id").references(() => subjects.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  dueDate: text("due_date").notNull(),
  assignedDate: text("assigned_date").notNull(),
  totalPoints: integer("total_points").notNull(),
  passingScore: integer("passing_score").notNull(),
  isPublished: integer("is_published", { mode: "boolean" }).default(false),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export type Homework = typeof homework.$inferSelect;

// ============================================================================
// HOMEWORK SUBMISSIONS TABLE
// ============================================================================

export const homeworkSubmissions = sqliteTable("homework_submissions", {
  id: text("id").primaryKey(),
  homeworkId: text("homework_id").references(() => homework.id, { onDelete: "cascade" }),
  studentId: text("student_id").references(() => users.id, { onDelete: "cascade" }),
  submittedAt: integer("submitted_at", { mode: "timestamp" }).notNull(),
  content: text("content", { mode: "json" }).$type<any>(),
  gradedAt: integer("graded_at", { mode: "timestamp" }).notNull(),
  score: integer("score").notNull(),
  feedback: text("feedback").notNull(),
  status: text("status").notNull(), // "submitted" | "graded" | "returned"
  isLate: integer("is_late", { mode: "boolean" }).default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export type HomeworkSubmission = typeof homeworkSubmissions.$inferSelect;

// ============================================================================
// CLASS SUBJECTS TABLE
// ============================================================================

export const classSubjects = sqliteTable("class_subjects", {
  id: text("id").primaryKey(),
  classId: text("class_id").references(() => classes.id, { onDelete: "cascade" }),
  subjectId: text("subject_id").references(() => subjects.id),
  teacherId: text("teacher_id").references(() => users.id),
  periodsPerWeek: integer("periods_per_week").notNull(),
  isCoreSubject: integer("is_core_subject", { mode: "boolean" }).default(true),
  roomId: text("room_id").references(() => rooms.id),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export type ClassSubject = typeof classSubjects.$inferSelect;

// ============================================================================
// TIMETABLE ENTRIES TABLE
// ============================================================================

export const timetableEntries = sqliteTable("timetable_entries", {
  id: text("id").primaryKey(),
  classId: text("class_id").references(() => classes.id, { onDelete: "cascade" }),
  subjectId: text("subject_id").references(() => subjects.id),
  teacherId: text("teacher_id").references(() => users.id),
  teacherName: text("teacher_name", { mode: "json" }).notNull(),
  roomId: text("room_id").references(() => rooms.id),
  roomName: text("room_name", { mode: "json" }).notNull(),
  periodId: text("period_id").references(() => timePeriods.id),
  periodName: text("period_name").notNull(),
  dayOfWeek: text("day_of_week").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  isDoublePeriod: integer("is_double_period", { mode: "boolean" }).default(false),
  notes: text("notes").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export type TimetableEntry = typeof timetableEntries.$inferSelect;

// ============================================================================
// TIME PERIODS TABLE
// ============================================================================

export const timePeriods = sqliteTable("time_periods", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").references(() => schools.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: text("type").notNull(), // "class" | "break" | "lunch"
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  duration: integer("duration").notNull(), // in minutes
  order: integer("order").notNull(),
  isBreak: integer("is_break", { mode: "boolean" }).default(false),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export type TimePeriod = typeof timePeriods.$inferSelect;

// ============================================================================
// ROOMS TABLE
// ============================================================================

export const rooms = sqliteTable("rooms", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").references(() => schools.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  roomNumber: text("room_number").notNull(),
  type: text("type").notNull(), // "classroom" | "lab" | "library" | "office" | "hall" | "other"
  capacity: integer("capacity").notNull(),
  floor: integer("floor").notNull(),
  building: text("building").notNull(),
  hasProjector: integer("has_projector", { mode: "boolean" }).default(false),
  hasComputers: integer("has_computers", { mode: "boolean" }).default(false),
  hasSmartBoard: integer("has_smart_board", { mode: "boolean" }).default(false),
  hasWhiteboard: integer("has_whiteboard", { mode: "boolean" }).default(false),
  hasAc: integer("has_ac", { mode: "boolean" }).default(false),
  facilities: text("facilities", { mode: "json" }).$type<string[]>(),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export type Room = typeof rooms.$inferSelect;

// ============================================================================
// PARTNERS TABLE
// ============================================================================

export const partners = sqliteTable("partners", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").references(() => schools.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: text("type").notNull(), // "rub_college" | "industry" | "ngo" | "government"
  description: text("description").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  address: text("address").notNull(),
  partnershipDate: text("partnership_date").notNull(),
  status: text("status").notNull().default("active"),
  workshopsConducted: integer("workshops_conducted").default(0),
  studentsPlaced: integer("students_placed").default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export type Partner = typeof partners.$inferSelect;

// ============================================================================
// COUNSELOR RESOURCES TABLE
// ============================================================================

export const counselorResources = sqliteTable("counselor_resources", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").references(() => schools.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(),
  category: text("category").notNull(),
  url: text("url").notNull(),
  content: text("content", { mode: "json" }).$type<any>(),
  tags: text("tags", { mode: "json" }).$type<string[]>(),
  targetAudience: text("target_audience").notNull(),
  isPublic: integer("is_public", { mode: "boolean" }).default(false),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  viewCount: integer("view_count").default(0),
  downloadCount: integer("download_count").default(0),
  createdBy: text("created_by").references(() => users.id),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export type CounselorResource = typeof counselorResources.$inferSelect;

// ============================================================================
// ENROLLMENTS TABLE
// ============================================================================

export const enrollments = sqliteTable("enrollments", {
  id: text("id").primaryKey(),
  studentId: text("student_id").references(() => users.id, { onDelete: "cascade" }),
  classId: text("class_id").references(() => classes.id, { onDelete: "cascade" }),
  academicYear: text("academic_year").notNull(),
  enrollmentDate: text("enrollment_date").notNull(),
  status: text("status").notNull(), // "active" | "withdrawn" | "completed" | "transferred"
  rollNumber: text("roll_number"),
  section: text("section"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export type Enrollment = typeof enrollments.$inferSelect;

// ============================================================================
// TEACHER ASSIGNMENTS TABLE
// ============================================================================

export const teacherAssignments = sqliteTable("teacher_assignments", {
  id: text("id").primaryKey(),
  teacherId: text("teacher_id").references(() => users.id, { onDelete: "cascade" }),
  classId: text("class_id").references(() => classes.id, { onDelete: "cascade" }),
  subjectId: text("subject_id").references(() => subjects.id),
  academicYear: text("academic_year").notNull(),
  role: text("role").notNull(), // "homeroom" | "subject_teacher" | "both"
  isPrimary: integer("is_primary", { mode: "boolean" }).default(false),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export type TeacherAssignment = typeof teacherAssignments.$inferSelect;

// ============================================================================
// COUNSELOR ASSIGNMENTS TABLE
// ============================================================================

export const counselorAssignments = sqliteTable("counselor_assignments", {
  id: text("id").primaryKey(),
  counselorId: text("counselor_id").references(() => users.id, { onDelete: "cascade" }),
  schoolId: text("school_id").references(() => schools.id, { onDelete: "cascade" }),
  assignedClasses: text("assigned_classes", { mode: "json" }).$type<string[]>(),
  assignedGrades: text("assigned_grades", { mode: "json" }).$type<number[]>(),
  academicYear: text("academic_year").notNull(),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export type CounselorAssignment = typeof counselorAssignments.$inferSelect;

// ============================================================================
// FEE STRUCTURES TABLE
// ============================================================================

export const feeStructures = sqliteTable("fee_structures", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").references(() => schools.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description").notNull(),
  academicYear: text("academic_year").notNull(),
  grade: integer("grade").notNull(),
  totalFees: integer("total_fees").notNull(),
  breakdown: text("breakdown", { mode: "json" }).$type<Array<{
    feeType: string;
    amount: number;
    frequency: string;
  }>>(),
  isRecurring: integer("is_recurring", { mode: "boolean" }).default(false),
  currency: text("currency").notNull().default("BTN"),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export type FeeStructure = typeof feeStructures.$inferSelect;

// ============================================================================
// DISTRICTS TABLE
// ============================================================================

export const districts = sqliteTable("districts", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").unique().notNull(),
  dzongkhag: text("dzongkhag").notNull(),
  country: text("country").notNull().default("Bhutan"),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export type District = typeof districts.$inferSelect;

// ============================================================================
// TENANTS TABLE
// ============================================================================

export const tenants = sqliteTable("tenants", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").unique().notNull(),
  domain: text("domain").unique().notNull(),
  logo: text("logo").notNull(),
  primaryColor: text("primary_color").notNull(),
  secondaryColor: text("secondary_color").notNull(),
  settings: text("settings", { mode: "json" }).$type<Record<string, any>>(),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export type Tenant = typeof tenants.$inferSelect;

// ============================================================================
// EXAM RESULTS ENHANCED TABLE
// ============================================================================

export const examResultsEnhanced = sqliteTable("exam_results_enhanced", {
  id: text("id").primaryKey(),
  studentId: text("student_id").references(() => users.id, { onDelete: "cascade" }),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  examName: text("exam_name").notNull(),
  examType: text("exam_type").notNull(), // "midterm" | "final" | "unit_test" | "board_exam"
  academicYear: text("academic_year").notNull(),
  term: text("term").notNull(),
  examDate: text("exam_date").notNull(),
  examYear: integer("exam_year"),
  subjects: text("subjects", { mode: "json" }).$type<Array<{
    subjectId: string;
    subjectName: string;
    marksObtained: number;
    maxMarks: number;
    grade: string;
    percentage: number;
  }>>(),
  totalMarks: integer("total_marks").notNull(),
  maxTotalMarks: integer("max_total_marks").notNull(),
  percentage: integer("percentage").notNull(),
  grade: text("grade").notNull(),
  rank: integer("rank"),
  classRank: integer("class_rank"),
  remarks: text("remarks"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export type ExamResultEnhanced = typeof examResultsEnhanced.$inferSelect;

// ============================================================================
// ACADEMIC TERMS TABLE
// ============================================================================

export const academicTerms = sqliteTable("academic_terms", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").references(() => schools.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  academicYear: text("academic_year").notNull(),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  isCurrent: integer("is_current", { mode: "boolean" }).default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export type AcademicTerm = typeof academicTerms.$inferSelect;

// ============================================================================
// ATTENDANCE (simplified alias) TABLE
// ============================================================================

export const attendance = sqliteTable("attendance", {
  id: text("id").primaryKey(),
  studentId: text("student_id").references(() => users.id, { onDelete: "cascade" }),
  classId: text("class_id").references(() => classes.id, { onDelete: "cascade" }),
  schoolId: text("school_id").references(() => schools.id),
  date: text("date").notNull(),
  status: text("status").notNull(), // "present" | "absent" | "late" | "excused"
  recordedBy: text("recorded_by").references(() => users.id),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export type Attendance = typeof attendance.$inferSelect;

// ============================================================================
// CAREER MATCHES TABLE
// ============================================================================

export const careerMatches = sqliteTable("career_matches", {
  id: text("id").primaryKey(),
  studentId: text("student_id").references(() => users.id, { onDelete: "cascade" }),
  careerId: text("career_id").notNull(),
  careerTitle: text("career_title").notNull(),
  matchScore: integer("match_score").notNull(),
  matchReason: text("match_reason").notNull(),
  recommendationText: text("recommendation_text"),
  isTopMatch: integer("is_top_match", { mode: "boolean" }).default(false),
  assessmentType: text("assessment_type").notNull(), // "riasec" | "mbti" | "work_values"
  assessmentId: text("assessment_id"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export type CareerMatch = typeof careerMatches.$inferSelect;

// ============================================================================
// CAREER PLANS TABLE
// ============================================================================

export const careerPlans = sqliteTable("career_plans", {
  id: text("id").primaryKey(),
  studentId: text("student_id").references(() => users.id, { onDelete: "cascade" }).unique(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  targetCareer: text("target_career").notNull(),
  targetCareerId: text("target_career_id").notNull(),
  shortTermGoals: text("short_term_goals", { mode: "json" }).$type<string[]>(),
  longTermGoals: text("long_term_goals", { mode: "json" }).$type<string[]>(),
  subjects: text("subjects", { mode: "json" }).$type<Array<{
    subject: string;
    importance: string;
  }>>(),
  milestones: text("milestones", { mode: "json" }).$type<Array<{
    title: string;
    deadline: string;
    completed: boolean;
  }>>(),
  notes: text("notes"),
  counselorNotes: text("counselor_notes"),
  status: text("status").notNull().default("active"), // "active" | "achieved" | "changed"
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export type CareerPlan = typeof careerPlans.$inferSelect;

// ============================================================================
// RIASEC RESULTS TABLE
// ============================================================================

export const riasecResults = sqliteTable("riasec_results", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  scores: text("scores", { mode: "json" }).$type<{
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
  recommendedCareers: text("recommended_careers", { mode: "json" }).$type<string[]>().notNull(),
  completedAt: integer("completed_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export type RiasecResult = typeof riasecResults.$inferSelect;

// ============================================================================
// MBTI RESULTS TABLE
// ============================================================================

export const mbtiResults = sqliteTable("mbti_results", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  personalityType: text("personality_type").notNull(), // "INTJ", "ENFP", etc.
  scores: text("scores", { mode: "json" }).$type<{
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
  strengths: text("strengths", { mode: "json" }).$type<string[]>().notNull(),
  weaknesses: text("weaknesses", { mode: "json" }).$type<string[]>().notNull(),
  recommendedCareers: text("recommended_careers", { mode: "json" }).$type<string[]>().notNull(),
  completedAt: integer("completed_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export type MBTIResult = typeof mbtiResults.$inferSelect;

// ============================================================================
// DISC RESULTS TABLE
// ============================================================================

export const discResults = sqliteTable("disc_results", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  dominantStyle: text("dominant_style").notNull(), // "D" | "I" | "S" | "C"
  scores: text("scores", { mode: "json" }).$type<{
    d: number;
    i: number;
    s: number;
    c: number;
  }>().notNull(),
  description: text("description").notNull(),
  strengths: text("strengths", { mode: "json" }).$type<string[]>().notNull(),
  weaknesses: text("weaknesses", { mode: "json" }).$type<string[]>().notNull(),
  recommendedCareers: text("recommended_careers", { mode: "json" }).$type<string[]>().notNull(),
  completedAt: integer("completed_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export type DiscResult = typeof discResults.$inferSelect;

// ============================================================================
// WORK VALUES RESULTS TABLE
// ============================================================================

export const workValuesResults = sqliteTable("work_values_results", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  topValues: text("top_values", { mode: "json" }).$type<Array<{
    value: string;
    score: number;
  }>>().notNull(),
  description: text("description").notNull(),
  recommendedCareers: text("recommended_careers", { mode: "json" }).$type<string[]>().notNull(),
  completedAt: integer("completed_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export type WorkValuesResult = typeof workValuesResults.$inferSelect;

// ============================================================================
// LEARNING STYLES RESULTS TABLE
// ============================================================================

export const learningStylesResults = sqliteTable("learning_styles_results", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  visualScore: integer("visual_score").notNull(),
  auditoryScore: integer("auditory_score").notNull(),
  kinestheticScore: integer("kinesthetic_score").notNull(),
  dominantStyle: text("dominant_style").notNull(), // "visual" | "auditory" | "kinesthetic"
  recommendations: text("recommendations", { mode: "json" }).$type<string[]>().notNull(),
  completedAt: integer("completed_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export type LearningStylesResult = typeof learningStylesResults.$inferSelect;

// ============================================================================
// LEARNING MODULES TABLE
// ============================================================================

export const learningModules = sqliteTable("learning_modules", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  subjectId: text("subject_id").references(() => subjects.id),
  classId: text("class_id").references(() => classes.id),
  teacherId: text("teacher_id").references(() => users.id),
  category: text("category").notNull(), // "subject" | "skill" | "exam_prep" | "career"
  level: text("level").notNull(), // "beginner" | "intermediate" | "advanced"
  duration: integer("duration").notNull(), // in minutes
  content: text("content", { mode: "json" }).$type<any>(),
  thumbnail: text("thumbnail").notNull(),
  isPublic: integer("is_public", { mode: "boolean" }).default(false),
  isPremium: integer("is_premium", { mode: "boolean" }).default(false),
  isPublished: integer("is_published", { mode: "boolean" }).default(false),
  price: integer("price").default(0),
  tags: text("tags", { mode: "json" }).$type<string[]>(),
  objectives: text("objectives", { mode: "json" }).$type<string[]>(),
  prerequisites: text("prerequisites", { mode: "json" }).$type<string[]>(),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export type LearningModule = typeof learningModules.$inferSelect;

// ============================================================================
// MODULE PROGRESS TABLE
// ============================================================================

export const moduleProgress = sqliteTable("module_progress", {
  id: text("id").primaryKey(),
  studentId: text("student_id").references(() => users.id, { onDelete: "cascade" }),
  moduleId: text("module_id").references(() => learningModules.id, { onDelete: "cascade" }),
  status: text("status").notNull(), // "not_started" | "in_progress" | "completed"
  progress: integer("progress").notNull(), // 0-100
  completedLessons: text("completed_lessons", { mode: "json" }).$type<string[]>(),
  currentLesson: text("current_lesson"),
  timeSpent: integer("time_spent").notNull(), // in seconds
  lastAccessedAt: integer("last_accessed_at", { mode: "timestamp" }).notNull(),
  completedAt: integer("completed_at", { mode: "timestamp" }),
  certificateUrl: text("certificate_url"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export type ModuleProgress = typeof moduleProgress.$inferSelect;

// ============================================================================
// TUITION COURSES TABLE
// ============================================================================

export const tuitionCourses = sqliteTable("tuition_courses", {
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
  currency: text("currency").notNull().default("BTN"),
  maxStudents: integer("max_students").notNull(),
  currentStudents: integer("current_students").default(0),
  schedule: text("schedule", { mode: "json" }).$type<Array<{
    day: string;
    startTime: string;
    endTime: string;
  }>>(),
  mode: text("mode").notNull(), // "online" | "in_person" | "hybrid"
  location: text("location"),
  meetingLink: text("meeting_link"),
  thumbnail: text("thumbnail").notNull(),
  tags: text("tags", { mode: "json" }).$type<string[]>(),
  requirements: text("requirements", { mode: "json" }).$type<string[]>(),
  status: text("status"), // "draft" | "published" | "archived"
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export type TuitionCourse = typeof tuitionCourses.$inferSelect;

// ============================================================================
// TUITION ENROLLMENTS TABLE
// ============================================================================

export const tuitionEnrollments = sqliteTable("tuition_enrollments", {
  id: text("id").primaryKey(),
  courseId: text("course_id").references(() => tuitionCourses.id, { onDelete: "cascade" }),
  studentId: text("student_id").references(() => users.id, { onDelete: "cascade" }),
  tutorId: text("tutor_id").references(() => users.id, { onDelete: "cascade" }),
  status: text("status").notNull(), // "active" | "completed" | "cancelled" | "suspended"
  enrollmentDate: text("enrollment_date").notNull(),
  enrolledAt: integer("enrolled_at", { mode: "timestamp" }),
  completionDate: text("completion_date"),
  completedAt: integer("completed_at", { mode: "timestamp" }),
  sessionsCompleted: integer("sessions_completed").default(0),
  totalPaid: integer("total_paid").default(0),
  tutorEarnings: integer("tutor_earnings"),
  notes: text("notes"),
  rating: integer("rating"), // 1-5
  review: text("review"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export type TuitionEnrollment = typeof tuitionEnrollments.$inferSelect;

// ============================================================================
// TUTORS TABLE
// ============================================================================

export const tutors = sqliteTable("tutors", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }).unique(),
  bio: text("bio").notNull(),
  subjects: text("subjects", { mode: "json" }).$type<Array<{
    subjectId: string;
    subjectName: string;
    proficiency: string; // "beginner" | "intermediate" | "expert"
  }>>().notNull(),
  qualifications: text("qualifications", { mode: "json" }).$type<Array<{
    degree: string;
    institution: string;
    year: number;
  }>>().notNull(),
  experience: integer("experience").notNull(), // in years
  hourlyRate: integer("hourly_rate").notNull(),
  currency: text("currency").notNull().default("BTN"),
  availability: text("availability", { mode: "json" }).$type<Array<{
    day: string;
    slots: Array<{
      start: string;
      end: string;
    }>;
  }>>(),
  teachingMode: text("teaching_mode").notNull(), // "online" | "in_person" | "both"
  location: text("location"),
  averageRating: integer("average_rating"), // 0-500 (5.00 * 100)
  totalReviews: integer("total_reviews").default(0),
  totalStudents: integer("total_students").default(0),
  isVerified: integer("is_verified", { mode: "boolean" }).default(false),
  verificationDocument: text("verification_document"),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export type Tutor = typeof tutors.$inferSelect;

// ============================================================================
// TUTOR EARNINGS TABLE
// ============================================================================

export const tutorEarnings = sqliteTable("tutor_earnings", {
  id: text("id").primaryKey(),
  tutorId: text("tutor_id").references(() => users.id, { onDelete: "cascade" }),
  enrollmentId: text("enrollment_id").references(() => tuitionEnrollments.id),
  amount: integer("amount").notNull(),
  currency: text("currency").notNull().default("BTN"),
  type: text("type").notNull(), // "session" | "bonus" | "refund" | "commission"
  status: text("status").notNull(), // "pending" | "available" | "withdrawn"
  payoutStatus: text("payout_status"), // "pending" | "processing" | "paid"
  sessionDate: text("session_date").notNull(),
  earnedAt: integer("earned_at", { mode: "timestamp" }),
  withdrawnAt: integer("withdrawn_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export type TutorEarning = typeof tutorEarnings.$inferSelect;

// ============================================================================
// LIVE SESSIONS TABLE
// ============================================================================

export const liveSessions = sqliteTable("live_sessions", {
  id: text("id").primaryKey(),
  courseId: text("course_id").references(() => tuitionCourses.id, { onDelete: "cascade" }),
  tutorId: text("tutor_id").references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  scheduledStart: text("scheduled_start").notNull(),
  scheduledEnd: text("scheduled_end").notNull(),
  actualStart: integer("actual_start", { mode: "timestamp" }),
  actualEnd: integer("actual_end", { mode: "timestamp" }),
  meetingLink: text("meeting_link"),
  meetingId: text("meeting_id"),
  recordingUrl: text("recording_url"),
  status: text("status").notNull(), // "scheduled" | "live" | "completed" | "cancelled"
  participants: integer("participants").default(0),
  maxParticipants: integer("maxparticipants"),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export type LiveSession = typeof liveSessions.$inferSelect;

// ============================================================================
// TUTOR REVIEWS TABLE
// ============================================================================

export const tutorReviews = sqliteTable("tutor_reviews", {
  id: text("id").primaryKey(),
  tutorId: text("tutor_id").references(() => users.id, { onDelete: "cascade" }),
  studentId: text("student_id").references(() => users.id, { onDelete: "cascade" }),
  enrollmentId: text("enrollment_id").references(() => tuitionEnrollments.id),
  rating: integer("rating").notNull(), // 1-5
  review: text("review").notNull(),
  response: text("response"),
  isVerified: integer("is_verified", { mode: "boolean" }).default(false),
  isPublic: integer("is_public", { mode: "boolean" }).default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export type TutorReview = typeof tutorReviews.$inferSelect;

// ============================================================================
// LEAVE REQUESTS TABLE
// ============================================================================

export const leaveRequests = sqliteTable("leave_requests", {
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
  approvedAt: integer("approved_at", { mode: "timestamp" }),
  rejectionReason: text("rejection_reason"),
  documents: text("documents", { mode: "json" }).$type<string[]>(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export type LeaveRequest = typeof leaveRequests.$inferSelect;

// ============================================================================
// VEHICLES TABLE
// ============================================================================

export const vehicles = sqliteTable("vehicles", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").references(() => schools.id, { onDelete: "cascade" }),
  routeId: text("route_id").notNull(),
  registrationNumber: text("registration_number").unique().notNull(),
  vehicleType: text("vehicle_type").notNull(), // "bus" | "van" | "mini_bus"
  capacity: integer("capacity").notNull(),
  driverName: text("driver_name").notNull(),
  driverPhone: text("driver_phone").notNull(),
  driverLicense: text("driver_license").notNull(),
  conductorName: text("conductor_name"),
  conductorPhone: text("conductor_phone"),
  status: text("status").notNull(), // "active" | "maintenance" | "inactive"
  gpsEnabled: integer("gps_enabled", { mode: "boolean" }).default(true),
  trackingDeviceId: text("tracking_device_id"),
  insuranceExpiry: text("insurance_expiry"),
  pollutionExpiry: text("pollution_expiry"),
  fitnessExpiry: text("fitness_expiry"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export type Vehicle = typeof vehicles.$inferSelect;

// ============================================================================
// TRANSPORT ROUTES TABLE
// ============================================================================

export const transportRoutes = sqliteTable("transport_routes", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").references(() => schools.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  routeNumber: text("route_number").unique().notNull(),
  startLocation: text("start_location").notNull(),
  endLocation: text("end_location").notNull(),
  stops: text("stops", { mode: "json" }).$type<Array<{
    name: string;
    location: { lat: string; lng: string };
    time: string;
  }>>().notNull(),
  distance: integer("distance").notNull(), // in km
  estimatedTime: integer("estimated_time").notNull(), // in minutes
  fee: integer("fee").notNull(),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export type TransportRoute = typeof transportRoutes.$inferSelect;

// ============================================================================
// TRANSPORT ALLOCATIONS TABLE
// ============================================================================

export const transportAllocations = sqliteTable("transport_allocations", {
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
  isPaid: integer("is_paid", { mode: "boolean" }).default(false),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export type TransportAllocation = typeof transportAllocations.$inferSelect;

// ============================================================================
// CIRCULATION TABLE
// ============================================================================

export const circulation = sqliteTable("circulation", {
  id: text("id").primaryKey(),
  bookId: text("book_id").references(() => books.id, { onDelete: "cascade" }),
  studentId: text("student_id").references(() => users.id, { onDelete: "cascade" }),
  borrowerId: text("borrower_id").references(() => users.id),
  borrowDate: text("borrow_date").notNull(),
  dueDate: text("due_date").notNull(),
  returnDate: text("return_date"),
  status: text("status").notNull(), // "borrowed" | "returned" | "overdue" | "lost"
  fine: integer("fine").default(0),
  finePaid: integer("fine_paid", { mode: "boolean" }).default(false),
  renewals: integer("renewals").default(0),
  maxRenewals: integer("max_renewals").notNull(),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export type Circulation = typeof circulation.$inferSelect;

// ============================================================================
// CONSENT RECORDS TABLE
// ============================================================================

export const consentRecords = sqliteTable("consent_records", {
  id: text("id").primaryKey(),
  studentId: text("student_id").references(() => users.id, { onDelete: "cascade" }),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  parentId: text("parent_id").references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // "field_trip" | "photos" | "medical" | "data" | "activities"
  title: text("title").notNull(),
  description: text("description").notNull(),
  status: text("status").notNull(), // "pending" | "approved" | "declined" | "revoked"
  consentGiven: integer("consent_given", { mode: "boolean" }).default(false),
  consentDate: integer("consent_date", { mode: "timestamp" }),
  ipAddress: text("ip_address"),
  documentUrl: text("document_url"),
  expiresAt: integer("expires_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export type ConsentRecord = typeof consentRecords.$inferSelect;

// ============================================================================
// COUNSELOR NOTES TABLE
// ============================================================================

export const counselorNotes = sqliteTable("counselor_notes", {
  id: text("id").primaryKey(),
  counselorId: text("counselor_id").references(() => users.id, { onDelete: "cascade" }),
  studentId: text("student_id").references(() => users.id, { onDelete: "cascade" }),
  noteType: text("note_type").notNull(), // "session" | "observation" | "intervention" | "follow_up"
  title: text("title").notNull(),
  content: text("content").notNull(),
  isConfidential: integer("is_confidential", { mode: "boolean" }).default(false),
  tags: text("tags", { mode: "json" }).$type<string[]>(),
  relatedIssues: text("related_issues", { mode: "json" }).$type<string[]>(),
  actionItems: text("action_items", { mode: "json" }).$type<Array<{
    action: string;
    completed: boolean;
    dueDate: string;
  }>>(),
  followUpDate: text("follow_up_date"),
  sessionDate: text("session_date").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export type CounselorNote = typeof counselorNotes.$inferSelect;

// ============================================================================
// WIZARD PROGRESS TABLE
// ============================================================================

export const wizardProgress = sqliteTable("wizard_progress", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }).unique(),
  currentStep: text("current_step").notNull(),
  completedSteps: text("completed_steps", { mode: "json" }).$type<string[]>(),
  data: text("data", { mode: "json" }).$type<Record<string, any>>(),
  isCompleted: integer("is_completed", { mode: "boolean" }).default(false),
  lastUpdated: integer("last_updated", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export type WizardProgress = typeof wizardProgress.$inferSelect;

// ============================================================================
// FILE STORAGE TABLE
// ============================================================================

export const fileStorage = sqliteTable("file_storage", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  fileName: text("file_name").notNull(),
  originalName: text("original_name").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(), // in bytes
  path: text("path").notNull(),
  url: text("url").notNull(),
  category: text("category").notNull(), // "profile" | "homework" | "document" | "certificate" | "other"
  isPublic: integer("is_public", { mode: "boolean" }).default(false),
  expiresAt: integer("expires_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export type FileStorage = typeof fileStorage.$inferSelect;

// ============================================================================
// SCHOOL EVENTS TABLE
// ============================================================================

export const schoolEvents = sqliteTable("school_events", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").references(() => schools.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  eventType: text("event_type").notNull(), // "academic" | "sports" | "cultural" | "holiday" | "exam" | "meeting" | "other"
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  location: text("location").notNull(),
  isAllDay: integer("is_all_day", { mode: "boolean" }).default(false),
  targetAudience: text("target_audience", { mode: "json" }).$type<string[]>(), // ["all", "students", "teachers", "parents", "class_X"]
  isRecurring: integer("is_recurring", { mode: "boolean" }).default(false),
  recurrencePattern: text("recurrence_pattern"), // "daily" | "weekly" | "monthly" | "yearly"
  status: text("status").notNull(), // "upcoming" | "ongoing" | "completed" | "cancelled"
  reminders: text("reminders", { mode: "json" }).$type<Array<{
    type: string;
    minutes: number;
  }>>(),
  attachments: text("attachments", { mode: "json" }).$type<string[]>(),
  createdBy: text("created_by").references(() => users.id),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export type SchoolEvent = typeof schoolEvents.$inferSelect;

// ============================================================================
// DATA SOURCES TABLE
// ============================================================================

export const dataSources = sqliteTable("data_sources", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // "api" | "database" | "file" | "manual"
  endpoint: text("endpoint").notNull(),
  authMethod: text("auth_method"), // "none" | "api_key" | "oauth" | "basic"
  config: text("config", { mode: "json" }).$type<Record<string, any>>(),
  lastSyncAt: integer("last_sync_at", { mode: "timestamp" }),
  status: text("status").notNull(), // "active" | "inactive" | "error"
  errorMessage: text("error_message"),
  syncFrequency: integer("sync_frequency"), // in minutes
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export type DataSource = typeof dataSources.$inferSelect;

// ============================================================================
// CAREERS TABLE (Job/Career Information)
// ============================================================================

export const careers = sqliteTable("careers", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  name: text("name").notNull(), // Alias for title, for compatibility
  slug: text("slug").notNull().unique(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  industry: text("industry").notNull(),
  riasecCode: text("riasec_code"), // R, I, A, S, E, C
  hollandCodes: text("holland_codes", { mode: "json" }).$type<string[]>(),
  educationLevel: text("education_level").notNull(), // "high_school" | "certificate" | "diploma" | "bachelor" | "master" | "phd"
  typicalSalary: text("typical_salary"),
  salaryCurrency: text("salary_currency").default("BTN"),
  growthOutlook: text("growth_outlook"), // "growing" | "stable" | "declining"
  skills: text("skills", { mode: "json" }).$type<string[]>(),
  subjects: text("subjects", { mode: "json" }).$type<string[]>(),
  workEnvironment: text("work_environment").notNull(),
  bhutanSpecific: integer("bhutan_specific", { mode: "boolean" }).default(false),
  bhutanDemand: text("bhutan_demand"), // "high" | "medium" | "low"
  rubPrograms: text("rub_programs", { mode: "json" }).$type<Array<{
    collegeId: string;
    programId: string;
    programName: string;
  }>>(),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  viewCount: integer("view_count").default(0),
  icon: text("icon").notNull(),
  color: text("color").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
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
export const announcementReads = sqliteTable("announcement_reads", {
  id: text("id").primaryKey(),
  announcementId: text("announcement_id").references(() => announcements.id, { onDelete: "cascade" }).notNull(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  readAt: integer("read_at", { mode: "timestamp" }).notNull(),
});

export type AnnouncementRead = typeof announcementReads.$inferSelect;

// Tuition categories table
export const tuitionCategories = sqliteTable("tuition_categories", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export type TuitionCategory = typeof tuitionCategories.$inferSelect;
