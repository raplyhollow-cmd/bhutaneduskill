/**
 * Career Roadmaps Schema
 *
 * Tables for tracking student career journeys, milestones, and progress
 */

import { boolean, index, integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./schema";

// ============================================================================
// CAREER INTERESTS
// ============================================================================

/**
 * Career Interests - Tracks student interest in specific careers
 * Used for interest tracking, trend analysis, and recommendations
 */
export const careerInterests = pgTable("career_interests", {
  id: text("id").primaryKey(),
  studentId: text("student_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  careerId: text("career_id").notNull(),
  interestLevel: text("interest_level").notNull(), // high, medium, low
  source: text("source").notNull(), // explicit, inferred, assessment
  viewCount: integer("view_count").default(0),
  firstSeen: timestamp("first_seen").notNull().defaultNow(),
  lastUpdated: timestamp("last_updated").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  studentIdIdx: index("career_interests_student_id_idx").on(table.studentId),
  careerIdIdx: index("career_interests_career_id_idx").on(table.careerId),
  studentCareerIdx: index("career_interests_student_career_idx").on(table.studentId, table.careerId),
}));

// ============================================================================
// CAREER ROADMAPS
// ============================================================================

/**
 * Main career roadmap table - tracks each student's career journey
 */
export const careerRoadmaps = pgTable("career_roadmaps", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: text("student_id").notNull().references(() => users.id, { onDelete: "cascade" }),

  // Target
  targetCareerId: text("target_career_id").notNull(),
  targetCareerTitle: text("target_career_title").notNull(),
  currentGrade: integer("current_grade").notNull(),

  // RUB Connection
  targetCollegeId: text("target_college_id"),
  targetCollegeName: text("target_college_name"),
  targetProgramId: text("target_program_id"),
  targetProgramName: text("target_program_name"),

  // Roadmap Data (JSON)
  phases: jsonb("phases").$type<{
    id: string;
    name: string;
    grade: string;
    period: string;
    description: string;
    milestones: Array<{
      id: string;
      title: string;
      description: string;
      category: string;
      status: "pending" | "in-progress" | "completed" | "skipped";
      dueDate?: string;
    }>;
    recommendations: Array<{
      type: string;
      title: string;
      description: string;
      priority: string;
      category: string;
    }>;
    focusSkills: string[];
  }[]>().notNull(),

  milestones: jsonb("milestones").$type<Array<{
    id: string;
    title: string;
    description: string;
    category: "academic" | "assessment" | "skill" | "application" | "milestone";
    status: "pending" | "in-progress" | "completed" | "skipped";
    dueDate?: string;
    relatedCareer?: string;
    resources?: string[];
  }>>().notNull(),

  // Progress tracking
  totalMilestones: integer("total_milestones").notNull().default(0),
  completedMilestones: integer("completed_milestones").notNull().default(0),
  progressPercentage: integer("progress_percentage").notNull().default(0),

  // Approval status
  status: text("status").notNull().default("active"), // active, achieved, changed, archived
  counselorApproved: boolean("counselor_approved").notNull().default(false),
  counselorId: text("counselor_id").references(() => users.id),
  counselorNotes: text("counselor_notes"),
  approvedAt: timestamp("approved_at"),
  parentApproved: boolean("parent_approved").notNull().default(false),
  parentApprovedAt: timestamp("parent_approved_at"),
  parentApprovedBy: text("parent_approved_by").references(() => users.id),

  // What-if scenarios
  alternativeCareers: jsonb("alternative_careers").$type<Array<{
    careerId: string;
    careerTitle: string;
    matchScore: number;
    consideredAt: string;
  }>>().$type<"array">(),

  // Metadata
  matchScore: integer("match_score"), // AI matching score
  confidence: text("confidence"), // high, medium, low
  aiRecommendation: jsonb("ai_recommendation").$type<{
    assessmentScore: number;
    academicScore: number;
    skillsScore: number;
    interestsScore: number;
    rationale: string[];
    nextSteps: string[];
  }>(),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ============================================================================
// SKILL EVIDENCE
// ============================================================================

/**
 * Evidence for skill validation - projects, certificates, achievements
 */
export const skillEvidence = pgTable("skill_evidence", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: text("student_id").notNull().references(() => users.id, { onDelete: "cascade" }),

  // Skill reference
  skillId: text("skill_id").notNull(),
  skillName: text("skill_name").notNull(),
  skillCategory: text("skill_category").notNull(), // academic, soft, technical, creative, service, vocational

  // Evidence details
  evidenceType: text("evidence_type").notNull(), // project, certificate, competition, homework, presentation, internship, volunteer
  title: text("title").notNull(),
  description: text("description"),

  // Attachments
  fileUrl: text("file_url"),
  fileNames: jsonb("file_names").$type<string[]>(),
  thumbnailUrl: text("thumbnail_url"),

  // Dates
  completedDate: timestamp("completed_at"),
  semester: text("semester"), // e.g., "2026-Spring"

  // Validation
  status: text("status").notNull().default("pending"), // pending, approved, rejected
  validatedBy: text("validated_by").references(() => users.id),
  validatedAt: timestamp("validated_at"),
  validationNotes: text("validation_notes"),
  proficiencyLevel: text("proficiency_level"), // beginner, intermediate, advanced, expert

  // For showcase/portfolio
  isFeatured: boolean("is_featured").notNull().default(false),
  showcaseOrder: integer("showcase_order"),

  // Related entities
  subjectId: text("subject_id"),
  projectId: text("project_id"),
  certificateId: text("certificate_id"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ============================================================================
// CAREER EXPLORATION ACTIVITIES
// ============================================================================

/**
 * Tracks all career exploration activities for analytics and personalization
 */
export const careerExplorationActivities = pgTable("career_exploration_activities", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: text("student_id").notNull().references(() => users.id, { onDelete: "cascade" }),

  // Activity type
  activityType: text("activity_type").notNull(),
  // Types: assessment_view, assessment_complete, career_view, career_save, career_unsave,
  //        coach_chat, roadmap_view, milestone_complete, rub_view, rub_save,
  //        scholarship_view, interview_practice, resume_download, portfolio_view

  // Activity details
  metadata: jsonb("metadata").$type<{
    careerId?: string;
    careerTitle?: string;
    assessmentType?: string;
    assessmentResult?: string;
    rubCollege?: string;
    rubProgram?: string;
    sessionDuration?: number; // seconds
    milestoneId?: string;
    questionCount?: number;
    score?: number;
  }>(),

  // Session tracking
  sessionId: text("session_id"), // For grouping related activities
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ============================================================================
// MENTORSHIP CONNECTIONS
// ============================================================================

/**
 * Student-Alumni mentorship connections for career guidance
 */
export const mentorshipConnections = pgTable("mentorship_connections", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: text("student_id").notNull().references(() => users.id, { onDelete: "cascade" }),

  // Mentor details (could be alumni, professional, teacher)
  mentorId: text("mentor_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  mentorName: text("mentor_name").notNull(),
  mentorRole: text("mentor_role").notNull(), // alumni, professional, teacher, counselor
  mentorCurrentPosition: text("mentor_current_position"),
  mentorOrganization: text("mentor_organization"),
  mentorGraduationYear: integer("mentor_graduation_year"),

  // Career context
  careerId: text("career_id").notNull(),
  careerTitle: text("career_title").notNull(),
  industry: text("industry"),

  // Connection status
  status: text("status").notNull().default("pending"),
  // pending, active, paused, completed, cancelled
  requestedAt: timestamp("requested_at").notNull().defaultNow(),
  acceptedAt: timestamp("accepted_at"),
  endedAt: timestamp("ended_at"),
  reasonForEnding: text("reason_for_ending"),

  // Session tracking
  totalSessions: integer("total_sessions").notNull().default(0),
  lastSessionAt: timestamp("last_session_at"),
  nextSessionScheduled: timestamp("next_session_scheduled"),

  // Goals and outcomes
  studentGoals: jsonb("student_goals").$type<Array<{
    goal: string;
    targetDate?: string;
    achieved: boolean;
  }>>(),
  outcomes: text("outcomes"), // Summary of outcomes

  // Feedback
  studentRating: integer("student_rating"), // 1-5
  mentorRating: integer("mentor_rating"), // 1-5
  feedbackFromStudent: text("feedback_from_student"),
  feedbackFromMentor: text("feedback_from_mentor"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ============================================================================
// CAREER COUNSELING SESSIONS
// ============================================================================

/**
 * Records actual counseling sessions between students and counselors
 */
export const careerCounselingSessions = pgTable("career_counseling_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: text("student_id").notNull().references(() => users.id, { onDelete: "cascade" }),

  // Session details
  counselorId: text("counselor_id").notNull().references(() => users.id),
  templateId: text("template_id"), // Reference to session template used

  sessionType: text("session_type").notNull(),
  // initial_assessment, career_exploration, rub_application, scholarship_guidance,
  // review_followup, crisis_intervention, parent_counseling

  scheduledDate: timestamp("scheduled_date").notNull(),
  duration: integer("duration_minutes"), // Actual duration
  status: text("status").notNull().default("scheduled"),
  // scheduled, completed, cancelled, no_show

  // Session content
  topicsDiscussed: jsonb("topics_discussed").$type<string[]>(),
  keyDecisions: jsonb("key_decisions").$type<Array<{
    decision: string;
    rationale: string;
    agreedBy: string[]; // student, parent, counselor
  }>>(),
  actionItems: jsonb("action_items").$type<Array<{
    task: string;
    assignedTo: string;
    dueDate: string;
    completed: boolean;
  }>>(),

  // Attendees
  parentAttended: boolean("parent_attended").notNull().default(false),
  parentId: text("parent_id").references(() => users.id),

  // Notes and outcomes
  counselorNotes: text("counselor_notes"),
  studentNotes: text("student_notes"),
  sessionGoals: jsonb("session_goals").$type<string[]>(),
  goalsAchieved: jsonb("goals_achieved").$type<string[]>(),

  // Follow-up
  followUpScheduled: boolean("follow_up_scheduled").notNull().default(false),
  followUpDate: timestamp("follow_up_date"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ============================================================================
// CAREER MILESTONE TRACKING
// ============================================================================

/**
 * Individual milestone progress tracking
 */
export const careerMilestones = pgTable("career_milestones", {
  id: uuid("id").primaryKey().defaultRandom(),
  roadmapId: uuid("roadmap_id").notNull().references(() => careerRoadmaps.id, { onDelete: "cascade" }),
  studentId: text("student_id").notNull().references(() => users.id, { onDelete: "cascade" }),

  // Milestone details
  milestoneId: text("milestone_id").notNull(), // Reference to template milestone
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  // assessment, academic, skill, application, milestone

  // Status
  status: text("status").notNull().default("pending"),
  // pending, in-progress, completed, skipped, cancelled

  // Priority and dates
  priority: text("priority").notNull().default("medium"), // high, medium, low
  targetDate: timestamp("target_date"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),

  // Dependencies
  dependsOn: jsonb("depends_on").$type<string[]>(), // IDs of milestones this depends on

  // Resources
  resources: jsonb("resources").$type<Array<{
    title: string;
    type: string;
    url?: string;
  }>>(),

  // Evidence
  evidenceIds: jsonb("evidence_ids").$type<string[]>(), // Links to skill_evidence

  // Notes
  studentNotes: text("student_notes"),
  counselorNotes: text("counselor_notes"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});


// ============================================================================
// CAREER RECOMMENDATIONS
// ============================================================================

/**
 * AI-generated career recommendations for counselor review
 */
export const careerRecommendations = pgTable("career_recommendations", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: text("student_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  counselorId: text("counselor_id").references(() => users.id, { onDelete: "set null" }),

  // Career details
  careerId: text("career_id").notNull(),
  careerTitle: text("career_title").notNull(),
  category: text("category").notNull(),

  // Match scores
  matchScore: integer("match_score").notNull(), // 0-100
  confidence: text("confidence").notNull(), // high, medium, low

  // Score breakdown
  assessmentScore: integer("assessment_score"),
  academicScore: integer("academic_score"),
  skillsScore: integer("skills_score"),
  interestsScore: integer("interests_score"),

  // Skills gap
  skillsGap: jsonb("skills_gap").$type<{
    missing: string[];
    have: string[];
    readiness: number;
  }>(),

  // RUB Connection
  rubPrograms: jsonb("rub_programs").$type<Array<{
    collegeId: string;
    collegeName: string;
    programName: string;
    matchScore: number;
    admissionProbability: number;
  }>>(),

  // Recommendation details
  rationale: jsonb("rationale").$type<string[]>(),
  nextSteps: jsonb("next_steps").$type<string[]>(),

  // Review status
  status: text("status").notNull().default("pending"),
  // pending, approved, approved_with_conditions, not_recommended

  // Counselor decision
  counselorDecision: text("counselor_decision"),
  // approve, approve_with_conditions, not_recommended
  counselorNotes: text("counselor_notes"),
  counselorConditions: jsonb("counselor_conditions").$type<string[]>(),
  reviewedAt: timestamp("reviewed_at"),

  // Student response
  studentResponse: text("student_response"),
  studentAccepted: boolean("student_accepted"),
  respondedAt: timestamp("responded_at"),

  // Parent involvement
  parentApproved: boolean("parent_approved").notNull().default(false),
  parentApprovedAt: timestamp("parent_approved_at"),
  parentNotes: text("parent_notes"),

  // Metadata
  suggestedAt: timestamp("suggested_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  studentIdIdx: index("career_recommendations_student_id_idx").on(table.studentId),
  counselorIdIdx: index("career_recommendations_counselor_id_idx").on(table.counselorId),
  statusIdx: index("career_recommendations_status_idx").on(table.status),
}));

// ============================================================================
// CAREER REVIEW NOTES
// ============================================================================

/**
 * Notes and communication history for career recommendations
 */
export const careerReviewNotes = pgTable("career_review_notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  recommendationId: uuid("recommendation_id").notNull().references(() => careerRecommendations.id, { onDelete: "cascade" }),

  // Note details
  authorId: text("author_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  authorRole: text("author_role").notNull(), // counselor, student, parent
  content: text("content").notNull(),

  // Note type
  noteType: text("note_type").notNull(),
  // rationale, condition, question, response, feedback

  // Visibility
  isPrivate: boolean("is_private").notNull().default(false),

  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  recommendationIdIdx: index("career_review_notes_recommendation_id_idx").on(table.recommendationId),
  authorIdIdx: index("career_review_notes_author_id_idx").on(table.authorId),
}));


// ============================================================================
// RELATIONS
// ============================================================================

export const careerRoadmapsRelations = relations(careerRoadmaps, ({ many, one }) => ({
  milestones: many(careerMilestones),
  student: one(users, {
    fields: [careerRoadmaps.studentId],
    references: [users.id],
  }),
}));


export const careerRecommendationsRelations = relations(careerRecommendations, ({ one, many }) => ({
  student: one(users, {
    fields: [careerRecommendations.studentId],
    references: [users.id],
  }),
  counselor: one(users, {
    fields: [careerRecommendations.counselorId],
    references: [users.id],
  }),
  notes: many(careerReviewNotes),
}));

export const careerReviewNotesRelations = relations(careerReviewNotes, ({ one }) => ({
  recommendation: one(careerRecommendations, {
    fields: [careerReviewNotes.recommendationId],
    references: [careerRecommendations.id],
  }),
  author: one(users, {
    fields: [careerReviewNotes.authorId],
    references: [users.id],
  }),
}));



export const careerInterestsRelations = relations(careerInterests, ({ one }) => ({
  student: one(users, {
    fields: [careerInterests.studentId],
    references: [users.id],
  }),
}));


export const skillEvidenceRelations = relations(skillEvidence, ({ one }) => ({
  student: one(users, {
    fields: [skillEvidence.studentId],
    references: [users.id],
  }),
}));

export const careerExplorationActivitiesRelations = relations(careerExplorationActivities, ({ one }) => ({
  student: one(users, {
    fields: [careerExplorationActivities.studentId],
    references: [users.id],
  }),
}));

export const mentorshipConnectionsRelations = relations(mentorshipConnections, ({ one }) => ({
  student: one(users, {
    fields: [mentorshipConnections.studentId],
    references: [users.id],
  }),
  mentor: one(users, {
    fields: [mentorshipConnections.mentorId],
    references: [users.id],
  }),
}));

export const careerCounselingSessionsRelations = relations(careerCounselingSessions, ({ one }) => ({
  student: one(users, {
    fields: [careerCounselingSessions.studentId],
    references: [users.id],
  }),
  counselor: one(users, {
    fields: [careerCounselingSessions.counselorId],
    references: [users.id],
  }),
}));

export const careerMilestonesRelations = relations(careerMilestones, ({ many, one }) => ({
  roadmap: one(careerRoadmaps, {
    fields: [careerMilestones.roadmapId],
    references: [careerRoadmaps.id],
  }),
  student: one(users, {
    fields: [careerMilestones.studentId],
    references: [users.id],
  }),
}));

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type CareerInterest = typeof careerInterests.$inferSelect;
export type NewCareerInterest = typeof careerInterests.$inferInsert;
export type CareerRoadmap = typeof careerRoadmaps.$inferSelect;
export type NewCareerRoadmap = typeof careerRoadmaps.$inferInsert;
export type SkillEvidence = typeof skillEvidence.$inferSelect;
export type NewSkillEvidence = typeof skillEvidence.$inferInsert;
export type CareerExplorationActivity = typeof careerExplorationActivities.$inferSelect;
export type NewCareerExplorationActivity = typeof careerExplorationActivities.$inferInsert;
export type MentorshipConnection = typeof mentorshipConnections.$inferSelect;
export type NewMentorshipConnection = typeof mentorshipConnections.$inferInsert;
export type CareerCounselingSession = typeof careerCounselingSessions.$inferSelect;
export type NewCareerCounselingSession = typeof careerCounselingSessions.$inferInsert;
export type CareerMilestone = typeof careerMilestones.$inferSelect;
export type NewCareerMilestone = typeof careerMilestones.$inferInsert;
export type CareerRecommendation = typeof careerRecommendations.$inferSelect;
export type NewCareerRecommendation = typeof careerRecommendations.$inferInsert;
export type CareerReviewNote = typeof careerReviewNotes.$inferSelect;
export type NewCareerReviewNote = typeof careerReviewNotes.$inferInsert;
