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
