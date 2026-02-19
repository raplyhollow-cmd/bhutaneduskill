/**
 * SERVICES INDEX
 *
 * Central export point for all service layer modules.
 * Services encapsulate business logic and database operations
 * for specific domains.
 *
 * @module services
 */

// ============================================================================
// ASSESSMENT SERVICE
// ============================================================================

export {
  getAssessmentResults,
  getLatestAssessment,
  getCompletedAssessments,
  saveAssessmentResult,
  calculateScores,
} from "./assessment.service";

export type {
  AssessmentResponse,
  SaveAssessmentInput,
  ScoredAssessmentResult,
  AssessmentResultWithDetails,
  RIASECScores,
  MBTIScores,
  DISCScores,
  WorkValuesScores,
} from "./assessment.service";

// ============================================================================
// CAREER MATCHING SERVICE
// ============================================================================

export {
  calculateCareerMatches,
  getCareerMatches,
  extractTraits,
  rankByCompatibility,
  saveCareerMatches,
  deleteCareerMatches,
} from "./career-matching.service";

export type {
  AssessmentType,
  CareerMatch,
  CareerMatchWithDetails,
  ExtractedTraits,
  MatchedCareer,
} from "./career-matching.service";

// ============================================================================
// PROGRESS SERVICE
// ============================================================================

export {
  calculateStudentProgress,
  getSubjectPerformance,
  getLearningTrends,
  getHomeworkSubmissionStats,
  generateProgressReport,
} from "./progress.service";

export type {
  StudentProgressMetrics,
  SubjectPerformance,
  LearningTrend,
  HomeworkSubmissionStats,
  ProgressReport,
} from "./progress.service";

// ============================================================================
// NOTIFICATION SERVICE
// ============================================================================

export {
  createNotification,
  notifyMinistryVerification,
  notifyStudent,
  notifyParent,
  createNotificationDelivery,
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUserNotificationSettings,
  updateUserNotificationSettings,
} from "./notification.service";

export type {
  CreateNotificationInput,
  NotifyStudentInput,
  NotifyParentInput,
  NotificationWithDelivery,
} from "./notification.service";

// ============================================================================
// SERVICE RE-EXPORTS
// ============================================================================

/**
 * Service modules provide a clean abstraction layer between
 * API routes/server actions and the database.
 *
 * Usage examples:
 *
 * ```typescript
 * import { getLatestAssessment, calculateCareerMatches } from "@/lib/services";
 *
 * // Get a user's latest RIASEC assessment
 * const riasecResult = await getLatestAssessment(userId, "riasec");
 *
 * // Calculate career matches based on assessment
 * const matches = await calculateCareerMatches(userId, "riasec", {
 *   limit: 10,
 *   minScore: 40,
 *   saveToDatabase: true,
 * });
 *
 * // Get student progress
 * import { calculateStudentProgress, getSubjectPerformance } from "@/lib/services";
 * const progress = await calculateStudentProgress(userId, "term");
 * const subjects = await getSubjectPerformance(userId);
 *
 * // Create notifications
 * import { notifyStudent, notifyParent } from "@/lib/services";
 * await notifyStudent({
 *   studentId,
 *   type: "homework",
 *   title: "New Homework Assigned",
 *   message: "You have a new homework assignment due tomorrow.",
 * });
 * ```
 */
