import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

// ============================================================================
// DISTRICTS (Predefined Bhutan Data)
// ============================================================================

export const districts = sqliteTable("districts", {
  id: text("id").primaryKey(),
  name: text("name").notNull(), // "Thimphu", "Paro", "Punakha", etc.
  nameDzongkha: text("name_dzongkha"),
  code: text("code").notNull().unique(), // "TH", "PA", "PU"
  isCity: integer("is_city", { mode: "boolean" }).default(false), // Thimphu is a city
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: integer("created_at", { mode: "timestamp" }),
});

// ============================================================================
// TENANTS (Districts/Regions)
// ============================================================================

// Tenants
export const tenants = sqliteTable("tenants", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  domain: text("domain").unique(),
  settings: text("settings", { mode: "json" }).$type<{
    theme?: string;
    primaryColor?: string;
  }>(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// Schools
export const schools = sqliteTable("schools", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  districtId: text("district_id").references(() => districts.id), // Link to district
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  domain: text("domain").unique(),
  address: text("address"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  schoolType: text("school_type"), // "HSS", "MSS", "LSS", "Primary", "Private"
  level: text("level"), // "PP-XII", "VII-X", etc.
  settings: text("settings", { mode: "json" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// Users
export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").notNull().references(() => tenants.id),
  schoolId: text("school_id").references(() => schools.id),
  type: text("type", { enum: ["student", "teacher", "parent", "admin", "counselor"] }).notNull(),
  email: text("email"),
  phone: text("phone"),
  firstName: text("first_name").notNull(),
  lastName: text("last_name"),
  profilePicture: text("profile_picture"),
  // Student specific
  dateOfBirth: text("date_of_birth"),
  classGrade: integer("class_grade"),
  section: text("section"),
  parentId: text("parent_id").references(() => users.id),
  // Teacher specific
  employeeId: text("employee_id"),
  subjects: text("subjects", { mode: "json" }).$type<string[]>(),
  // Parent specific
  occupation: text("occupation"),
  relationship: text("relationship"),
  clerkUserId: text("clerk_user_id").unique(),
  emailVerified: integer("email_verified", { mode: "boolean" }).default(false),
  settings: text("settings", { mode: "json" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  lastLoginAt: integer("last_login_at", { mode: "timestamp" }),
});

// Assessments
export const assessments = sqliteTable("assessments", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").notNull().references(() => tenants.id),
  userId: text("user_id").notNull().references(() => users.id),
  type: text("type").notNull().default("riasec"),
  status: text("status", { enum: ["in_progress", "completed", "abandoned"] }).default("in_progress"),
  answers: text("answers", { mode: "json" }).notNull().$type<Record<string, number>>(),
  results: text("results", { mode: "json" }),
  startedAt: integer("started_at", { mode: "timestamp" }).notNull(),
  completedAt: integer("completed_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// Questions
export const questions = sqliteTable("questions", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").references(() => tenants.id),
  assessmentType: text("assessment_type").notNull(),
  questionText: text("question_text").notNull(),
  options: text("options", { mode: "json" }).notNull().$type<Array<{ value: number; text: string }>>(),
  category: text("category"), // RIASEC: R, I, A, S, E, C
  orderIndex: integer("order_index"),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  language: text("language").default("en"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// Careers
export const careers = sqliteTable("careers", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").references(() => tenants.id),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  description: text("description"),
  riasecCode: text("riasec_code"),
  riasecScores: text("riasec_scores", { mode: "json" }).$type<Record<string, number>>(),
  skills: text("skills", { mode: "json" }).$type<string[]>(),
  educationPath: text("education_path", { mode: "json" }).$type<string[]>(),
  subjects: text("subjects", { mode: "json" }).$type<string[]>(),
  workEnvironment: text("work_environment"),
  salaryRange: text("salary_range"),
  demandOutlook: text("demand_outlook", { enum: ["high", "medium", "low"] }),
  bhutanSpecific: integer("bhutan_specific", { mode: "boolean" }).default(false),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

// Career Matches
export const careerMatches = sqliteTable("career_matches", {
  id: text("id").primaryKey(),
  assessmentId: text("assessment_id").notNull().references(() => assessments.id),
  careerId: text("career_id").notNull().references(() => careers.id),
  matchScore: integer("match_score").notNull(),
  recommendationText: text("recommendation_text"),
  isTopMatch: integer("is_top_match", { mode: "boolean" }).default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// Consent Records
export const consentRecords = sqliteTable("consent_records", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  parentId: text("parent_id").notNull().references(() => users.id),
  type: text("type").notNull(),
  status: text("status").default("pending"),
  consentText: text("consent_text"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  consentedAt: integer("consented_at", { mode: "timestamp" }),
  revokedAt: integer("revoked_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// Classes
export const classes = sqliteTable("classes", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").notNull().references(() => schools.id),
  teacherId: text("teacher_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  grade: integer("grade").notNull(),
  section: text("section"),
  academicYear: text("academic_year").notNull(),
  students: text("students", { mode: "json" }).$type<string[]>(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

// Assessment Types
export const assessmentTypes = sqliteTable("assessment_types", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  targetGrade: text("target_grade"),
  targetAudience: text("target_audience"),
  category: text("category"),
  duration: integer("duration"),
  questionCount: integer("question_count"),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// Assessment Submissions
export const assessmentSubmissions = sqliteTable("assessment_submissions", {
  id: text("id").primaryKey(),
  assessmentId: text("assessment_id").references(() => assessments.id),
  userId: text("user_id").references(() => users.id),
  assignedBy: text("assigned_by").references(() => users.id),
  status: text("status").default("pending"),
  startedAt: integer("started_at", { mode: "timestamp" }),
  completedAt: integer("completed_at", { mode: "timestamp" }),
  timeSpent: integer("time_spent"),
  ipAddress: text("ip_address"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// MBTI Personality Results
export const mbtiResults = sqliteTable("mbti_results", {
  id: text("id").primaryKey(),
  assessmentId: text("assessment_id").references(() => assessments.id),
  userId: text("user_id").references(() => users.id),
  eiScore: integer("ei_score"),
  snScore: integer("sn_score"),
  tfScore: integer("tf_score"),
  jpScore: integer("jp_score"),
  personalityType: text("personality_type"),
  traits: text("traits", { mode: "json" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// DISC Assessment Results
export const discResults = sqliteTable("disc_results", {
  id: text("id").primaryKey(),
  assessmentId: text("assessment_id").references(() => assessments.id),
  userId: text("user_id").references(() => users.id),
  dominance: integer("dominance"),
  influence: integer("influence"),
  steadiness: integer("steadiness"),
  conscientiousness: integer("conscientiousness"),
  discType: text("disc_type"),
  traits: text("traits", { mode: "json" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// Work Values Results
export const workValuesResults = sqliteTable("work_values_results", {
  id: text("id").primaryKey(),
  assessmentId: text("assessment_id").references(() => assessments.id),
  userId: text("user_id").references(() => users.id),
  valueData: text("value_data", { mode: "json" }).$type<{
    achievement: number;
    independence: number;
    recognition: number;
    relationships: number;
    support: number;
    workingConditions: number;
  }>(),
  topValues: text("top_values", { mode: "json" }).$type<string[]>(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// Learning Styles Results
export const learningStylesResults = sqliteTable("learning_styles_results", {
  id: text("id").primaryKey(),
  assessmentId: text("assessment_id").references(() => assessments.id),
  userId: text("user_id").references(() => users.id),
  visual: integer("visual"),
  auditory: integer("auditory"),
  readWrite: integer("read_write"),
  kinesthetic: integer("kinesthetic"),
  dominantStyle: text("dominant_style"),
  recommendations: text("recommendations", { mode: "json" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// RIASEC Assessment Results
export const riasecResults = sqliteTable("riasec_results", {
  id: text("id").primaryKey(),
  assessmentId: text("assessment_id").references(() => assessments.id),
  userId: text("user_id").references(() => users.id),
  realistic: integer("realistic"),
  investigative: integer("investigative"),
  artistic: integer("artistic"),
  social: integer("social"),
  enterprising: integer("enterprising"),
  conventional: integer("conventional"),
  hollandCode: text("holland_code"), // e.g., "RIA", "SCE"
  traits: text("traits", { mode: "json" }).$type<string[]>(),
  careerSuggestions: text("career_suggestions", { mode: "json" }).$type<Array<{
    career: string;
    matchScore: number;
  }>>(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// Exam Results (for Classes 8, 10, 12)
export const examResults = sqliteTable("exam_results", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id),
  examType: text("exam_type"),
  examYear: integer("exam_year"),
  subjects: text("subjects", { mode: "json" }).$type<Array<{
    subject: string;
    marks: number;
    totalMarks: number;
    percentage: number;
  }>>(),
  totalPercentage: integer("total_percentage"),
  division: text("division"),
  isVerified: integer("is_verified", { mode: "boolean" }).default(false),
  verifiedBy: text("verified_by").references(() => users.id),
  enteredBy: text("entered_by").references(() => users.id),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// Career Plan (Six-phase model)
export const careerPlans = sqliteTable("career_plans", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id),
  counselorId: text("counselor_id").references(() => users.id),
  currentPhase: text("current_phase").default("self_assessment"),
  targetCareer: text("targetCareer").references(() => careers.id),
  shortTermGoals: text("short_term_goals", { mode: "json" }),
  longTermGoals: text("long_term_goals", { mode: "json" }),
  actionSteps: text("action_steps", { mode: "json" }),
  milestones: text("milestones", { mode: "json" }),
  status: text("status").default("active"),
  completedAt: integer("completed_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

// Counselor Notes
export const counselorNotes = sqliteTable("counselor_notes", {
  id: text("id").primaryKey(),
  counselorId: text("counselor_id").references(() => users.id),
  studentId: text("student_id").references(() => users.id),
  note: text("note").notNull(),
  isPrivate: integer("is_private", { mode: "boolean" }).default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

// Types
export type Tenant = typeof tenants.$inferSelect;
export type District = typeof districts.$inferSelect;
export type School = typeof schools.$inferSelect;
export type User = typeof users.$inferSelect;
export type Assessment = typeof assessments.$inferSelect;
export type Question = typeof questions.$inferSelect;
export type Career = typeof careers.$inferSelect;
export type CareerMatch = typeof careerMatches.$inferSelect;
export type ConsentRecord = typeof consentRecords.$inferSelect;
export type Class = typeof classes.$inferSelect;
export type AssessmentType = typeof assessmentTypes.$inferSelect;
export type AssessmentSubmission = typeof assessmentSubmissions.$inferSelect;
export type MBTIResult = typeof mbtiResults.$inferSelect;
export type DISCResult = typeof discResults.$inferSelect;
export type WorkValuesResult = typeof workValuesResults.$inferSelect;
export type LearningStylesResult = typeof learningStylesResults.$inferSelect;
export type ExamResult = typeof examResults.$inferSelect;
export type CareerPlan = typeof careerPlans.$inferSelect;
export type CounselorNote = typeof counselorNotes.$inferSelect;

// ============================================================================
// SCHOOL ADMIN & COUNSELOR ASSIGNMENTS
// ============================================================================

// School Admin role (separate from platform admin)
export const schoolAdmins = sqliteTable("school_admins", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  schoolId: text("school_id").notNull().references(() => schools.id),
  permissions: text("permissions", { mode: "json" }).$type<string[]>(), // ["manage_students", "manage_teachers", "view_reports"]
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  appointedBy: text("appointed_by").references(() => users.id),
  appointedAt: integer("appointed_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }),
});

// Counselor-School assignments (multi-school support)
export const counselorAssignments = sqliteTable("counselor_assignments", {
  id: text("id").primaryKey(),
  counselorId: text("counselor_id").notNull().references(() => users.id),
  schoolId: text("school_id").notNull().references(() => schools.id),
  isPrimary: integer("is_primary", { mode: "boolean" }).default(false), // Main school
  assignedBy: text("assigned_by").references(() => users.id), // Platform or tenant admin
  assignedAt: integer("assigned_at", { mode: "timestamp" }),
  expiresAt: integer("expires_at", { mode: "timestamp" }), // For temporary assignments
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: integer("created_at", { mode: "timestamp" }),
});

// Student enrollment (improves class management)
export const enrollments = sqliteTable("enrollments", {
  id: text("id").primaryKey(),
  studentId: text("student_id").notNull().references(() => users.id),
  classId: text("class_id").notNull().references(() => classes.id),
  schoolYear: text("school_year").notNull(), // "2024-2025"
  semester: text("semester"), // "Fall", "Spring", "Full Year"
  rollNumber: integer("roll_number"),
  enrolledAt: integer("enrolled_at", { mode: "timestamp" }),
  enrolledBy: text("enrolled_by").references(() => users.id),
  withdrewAt: integer("withdrew_at", { mode: "timestamp" }),
  status: text("status").default("active"), // "active", "withdrawn", "completed", "transferred"
  createdAt: integer("created_at", { mode: "timestamp" }),
});

// Teacher class assignments
export const teacherAssignments = sqliteTable("teacher_assignments", {
  id: text("id").primaryKey(),
  teacherId: text("teacher_id").notNull().references(() => users.id),
  classId: text("class_id").notNull().references(() => classes.id),
  role: text("role").default("teacher"), // "teacher", "assistant_teacher", "substitute"
  assignedAt: integer("assigned_at", { mode: "timestamp" }),
  assignedBy: text("assigned_by").references(() => users.id),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: integer("created_at", { mode: "timestamp" }),
});

// ============================================================================
// ACADEMIC TERMS & SUBJECTS
// ============================================================================

// Academic Terms/Semesters
export const academicTerms = sqliteTable("academic_terms", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").notNull().references(() => schools.id),
  name: text("name").notNull(), // "Spring 2025", "Academic Year 2024-2025"
  type: text("type").notNull(), // "semester", "trimester", "annual"
  startDate: text("start_date").notNull(), // ISO date
  endDate: text("end_date").notNull(),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: integer("created_at", { mode: "timestamp" }),
});

// Subjects/Courses
export const subjects = sqliteTable("subjects", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").references(() => schools.id),
  code: text("code").notNull(), // "ENG-101", "MATH-10"
  name: text("name").notNull(), // "English", "Mathematics"
  nameDzongkha: text("name_dzongkha"),
  grade: integer("grade"), // Which grade this subject is for
  description: text("description"),
  icon: text("icon"), // Emoji or icon URL
  color: text("color"), // For UI theming
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: integer("created_at", { mode: "timestamp" }),
});

// ============================================================================
// HOMEWORK & ASSIGNMENTS
// ============================================================================

// Homework/Assignments (Web-based)
export const homework = sqliteTable("homework", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").notNull().references(() => schools.id),
  classId: text("class_id").notNull().references(() => classes.id),
  subjectId: text("subject_id").references(() => subjects.id),
  teacherId: text("teacher_id").notNull().references(() => users.id),
  termId: text("term_id").references(() => academicTerms.id),

  // Homework details
  title: text("title").notNull(),
  description: text("description"),
  instructions: text("instructions"), // Rich text or markdown
  type: text("type").notNull(), // "assignment", "quiz", "project", "reading"

  // Questions (JSON for different question types)
  questions: text("questions", { mode: "json" }).$type<Array<{
    id: string;
    type: "multiple_choice" | "short_answer" | "essay" | "fill_blank" | "match" | "numeric" | "math_expression" | "graph_plot" | "handwriting";
    question: string;
    options?: string[];
    correctAnswer?: string | string[];
    points: number;
    explanation?: string;
    mathMode?: boolean; // Enable LaTeX rendering
  }>>(),

  // File attachments (PDF, images, etc.)
  attachments: text("attachments", { mode: "json" }).$type<Array<{
    name: string;
    url: string;
    type: string;
    size: number;
  }>>(),

  // Cloud links (Google Drive, OneDrive, etc.)
  externalLinks: text("external_links", { mode: "json" }).$type<Array<{
    title: string;
    url: string;
    provider: "google_drive" | "onedrive" | "dropbox" | "other";
  }>>(),

  // Dates
  assignedDate: text("assigned_date").notNull(), // ISO date
  dueDate: text("due_date").notNull(),
  lateSubmissionDeadline: text("late_submission_deadline"),

  // Settings
  maxPoints: integer("max_points"),
  passingPoints: integer("passing_points"),
  timeLimit: integer("time_limit"), // Minutes (for timed quizzes)
  attemptsAllowed: integer("attempts_allowed").default(1),
  showAnswersAfter: text("show_answers_after"), // "immediate", "after_due", "manual"
  isPublished: integer("is_published", { mode: "boolean" }).default(false),

  createdAt: integer("created_at", { mode: "timestamp" }),
  updatedAt: integer("updated_at", { mode: "timestamp" }),
});

// Homework Submissions (Student answers in app)
export const homeworkSubmissions = sqliteTable("homework_submissions", {
  id: text("id").primaryKey(),
  homeworkId: text("homework_id").notNull().references(() => homework.id),
  studentId: text("student_id").notNull().references(() => users.id),

  // Student answers
  answers: text("answers", { mode: "json" }).$type<Record<string, any>>(), // Question ID -> Answer

  // File uploads (for assignments requiring file submission)
  attachments: text("attachments", { mode: "json" }).$type<Array<{
    name: string;
    url: string;
    type: string;
    size: number;
  }>>(),

  // Text/essay answers (stored separately for full-text search)
  textAnswers: text("text_answers", { mode: "json" }),

  // Scoring
  score: integer("score"),
  maxScore: integer("max_score"),
  percentage: integer("percentage"),
  isLate: integer("is_late", { mode: "boolean" }).default(false),
  submittedAt: integer("submitted_at", { mode: "timestamp" }),

  // Grading
  gradedBy: text("graded_by").references(() => users.id),
  gradedAt: integer("graded_at", { mode: "timestamp" }),
  feedback: text("feedback"), // Teacher's overall feedback
  questionFeedback: text("question_feedback", { mode: "json" }), // Per-question feedback

  // Status
  status: text("status").default("submitted"), // "draft", "submitted", "graded", "returned"

  createdAt: integer("created_at", { mode: "timestamp" }),
  updatedAt: integer("updated_at", { mode: "timestamp" }),
});

// ============================================================================
// ATTENDANCE SYSTEM
// ============================================================================

// Attendance Records
export const attendance = sqliteTable("attendance", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").notNull().references(() => schools.id),
  classId: text("class_id").notNull().references(() => classes.id),
  studentId: text("student_id").notNull().references(() => users.id),
  date: text("date").notNull(), // ISO date (YYYY-MM-DD)
  termId: text("term_id").references(() => academicTerms.id),

  // Attendance status
  status: text("status").notNull(), // "present", "absent", "late", "excused", "sick_leave"

  // Entry method tracking
  entryMethod: text("entry_method").notNull(), // "manual", "fingerprint", "csv_import", "app_check_in"
  enteredBy: text("entered_by").references(() => users.id), // Who recorded it

  // Time tracking (for fingerprint/app check-in)
  checkInTime: text("check_in_time"), // HH:MM format
  checkOutTime: text("check_out_time"),

  // Geolocation (for app check-in verification)
  checkInLocation: text("check_in_location", { mode: "json" }).$type<{
    latitude: number;
    longitude: number;
    accuracy: number;
  }>(),

  // Notes
  reason: text("reason"), // For absence/excused
  notes: text("notes"),

  createdAt: integer("created_at", { mode: "timestamp" }),
  updatedAt: integer("updated_at", { mode: "timestamp" }),
});

// Attendance Sessions (for fingerprint check-in kiosk mode)
export const attendanceSessions = sqliteTable("attendance_sessions", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").notNull().references(() => schools.id),
  classId: text("class_id").references(() => classes.id),
  name: text("name").notNull(), // "Morning Assembly", "Class 10-A Attendance"
  startTime: text("start_time").notNull(), // HH:MM
  endTime: text("end_time").notNull(),
  kioskDeviceId: text("kiosk_device_id"), // Fingerprint device ID
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: integer("created_at", { mode: "timestamp" }),
});

// ============================================================================
// EXAM RESULTS (Enhanced)
// ============================================================================

// Exam Results (Enhanced)
export const examResultsEnhanced = sqliteTable("exam_results_enhanced", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").notNull().references(() => schools.id),
  studentId: text("student_id").notNull().references(() => users.id),
  termId: text("term_id").references(() => academicTerms.id),

  // Exam details
  examType: text("exam_type").notNull(), // "midterm", "final", "unit_test", "board_exam"
  examName: text("exam_name").notNull(), // "Class 10 Final Examination 2024"
  examYear: integer("exam_year").notNull(),

  // Subject-wise results
  subjectResults: text("subject_results", { mode: "json" }).$type<Array<{
    subjectId: string;
    subjectName: string;
    marksObtained: number;
    maxMarks: number;
    percentage: number;
    grade: string; // "A+", "A", "B+", etc.
    remarks?: string;
  }>>(),

  // Aggregate results
  totalMarksObtained: integer("total_marks_obtained"),
  totalMaxMarks: integer("total_max_marks"),
  overallPercentage: integer("overall_percentage"),
  division: text("division"), // "First Division", "Second Division"
  rank: integer("rank"), // Class rank
  percentile: integer("percentile"),

  // Board exam specifics
  boardExamRollNumber: text("board_exam_roll_number"),
  boardRegistrationNumber: text("board_registration_number"),
  certificateUrl: text("certificate_url"),

  // Verification
  isVerified: integer("is_verified", { mode: "boolean" }).default(false),
  verifiedBy: text("verified_by").references(() => users.id),
  enteredBy: text("entered_by").references(() => users.id),

  createdAt: integer("created_at", { mode: "timestamp" }),
  updatedAt: integer("updated_at", { mode: "timestamp" }),
});

// ============================================================================
// FEE MANAGEMENT
// ============================================================================

// Fee Structure
export const feeStructures = sqliteTable("fee_structures", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").notNull().references(() => schools.id),
  name: text("name").notNull(), // "Class 10 Fee Structure 2024-2025"
  grade: integer("grade").notNull(),
  academicYear: text("academic_year").notNull(),

  // Fee components
  fees: text("fees", { mode: "json" }).$type<Array<{
    id: string;
    name: string; // "Tuition Fee", "Lab Fee", "Sports Fee"
    amount: number; // In Ngultrum (BTN)
    frequency: "monthly" | "quarterly" | "semester" | "annual" | "one_time";
    isOptional: number;
    dueDate?: string; // ISO date
  }>>(),

  // Total amount
  totalAnnualAmount: integer("total_annual_amount"),

  // Scholarship discounts applicable
  applicableScholarships: text("applicable_scholarships", { mode: "json" }).$type<string[]>(),

  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: integer("created_at", { mode: "timestamp" }),
  updatedAt: integer("updated_at", { mode: "timestamp" }),
});

// Student Fee Records
export const studentFees = sqliteTable("student_fees", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").notNull().references(() => schools.id),
  studentId: text("student_id").notNull().references(() => users.id),
  structureId: text("structure_id").references(() => feeStructures.id),
  termId: text("term_id").references(() => academicTerms.id),

  // Payment status
  totalAmount: integer("total_amount").notNull(),
  amountPaid: integer("amount_paid").default(0),
  amountPending: integer("amount_pending"),
  amountWaived: integer("amount_waived").default(0),

  // Status
  status: text("status").default("pending"), // "pending", "partial", "paid", "waived"

  // Due dates
  dueDate: text("due_date"),
  lastPaymentDate: text("last_payment_date"),

  createdAt: integer("created_at", { mode: "timestamp" }),
  updatedAt: integer("updated_at", { mode: "timestamp" }),
});

// Fee Payment Transactions
export const feePayments = sqliteTable("fee_payments", {
  id: text("id").primaryKey(),
  studentFeeId: text("student_fee_id").notNull().references(() => studentFees.id),
  studentId: text("student_id").notNull().references(() => users.id),
  schoolId: text("school_id").notNull().references(() => schools.id),

  // Payment details
  amount: integer("amount").notNull(),
  paymentMethod: text("payment_method").notNull(), // "cash", "bank_transfer", "check", "online", "upi"
  transactionId: text("transaction_id"), // Bank reference

  // Receipt
  receiptNumber: text("receipt_number").notNull(),
  receiptUrl: text("receipt_url"), // PDF receipt

  // Collected by
  collectedBy: text("collected_by").references(() => users.id),
  collectedAt: integer("collected_at", { mode: "timestamp" }).notNull(),

  // Notes
  notes: text("notes"),

  createdAt: integer("created_at", { mode: "timestamp" }),
});

// ============================================================================
// LEARNING MODULES
// ============================================================================

// Modules/Lessons (Advanced Learning Management)
export const learningModules = sqliteTable("learning_modules", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").references(() => schools.id),
  subjectId: text("subject_id").references(() => subjects.id),
  teacherId: text("teacher_id").references(() => users.id),

  // Module details
  title: text("title").notNull(),
  description: text("description"),
  orderIndex: integer("order_index"),

  // Content (structured lessons)
  lessons: text("lessons", { mode: "json" }).$type<Array<{
    id: string;
    title: string;
    content: string; // Rich text/markdown
    videoUrl?: string;
    attachments?: Array<{ name: string; url: string; type: string }>;
    duration: integer; // Minutes (estimated)
    order: number;
  }>>(),

  // Assessment (quiz at the end)
  quiz: text("quiz", { mode: "json" }),

  // Settings
  isPublished: integer("is_published", { mode: "boolean" }).default(false),
  isPublic: integer("is_public", { mode: "boolean" }).default(false), // Share across schools
  allowPreview: integer("allow_preview", { mode: "boolean" }).default(true),

  // Enrollment (if restricted)
  enrollable: integer("enrollable", { mode: "boolean" }).default(false),
  maxEnrollments: integer("max_enrollments"),

  // Progress tracking
  estimatedDuration: integer("estimated_duration"), // Total minutes

  createdAt: integer("created_at", { mode: "timestamp" }),
  updatedAt: integer("updated_at", { mode: "timestamp" }),
});

// Module Progress/Enrollment
export const moduleProgress = sqliteTable("module_progress", {
  id: text("id").primaryKey(),
  moduleId: text("module_id").notNull().references(() => learningModules.id),
  studentId: text("student_id").notNull().references(() => users.id),

  // Progress
  completedLessons: text("completed_lessons", { mode: "json" }).$type<string[]>(),
  currentLesson: text("current_lesson"), // Currently on lesson X
  progressPercentage: integer("progress_percentage").default(0),

  // Quiz results
  quizScore: integer("quiz_score"),
  quizCompletedAt: integer("quiz_completed_at", { mode: "timestamp" }),

  // Completion
  isCompleted: integer("is_completed", { mode: "boolean" }).default(false),
  completedAt: integer("completed_at", { mode: "timestamp" }),

  // Certificate (upon completion)
  certificateUrl: text("certificate_url"),

  enrolledAt: integer("enrolled_at", { mode: "timestamp" }),
  lastAccessedAt: integer("last_accessed_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }),
});

// ============================================================================
// FILE STORAGE
// ============================================================================

// File Storage (Cloud + Local option)
export const fileStorage = sqliteTable("file_storage", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").references(() => schools.id),

  // File metadata
  fileName: text("file_name").notNull(),
  originalName: text("original_name").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(), // Bytes

  // Storage location
  storageType: text("storage_type").notNull(), // "local", "s3", "cloudflare_r2", "google_drive", "onedrive"
  storagePath: text("storage_path").notNull(), // Path or URL

  // Ownership
  uploadedBy: text("uploaded_by").references(() => users.id),
  entityType: text("entity_type").notNull(), // "homework", "submission", "module", "profile", "fee_receipt"
  entityId: text("entity_id").notNull(),

  // Access control
  isPublic: integer("is_public", { mode: "boolean" }).default(false),
  accessCount: integer("access_count").default(0),

  // Expiration (for temporary files)
  expiresAt: integer("expires_at", { mode: "timestamp" }),

  createdAt: integer("created_at", { mode: "timestamp" }),
});

// ============================================================================
// TUITION MARKETPLACE
// ============================================================================

// Tuition Subjects/Categories
export const tuitionCategories = sqliteTable("tuition_categories", {
  id: text("id").primaryKey(),
  name: text("name").notNull(), // "Mathematics", "Physics", "English"
  icon: text("icon"),
  description: text("description"),
  gradeLevels: text("grade_levels", { mode: "json" }).$type<number[]>(), // [8, 9, 10, 11, 12]
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: integer("created_at", { mode: "timestamp" }),
});

// Tutors (Teachers who offer tuition)
export const tutors = sqliteTable("tutors", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),

  // Profile
  bio: text("bio"), // Professional introduction
  qualifications: text("qualifications", { mode: "json" }).$type<Array<{
    degree: string;
    institution: string;
    year: number;
  }>>(),
  experience: integer("experience"), // Years of teaching experience

  // Expertise
  subjects: text("subjects", { mode: "json" }).$type<string[]>(), // ["Mathematics", "Physics"]
  gradeLevels: text("grade_levels", { mode: "json" }).$type<number[]>(), // [10, 11, 12]

  // Location (for physical tuition)
  location: text("location", { mode: "json" }).$type<{
    district: string;
    city: string;
    area: string;
    coordinates: { latitude: number; longitude: number };
  }>(),
  travelRadius: integer("travel_radius"), // KM willing to travel

  // Pricing
  hourlyRateOnline: integer("hourly_rate_online"), // BTN per hour
  hourlyRatePhysical: integer("hourly_rate_physical"), // BTN per hour
  currency: text("currency").default("BTN"),

  // Availability
  availableDays: text("available_days", { mode: "json" }).$type<string[]>(), // ["Monday", "Wednesday"]
  availableSlots: text("available_slots", { mode: "json" }).$type<Array<{
    day: string;
    startTime: string; // HH:MM
    endTime: string;
  }>>(),

  // Verification
  isVerified: integer("is_verified", { mode: "boolean" }).default(false),
  verificationDocuments: text("verification_documents", { mode: "json" }).$type<Array<{
    type: string; // "id_proof", "qualification", "experience_certificate"
    url: string;
  }>>(),

  // Rating
  averageRating: integer("average_rating"), // 1-50 (to store as 0.5 increments, divide by 10)
  totalReviews: integer("total_reviews").default(0),
  totalStudents: integer("total_students").default(0),

  // Bank details for payments
  bankAccount: text("bank_account", { mode: "json" }).$type<{
    bankName: string;
    accountNumber: string;
    accountHolder: string;
    branch?: string;
  }>(),

  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: integer("created_at", { mode: "timestamp" }),
});

// Tuition Courses (Online pre-recorded or live)
export const tuitionCourses = sqliteTable("tuition_courses", {
  id: text("id").primaryKey(),
  tutorId: text("tutor_id").notNull().references(() => tutors.id),
  categoryId: text("category_id").references(() => tuitionCategories.id),

  // Course details
  title: text("title").notNull(),
  description: text("description"),
  thumbnail: text("thumbnail"), // Cover image URL

  // Type
  type: text("type").notNull(), // "online_recorded", "online_live", "physical"

  // For physical courses
  location: text("location", { mode: "json" }).$type<{
    district: string;
    area: string;
    fullAddress: string;
    coordinates: { latitude: number; longitude: number };
  }>(),

  // Target audience
  gradeLevel: integer("grade_level"),
  maxStudents: integer("max_students"),
  currentEnrollments: integer("current_enrollments").default(0),

  // Schedule (for live courses)
  schedule: text("schedule", { mode: "json" }).$type<Array<{
    day: string;
    startTime: string;
    endTime: string;
    startDate: string; // ISO date
    endDate: string;
  }>>(),

  // Content (for recorded courses)
  lessons: text("lessons", { mode: "json" }).$type<Array<{
    id: string;
    title: string;
    videoUrl: string;
    duration: number; // Minutes
    order: number;
    isFree: number; // Preview lesson
  }>>(),

  // Pricing
  price: integer("price").notNull(), // Total course price in BTN
  currency: text("currency").default("BTN"),
  discountPrice: integer("discount_price"),
  discountValidUntil: text("discount_valid_until"),

  // Status
  status: text("status").default("draft"), // "draft", "published", "archived"
  publishedAt: integer("published_at", { mode: "timestamp" }),

  createdAt: integer("created_at", { mode: "timestamp" }),
  updatedAt: integer("updated_at", { mode: "timestamp" }),
});

// Tuition Enrollments
export const tuitionEnrollments = sqliteTable("tuition_enrollments", {
  id: text("id").primaryKey(),
  courseId: text("course_id").notNull().references(() => tuitionCourses.id),
  studentId: text("student_id").notNull().references(() => users.id),
  tutorId: text("tutor_id").notNull().references(() => tutors.id),

  // Payment
  amountPaid: integer("amount_paid").notNull(),
  platformFee: integer("platform_fee").notNull(), // 20% of amountPaid
  tutorEarnings: integer("tutor_earnings").notNull(), // 80% of amountPaid
  currency: text("currency").default("BTN"),

  // Payment status
  paymentStatus: text("payment_status").default("pending"), // "pending", "completed", "refunded"
  paymentMethod: text("payment_method"), // "online", "cash", "bank_transfer"

  // Enrollment dates
  enrolledAt: integer("enrolled_at", { mode: "timestamp" }).notNull(),
  completedAt: integer("completed_at", { mode: "timestamp" }),
  expiresAt: integer("expires_at", { mode: "timestamp" }), // Course access expiry

  // Progress
  progressPercentage: integer("progress_percentage").default(0),
  completedLessons: text("completed_lessons", { mode: "json" }).$type<string[]>(),

  // Certificate (on completion)
  certificateUrl: text("certificate_url"),

  createdAt: integer("created_at", { mode: "timestamp" }),
});

// Live Sessions (for one-on-one or group live tuition)
export const liveSessions = sqliteTable("live_sessions", {
  id: text("id").primaryKey(),
  tutorId: text("tutor_id").notNull().references(() => tutors.id),
  studentId: text("student_id").references(() => users.id), // null for group sessions
  courseId: text("course_id").references(() => tuitionCourses.id),

  // Session details
  title: text("title").notNull(),
  description: text("description"),
  subject: text("subject").notNull(),

  // Type
  sessionType: text("session_type").notNull(), // "one_on_one", "group"

  // Timing
  scheduledDate: text("scheduled_date").notNull(), // ISO date
  startTime: text("start_time").notNull(), // HH:MM
  endTime: text("end_time").notNull(),
  duration: integer("duration").notNull(), // Minutes

  // Platform
  platform: text("platform").notNull(), // "zoom", "google_meet", "teams", "in_app"
  meetingLink: text("meeting_link"),
  meetingPassword: text("meeting_password"),

  // For group sessions
  maxParticipants: integer("max_participants"),
  currentParticipants: integer("current_participants").default(0),
  pricePerStudent: integer("price_per_student"),

  // Recording
  isRecorded: integer("is_recorded", { mode: "boolean" }).default(false),
  recordingUrl: text("recording_url"),

  // Status
  status: text("status").default("scheduled"), // "scheduled", "in_progress", "completed", "cancelled"

  // Actual timing (may differ from scheduled)
  actualStartTime: integer("actual_start_time", { mode: "timestamp" }),
  actualEndTime: integer("actual_end_time", { mode: "timestamp" }),

  createdAt: integer("created_at", { mode: "timestamp" }),
});

// Tutor Reviews & Ratings
export const tutorReviews = sqliteTable("tutor_reviews", {
  id: text("id").primaryKey(),
  tutorId: text("tutor_id").notNull().references(() => tutors.id),
  studentId: text("student_id").notNull().references(() => users.id),
  enrollmentId: text("enrollment_id").references(() => tuitionEnrollments.id),
  sessionId: text("session_id").references(() => liveSessions.id),

  // Rating
  rating: integer("rating").notNull(), // 1-5
  // Rating categories
  teachingQuality: integer("teaching_quality"), // 1-5
  communication: integer("communication"), // 1-5
  punctuality: integer("punctuality"), // 1-5
  valueForMoney: integer("value_for_money"), // 1-5

  // Review
  review: text("review"), // Written review
  isPublic: integer("is_public", { mode: "boolean" }).default(true),

  // Tutor response
  tutorResponse: text("tutor_response"),
  respondedAt: integer("responded_at", { mode: "timestamp" }),

  createdAt: integer("created_at", { mode: "timestamp" }),
});

// Tutor Earnings & Payouts
export const tutorEarnings = sqliteTable("tutor_earnings", {
  id: text("id").primaryKey(),
  tutorId: text("tutor_id").notNull().references(() => tutors.id),

  // Source
  sourceType: text("source_type").notNull(), // "course", "live_session"
  sourceId: text("source_id").notNull(),
  enrollmentId: text("enrollment_id").references(() => tuitionEnrollments.id),

  // Amount
  grossAmount: integer("gross_amount").notNull(), // Before platform fee
  platformFee: integer("platform_fee").notNull(), // 20%
  netAmount: integer("net_amount").notNull(), // 80% to tutor
  currency: text("currency").default("BTN"),

  // Payout status
  payoutStatus: text("payout_status").default("pending"), // "pending", "processing", "paid", "failed"
  payoutMethod: text("payout_method"), // "bank_transfer", "wallet"
  payoutReference: text("payout_reference"),
  paidAt: integer("paid_at", { mode: "timestamp" }),

  earnedAt: integer("earned_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }),
});

// Physical Tuition Requests (Location-based)
export const physicalTuitionRequests = sqliteTable("physical_tuition_requests", {
  id: text("id").primaryKey(),
  studentId: text("student_id").notNull().references(() => users.id),

  // Request details
  subjects: text("subjects", { mode: "json" }).$type<string[]>(),
  gradeLevel: integer("grade_level").notNull(),

  // Location preferences
  location: text("location", { mode: "json" }).$type<{
    district: string;
    area: string;
    preferredLocations: string[]; // ["Tuition center", "Home", "Library"]
  }>(),
  maxTravelDistance: integer("max_travel_distance"), // KM

  // Schedule preferences
  preferredDays: text("preferred_days", { mode: "json" }).$type<string[]>(),
  preferredTime: text("preferred_time"), // "morning", "afternoon", "evening"

  // Budget
  maxHourlyRate: integer("max_hourly_rate"),

  // Matching
  matchedTutors: text("matched_tutors", { mode: "json" }).$type<Array<{
    tutorId: string;
    matchScore: number; // How well they match
  }>>(),
  selectedTutorId: text("selected_tutor_id").references(() => tutors.id),

  // Status
  status: text("status").default("open"), // "open", "matched", "booked", "completed", "cancelled"

  createdAt: integer("created_at", { mode: "timestamp" }),
  expiresAt: integer("expires_at", { mode: "timestamp" }), // Request expires in 30 days
});

// ============================================================================
// ADDITIONAL TYPE EXPORTS
// ============================================================================

export type SchoolAdmin = typeof schoolAdmins.$inferSelect;
export type CounselorAssignment = typeof counselorAssignments.$inferSelect;
export type Enrollment = typeof enrollments.$inferSelect;
export type TeacherAssignment = typeof teacherAssignments.$inferSelect;
export type AcademicTerm = typeof academicTerms.$inferSelect;
export type Subject = typeof subjects.$inferSelect;
export type Homework = typeof homework.$inferSelect;
export type HomeworkSubmission = typeof homeworkSubmissions.$inferSelect;
export type Attendance = typeof attendance.$inferSelect;
export type AttendanceSession = typeof attendanceSessions.$inferSelect;
export type ExamResultEnhanced = typeof examResultsEnhanced.$inferSelect;
export type FeeStructure = typeof feeStructures.$inferSelect;
export type StudentFee = typeof studentFees.$inferSelect;
export type FeePayment = typeof feePayments.$inferSelect;
export type LearningModule = typeof learningModules.$inferSelect;
export type ModuleProgress = typeof moduleProgress.$inferSelect;
export type FileStorage = typeof fileStorage.$inferSelect;
export type TuitionCategory = typeof tuitionCategories.$inferSelect;
export type Tutor = typeof tutors.$inferSelect;
export type TuitionCourse = typeof tuitionCourses.$inferSelect;
export type TuitionEnrollment = typeof tuitionEnrollments.$inferSelect;
export type LiveSession = typeof liveSessions.$inferSelect;
export type TutorReview = typeof tutorReviews.$inferSelect;
export type TutorEarning = typeof tutorEarnings.$inferSelect;
export type PhysicalTuitionRequest = typeof physicalTuitionRequests.$inferSelect;
