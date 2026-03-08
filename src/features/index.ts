// Unified Feature Exports

// Core entities
export { UsersFeature } from "./users.feature";
export { UsersFeature as UserFeature } from "./users.feature";
export { SchoolsFeature } from "./schools.feature";
export { SchoolsFeature as SchoolFeature } from "./schools.feature";
export { StudentsFeature } from "./students.feature";
export { StudentsFeature as StudentFeature } from "./students.feature";
export { TeachersFeature } from "./teachers.feature";
export { TeachersFeature as TeacherFeature } from "./teachers.feature";
export { ClassesFeature } from "./classes.feature";
export { ClassesFeature as ClassFeature } from "./classes.feature";
export { SubjectsFeature } from "./subjects.feature";
export { SubjectsFeature as SubjectFeature } from "./subjects.feature";

// Organization
export { DepartmentFeature as DepartmentsFeature } from "./departments.feature";
export { DepartmentFeature } from "./departments.feature";
export { BatchFeature as BatchesFeature } from "./batches.feature";
export { BatchFeature as BatcheFeature } from "./batches.feature";
export { SectionsFeature } from "./sections.feature";
export { SectionsFeature as SectionFeature } from "./sections.feature";

// Academic
export { HomeworkFeature } from "./homework.feature";
export { AttendanceFeature } from "./attendance.feature";
export { BehaviorRecordFeature } from "./behavior-records.feature";
export { InterventionFeature } from "./interventions.feature";
export { ResultFeature } from "./results.feature";
export { StudentSkillFeature } from "./student-skills.feature";
export { LessonFeature } from "./lessons.feature";
export { LessonFeature as TimetableFeature } from "./lessons.feature";
export { ExamFeature } from "./exams.feature";
export { AssessmentsFeature as AssessmentFeature } from "./assessments.feature";

// Skills & Career
export { SkillFeature } from "./skills.feature";
export { CareerFeature } from "./career.feature";
export { LearningPathFeature } from "./learningPath.feature";

// Behavior & Support
export { CounselorNoteFeature } from "./counselor-notes.feature";

// Transport
export { TransportFeature } from "./transport.feature";
export { TransportAllocationFeature as TransportAllocationsFeature } from "./transport-allocations.feature";
export { TransportAllocationFeature as TransportAllocationFeature } from "./transport-allocations.feature";

// Library
export { LibraryBookFeature } from "./library-books.feature";
export { LibraryLoanFeature } from "./library-loans.feature";
export { LibraryFineFeature } from "./library-fines.feature";

// Fees & Billing
export { FeeFeature } from "./fees.feature";
export { FeePaymentFeature } from "./fee-payments.feature";
export { InvoiceFeature } from "./invoices.feature";
export { PlanFeature } from "./plans.feature";
export { SubscriptionsFeature } from "./subscriptions.feature";
export { SubscriptionsFeature as SubscriptionFeature } from "./subscriptions.feature";

// Payroll & HR
export { PayrollFeature } from "./payroll.feature";
export { PayrollRunsFeature } from "./payroll.feature";
export { SalaryStructuresFeature } from "./payroll.feature";

// Communication
export { AnnouncementFeature } from "./announcements.feature";
export { CommunicationFeature } from "./communication.feature";
export { NotificationsFeature } from "./notifications.feature";
export { NotificationsFeature as NotificationFeature } from "./notifications.feature";
export { MessageFeature } from "./messages.feature";

// Reports & Analytics
export { ReportFeature } from "./reports.feature";
export { AnalyticsFeature as AnalyticFeature } from "./analytics.feature";
export { AnalyticsFeature } from "./analytics.feature";
export { AuditLogFeature } from "./audit-logs.feature";

// Resources
export { TeachingResourceFeature as TeachingResourcesFeature } from "./teaching-resources.feature";
export { TeachingResourceFeature } from "./teaching-resources.feature";
export { ResourceShareFeature } from "./resource-shares.feature";

// Meetings & Sessions
export { MeetingFeature } from "./meetings.feature";
export { SessionFeature } from "./sessions.feature";

// Ministry
export { WorkforceDataFeature } from "./workforce-data.feature";

// Timetable & Scheduling
export { TimetableSlotFeature } from "./timetable-slots.feature";
export { ScheduleExceptionFeature } from "./schedule-exceptions.feature";

// Submissions & Assessment
export { SubmissionFeature } from "./submissions.feature";
export { RubricFeature } from "./rubrics.feature";

// Career & Skills
export { RoadmapFeature } from "./roadmaps.feature";
export { SkillGapFeature } from "./skill-gaps.feature";

// Transport Routes
export { TransportRouteFeature } from "./transport-routes.feature";

// Counseling
export { TreatmentPlanFeature } from "./treatment-plans.feature";

// Teacher Assignments
export { TeacherAssignmentsFeature } from "./teacher-assignments.feature";

// STUB FEATURES (for features not yet created)
export const AppointmentFeature = {
  name: "appointments",
  tableName: "appointments",
  schema: {
    id: { type: "text", required: true },
    title: { type: "text", required: true },
    date: { type: "date" },
    status: { type: "text" },
  },
  config: { schema: {}, permissions: {} },
  api: {},
  types: {},
  bulkOperations: {},
  actions: {},
  webhooks: {},
  public: {},
  publicHandlers: {},
};

export const CareerMatcheFeature = {
  name: "career-matches",
  tableName: "career_matches",
  schema: {
    id: { type: "text", required: true },
    studentId: { type: "text" },
    careerId: { type: "text" },
    score: { type: "integer" },
  },
  config: { schema: {}, permissions: {} },
  api: {},
  types: {},
  bulkOperations: {},
  actions: {},
  webhooks: {},
  public: {},
  publicHandlers: {},
};

export const GnhIndicatorFeature = {
  name: "gnh-indicators",
  tableName: "gnh_indicators",
  schema: {
    id: { type: "text", required: true },
    name: { type: "text", required: true },
    value: { type: "integer" },
    domain: { type: "text" },
  },
  config: { schema: {}, permissions: {} },
  api: {},
  types: {},
  bulkOperations: {},
  actions: {},
  webhooks: {},
  public: {},
  publicHandlers: {},
};

export const GradeFeature = {
  name: "grades",
  tableName: "grades",
  schema: {
    id: { type: "text", required: true },
    studentId: { type: "text" },
    subject: { type: "text" },
    score: { type: "integer" },
    term: { type: "text" },
  },
  config: { schema: {}, permissions: {} },
  api: {},
  types: {},
  bulkOperations: {},
  actions: {},
  webhooks: {},
  public: {},
  publicHandlers: {},
};

// Lazy loading feature map to avoid circular dependencies
// Returns function pointers that are evaluated on demand
export const features: Record<string, () => any> = {
  users: () => require("./users.feature").UsersFeature,
  user: () => require("./users.feature").UsersFeature,
  schools: () => require("./schools.feature").SchoolsFeature,
  school: () => require("./schools.feature").SchoolsFeature,
  students: () => require("./students.feature").StudentsFeature,
  student: () => require("./students.feature").StudentsFeature,
  teachers: () => require("./teachers.feature").TeachersFeature,
  teacher: () => require("./teachers.feature").TeachersFeature,
  classes: () => require("./classes.feature").ClassesFeature,
  class: () => require("./classes.feature").ClassesFeature,
  subjects: () => require("./subjects.feature").SubjectsFeature,
  subject: () => require("./subjects.feature").SubjectsFeature,
  departments: () => require("./departments.feature").DepartmentFeature,
  batches: () => require("./batches.feature").BatchFeature,
  sections: () => require("./sections.feature").SectionsFeature,
  homework: () => require("./homework.feature").HomeworkFeature,
  attendance: () => require("./attendance.feature").AttendanceFeature,
  behavior_records: () => require("./behavior-records.feature").BehaviorRecordFeature,
  "behavior-records": () => require("./behavior-records.feature").BehaviorRecordFeature,
  interventions: () => require("./interventions.feature").InterventionFeature,
  results: () => require("./results.feature").ResultFeature,
  student_skills: () => require("./student-skills.feature").StudentSkillFeature,
  lessons: () => require("./lessons.feature").LessonFeature,
  timetables: () => require("./lessons.feature").LessonFeature,
  timetable: () => require("./lessons.feature").LessonFeature,
  exams: () => require("./exams.feature").ExamFeature,
  assessments: () => require("./assessments.feature").AssessmentsFeature,
  assessment: () => require("./assessments.feature").AssessmentsFeature,
  skills: () => require("./skills.feature").SkillFeature,
  careers: () => require("./career.feature").CareerFeature,
  learning_paths: () => require("./learningPath.feature").LearningPathFeature,
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
  notification: () => require("./notifications.feature").NotificationsFeature,
  reports: () => require("./reports.feature").ReportFeature,
  analytics: () => require("./analytics.feature").AnalyticsFeature,
  audit_logs: () => require("./audit-logs.feature").AuditLogFeature,
  teaching_resources: () => require("./teaching-resources.feature").TeachingResourceFeature,
  meetings: () => require("./meetings.feature").MeetingFeature,
  sessions: () => require("./sessions.feature").SessionFeature,
  workforce_data: () => require("./workforce-data.feature").WorkforceDataFeature,
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
  "teacher-assignments": () => require("./teacher-assignments.feature").TeacherAssignmentsFeature,
  payroll: () => require("./payroll.feature").PayrollFeature,
  "payroll-runs": () => require("./payroll.feature").PayrollRunsFeature,
  "salary-structures": () => require("./payroll.feature").SalaryStructuresFeature,
  appointments: () => AppointmentFeature,
  "career-matches": () => CareerMatcheFeature,
  "gnh-indicators": () => GnhIndicatorFeature,
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

// Get feature names without evaluating the functions
export function getFeatureNames(): string[] {
  return Object.keys(features);
}

export type FeatureName = keyof typeof features;

export type { FeatureConfig } from "@/lib/features/define-feature";
