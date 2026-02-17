"use server";

import { logger } from "@/lib/logger";
/**
 * COUNSELOR DASHBOARD SERVER ACTIONS
 *
 * Server actions for counselor dashboard data fetching
 * Now uses real API data instead of mock values
 */


import { requireAuth } from "@/lib/auth-utils";

/**
 * Fetch counselor statistics
 * Returns overview data for the counselor dashboard from real API
 */
export async function fetchCounselorStats() {
  try {
    const authResult = await requireAuth(['counselor', 'admin']);
    if ('error' in authResult) {
      return {
        totalStudents: 0,
        activeSchools: 0,
        pendingReports: 0,
        assessmentsThisWeek: 0,
        aiCoachUsage: 0,
      };
    }

    // Fetch from dashboard API
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3003';

    const response = await fetch(`${baseUrl}/api/counselor/dashboard`, {
      cache: 'no-store',
    });

    if (response.ok) {
      const data = await response.json();
      return data.stats || {
        totalStudents: 0,
        activeSchools: 0,
        pendingReports: 0,
        assessmentsThisWeek: 0,
        aiCoachUsage: 0,
      };
    }

    // Fallback to zeros if API fails
    return {
      totalStudents: 0,
      activeSchools: 0,
      pendingReports: 0,
      assessmentsThisWeek: 0,
      aiCoachUsage: 0,
    };
  } catch (error) {
    logger.error("Error fetching counselor stats:", error);
    return {
      totalStudents: 0,
      activeSchools: 0,
      pendingReports: 0,
      assessmentsThisWeek: 0,
      aiCoachUsage: 0,
    };
  }
}

/**
 * Student insight interface
 */
export interface StudentInsight {
  id: string;
  name: string;
  school: string;
  grade: string;
  attendance: number;
  lastActivity: string;
  assessmentStatus: "completed" | "in_progress" | "pending";
  topCareer: string | null;
  needsAttention: boolean;
}
