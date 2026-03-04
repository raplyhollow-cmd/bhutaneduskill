/**
 * EMAIL NOTIFICATION SYSTEM
 *
 * Sends assessment reminders, deadline alerts, and engagement emails
 */

import { db } from "@/lib/db";
import { users, assessments, assessmentSubmissions } from "@/lib/db/schema";
import { eq, and, sql, gte, lte, isNull } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { nanoid } from "nanoid";

// Email queue interface (table doesn't exist yet in schema - using in-memory for now)
interface EmailQueueItem {
  id: string;
  to: string;
  type: string;
  templateData: Record<string, unknown>;
  priority: "low" | "normal" | "high";
  status: "pending" | "sent" | "failed";
  sendAt?: Date;
  error?: string;
  sentAt?: Date;
  createdAt: Date;
}

// In-memory email queue for development (TODO: add emailQueue table to schema)
const emailQueueData = new Map<string, EmailQueueItem>();

// ============================================================================
// EMAIL TEMPLATES
// ============================================================================/

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

const TEMPLATES: Record<string, (data: any) => EmailTemplate> = {
  assessment_reminder: (data: { studentName: string; assessmentName: string; dueDate: string }) => ({
    subject: `Reminder: Complete your ${data.assessmentName} Assessment`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #a855f7;">Reminder: ${data.assessmentName} Assessment</h2>
        <p>Hi ${data.studentName},</p>
        <p>You have an assessment pending completion. Due date: <strong>${data.dueDate}</strong></p>
        <p>This assessment will help us understand your strengths and suggest the best career path for you.</p>
        <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/student/assessments" style="background: #a855f7; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block;">Continue Assessment</a></p>
        <p style="color: #6b7280; font-size: 12px;">Bhutan EduSkill • Building Your Future</p>
      </div>
    `,
    text: `Hi ${data.studentName}, please complete your ${data.assessmentName} assessment by ${data.dueDate}. Visit: ${process.env.NEXT_PUBLIC_APP_URL}/student/assessments`,
  }),

  assessment_overdue: (data: { studentName: string; assessmentName: string }) => ({
    subject: `Overdue: ${data.assessmentName} Assessment`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Assessment Overdue</h2>
        <p>Hi ${data.studentName},</p>
        <p>Your <strong>${data.assessmentName}</strong> assessment is overdue.</p>
        <p>Completing this assessment is important for your career planning. Please finish it as soon as possible.</p>
        <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/student/assessments" style="background: #dc2626; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block;">Complete Now</a></p>
      </div>
    `,
    text: `Your ${data.assessmentName} assessment is overdue. Please complete it at: ${process.env.NEXT_PUBLIC_APP_URL}/student/assessments`,
  }),

  homework_reminder: (data: { studentName: string; homeworkTitle: string; dueDate: string; teacherName: string }) => ({
    subject: `Homework Due: ${data.homeworkTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3b82f6;">Homework Reminder</h2>
        <p>Hi ${data.studentName},</p>
        <p><strong>${data.homeworkTitle}</strong> is due on <strong>${data.dueDate}</strong>.</p>
        <p>From: ${data.teacherName}</p>
        <p>Make sure to submit on time!</p>
        <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/student/homework" style="background: #3b82f6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block;">View Homework</a></p>
      </div>
    `,
    text: `Hi ${data.studentName}, you have homework due: ${data.homeworkTitle} on ${data.dueDate}. From ${data.teacherName}.`,
  }),

  roadmap_ready: (data: { studentName: string }) => ({
    subject: `Your Career Roadmap is Ready! 🎓`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #22c55e;">Your Roadmap is Ready!</h2>
        <p>Hi ${data.studentName},</p>
        <p>Great news! Based on your assessments, we've created your personalized career roadmap.</p>
        <p>Your roadmap shows:</p>
        <ul>
          <li>Recommended subjects for Class 11-12</li>
          <li>BCSE target scores for your dream career</li>
          <li>RUB colleges that match your profile</li>
          <li>Scholarship opportunities</li>
        </ul>
        <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/student/roadmap" style="background: #22c55e; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block;">View Your Roadmap</a></p>
      </div>
    `,
    text: `Hi ${data.studentName}, your personalized career roadmap is ready! View it at: ${process.env.NEXT_PUBLIC_APP_URL}/student/roadmap`,
  }),

  parent_digest: (data: { parentName: string; childName: string; stats: { assessments: number; attendance: number; upcomingDeadlines: string[] } }) => ({
    subject: `Weekly Update: ${data.childName}'s Progress`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #a855f7;">Weekly Progress Update</h2>
        <p>Hi ${data.parentName},</p>
        <p>Here's how ${data.childName} is doing this week:</p>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Assessments Completed</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${data.stats.assessments}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Attendance Rate</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${data.stats.attendance}%</td></tr>
        </table>
        ${data.stats.upcomingDeadlines.length > 0 ? `<p><strong>Upcoming Deadlines:</strong></p><ul>${data.stats.upcomingDeadlines.map(d => `<li>${d}</li>`).join("")}</ul>` : ""}
        <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/parent" style="background: #a855f7; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block;">View Full Details</a></p>
      </div>
    `,
    text: `Weekly update for ${data.childName}: ${data.stats.assessments} assessments, ${data.stats.attendance}% attendance.`,
  }),
};

// ============================================================================
// EMAIL SENDING FUNCTIONS
// ============================================================================/

/**
 * Queue an email to be sent (in-memory)
 */
export async function queueEmail(data: {
  to: string;
  type: string;
  templateData?: any;
  priority?: "low" | "normal" | "high";
  sendAt?: Date;
}) {
  const id = nanoid();
  const item: EmailQueueItem = {
    id,
    to: data.to,
    type: data.type,
    templateData: data.templateData || {},
    priority: data.priority || "normal",
    status: "pending",
    sendAt: data.sendAt,
    createdAt: new Date(),
  };
  emailQueueData.set(id, item);
}

/**
 * Send assessment reminders to students who haven't completed
 */
export async function sendAssessmentReminders(assessmentId: string, daysBeforeDue: number = 3) {
  // Get assessment details
  const [assessment] = await db
    .select()
    .from(assessments)
    .where(eq(assessments.id, assessmentId))
    .limit(1);

  if (!assessment) return { sent: 0, queued: 0 };

  // Find students who haven't completed
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + daysBeforeDue);

  const students = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
    })
    .from(users)
    .leftJoin(
      assessmentSubmissions,
      and(
        eq(assessmentSubmissions.userId, users.id),
        eq(assessmentSubmissions.assessmentId, assessmentId)
      )
    )
    .where(
      and(
        eq(users.type, "student"),
        isNull(assessmentSubmissions.id)
      )
    );

  let queued = 0;
  for (const student of students) {
    if (student.email) {
      await queueEmail({
        to: student.email,
        type: "assessment_reminder",
        templateData: {
          studentName: student.name || "Student",
          assessmentName: assessment.title,
          dueDate: dueDate.toLocaleDateString(),
        },
        priority: "normal",
      });
      queued++;
    }
  }

  return { sent: 0, queued };
}

/**
 * Send roadmap ready notification
 */
export async function sendRoadmapNotification(studentId: string) {
  const [student] = await db
    .select()
    .from(users)
    .where(eq(users.id, studentId))
    .limit(1);

  if (!student || !student.email) return { sent: 0, queued: 0 };

  await queueEmail({
    to: student.email,
    type: "roadmap_ready",
    templateData: {
      studentName: student.name || "Student",
    },
    priority: "high",
  });

  return { sent: 0, queued: 1 };
}

/**
 * Send parent weekly digest
 */
export async function sendParentDigest(parentId: string) {
  // TODO: Implement parent digest email
  // Fetch child's stats for the week
  // Queue digest email
  return { sent: 0, queued: 0 };
}

// ============================================================================
// BATCH EMAIL OPERATIONS
// ============================================================================/

/**
 * Send all pending reminders for a specific date
 */
export async function sendDailyReminders() {
  logger.info("Sending daily assessment reminders");

  // Get assessments due in 3 days
  const threeDaysFromNow = new Date();
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

  const upcomingAssessments = await db
    .select()
    .from(assessments)
    .where(
      and(
        sql`${assessments.dueDate} <= ${threeDaysFromNow}`,
        sql`${assessments.dueDate} >= ${new Date()}`
      )
    );

  let totalQueued = 0;
  for (const assessment of upcomingAssessments) {
    const result = await sendAssessmentReminders(assessment.id, 3);
    totalQueued += result.queued;
  }

  logger.info("Daily reminders queued", { total: totalQueued });
  return { totalQueued };
}

/**
 * Process email queue (called by cron job)
 */
export async function processEmailQueue(limit: number = 50) {
  const now = new Date();
  const pending: EmailQueueItem[] = [];

  // Get pending emails from in-memory queue
  for (const item of emailQueueData.values()) {
    if (item.status === "pending" && pending.length < limit) {
      if (!item.sendAt || item.sendAt <= now) {
        pending.push(item);
      }
    }
  }

  const processed = [];
  for (const email of pending) {
    try {
      const template = TEMPLATES[email.type];
      if (!template) {
        email.status = "failed";
        email.error = "Unknown template";
        continue;
      }

      const emailContent = template(email.templateData || {});

      // TODO: Actually send email via Resend, SendGrid, or similar
      // For now, just mark as sent in development
      logger.info("Would send email", {
        to: email.to,
        type: email.type,
        subject: emailContent.subject,
      });

      email.status = "sent";
      email.sentAt = new Date();
      processed.push(email.id);
    } catch (error) {
      logger.error("Failed to send email", { emailId: email.id, error });
      email.status = "failed";
      email.error = String(error);
    }
  }

  return { processed, count: processed.length };
}
