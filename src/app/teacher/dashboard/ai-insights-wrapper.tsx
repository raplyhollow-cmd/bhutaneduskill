"use client";

/**
 * TEACHER AI INSIGHTS WRAPPER
 *
 * Client component that fetches AI insights from the API.
 * This is separated from the main dashboard to allow for server-side rendering of the main content.
 */

import { useEffect, useState, useRef } from "react";
import { AIInsightCard } from "@/components/ai/ai-insight-card";
import { logger } from "@/lib/logger";
import type { TeacherDashboardData } from "./_actions";

interface TeacherAIInsightsProps {
  dashboardData: TeacherDashboardData;
}

interface AIInsight {
  type: "warning" | "success" | "info" | "tip";
  title: string;
  message: string;
  actions?: Array<{ label: string; href: string }>;
}

export function TeacherAIInsights({ dashboardData }: TeacherAIInsightsProps) {
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const fetchAIInsights = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/ai/insights", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userRole: "teacher",
            contextData: {
              stats: dashboardData.stats,
              classes: dashboardData.classes,
              needsAttention: dashboardData.needsAttention,
            },
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setAiInsights(data.insights || []);
        } else {
          // Fallback to static insights if API fails
          setAiInsights(getFallbackInsights());
        }
      } catch (err) {
        logger.error("[Teacher Dashboard] Failed to load AI insights:", err);
        setAiInsights(getFallbackInsights());
      } finally {
        setIsLoading(false);
      }
    };

    fetchAIInsights();
  }, [dashboardData]);

  const getFallbackInsights = (): AIInsight[] => {
    const insights: AIInsight[] = [];

    // Attendance insight
    if (dashboardData.stats.averageAttendance < 80) {
      insights.push({
        type: "warning",
        title: "Low Attendance Alert",
        message: `Your average class attendance is ${dashboardData.stats.averageAttendance}%. Consider reaching out to frequently absent students.`,
        actions: [{ label: "View Attendance", href: "/teacher/attendance" }],
      });
    } else if (dashboardData.stats.averageAttendance >= 90) {
      insights.push({
        type: "success",
        title: "Excellent Attendance",
        message: `Your classes have ${dashboardData.stats.averageAttendance}% average attendance. Keep up the great work!`,
      });
    }

    // Pending grading insight
    if (dashboardData.stats.pendingHomework > 10) {
      insights.push({
        type: "warning",
        title: "Grading Backlog",
        message: `You have ${dashboardData.stats.pendingHomework} submissions waiting to be graded. Try to grade a few each day.`,
        actions: [{ label: "View Submissions", href: "/teacher/homework" }],
      });
    }

    // At-risk students insight
    if (dashboardData.stats.atRiskStudents > 0) {
      insights.push({
        type: "warning",
        title: "Students Need Support",
        message: `${dashboardData.stats.atRiskStudents} student(s) may need additional support based on attendance or performance.`,
        actions: [{ label: "View Details", href: "#needs-attention" }],
      });
    }

    // Class completion insight
    if (dashboardData.stats.assessmentCompletion > 0) {
      insights.push({
        type: "info",
        title: "Class Engagement",
        message: `Average homework completion rate across your classes is ${dashboardData.stats.assessmentCompletion}%.`,
      });
    }

    // Default insight if nothing else
    if (insights.length === 0) {
      insights.push({
        type: "info",
        title: "Dashboard Overview",
        message: `You have ${dashboardData.stats.totalStudents} students across ${dashboardData.stats.activeClasses} classes. Track attendance and homework to monitor student progress.`,
        actions: [{ label: "View Students", href: "/teacher/students" }],
      });
    }

    return insights.slice(0, 4);
  };

  const insightsToShow = aiInsights.length > 0 ? aiInsights : getFallbackInsights();

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-4">AI Insights</h2>
      <div className="grid md:grid-cols-2 gap-6">
        {isLoading ? (
          <>
            <div className="h-32 bg-gray-100 rounded-lg animate-pulse" />
            <div className="h-32 bg-gray-100 rounded-lg animate-pulse" />
          </>
        ) : (
          insightsToShow.map((insight, index) => (
            <AIInsightCard
              key={index}
              type={insight.type}
              title={insight.title}
              message={insight.message}
              actions={insight.actions}
            />
          ))
        )}
      </div>
    </div>
  );
}
