/**
 * Student Portal Types
 *
 * Shared types for student dashboard features including
 * AI Career Coach, Roadmap Tracker, and Marks Overview.
 */

// ============================================================================
// AI CAREER COACH TYPES
// ============================================================================

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface ChatState {
  isOpen: boolean;
  messages: ChatMessage[];
  isLoading: boolean;
  conversationHistory: ChatMessage[];
  suggestedPrompts: string[];
}

export interface AIChatResponse {
  message: string;
  suggestions?: string[];
  resources?: Array<{
    title: string;
    url: string;
    type: "college" | "scholarship" | "career" | "article";
  }>;
  fallback?: boolean;
}

/**
 * Dashboard data context for quick prompt condition check
 */
export interface DashboardDataContext {
  user?: {
    id: string;
    type: string;
  };
  assessments?: Array<{
    id: string;
    type: string;
    status: string;
  }>;
  roadmap?: StudentRoadmap;
  marks?: MarksSummary;
}

export interface QuickPrompt {
  id: string;
  text: string;
  icon: string;
  condition?: (data: DashboardDataContext) => boolean;
}

// ============================================================================
// ROADMAP TRACKER TYPES
// ============================================================================

export type StageStatus = "completed" | "current" | "upcoming" | "locked";

export interface Milestone {
  id: string;
  title: string;
  description: string;
  completed?: boolean;
  dueDate?: string;
}

export interface RoadmapStage {
  id: string;
  title: string;
  description: string;
  icon: string;
  gradeRange: [number, number];
  status: StageStatus;
  milestones: Milestone[];
  color: string;
}

export interface StudentRoadmap extends Record<string, unknown> {
  stages: RoadmapStage[];
  currentGrade: number;
  targetCareer?: string;
  personalizedNote?: string;
}

// ============================================================================
// MARKS OVERVIEW TYPES
// ============================================================================

export type TrendType = "up" | "down" | "stable";

export interface SubjectPerformance {
  subject: string;
  marksObtained: number;
  maxMarks: number;
  percentage: number;
  grade: string;
  trend: TrendType;
  previousPercentage?: number;
  rank?: number;
}

export type ExamTerm = "midterm" | "final" | "unit_test" | "board_exam";

export interface ExamResult {
  id: string;
  examName: string;
  examType: ExamTerm;
  examDate: string;
  subjects: SubjectPerformance[];
  overallPercentage: number;
  overallGrade: string;
  classRank?: number;
  totalStudents?: number;
}

export interface MarksSummary {
  currentExam: ExamResult | null;
  previousExam: ExamResult | null;
  availableTerms: ExamTerm[];
  selectedTerm: ExamTerm;
  hasData: boolean;
}

// ============================================================================
// EXTENDED DASHBOARD DATA
// ============================================================================

export interface StudentDashboardData {
  roadmap?: StudentRoadmap;
  marks?: MarksSummary;
}

export interface ExtendedStudentDashboardData extends StudentDashboardData {
  roadmap?: StudentRoadmap;
  marks?: MarksSummary;
}
