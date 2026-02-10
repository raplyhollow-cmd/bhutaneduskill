// User Types
export type UserType = "student" | "teacher" | "parent" | "admin";

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
  lastLoginAt?: Date;
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
