"use server";
import { logger } from "@/lib/logger";

/**
 * TEACHER SERVER ACTIONS
 *
 * Server actions for teacher portal.
 * These are wrapped versions of the data fetching utilities for use in client components.
 */


import {
  getCurrentTeacherId,
  getTeacherEarnings,
  filterTransactions,
  type EarningsData,
  type TransactionData,
  type CourseStatsData,
} from "@/lib/api/teacher";
import { cache } from "react";

// Cache the teacher ID lookup
const getCachedTeacherId = cache(async () => {
  return await getCurrentTeacherId();
});

/**
 * EARNINGS ACTIONS
 */
export async function fetchTeacherEarnings(options: {
  timePeriod?: "all" | "month" | "quarter" | "year";
  status?: "all" | "completed" | "pending" | "processing";
} = {}) {
  const tutorId = await getCachedTeacherId();
  const { timePeriod = "all", status = "all" } = options;

  const { earningsData, transactions, courseStats } = await getTeacherEarnings(tutorId);

  // Filter transactions based on options
  const filteredTransactions = filterTransactions(transactions, timePeriod, status);

  return {
    earningsData,
    transactions: filteredTransactions,
    courseStats,
    allTransactions: transactions, // Return all for client-side filtering
  };
}

/**
 * REQUEST PAYOUT ACTION
 *
 * Request a payout for pending earnings.
 */
export async function requestPayout() {
  const tutorId = await getCachedTeacherId();

  if (!tutorId) {
    return { success: false, error: "Teacher not found" };
  }

  try {
    const { db } = await import("@/lib/db");
    const { tutorEarnings } = await import("@/lib/db/schema");
    const { eq, and } = await import("drizzle-orm");

    // Get all pending earnings
    const pendingEarnings = await db.query.tutorEarnings.findMany({
      where: and(
        eq(tutorEarnings.tutorId, tutorId),
        eq(tutorEarnings.payoutStatus, "pending")
      ),
    });

    if (pendingEarnings.length === 0) {
      return { success: false, error: "No pending earnings to payout" };
    }

    // Calculate total
    const totalAmount = pendingEarnings.reduce((sum, e) => sum + (e.netAmount || 0), 0);

    // Update all pending earnings to processing
    for (const earning of pendingEarnings) {
      await db
        .update(tutorEarnings)
        .set({
          payoutStatus: "processing",
        })
        .where(eq(tutorEarnings.id, earning.id));
    }

    return {
      success: true,
      amount: totalAmount,
      count: pendingEarnings.length,
      message: `Payout request for Nu. ${totalAmount.toLocaleString()} has been submitted.`,
    };
  } catch (error) {
    logger.error("Failed to request payout:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to request payout",
    };
  }
}
