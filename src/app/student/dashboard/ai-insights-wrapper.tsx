"use client";

/**
 * Student Dashboard AI Insights Wrapper
 *
 * Client component that fetches AI insights with student context data.
 * This component receives the server-side fetched dashboard data as props
 * and passes it to the unified AI insights API.
 */


import { AIInsightsSection } from "@/components/ai/ai-insights-section";

export interface StudentInsightsData {
  assessments: { completed: number; total: number };
  homework: { pending: number; submitted: number; graded: number; total: number };
  attendance: { rate: number; presentDays: number; totalDays: number };
  careerMatches: { totalMatches: number; topMatches: number; topCareer: string | null; hollandCode: string | null };
  fees: { totalAmount: number; amountPaid: number; amountPending: number; status: string; dueDate: string | null } | null;
}

export interface StudentAIInsightsProps {
  dashboardData: StudentInsightsData;
}

export function StudentAIInsights({ dashboardData }: StudentAIInsightsProps) {
  // Prepare context data for the AI insights API
  const contextData = {
    stats: {
      completedAssessments: dashboardData.assessments.completed,
      totalAssessments: dashboardData.assessments.total,
      homeworkPending: dashboardData.homework.pending,
      homeworkSubmitted: dashboardData.homework.submitted,
      homeworkGraded: dashboardData.homework.graded,
      attendanceRate: dashboardData.attendance.rate,
      presentDays: dashboardData.attendance.presentDays,
      totalDays: dashboardData.attendance.totalDays,
      careerMatches: dashboardData.careerMatches.topMatches,
      totalMatches: dashboardData.careerMatches.totalMatches,
      hollandCode: dashboardData.careerMatches.hollandCode,
      // Fee status for alerts
      feesPending: dashboardData.fees?.amountPending ?? 0,
      feesStatus: dashboardData.fees?.status,
    },
  };

  return (
    <AIInsightsSection
      userRole="student"
      contextData={contextData}
      maxInsights={3}
    />
  );
}
