// Unified Feature Exports
// Uses lazy loading to avoid circular dependencies

// Core entities
export { UsersFeature } from "./users.feature";
export { UsersFeature as UserFeature } from "./users.feature"; // Singular alias
export { SchoolsFeature } from "./schools.feature";
export { SchoolsFeature as SchoolFeature } from "./schools.feature"; // Singular alias
export { StudentsFeature } from "./students.feature";
export { StudentsFeature as StudentFeature } from "./students.feature"; // Singular alias
export { TeachersFeature } from "./teachers.feature";
export { TeachersFeature as TeacherFeature } from "./teachers.feature"; // Singular alias
export { ClassesFeature } from "./classes.feature";
export { ClassesFeature as ClassFeature } from "./classes.feature"; // Singular alias
export { SubjectsFeature } from "./subjects.feature";
export { SubjectsFeature as SubjectFeature } from "./subjects.feature"; // Singular alias

// Organization
export { DepartmentFeature as DepartmentsFeature } from "./departments.feature";
export { DepartmentFeature } from "./departments.feature"; // Also export singular
export { BatchFeature as BatchesFeature } from "./batches.feature";
export { BatchFeature as BatcheFeature } from "./batches.feature"; // For typo compatibility
export { SectionsFeature } from "./sections.feature";
export { SectionsFeature as SectionFeature } from "./sections.feature"; // Singular alias

// Academic
export { AttendanceFeature } from "./attendance.feature";
export { HomeworkFeature } from "./homework.feature";
export { LessonFeature } from "./lessons.feature";
export { LessonFeature as TimetableFeature } from "./lessons.feature"; // Alias for timetables
export { ExamFeature } from "./exams.feature";
export { ResultFeature } from "./results.feature";
export { AssessmentsFeature as AssessmentFeature } from "./assessments.feature"; // Singular alias

// Skills & Career
export { SkillFeature } from "./skills.feature";
export { StudentSkillFeature } from "./student-skills.feature";
export { CareerFeature } from "./career.feature";
export { LearningPathFeature } from "./learningPath.feature";

// Behavior & Support
export { BehaviorRecordFeature } from "./behavior-records.feature";
export { InterventionFeature } from "./interventions.feature";
export { CounselorNoteFeature } from "./counselor-notes.feature";

// Transport
export { TransportFeature } from "./transport.feature";
export { TransportAllocationFeature as TransportAllocationsFeature } from "./transport-allocations.feature";
export { TransportAllocationFeature as TransportAllocationFeature } from "./transport-allocations.feature"; // Fix naming

// Library
export { LibraryBookFeature } from "./library-books.feature";

// Fees & Billing
export { FeeFeature } from "./fees.feature";
export { FeePaymentFeature } from "./fee-payments.feature";
export { InvoiceFeature } from "./invoices.feature";
export { PlanFeature } from "./plans.feature";
export { SubscriptionsFeature } from "./subscriptions.feature";
export { SubscriptionsFeature as SubscriptionFeature } from "./subscriptions.feature"; // Singular alias

// Communication
export { AnnouncementFeature } from "./announcements.feature";
export { CommunicationFeature } from "./communication.feature";
export { NotificationsFeature } from "./notifications.feature";
export { NotificationsFeature as NotificationFeature } from "./notifications.feature"; // Singular alias

// Reports & Analytics
export { ReportFeature } from "./reports.feature";
export { AnalyticsFeature as AnalyticFeature } from "./analytics.feature"; // Singular alias
export { AnalyticsFeature } from "./analytics.feature";
export { AuditLogFeature } from "./audit-logs.feature";

// Resources
export { TeachingResourceFeature as TeachingResourcesFeature } from "./teaching-resources.feature";
export { TeachingResourceFeature } from "./teaching-resources.feature"; // Also export singular

// Meetings & Sessions
export { MeetingFeature } from "./meetings.feature";
export { SessionFeature } from "./sessions.feature";

// Ministry
export { WorkforceDataFeature } from "./workforce-data.feature";

// ============================================================================
// FULL FEATURE IMPLEMENTATIONS (NEW)
// ============================================================================

// Timetable & Scheduling
export { TimetableSlotFeature } from "./timetable-slots.feature";
export { ScheduleExceptionFeature } from "./schedule-exceptions.feature";

// Submissions & Assessment
export { SubmissionFeature } from "./submissions.feature";
export { RubricFeature } from "./rubrics.feature";

// Communication
export { MessageFeature } from "./messages.feature";

// Career & Skills
export { RoadmapFeature } from "./roadmaps.feature";
export { SkillGapFeature } from "./skill-gaps.feature";

// Library
export { LibraryLoanFeature } from "./library-loans.feature";
export { LibraryFineFeature } from "./library-fines.feature";

// Resources & Sharing
export { ResourceShareFeature } from "./resource-shares.feature";

// Transport
export { TransportRouteFeature } from "./transport-routes.feature";

// Counseling
export { TreatmentPlanFeature } from "./treatment-plans.feature";

// ============================================================================
// STUB FEATURES (for features not yet created)
// ============================================================================

// Stub for appointments
export const AppointmentFeature = {
  name: "appointments",
  schema: {
    id: { type: "text", required: true },
    title: { type: "text", required: true },
    date: { type: "date" },
    status: { type: "text" },
  },
  api: {},
  config: {},
};

// Stub for career matches
export const CareerMatcheFeature = {
  name: "career-matches",
  schema: {
    id: { type: "text", required: true },
    studentId: { type: "text" },
    careerId: { type: "text" },
    score: { type: "integer" },
  },
  api: {},
  config: {},
};

// Stub for GNH indicators
export const GnhIndicatorFeature = {
  name: "gnh-indicators",
  schema: {
    id: { type: "text", required: true },
    name: { type: "text", required: true },
    value: { type: "integer" },
    domain: { type: "text" },
  },
  api: {},
  config: {},
};

// Stub for grades
export const GradeFeature = {
  name: "grades",
  schema: {
    id: { type: "text", required: true },
    studentId: { type: "text" },
    subject: { type: "text" },
    score: { type: "integer" },
    term: { type: "text" },
  },
  api: {},
  config: {},
};

// NOTE: The following features now have real implementations in their own files:
// - LibraryFineFeature (library-fines.feature.ts)
// - LibraryLoanFeature (library-loans.feature.ts)
// - MessageFeature (messages.feature.ts)
// - ResourceShareFeature (resource-shares.feature.ts)
// - RoadmapFeature (roadmaps.feature.ts)
// - RubricFeature (rubrics.feature.ts)
// - ScheduleExceptionFeature (schedule-exceptions.feature.ts)
// - SkillGapFeature (skill-gaps.feature.ts)
// - SubmissionFeature (submissions.feature.ts)
// - TimetableSlotFeature (timetable-slots.feature.ts)
// - TransportRouteFeature (transport-routes.feature.ts)
// - TreatmentPlanFeature (treatment-plans.feature.ts)

// LAZY FEATURES MAP - computed at runtime to avoid circular deps
export const features: Record<string, any> = {
  users: () => require("./users.feature").UsersFeature,
  schools: () => require("./schools.feature").SchoolsFeature,
  students: () => require("./students.feature").StudentsFeature,
  teachers: () => require("./teachers.feature").TeachersFeature,
  classes: () => require("./classes.feature").ClassesFeature,
  subjects: () => require("./subjects.feature").SubjectsFeature,
  departments: () => require("./departments.feature").DepartmentFeature,
  batches: () => require("./batches.feature").BatchFeature,
  sections: () => require("./sections.feature").SectionsFeature,
  attendance: () => require("./attendance.feature").AttendanceFeature,
  homework: () => require("./homework.feature").HomeworkFeature,
  lessons: () => require("./lessons.feature").LessonFeature,
  exams: () => require("./exams.feature").ExamFeature,
  results: () => require("./results.feature").ResultFeature,
  assessments: () => require("./assessments.feature").AssessmentsFeature,
  skills: () => require("./skills.feature").SkillFeature,
  student_skills: () => require("./student-skills.feature").StudentSkillFeature,
  careers: () => require("./career.feature").CareerFeature,
  learning_paths: () => require("./learningPath.feature").LearningPathFeature,
  behavior_records: () => require("./behavior-records.feature").BehaviorRecordFeature,
  interventions: () => require("./interventions.feature").InterventionFeature,
  counselor_notes: () => require("./counselor-notes.feature").CounselorNoteFeature,
  transport: () => require("./transport.feature").TransportFeature,
  transport_allocations: () => require("./transport-allocations.feature").TransportAllocationFeature,
  library_books: () => require("./library-books.feature").LibraryBookFeature,
  fees: () => require("./fees.feature").FeeFeature,
  fee_payments: () => require("./fee-payments.feature").FeePaymentFeature,
  invoices: () => require("./invoices.feature").InvoiceFeature,
  plans: () => require("./plans.feature").PlanFeature,
  subscriptions: () => require("./subscriptions.feature").SubscriptionsFeature,
  announcements: () => require("./announcements.feature").AnnouncementFeature,
  communication: () => require("./communication.feature").CommunicationFeature,
  notifications: () => require("./notifications.feature").NotificationsFeature,
  reports: () => require("./reports.feature").ReportFeature,
  analytics: () => require("./analytics.feature").AnalyticsFeature,
  audit_logs: () => require("./audit-logs.feature").AuditLogFeature,
  teaching_resources: () => require("./teaching-resources.feature").TeachingResourceFeature,
  meetings: () => require("./meetings.feature").MeetingFeature,
  sessions: () => require("./sessions.feature").SessionFeature,
  timetables: () => require("./lessons.feature").LessonFeature, // Alias
  timetable: () => require("./lessons.feature").LessonFeature, // Singular alias
  workforce_data: () => require("./workforce-data.feature").WorkforceDataFeature,

  // Real feature implementations (imported from their own files)
  "timetable-slots": () => require("./timetable-slots.feature").TimetableSlotFeature,
  submissions: () => require("./submissions.feature").SubmissionFeature,
  rubrics: () => require("./rubrics.feature").RubricFeature,
  messages: () => require("./messages.feature").MessageFeature,
  roadmaps: () => require("./roadmaps.feature").RoadmapFeature,
  "skill-gaps": () => require("./skill-gaps.feature").SkillGapFeature,
  "schedule-exceptions": () => require("./schedule-exceptions.feature").ScheduleExceptionFeature,
  "resource-shares": () => require("./resource-shares.feature").ResourceShareFeature,
  "library-loans": () => require("./library-loans.feature").LibraryLoanFeature,
  "library-fines": () => require("./library-fines.feature").LibraryFineFeature,
  "transport-routes": () => require("./transport-routes.feature").TransportRouteFeature,
  "treatment-plans": () => require("./treatment-plans.feature").TreatmentPlanFeature,

  // Stub features (for features not yet created)
  appointments: () => AppointmentFeature,
  career_matches: () => CareerMatcheFeature,
  gnh_indicators: () => GnhIndicatorFeature,
  grades: () => GradeFeature,
};

// Helper to get feature (evaluates lazy function)
export function getFeature(name: string): any {
  const fn = features[name];
  if (fn && typeof fn === "function") {
    return fn();
  }
  return undefined;
}

// Types
export type { FeatureConfig } from "@/components/unified";
