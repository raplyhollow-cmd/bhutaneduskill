// User Types
export type UserType = "student" | "teacher" | "parent" | "admin";

export interface Class {
  id: string;
  name: string;
  grade: number;
  section?: string;
  teacherId?: string;
  schoolId: string;
}

export interface User {
  id: string;
  tenantId: string;
  schoolId?: string;
  type: UserType;
  role: string;
  email?: string;
  phone?: string;
  firstName: string;
  lastName?: string;
  profilePicture?: string;
  // Student specific
  dateOfBirth?: string;
  classGrade?: number;
  section?: string;
  parentId?: string;
  // Teacher specific
  employeeId?: string;
  subjects?: string[];
  // Parent specific
  occupation?: string;
  relationship?: string;
  clerkUserId?: string;
  emailVerified?: boolean;
  settings?: Record<string, unknown>;
  createdAt: Date;
  lastLogin?: string | null;
}

// Assessment Types
export type AssessmentType = "riasec" | "aptitude" | "skills" | "interest";
export type AssessmentStatus = "in_progress" | "completed" | "abandoned";

export interface Assessment {
  id: string;
  tenantId: string;
  userId: string;
  type: AssessmentType;
  status: AssessmentStatus;
  answers: Record<string, number>;
  results?: AssessmentResults;
  startedAt: Date;
  completedAt?: Date;
  createdAt: Date;
}

export interface AssessmentResults {
  riasecType?: string;
  scores?: RIASECScores;
  recommendedCareers?: CareerMatch[];
}

// Assessment Result (from database) - added for admin assessments page
// Using DbAssessmentResult to avoid conflict with AssessmentResult from database schema
export interface DbAssessmentResult {
  id: string;
  assessmentId: string;
  userId: string;
  status: string;
  score?: number;
  answers?: unknown[];
  textAnswers?: Record<string, string>;
  feedback?: string;
  submittedAt?: Date;
  gradedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  // Additional properties from joins
  assessment?: {
    id: string;
    title: string;
    description?: string;
    type?: string;
    dueDate?: string;
    totalPoints?: number;
  };
  user?: {
    id: string;
    name: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  };
}

// Assessment Type (database entity) - added for admin assessments page
// Using DbAssessmentTypeEntity to avoid conflict with AssessmentType union
export interface DbAssessmentTypeEntity {
  id: string;
  name: string;
  slug: string;
  type: AssessmentType;
  category: string;
  targetAudience?: string[];
  targetGrade?: number[];
  duration?: number;
  totalQuestions?: number;
  passingScore?: number;
  isActive: boolean;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Assessment Stats for admin dashboard
export interface AssessmentStats {
  assessmentTypes: {
    total: number;
    active: number;
  };
  assessments: {
    total: number;
    active: number;
  };
  submissions: {
    total: number;
    submitted: number;
    graded: number;
    pending: number;
  };
  byCategory: Record<string, number>;
}

// Export aliases for backward compatibility
export type AssessmentResult = DbAssessmentResult;
export type AssessmentTypeEntity = DbAssessmentTypeEntity;

export interface RIASECScores {
  realistic: number;
  investigative: number;
  artistic: number;
  social: number;
  enterprising: number;
  conventional: number;
}

// Career Types
export interface Career {
  id: string;
  tenantId?: string;
  name: string;
  slug: string;
  description?: string;
  riasecCode?: string;
  riasecScores?: Partial<RIASECScores>;
  skills?: string[];
  educationPath?: string[];
  subjects?: string[];
  workEnvironment?: string;
  salaryRange?: string;
  demandOutlook?: "high" | "medium" | "low";
  bhutanSpecific?: boolean;
  isActive?: boolean;
}

export interface CareerMatch {
  career: Career;
  matchScore: number;
  recommendation?: string;
  isTopMatch?: boolean;
}

// RIASEC Types
export type RIASECType = "R" | "I" | "A" | "S" | "E" | "C";

export interface RIASECQuestion {
  id: string;
  text: string;
  options: Array<{ value: number; text: string }>;
  category: RIASECType;
}

// School & Tenant Types
export interface Tenant {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  settings?: Record<string, unknown>;
}

export interface School {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  domain?: string;
  address?: string;
  contactEmail?: string;
  contactPhone?: string;
}

// Dashboard Types
export interface StudentDashboard {
  user: User;
  recentAssessments: Assessment[];
  topSkills: string[];
  recommendedCareers: Career[];
  progress: {
    assessmentsCompleted: number;
    skillsInProgress: number;
    streak: number;
  };
}

export interface TeacherDashboard {
  user: User;
  classes: Class[];
  studentCount: number;
  assessmentCompletion: number;
  careerInterestDistribution: Record<string, number>;
}

export interface ParentDashboard {
  user: User;
  children: User[];
  childrenProgress: Array<{
    child: User;
    latestAssessment?: Assessment;
    recommendedCareers: Career[];
  }>;
}

export interface AdminDashboard {
  school: School;
  totalStudents: number;
  totalTeachers: number;
  totalParents: number;
  assessmentStats: {
    total: number;
    completed: number;
    inProgress: number;
  };
  careerInterests: Record<string, number>;
  atRiskStudents: number;
}

// Study Abroad Types
export type StudyAbroadCountry = "australia" | "new-zealand" | "usa" | "singapore" | "europe";

export interface StudyAbroadRequirement {
  country: StudyAbroadCountry;
  requirements: string[];
  ieltsRequired: boolean;
  ieltsScore: number;
  satRequired: boolean;
  costPerYear: {
    tuition: string;
    living: string;
  };
  scholarships: boolean;
}

export interface StudyAbroadReadiness {
  country: StudyAbroadCountry;
  readinessScore: number;
  academicReady: boolean;
  languageReady: boolean;
  financialReady: boolean;
  recommendations: string[];
}

// Consent Types
export interface ConsentRecord {
  id: string;
  userId: string;
  parentId: string;
  type: string;
  status: "pending" | "approved" | "revoked";
  consentText?: string;
  consentedAt?: Date;
  revokedAt?: Date;
}

// API Response Types
export interface ApiResponse<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

// ============================================================================
// STANDARD API RESPONSE TYPES (for new API routes)
// ============================================================================

/**
 * Standard API Success Response
 * Use this for consistent success responses across all API routes
 */
export interface ApiSuccess<T> {
  data: T;
  status?: number;
  message?: string;
}

/**
 * Standard API Error Response
 * Use this for consistent error responses across all API routes
 */
export interface ApiErrorResponse {
  error: string;
  status: number;
  details?: unknown;
}

/**
 * Union type for API responses
 */
export type ApiResponseV2<T> = ApiSuccess<T> | ApiErrorResponse;

/**
 * Pagination metadata
 */
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Paginated API response
 */
export interface PaginatedResponse<T> extends ApiSuccess<T[]> {
  pagination: Pagination;
}

// ============================================================================
// COMMON ENTITY TYPES
// ============================================================================

/**
 * Base entity with common fields
 */
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * User entity for API responses
 */
export interface UserEntity extends BaseEntity {
  clerkUserId: string;
  type: string;
  name?: string;
  email?: string;
  schoolId?: string;
}

// ============================================================================
// API REQUEST TYPES
// ============================================================================

/**
 * Common query parameters for list endpoints
 */
export interface ListQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}

/**
 * Common filter parameters
 */
export interface FilterParams {
  schoolId?: string;
  classId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

// ============================================================================
// LIBRARY TYPES
// ============================================================================

/**
 * Book status types
 */
export type BookStatus = "available" | "borrowed" | "reserved" | "lost" | "damaged" | "maintenance";

/**
 * Book condition types
 */
export type BookCondition = "new" | "good" | "fair" | "poor" | "damaged";

/**
 * Library book entity
 */
export interface LibraryBook extends BaseEntity {
  id: string;
  schoolId: string;
  isbn: string;
  title: string;
  author: string;
  publicationYear: number;
  category: string;
  publisher: string;
  language: string;
  description: string;
  totalPages: number;
  coverImage: string;
  status: BookStatus;
  isActive: boolean;
}

/**
 * Circulation status types
 */
export type CirculationStatus = "borrowed" | "returned" | "overdue" | "lost";

/**
 * Library circulation record (book borrowing)
 */
export interface LibraryCirculation extends BaseEntity {
  id: string;
  bookId: string;
  borrowerId: string;
  studentId: string;
  borrowDate: string;
  dueDate: string;
  returnDate?: string;
  status: CirculationStatus;
  fine: number;
  finePaid: boolean;
  renewals: number;
  maxRenewals: number;
  notes?: string;
  book?: {
    id: string;
    title: string;
    author: string;
    isbn: string;
    category: string;
    coverImage: string;
    publicationYear: number;
    status: string;
  };
  borrower?: {
    id: string;
    name: string;
    email: string;
    type: string;
  };
  calculatedFine?: number;
  isOverdue?: boolean;
  daysOverdue?: number;
}

/**
 * Reservation status types
 */
export type ReservationStatus = "pending" | "ready" | "fulfilled" | "cancelled" | "expired";

/**
 * Book reservation/hold request
 */
export interface BookReservation extends BaseEntity {
  id: string;
  schoolId: string;
  bookId: string;
  requesterId: string;
  requesterType: "student" | "teacher" | "admin" | "staff";
  requesterName?: string;
  reservationDate: string;
  expiryDate: string;
  notifiedDate?: string;
  status: ReservationStatus;
  priority: number;
  notes?: string;
  cancellationReason?: string;
  book?: {
    id: string;
    title: string;
    author: string;
    isbn: string;
    coverImage: string;
  };
}

/**
 * Library statistics
 */
export interface LibraryStats {
  totalBooks: number;
  availableBooks: number;
  borrowedBooks: number;
  reservedBooks: number;
  overdueBooks: number;
  totalDigitalResources: number;
  totalMembers: number;
  activeMembers: number;
  totalFines: number;
  finesPaid: number;
  finesPending: number;
  borrowsThisMonth: number;
  returnsThisMonth: number;
  newBooksThisMonth: number;
}

/**
 * Library dashboard data
 */
export interface LibraryDashboard {
  stats: LibraryStats;
  recentCirculation: LibraryCirculation[];
  pendingReservations: BookReservation[];
  overdueBooks: Array<LibraryCirculation & { book: LibraryBook; borrower: { id: string; name: string } }>;
  popularBooks: Array<LibraryBook & { borrowCount: number }>;
}

// ============================================================================
// DATABASE QUERY RESULT TYPES
// ============================================================================

/**
 * Base database entity with common fields
 */
export interface DbEntity {
  id: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

/**
 * Database User record (full type for query results)
 */
export interface DbUser extends DbEntity {
  id: string;
  clerkUserId: string;
  type: string;
  schoolId?: string | null;
  firstName: string;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  profilePicture?: string | null;
  dateOfBirth?: string | null;
  classGrade?: number | null;
  section?: string | null;
  parentId?: string | null;
  employeeId?: string | null;
  subjects?: string[] | null;
  occupation?: string | null;
  relationship?: string | null;
  settings?: Record<string, unknown> | null;
  isActive?: boolean;
  onboardingStatus?: string | null;
}

/**
 * School database record
 */
export interface DbSchool extends DbEntity {
  id: string;
  tenantId: string;
  name: string;
  nameDzongkha?: string | null;
  code: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  logo?: string | null;
  schoolType?: string | null;
  level?: string | null;
  domain?: string | null;
  isActive?: boolean;
  subscriptionStatus?: string | null;
}

/**
 * Class database record
 */
export interface DbClass extends DbEntity {
  id: string;
  name: string;
  grade: number;
  section?: string | null;
  schoolId: string;
  classTeacherId?: string | null;
  capacity?: number | null;
  currentStudents?: number | null;
  roomNumber?: string | null;
  isActive?: boolean;
}

/**
 * Subject database record
 */
export interface DbSubject extends DbEntity {
  id: string;
  code: string;
  name: string;
  nameDzongkha?: string | null;
  schoolId?: string | null;
  isGlobal?: boolean;
  applicableGrades?: string[] | null;
  description?: string | null;
  isActive?: boolean;
}

// ============================================================================
// ERROR HANDLING TYPES
// ============================================================================

/**
 * Standard error with unknown cause
 */
export interface UnknownError {
  message?: string;
  code?: string;
  status?: number;
  details?: unknown;
}

/**
 * Type guard for error objects
 */
export function isErrorWithMessage(error: unknown): error is { message: string } {
  return (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message: unknown }).message === "string"
  );
}

/**
 * Get error message from unknown error
 */
export function getErrorMessage(error: unknown): string {
  if (isErrorWithMessage(error)) {
    return error.message;
  }
  return String(error);
}

// ============================================================================
// FORM AND REQUEST TYPES
// ============================================================================

/**
 * Generic form data type
 */
export interface FormDataRecord {
  [key: string]: string | number | boolean | string[] | undefined | null;
}

/**
 * Database query condition type
 */
export type DbCondition = {
  field: string;
  operator: "eq" | "ne" | "gt" | "gte" | "lt" | "lte" | "in" | "like" | "isNull";
  value: unknown;
};

/**
 * Dynamic update data type for database operations
 */
export type UpdateData<T extends Record<string, unknown>> = Partial<T> & {
  updatedAt?: Date;
};

// ============================================================================
// CLERK WEBHOOK TYPES
// ============================================================================

/**
 * Clerk webhook event data types
 */
export interface ClerkWebhookUser {
  id: string;
  email_addresses: Array<{ id: string; email_address: string; verification?: { status: string } }>;
  first_name?: string;
  last_name?: string;
  phone_numbers?: Array<{ phone_number: string }>;
  profile_image_url?: string;
  created_at: number;
  updated_at: number;
  public_metadata?: Record<string, unknown>;
  unsafe_metadata?: Record<string, unknown>;
}

/**
 * Clerk webhook event type
 */
export interface ClerkWebhookEvent {
  data: ClerkWebhookUser;
  object: "event";
  type: "user.created" | "user.updated" | "user.deleted";
}

// ============================================================================
// AI API TYPES
// ============================================================================

/**
 * AI safety setting
 */
export interface AISafetySetting {
  category: string;
  threshold: string;
}

/**
 * AI chat message
 */
export interface AIMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

// ============================================================================
// DATA EXPORT/IMPORT TYPES
// ============================================================================

/**
 * CSV row data
 */
export type CSVRow = Record<string, string | number>;

/**
 * JSON data array
 */
export type JSONArray = Array<Record<string, unknown>>;

/**
 * Import/Export result
 */
export interface ImportResult<T = unknown> {
  success: boolean;
  rowsProcessed: number;
  rowsSucceeded: number;
  rowsFailed: number;
  errors?: Array<{ row: number; message: string }>;
  data?: T[];
}

// ============================================================================
// ICON AND COMPONENT PROP TYPES
// ============================================================================

/**
 * React Node type for component props (icons, children, etc.)
 */
export type IconNode = React.ReactNode;

/**
 * Select value change handler type (for shadcn/ui Select components)
 */
export type SelectValueChangeHandler = (value: string) => void;

// ============================================================================
// HOMEWORK AND ASSESSMENT TYPES
// ============================================================================

/**
 * Homework question types
 */
export type QuestionType = "multiple-choice" | "true-false" | "short-answer" | "essay" | "fill-blank";

/**
 * Homework question interface
 */
export interface HomeworkQuestion {
  id: string;
  type: QuestionType;
  text: string;
  options?: Array<{ id: string; text: string; isCorrect?: boolean }>;
  correctAnswer?: string | string[];
  points?: number;
}

/**
 * Student homework answer
 */
export interface StudentAnswer {
  questionId: string;
  answer: string | string[] | boolean | number;
  submittedAt?: string;
}

/**
 * Homework submission data
 */
export interface HomeworkSubmissionData {
  homeworkId: string;
  studentId: string;
  answers: StudentAnswer[];
  submittedAt: string;
}

// ============================================================================
// TEACHER PAYSLIP TYPES
// ============================================================================

/**
 * Payslip allowance/deduction item
 */
export interface PayslipItem {
  name: string;
  amount: number;
  type?: string;
}

/**
 * Teacher payslip record
 */
export interface PayslipRecord {
  id: string;
  teacherId: string;
  teacherName?: string;
  schoolId: string;
  month: number;
  year: number;
  basicSalary: number;
  allowances?: PayslipItem[];
  deductions?: PayslipItem[];
  netSalary: number;
  paymentDate?: string;
  status?: "paid" | "pending" | "cancelled";
}

/**
 * School data for payslip
 */
export interface PayslipSchoolData {
  id: string;
  name: string;
  code?: string;
  address?: string;
  logo?: string;
  contactEmail?: string;
  contactPhone?: string;
}

// ============================================================================
// BCSE SCHOLARSHIP TYPES
// ============================================================================

/**
 * BCSE subject result
 */
export interface BCSISubjectResult {
  subject: string;
  grade: string;
  marks?: number;
}

/**
 * BCSE exam result
 */
export interface BCSEResult {
  indexNumber: string;
  studentName: string;
  school: string;
  year: number;
  totalMarks?: number;
  aggregate?: string;
  subjectResults: BCSISubjectResult[];
}

/**
 * BCSE scholarship data
 */
export interface BCSEScholarship {
  id: string;
  name: string;
  type: string;
  eligibilityCriteria: {
    minimumAggregate?: string;
    requiredSubjects?: string[];
    minimumMarks?: number;
  };
  benefits: string[];
  applicationDeadline?: string;
  status?: "active" | "closed" | "upcoming";
}

/**
 * BCSE result validation row
 */
export interface BCSEValidationRow {
  indexNumber?: string;
  studentName?: string;
  school?: string;
  subject?: string;
  grade?: string;
  marks?: string;
}

// ============================================================================
// SCHOOL ADMIN CLASS TYPES
// ============================================================================

/**
 * Class subject assignment data
 */
export interface ClassSubjectAssignment {
  subjectId: string;
  subjectName: string;
  teacherId?: string;
  teacherName?: string;
}

/**
 * Class homework data
 */
export interface ClassHomeworkData {
  id: string;
  title: string;
  subject: string;
  dueDate: string;
  submissionCount: number;
  totalStudents: number;
}

/**
 * Class attendance summary
 */
export interface ClassAttendanceData {
  date: string;
  present: number;
  absent: number;
  late: number;
  total: number;
}

// ============================================================================
// EVENT REGISTRATION TYPES
// ============================================================================

/**
 * Event registration update data
 */
export interface EventRegistrationUpdateData {
  status?: "confirmed" | "pending" | "cancelled" | "attended";
  checkInTime?: string;
  notes?: string;
  paymentStatus?: "paid" | "pending" | "waived";
}

// ============================================================================
// MEDICAL RECORD TYPES
// ============================================================================

/**
 * Vaccination record data
 */
export interface VaccinationRecordData {
  id: string;
  studentId: string;
  studentName?: string;
  vaccineName: string;
  vaccineType?: string;
  administeredDate: string;
  nextDueDate?: string;
  administeredBy?: string;
  batchNumber?: string;
  notes?: string;
}

/**
 * Medical referral data
 */
export interface MedicalReferralData {
  id: string;
  studentId: string;
  studentName?: string;
  referralDate: string;
  referredTo: string;
  reason: string;
  urgency?: "routine" | "urgent" | "emergency";
  status?: "pending" | "completed" | "cancelled";
  notes?: string;
}

/**
 * Medicine inventory item
 */
export interface MedicineInventoryData {
  id: string;
  name: string;
  genericName?: string;
  category?: string;
  quantity: number;
  unit?: string;
  expiryDate?: string;
  batchNumber?: string;
  supplier?: string;
  reorderLevel?: number;
}

/**
 * Student allergy record
 */
export interface AllergyRecordData {
  id: string;
  studentId: string;
  studentName?: string;
  allergen: string;
  allergyType?: "food" | "medication" | "environmental" | "other";
  severity?: "mild" | "moderate" | "severe";
  reaction?: string;
  diagnosedDate?: string;
  notes?: string;
}

// ============================================================================
// TUITION ENROLLMENT TYPES
// ============================================================================

/**
 * Tuition enrollment data
 */
export interface TuitionEnrollmentData {
  id: string;
  studentId: string;
  studentName?: string;
  sessionId: string;
  sessionName?: string;
  enrolledDate: string;
  status?: "active" | "completed" | "cancelled" | "suspended";
  feeAmount?: number;
  paymentStatus?: "paid" | "pending" | "partial";
}

// ============================================================================
// CAREER GUIDANCE TYPES
// ============================================================================

/**
 * Recommended scholarship for student
 */
export interface RecommendedScholarship {
  scholarship: BCSEScholarship;
  matchScore: number;
  eligibilityNotes?: string[];
}

/**
 * Student career data
 */
export interface StudentCareerData {
  studentId: string;
  riasecType?: string;
  scores?: Partial<RIASECScores>;
  recommendedCareers?: CareerMatch[];
  recommendedScholarships?: RecommendedScholarship[];
}

// ============================================================================
// COUNSELOR API TYPES
// ============================================================================

/**
 * Student needing attention data
 */
export interface StudentNeedingAttention {
  id: string;
  name: string;
  school: string;
  grade: number | null;
  attendance: number;
  lastActivity: string;
  assessmentStatus: "completed" | "in_progress" | "pending";
  topCareer: string | null;
  needsAttention: boolean;
}

/**
 * Dashboard statistics for counselors
 */
export interface CounselorDashboardStats {
  totalStudents: number;
  activeSchools: number;
  pendingReports: number;
  assessmentsThisWeek: number;
  aiCoachUsage: number;
}

/**
 * School performance metrics
 */
export interface SchoolPerformance {
  name: string;
  students: number;
  completion: number;
}

/**
 * Session statistics
 */
export interface SessionStats {
  upcomingSessions: number;
  completedToday: number;
  totalHours: number;
  groupSessions: number;
}

/**
 * Student intervention data
 */
export interface StudentIntervention {
  id: string;
  studentId: string;
  studentName: string;
  grade: number | null;
  school: string;
  type: "academic" | "behavioral" | "personal" | "career" | "social";
  category: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: string;
  startDate: string;
  targetDate: string;
  followUpDate?: string;
  progress: number;
  description: string;
  goals: InterventionGoal[];
  notes: string[];
  outcome?: string;
  outcomeRating?: number | null;
  tags: string[];
  counselorId: string;
  createdAt: Date | string;
}

/**
 * Intervention goal data
 */
export interface InterventionGoal {
  id: string;
  text: string;
  status: "pending" | "in_progress" | "completed";
  targetDate?: string;
}

/**
 * Create intervention request
 */
export interface CreateInterventionRequest {
  studentId: string;
  type: "academic" | "behavioral" | "personal" | "career" | "social";
  category: string;
  priority: "low" | "medium" | "high" | "urgent";
  description: string;
  startDate: string;
  targetDate: string;
  followUpDate?: string;
  goals?: InterventionGoal[];
  tags?: string[];
}

// ============================================================================
// MINISTRY API TYPES
// ============================================================================

/**
 * Ministry dashboard statistics
 */
export interface MinistryDashboardStats {
  totalSchools: number;
  totalStudents: number;
  totalTeachers: number;
  assessmentCompletion: number;
  newSchoolsThisMonth: number;
  activeTeachers: number;
  enrollmentGrowth: number;
}

/**
 * Top performing school
 */
export interface TopSchool {
  id: string;
  name: string;
  district: string;
  completion: number;
  students: number;
  change: number;
}

/**
 * Career interest distribution
 */
export interface CareerInterest {
  career: string;
  percentage: number;
  trend: string;
  count: number;
}

/**
 * Recent activity item
 */
export interface RecentActivity {
  type: string;
  description: string;
  timestamp: string;
}

/**
 * Ministry dashboard response
 */
export interface MinistryDashboardResponse {
  stats: MinistryDashboardStats;
  topSchools: TopSchool[];
  careerInterests: CareerInterest[];
  recentActivity: RecentActivity[];
}

// ============================================================================
// TEACHER STUDENT API TYPES
// ============================================================================

/**
 * Student record with parent information
 */
export interface StudentWithParent {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  profilePicture?: string | null;
  parentId?: string | null;
  parentContact?: string | null;
  parentPhone?: string | null;
  emergencyContact?: string | null;
}

/**
 * Parent/guardian contact information
 */
export interface ParentGuardianInfo {
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
}

/**
 * Attendance summary for a student
 */
export interface AttendanceSummary {
  present: number;
  absent: number;
  percentage: number | null;
  totalRecorded: number;
}

/**
 * Homework summary for a student
 */
export interface HomeworkSummary {
  submitted: number;
  graded: number;
  pending: number;
  total: number;
}

/**
 * Enriched student data for teacher view
 */
export interface EnrichedStudentData {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string | null;
  profilePicture: string | null;
  classGrade: number;
  section: string | null;
  className: string;
  classId: string;
  rollNumber: string | null;
  attendanceSummary: AttendanceSummary;
  homeworkSummary: HomeworkSummary;
  enrolledAt: Date | string;
  parentGuardianName: string | null;
  parentGuardianPhone: string | null;
  parentGuardianEmail: string | null;
}

// ============================================================================
// PARENT ATTENDANCE API TYPES
// ============================================================================

/**
 * Attendance record with details
 */
export interface AttendanceRecord {
  id: string;
  studentId: string;
  classId: string;
  date: string;
  status: "present" | "absent" | "late" | "excused";
  notes?: string | null;
  recordedBy?: string | null;
  createdAt: Date | string;
}

/**
 * Attendance statistics for a student
 */
export interface AttendanceStatistics {
  present: number;
  absent: number;
  late: number;
  excused: number;
  total: number;
  percentage: number;
}

/**
 * Class attendance details
 */
export interface ClassAttendanceDetails {
  classId: string;
  className: string;
  grade: number;
  section: string | null;
  attendance: AttendanceRecord[];
  statistics: AttendanceStatistics;
}

// ============================================================================
// HOMEWORK API TYPES
// ============================================================================

/**
 * Homework question with correct answer
 */
export interface HomeworkQuestionWithAnswer {
  id: string;
  text: string;
  type: string;
  options?: Array<{ id: string; text: string; isCorrect?: boolean }>;
  correctAnswer?: string | string[];
  points?: number;
}

/**
 * Student homework answer for grading
 */
export interface StudentHomeworkAnswer {
  questionId: string;
  answer: string | string[] | number | boolean;
  isCorrect?: boolean;
  points?: number;
  feedback?: string;
}

/**
 * Grading result for homework submission
 */
export interface HomeworkGradingResult {
  submissionId: string;
  totalPoints: number;
  earnedPoints: number;
  percentage: number;
  status: "graded" | "partial" | "needs_review";
  answers: StudentHomeworkAnswer[];
  gradedAt: Date;
  gradedBy: string;
}

/**
 * Draft homework submission data
 */
export interface DraftHomeworkData {
  homeworkId: string;
  studentId: string;
  answers: Array<{
    questionId: string;
    answer: string | string[] | number | boolean;
    timestamp?: string;
  }>;
  lastSaved: string;
  timeSpent?: number;
}

// ============================================================================
// STUDENT HOMEWORK TYPES
// ============================================================================

/**
 * Homework submission status
 */
export type HomeworkSubmissionStatus = "draft" | "submitted" | "graded" | "late" | "overdue";

/**
 * Student homework with submission status
 */
export interface StudentHomeworkData {
  id: string;
  title: string;
  description?: string | null;
  subject: string | null;
  subjectId: string | null;
  classId: string;
  teacherId: string | null;
  dueDate: string;
  isPublished: boolean;
  submissionStatus: HomeworkSubmissionStatus;
  submittedAt?: string | null;
  gradedAt?: string | null;
  score?: number | null;
  maxScore?: number | null;
  feedback?: string | null;
  hasDraft: boolean;
  isOverdue: boolean;
}

/**
 * Draft homework answer
 */
export interface DraftAnswer {
  questionId: string;
  answer: string | string[] | number | boolean;
  savedAt: string;
}

// ============================================================================
// JSON COLUMN TYPES FOR DATABASE SCHEMA
// ============================================================================

/**
 * Question data for assessment questions
 * Supports different assessment types with flexible structure
 */
export type QuestionData = Record<string, unknown> & {
  dimension?: string;
  direction?: number;
  category?: string;
  [key: string]: unknown;
};

/**
 * Content data for homework submissions
 * Stores student answers and submission metadata
 */
export interface HomeworkContent {
  answers?: Array<{
    questionId: string;
    answer: string | number | string[];
    isCorrect?: boolean;
  }>;
  files?: string[];
  submittedText?: string;
  totalTime?: number;
  [key: string]: unknown;
}

/**
 * Content data for counselor resources
 * Stores resource content in various formats
 */
export interface CounselorContent {
  title?: string;
  body?: string;
  sections?: Array<{
    heading: string;
    content: string;
  }>;
  attachments?: Array<{
    name: string;
    url: string;
    type: string;
  }>;
  [key: string]: unknown;
}

/**
 * Content data for learning modules
 * Stores module lessons and resources
 */
export interface LearningModuleContent {
  lessons?: Array<{
    id: string;
    title: string;
    duration: number;
    videoUrl?: string;
    content?: string;
    resources?: Array<{ name: string; url: string }>;
  }>;
  objectives?: string[];
  prerequisites?: string[];
  [key: string]: unknown;
}
