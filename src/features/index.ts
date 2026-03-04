// Unified Feature Exports
// Uses lazy loading to avoid circular dependencies

// Core entities
export { UsersFeature } from "./users.feature";
export { SchoolsFeature } from "./schools.feature";
export { StudentsFeature } from "./students.feature";
export { TeachersFeature } from "./teachers.feature";
export { ClassesFeature } from "./classes.feature";
export { SubjectsFeature } from "./subjects.feature";

// Organization
export { DepartmentFeature as DepartmentsFeature } from "./departments.feature";
export { BatchFeature as BatchesFeature } from "./batches.feature";
export { SectionsFeature } from "./sections.feature";

// Academic
export { AttendanceFeature } from "./attendance.feature";
export { HomeworkFeature } from "./homework.feature";
export { LessonFeature } from "./lessons.feature";
export { ExamFeature } from "./exams.feature";
export { ResultFeature } from "./results.feature";
export { AssessmentsFeature } from "./assessments.feature";

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

// Library
export { LibraryBookFeature } from "./library-books.feature";

// Fees & Billing
export { FeeFeature } from "./fees.feature";
export { FeePaymentFeature } from "./fee-payments.feature";
export { InvoiceFeature } from "./invoices.feature";
export { PlanFeature } from "./plans.feature";
export { SubscriptionsFeature } from "./subscriptions.feature";

// Communication
export { AnnouncementFeature } from "./announcements.feature";
export { CommunicationFeature } from "./communication.feature";

// Reports & Analytics
export { ReportFeature } from "./reports.feature";
export { AnalyticsFeature } from "./analytics.feature";
export { AuditLogFeature } from "./audit-logs.feature";

// Resources
export { TeachingResourceFeature as TeachingResourcesFeature } from "./teaching-resources.feature";

// Meetings & Sessions
export { MeetingFeature } from "./meetings.feature";
export { SessionFeature } from "./sessions.feature";

// Ministry
export { WorkforceDataFeature } from "./workforce-data.feature";

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
  reports: () => require("./reports.feature").ReportFeature,
  analytics: () => require("./analytics.feature").AnalyticsFeature,
  audit_logs: () => require("./audit-logs.feature").AuditLogFeature,
  teaching_resources: () => require("./teaching-resources.feature").TeachingResourceFeature,
  meetings: () => require("./meetings.feature").MeetingFeature,
  sessions: () => require("./sessions.feature").SessionFeature,
  timetables: () => require("./lessons.feature").LessonFeature, // Alias
  workforce_data: () => require("./workforce-data.feature").WorkforceDataFeature,
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
