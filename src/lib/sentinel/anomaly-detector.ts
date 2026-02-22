/**
 * AI SENTINEL - Anomaly Detection System
 *
 * Monitors platform health and detects anomalies requiring admin attention.
 * Runs daily via cron or on-demand.
 */

import { db } from "@/lib/db";
import { schools, users, invoices, subscriptions, aiInteractions, assessments } from "@/lib/db/schema";
import { eq, gt, lt, and, sql, desc } from "drizzle-orm";
import { logger } from "@/lib/logger";

// ============================================================================
// TYPES
// ============================================================================

export interface AnomalyDetection {
  severity: "low" | "medium" | "high" | "critical";
  type: "seat_limit" | "overdue_payment" | "low_engagement" | "api_error" | "system_health";
  entityId: string;
  entityType: "school" | "invoice" | "user" | "system";
  title: string;
  message: string;
  suggestedAction?: string;
  metadata?: Record<string, any>;
}

export interface DetectionResult {
  anomalies: AnomalyDetection[];
  summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    total: number;
  };
  timestamp: Date;
}

// ============================================================================
// ANOMALY DETECTORS
// ============================================================================

/**
 * Detect schools that have exceeded their subscription seat limits
 */
async function detectSeatLimitAnomalies(): Promise<AnomalyDetection[]> {
  const anomalies: AnomalyDetection[] = [];

  try {
    // Get all active schools with their subscriptions
    const allSchools = await db
      .select({
        id: schools.id,
        name: schools.name,
        maxStudents: schools.maxStudents,
        subscriptionTier: schools.subscriptionTier,
      })
      .from(schools)
      .where(eq(schools.isActive, true));

    // Define seat limits by tier
    const tierLimits: Record<string, number> = {
      free: 100,
      basic: 500,
      standard: 2000,
      premium: -1, // Unlimited
    };

    for (const school of allSchools) {
      const limit = tierLimits[school.subscriptionTier || "free"] || 100;

      // Skip unlimited tiers
      if (limit === -1) continue;

      const maxStudents = school.maxStudents || 0;
      const usagePercentage = limit > 0 ? (maxStudents / limit) * 100 : 0;

      // Alert at 90% usage
      if (usagePercentage >= 90 && usagePercentage < 100) {
        anomalies.push({
          severity: "high",
          type: "seat_limit",
          entityId: school.id,
          entityType: "school",
          title: `${school.name} approaching seat limit`,
          message: `${school.name} has ${maxStudents} students (${usagePercentage.toFixed(0)}%) of ${limit} seat limit. Upgrade required soon.`,
          suggestedAction: `Send upgrade notification to ${school.name} school admin`,
          metadata: { schoolName: school.name, currentUsage: maxStudents, limit, usagePercentage },
        });
      }

      // Critical at 100%+ usage
      if (usagePercentage >= 100) {
        anomalies.push({
          severity: "critical",
          type: "seat_limit",
          entityId: school.id,
          entityType: "school",
          title: `${school.name} exceeded seat limit`,
          message: `${school.name} has ${maxStudents} students, exceeding the ${limit} seat limit. Immediate action required.`,
          suggestedAction: `Suspend new student registration or upgrade subscription for ${school.name}`,
          metadata: { schoolName: school.name, currentUsage: maxStudents, limit, usagePercentage },
        });
      }
    }
  } catch (error) {
    logger.error("Failed to detect seat limit anomalies:", error);
  }

  return anomalies;
}

/**
 * Detect overdue invoices
 */
async function detectOverduePaymentAnomalies(): Promise<AnomalyDetection[]> {
  const anomalies: AnomalyDetection[] = [];

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get overdue invoices
    const overdueInvoices = await db
      .select({
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        schoolId: invoices.schoolId,
        amount: invoices.totalAmount,
        dueDate: invoices.dueDate,
        status: invoices.status,
      })
      .from(invoices)
      .where(
        and(
          eq(invoices.status, "overdue"),
          lt(invoices.dueDate, today)
        )
      )
      .orderBy(desc(invoices.dueDate));

    for (const invoice of overdueInvoices) {
      const dueDate = new Date(invoice.dueDate);
      const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

      // Get school name
      const school = await db
        .select({ name: schools.name })
        .from(schools)
        .where(eq(schools.id, invoice.schoolId!))
        .limit(1);

      const schoolName = school[0]?.name || "Unknown School";

      // Severity based on days overdue
      let severity: AnomalyDetection["severity"] = "low";
      if (daysOverdue > 30) severity = "critical";
      else if (daysOverdue > 14) severity = "high";
      else if (daysOverdue > 7) severity = "medium";

      anomalies.push({
        severity,
        type: "overdue_payment",
        entityId: invoice.id,
        entityType: "invoice",
        title: `Invoice ${invoice.invoiceNumber} overdue by ${daysOverdue} days`,
        message: `${schoolName} has overdue invoice ${invoice.invoiceNumber} for Nu.${invoice.amount}. ${daysOverdue} days past due.`,
        suggestedAction: daysOverdue > 14
          ? `Send payment reminder and consider restricting ${schoolName} access`
          : `Send payment reminder to ${schoolName}`,
        metadata: {
          invoiceNumber: invoice.invoiceNumber,
          schoolName,
          amount: invoice.amount,
          daysOverdue,
          schoolId: invoice.schoolId,
        },
      });
    }
  } catch (error) {
    logger.error("Failed to detect overdue payment anomalies:", error);
  }

  return anomalies;
}

/**
 * Detect schools with low engagement (low assessment completion)
 */
async function detectLowEngagementAnomalies(): Promise<AnomalyDetection[]> {
  const anomalies: AnomalyDetection[] = [];

  try {
    // Get schools with students - we need to count users per school
    const schoolsWithStudents = await db
      .select({
        id: schools.id,
        name: schools.name,
        createdAt: schools.createdAt,
      })
      .from(schools)
      .where(eq(schools.isActive, true));

    // Check each school's assessment completion rate
    for (const school of schoolsWithStudents) {
      // Get student count for this school
      const studentCountResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(
          and(
            eq(users.schoolId, school.id),
            eq(users.type, "student")
          )
        );

      const studentCount = studentCountResult[0]?.count || 0;

      // Skip new schools (less than 30 days old) and very small schools
      const daysSinceCreation = (Date.now() - new Date(school.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceCreation < 30 || studentCount < 50) continue;

      // Count assessments completed by students from this school - Note: assessments table uses classId, not schoolId
      // We need to join through users table
      const completedAssessments = await db
        .select({ count: sql<number>`count(*)` })
        .from(assessments)
        .innerJoin(users, eq(assessments.userId, users.id))
        .where(eq(users.schoolId, school.id));

      const assessmentCount = Number(completedAssessments[0]?.count || 0);
      const completionRate = studentCount > 0 ? (assessmentCount / studentCount) * 100 : 0;

      // Alert if completion rate is below 20%
      if (completionRate < 20 && assessmentCount < studentCount) {
        anomalies.push({
          severity: "medium",
          type: "low_engagement",
          entityId: school.id,
          entityType: "school",
          title: `${school.name} has low assessment engagement`,
          message: `Only ${assessmentCount} of ${studentCount} students (${completionRate.toFixed(0)}%) have completed assessments.`,
          suggestedAction: `Send engagement campaign to ${school.name} teachers and students`,
          metadata: { schoolName: school.name, studentCount, assessmentCount, completionRate },
        });
      }
    }
  } catch (error) {
    logger.error("Failed to detect low engagement anomalies:", error);
  }

  return anomalies;
}

/**
 * Detect system health issues (would require additional monitoring infrastructure)
 */
async function detectSystemHealthAnomalies(): Promise<AnomalyDetection[]> {
  const anomalies: AnomalyDetection[] = [];

  try {
    // Check for recent AI interaction failures
    // This would require additional error tracking
    // For now, return empty
  } catch (error) {
    logger.error("Failed to detect system health anomalies:", error);
  }

  return anomalies;
}

// ============================================================================
// MAIN DETECTION FUNCTION
// ============================================================================

/**
 * Run all anomaly detection checks
 */
export async function detectAllAnomalies(): Promise<DetectionResult> {
  const startTime = Date.now();

  logger.info("Starting anomaly detection scan");

  // Run all detectors in parallel
  const [
    seatLimitAnomalies,
    overduePaymentAnomalies,
    lowEngagementAnomalies,
    systemHealthAnomalies,
  ] = await Promise.all([
    detectSeatLimitAnomalies(),
    detectOverduePaymentAnomalies(),
    detectLowEngagementAnomalies(),
    detectSystemHealthAnomalies(),
  ]);

  const allAnomalies = [
    ...seatLimitAnomalies,
    ...overduePaymentAnomalies,
    ...lowEngagementAnomalies,
    ...systemHealthAnomalies,
  ];

  // Sort by severity (critical first)
  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  allAnomalies.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  const summary = {
    critical: allAnomalies.filter((a) => a.severity === "critical").length,
    high: allAnomalies.filter((a) => a.severity === "high").length,
    medium: allAnomalies.filter((a) => a.severity === "medium").length,
    low: allAnomalies.filter((a) => a.severity === "low").length,
    total: allAnomalies.length,
  };

  const duration = Date.now() - startTime;

  logger.info("Anomaly detection scan completed", {
    duration: `${duration}ms`,
    summary,
  });

  return {
    anomalies: allAnomalies,
    summary,
    timestamp: new Date(),
  };
}

/**
 * Generate SITREP summary from anomalies
 */
export function generateAnomalySummary(anomalies: AnomalyDetection[]): string {
  if (anomalies.length === 0) {
    return "All systems operational. No anomalies detected.";
  }

  const byType = anomalies.reduce((acc, a) => {
    acc[a.type] = (acc[a.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const criticalCount = anomalies.filter((a) => a.severity === "critical").length;
  const highCount = anomalies.filter((a) => a.severity === "high").length;

  let summary = `Detected ${anomalies.length} anomaly(s) requiring attention.\n\n`;

  if (criticalCount > 0) {
    summary += `🔴 CRITICAL: ${criticalCount} issue(s) need immediate action.\n`;
  }
  if (highCount > 0) {
    summary += `🟠 HIGH: ${highCount} issue(s) should be addressed soon.\n`;
  }

  summary += "\nBreakdown:\n";
  for (const [type, count] of Object.entries(byType)) {
    summary += `- ${type}: ${count}\n`;
  }

  return summary;
}
