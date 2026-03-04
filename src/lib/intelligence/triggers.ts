/**
 * Intelligence Triggers
 *
 * Defines all events that can trigger intelligence generation
 * When these events occur, the Intelligence Engine creates insights
 */

export enum TriggerType {
  // Assessment Events
  ASSESSMENT_COMPLETE = "assessment.complete",
  ASSESSMENT_STARTED = "assessment.started",

  // Academic Events
  GRADE_POSTED = "grade.posted",
  GRADE_CHANGED = "grade.changed",

  // Attendance Events
  ATTENDANCE_LOW = "attendance.low",
  ATTENDANCE_RECOVERED = "attendance.recovered",

  // Homework Events
  HOMEWORK_ASSIGNED = "homework.assigned",
  HOMEWORK_SUBMITTED = "homework.submitted",
  HOMEOVERDUE = "homework.overdue",
  HOMEWORK_LATE = "homework.late",

  // Career Events
  CAREER_MATCH_GENERATED = "career.match.generated",
  CAREER_PLAN_CREATED = "career.plan.created",

  // Behavior Events
  LOGIN_PATTERN = "login.pattern",
  INACTIVE_PERIOD = "inactive.period",

  // Schedule Events
  NEW_CLASS_ENROLLMENT = "class.enrollment",
  CLASS_CHANGE = "class.changed",
}

export enum InsightType {
  /** Urgent: requires immediate attention */
  ALERT = "alert",
  /** Recommendation for improvement */
  SUGGESTION = "suggestion",
  /** Prediction based on data trends */
  PREDICTION = "prediction",
  /** Positive achievement to celebrate */
  ACHIEVEMENT = "achievement",
  /** Informational insight */
  INFO = "info",
}

export enum Priority {
  LOW = 0,
  MEDIUM = 1,
  HIGH = 2,
  URGENT = 3,
}

/**
 * Trigger Configuration
 * Defines what happens when an event occurs
 */
export interface TriggerConfig {
  type: TriggerType;
  name: string;
  description: string;
  insightType: InsightType;
  priority: Priority;
  /** If true, only trigger once per user per session/day */
  oncePerPeriod?: boolean;
  /** How long the insight remains relevant (null = forever) */
  expiresIn?: number; // milliseconds
}

/**
 * All trigger configurations
 */
export const TRIGGER_CONFIGS: Record<TriggerType, TriggerConfig> = {
  [TriggerType.ASSESSMENT_COMPLETE]: {
    type: TriggerType.ASSESSMENT_COMPLETE,
    name: "Assessment Completed",
    description: "Student completed an assessment",
    insightType: InsightType.ACHIEVEMENT,
    priority: Priority.HIGH,
    oncePerPeriod: true,
  },

  [TriggerType.ASSESSMENT_STARTED]: {
    type: TriggerType.ASSESSMENT_STARTED,
    name: "Assessment Started",
    description: "Student started an assessment",
    insightType: InsightType.INFO,
    priority: Priority.LOW,
  },

  [TriggerType.GRADE_POSTED]: {
    type: TriggerType.GRADE_POSTED,
    name: "Grade Posted",
    description: "New grade posted for student",
    insightType: InsightType.INFO,
    priority: Priority.MEDIUM,
  },

  [TriggerType.GRADE_CHANGED]: {
    type: TriggerType.GRADE_CHANGED,
    name: "Grade Changed",
    description: "Student's grade was modified",
    insightType: InsightType.INFO,
    priority: Priority.LOW,
  },

  [TriggerType.ATTENDANCE_LOW]: {
    type: TriggerType.ATTENDANCE_LOW,
    name: "Low Attendance Alert",
    description: "Student attendance below threshold",
    insightType: InsightType.ALERT,
    priority: Priority.URGENT,
    expiresIn: 7 * 24 * 60 * 60 * 1000, // 7 days
  },

  [TriggerType.ATTENDANCE_RECOVERED]: {
    type: TriggerType.ATTENDANCE_RECOVERED,
    name: "Attendance Recovered",
    description: "Student attendance improved",
    insightType: InsightType.ACHIEVEMENT,
    priority: Priority.MEDIUM,
  },

  [TriggerType.HOMEWORK_ASSIGNED]: {
    type: TriggerType.HOMEWORK_ASSIGNED,
    name: "Homework Assigned",
    description: "New homework assigned",
    insightType: InsightType.INFO,
    priority: Priority.LOW,
    expiresIn: 2 * 24 * 60 * 60 * 1000, // 2 days
  },

  [TriggerType.HOMEWORK_SUBMITTED]: {
    type: TriggerType.HOMEWORK_SUBMITTED,
    name: "Homework Submitted",
    description: "Student submitted homework",
    insightType: InsightType.ACHIEVEMENT,
    priority: Priority.LOW,
  },

  [TriggerType.HOMEOVERDUE]: {
    type: TriggerType.HOMEOVERDUE,
    name: "Homework Overdue",
    description: "Homework submission is overdue",
    insightType: InsightType.ALERT,
    priority: Priority.HIGH,
    expiresIn: 1 * 24 * 60 * 60 * 1000, // 1 day
  },

  [TriggerType.HOMEWORK_LATE]: {
    type: TriggerType.HOMEWORK_LATE,
    name: "Homework Late",
    description: "Homework submitted late",
    insightType: InsightType.SUGGESTION,
    priority: Priority.MEDIUM,
  },

  [TriggerType.CAREER_MATCH_GENERATED]: {
    type: TriggerType.CAREER_MATCH_GENERATED,
    name: "Career Matches Generated",
    description: "Career matches created based on assessment",
    insightType: InsightType.ACHIEVEMENT,
    priority: Priority.HIGH,
    oncePerPeriod: true,
  },

  [TriggerType.CAREER_PLAN_CREATED]: {
    type: TriggerType.CAREER_PLAN_CREATED,
    name: "Career Plan Created",
    description: "Student created career plan",
    insightType: InsightType.ACHIEVEMENT,
    priority: Priority.HIGH,
  },

  [TriggerType.LOGIN_PATTERN]: {
    type: TriggerType.LOGIN_PATTERN,
    name: "Login Pattern Detected",
    description: "User login pattern analyzed",
    insightType: InsightType.INFO,
    priority: Priority.LOW,
  },

  [TriggerType.INACTIVE_PERIOD]: {
    type: TriggerType.INACTIVE_PERIOD,
    name: "Inactive Period",
    description: "User hasn't logged in for a while",
    insightType: InsightType.SUGGESTION,
    priority: Priority.MEDIUM,
  },

  [TriggerType.NEW_CLASS_ENROLLMENT]: {
    type: TriggerType.NEW_CLASS_ENROLLMENT,
    name: "New Class Enrollment",
    description: "Student enrolled in new class",
    insightType: InsightType.INFO,
    priority: Priority.MEDIUM,
  },

  [TriggerType.CLASS_CHANGE]: {
    type: TriggerType.CLASS_CHANGE,
    name: "Class Changed",
    description: "Student's class assignment changed",
    insightType: InsightType.INFO,
    priority: Priority.LOW,
  },
};

/**
 * Insight Template
 * Base structure for creating insights
 */
export interface InsightTemplate {
  getTitle(data: Record<string, unknown>): string;
  getDescription(data: Record<string, unknown>): string;
  getActionUrl?(data: Record<string, unknown>): string;
  getActionLabel?(data: Record<string, unknown>): string;
}

/**
 * Insight templates for each trigger type
 */
export const INSIGHT_TEMPLATES: Partial<Record<TriggerType, InsightTemplate>> = {
  [TriggerType.ASSESSMENT_COMPLETE]: {
    getTitle: (data) => {
      const type = data.assessmentType as string;
      const typeNames: Record<string, string> = {
        riasec: "RIASEC",
        mbti: "MBTI",
        disc: "DISC",
        "work-values": "Work Values",
        "learning-styles": "Learning Styles",
      };
      return `Assessment Complete: ${typeNames[type] || type}`;
    },
    getDescription: (data) => {
      const careerCount = (data.careerMatches as unknown[])?.length || 0;
      return `You completed your assessment! We found ${careerCount} career matches for you.`;
    },
    getActionUrl: (data) => `/student/careers`,
    getActionLabel: (data) => "View Careers",
  },

  [TriggerType.ATTENDANCE_LOW]: {
    getTitle: (data) => {
      const rate = data.attendanceRate as number;
      return `Low Attendance Alert: ${rate?.toFixed(0) || 0}%`;
    },
    getDescription: (data) => {
      return `Your attendance is below 80%. This may affect your academic progress. Please attend classes regularly.`;
    },
    getActionUrl: (data) => `/student/attendance`,
    getActionLabel: (data) => "View Attendance",
  },

  [TriggerType.GRADE_POSTED]: {
    getTitle: (data) => {
      const subject = data.subject as string;
      return `New Grade: ${subject || "Assignment"}`;
    },
    getDescription: (data) => {
      const grade = data.grade as string;
      const score = data.score as number;
      return `Your grade has been posted: ${grade || score?.toString() || "Check your gradebook"}`;
    },
    getActionUrl: (data) => `/student/grades`,
    getActionLabel: (data) => "View Grades",
  },

  [TriggerType.HOMEOVERDUE]: {
    getTitle: (data) => {
      const count = (data.overdueCount as number) || 1;
      return `${count} Homework${count > 1 ? "s" : ""} Overdue`;
    },
    getDescription: (data) => {
      return `You have overdue homework. Complete them to avoid penalties.`;
    },
    getActionUrl: (data) => `/student/homework`,
    getActionLabel: (data) => "View Homework",
  },

  [TriggerType.CAREER_MATCH_GENERATED]: {
    getTitle: (data) => {
      return "Your Career Matches Are Ready!";
    },
    getDescription: (data) => {
      const topCareer = data.topCareer as string;
      return `Based on your assessment, ${topCareer || "several careers"} may be a great fit for you.`;
    },
    getActionUrl: (data) => `/student/careers`,
    getActionLabel: (data) => "Explore Careers",
  },
};

/**
 * Thresholds for triggering insights
 */
export const THRESHOLDS = {
  ATTENDANCE_LOW: 0.8, // 80%
  ATTENDANCE_CRITICAL: 0.7, // 70%
  GRADE_LOW_WARNING: 60, // below 60%
  GRADE_LOW_CRITICAL: 40, // below 40%
  HOMEWORK_OVERDUE_HOURS: 24, // 24 hours past deadline
  INACTIVE_DAYS: 7, // 7 days without login
};