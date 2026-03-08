/**
 * TIMETABLE CONSTRAINTS TYPE DEFINITIONS
 *
 * Defines the data structures for user-defined constraints that guide AI timetable optimization.
 * This enables the "Human-in-the-loop" approach where admins set rules and AI finds optimal solutions.
 */

/**
 * Main constraints object that defines all rules for timetable generation/optimization
 */
export interface TimetableConstraints {
  /** Teacher-specific availability and workload limits */
  teacherAvailability: TeacherConstraint[];

  /** Subject-specific scheduling preferences */
  subjectRules: SubjectConstraint[];

  /** Room requirements and restrictions */
  roomRules: RoomConstraint[];

  /** Class-specific scheduling restrictions */
  classRules: ClassConstraint[];

  /** Global school-wide policies */
  globalRules?: GlobalConstraint;
}

/**
 * Teacher constraints define availability and workload limits per teacher
 */
export interface TeacherConstraint {
  /** Teacher user ID */
  teacherId: string;

  /** Teacher name (for display) */
  teacherName?: string;

  /** Periods when this teacher is NOT available */
  unavailablePeriods: TimeSlot[];

  /** Maximum consecutive teaching periods allowed (default: 5) */
  maxConsecutivePeriods?: number;

  /** Maximum teaching periods per day (default: 6) */
  maxDailyPeriods?: number;

  /** Maximum teaching periods per week (default: 30) */
  maxWeeklyPeriods?: number;

  /** Preferred days for teaching (for workload balancing) */
  preferredDays?: string[];

  /** Days to avoid (e.g., for other duties) */
  avoidDays?: string[];

  /** Minimum gap between periods (for travel between rooms) */
  minGapMinutes?: number;
}

/**
 * Subject constraints define scheduling preferences for subjects
 */
export interface SubjectConstraint {
  /** Subject ID */
  subjectId: string;

  /** Subject name (for display) */
  subjectName?: string;

  /** Prefer morning slots (8AM - 11AM) for difficult subjects */
  preferMorningSlots?: boolean;

  /** Avoid last period of day (when students are tired) */
  avoidLastPeriod?: boolean;

  /** Requires double period (lab subjects, etc.) */
  requireDoublePeriod?: boolean;

  /** Subject priority level */
  priority?: "core" | "elective" | "optional";

  /** Maximum periods per day for this subject */
  maxPeriodsPerDay?: number;

  /** Minimum gap between same subject periods */
  minGapBetweenSameSubject?: number; // in periods
}

/**
 * Room constraints define which rooms are required for specific subjects
 */
export interface RoomConstraint {
  /** Room ID */
  roomId: string;

  /** Room name (for display) */
  roomName?: string;

  /** Subjects that MUST use this room (e.g., lab for Science) */
  requiredForSubjects?: string[];

  /** Minimum capacity needed */
  minCapacity?: number;

  /** Maximum capacity (for small seminar rooms) */
  maxCapacity?: number;

  /** Room type restrictions */
  roomType?: "classroom" | "lab" | "library" | "hall" | "office" | "other";

  /** Subjects that CANNOT use this room */
  excludeSubjects?: string[];
}

/**
 * Class constraints define scheduling restrictions for specific classes
 */
export interface ClassConstraint {
  /** Class ID */
  classId: string;

  /** Class name (for display) */
  className?: string;

  /** Periods to avoid (assembly, sports, etc.) */
  avoidPeriods: TimeSlot[];

  /** Maximum consecutive periods of same subject */
  maxContinuousSameSubject?: number;

  /** Preferred break periods (for optimal student focus) */
  preferredBreakAfter?: number; // periods
}

/**
 * Global school-wide constraints
 */
export interface GlobalConstraint {
  /** Maximum class size for optimal learning */
  maxClassSize?: number;

  /** Minimum break duration between periods (minutes) */
  minBreakDuration?: number;

  /** Lunch break duration (minutes) */
  lunchBreakDuration?: number;

  /** School start time (HH:MM format) */
  schoolStartTime?: string;

  /** School end time (HH:MM format) */
  schoolEndTime?: string;

  /** Working days (default: Monday-Friday) */
  workingDays?: string[];

  /** Minimum gap between same subject for any class */
  minGapBetweenSameSubjectGlobal?: number;
}

/**
 * Time slot reference (day + period)
 */
export interface TimeSlot {
  /** Day of week: "mon", "tue", "wed", "thu", "fri", "sat" */
  day: string;

  /** Period number (1-based index) */
  period: number;
}

/**
 * AI Optimization result
 */
export interface OptimizationResult {
  /** Optimized timetable entries */
  optimizedSchedule: TimetableEntry[];

  /** List of improvements made by AI */
  improvements: Improvement[];

  /** Optimization metrics */
  metrics: OptimizationMetrics;

  /** AI explanation of changes */
  aiInsights: string;

  /** Whether the result can be applied (no blocking issues) */
  canApply: boolean;

  /** Any remaining conflicts */
  remainingConflicts?: Conflict[];
}

/**
 * Single timetable entry
 */
export interface TimetableEntry {
  id?: string;
  classId: string;
  className?: string;
  subjectId: string;
  subjectName?: string;
  teacherId: string;
  teacherName?: string;
  roomId?: string;
  roomName?: string;
  dayOfWeek: string;
  periodNumber: number;
  startTime: string;
  endTime: string;
}

/**
 * Individual improvement made by AI
 */
export interface Improvement {
  type: "conflict_resolved" | "workload_balanced" | "optimal_placement" | "gap_optimized" | "room_optimized";
  description: string;
  before: TimetableEntry;
  after: TimetableEntry;
  impact: "high" | "medium" | "low";
}

/**
 * Optimization metrics
 */
export interface OptimizationMetrics {
  /** Number of conflicts removed */
  conflictsRemoved: number;

  /** Workload balance improvement percentage */
  workloadBalanceImproved: string;

  /** Whether schedule optimizes for student performance */
  studentPerformanceOptimized: boolean;

  /** Overall optimization score (0-100) */
  optimizationScore: number;

  /** Total periods scheduled */
  totalPeriodsScheduled: number;

  /** Teacher utilization rate */
  teacherUtilizationRate: number;
}

/**
 * Conflict detection result
 */
export interface Conflict {
  type: "teacher" | "room" | "class";
  severity: "error" | "warning";
  message: string;
  entries: TimetableEntry[];
}

/**
 * Swap request between teachers
 */
export interface SwapRequest {
  id: string;
  requesterId: string;
  requesterName: string;
  targetId: string;
  targetName: string;
  requesterPeriod: TimeSlot;
  targetPeriod: TimeSlot;
  reason: "emergency" | "medical" | "personal" | "preference";
  message: string;
  status: "pending" | "accepted" | "rejected" | "completed" | "cancelled";
  createdAt: Date;
  respondedAt?: Date;
  aiCompatibilityScore?: number;
}

/**
 * AI-suggested swap partner
 */
export interface SwapPartner {
  teacherId: string;
  teacherName: string;
  theirPeriod: TimeSlot;
  compatibilityScore: number; // 0-100
  swapImpact: "favorable" | "fair" | "unfavorable";
  reason: string;
}

/**
 * School context for AI processing
 */
export interface SchoolContext {
  schoolId: string;
  academicYear: string;
  semester?: string;
  bellSchedule: BellPeriod[];
  workingDays: string[];
}

/**
 * Bell period definition
 */
export interface BellPeriod {
  id: string;
  name: string;
  type: "class" | "break" | "lunch";
  order: number;
  startTime: string;
  endTime: string;
  duration: number;
  isBreak: boolean;
}
