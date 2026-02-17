"use client";

import { logger } from "@/lib/logger";
/**
 * AI Insights Section for School Admin Dashboard
 *
 * Client component that fetches personalized AI insights from /api/ai/insights
 * and displays them using the AIInsightCard component.
 */


import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Loader2 } from "lucide-react";
import { AIInsightCard, type AIInsightCardProps } from "@/components/ai/ai-insight-card";

interface SchoolStats {
  pendingFees: number;
  pendingAttendance: number;
  totalStudents: number;
  totalTeachers: number;
  totalRevenue: number;
  totalClasses: number;
}

interface AIInsightResponse {
  success: boolean;
  insights?: Array<{
    type: "warning" | "success" | "info" | "tip";
    title: string;
    message: string;
    actions?: Array<{ label: string; href: string }>;
  }>;
  error?: string;
}

interface AIInsightsSectionProps {
  stats: SchoolStats;
}

export function AIInsightsSection({ stats }: AIInsightsSectionProps) {
  const [insights, setInsights] = useState<AIInsightCardProps[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Calculate derived stats for the API
  const teacherStudentRatio = stats.totalTeachers > 0
    ? Math.round(stats.totalStudents / stats.totalTeachers)
    : 25;

  const revenuePercentage = stats.totalRevenue > 0
    ? Math.min(100, Math.round((stats.totalRevenue / (stats.totalStudents * 5000)) * 100))
    : 85;

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/ai/insights", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userRole: "school-admin",
            contextData: {
              stats: {
                pendingFees: stats.pendingFees,
                pendingAttendance: stats.pendingAttendance,
                totalStudents: stats.totalStudents,
                totalTeachers: stats.totalTeachers,
                totalClasses: stats.totalClasses,
                revenuePercentage,
                teacherStudentRatio,
              }
            }
          })
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data: AIInsightResponse = await response.json();

        if (data.success && data.insights) {
          setInsights(data.insights);
        } else if (data.error) {
          setError(data.error);
        }
      } catch (err) {
        logger.error("Failed to fetch AI insights:", err);
        setError("Unable to load insights. Using fallback insights.");
        // Set fallback insights on error
        setFallbackInsights();
      } finally {
        setLoading(false);
      }
    };

    fetchInsights();
  }, [stats]);

  const setFallbackInsights = () => {
    setInsights([
      {
        type: "warning",
        title: "Pending Actions Alert",
        message: `${stats.pendingAttendance} classes need attendance marked and ${stats.pendingFees} students have pending fees. Address these to maintain accurate records.`,
        actions: [
          { label: "Mark Attendance", href: "/school-admin/attendance" },
          { label: "View Fees", href: "/school-admin/fees" },
        ],
      },
      {
        type: "success",
        title: "School Performance Strong",
        message: `Revenue collection at ${revenuePercentage}%. ${stats.totalStudents} students enrolled with ${stats.totalTeachers} teachers active. Teacher-student ratio is 1:${teacherStudentRatio}.`,
        actions: [
          { label: "View Reports", href: "/school-admin/reports" },
        ],
      },
      {
        type: "tip",
        title: "AI Suggestion",
        message: "Teacher-to-student ratio is optimal. Consider introducing AI-powered analytics for tracking student progress and early intervention.",
        actions: [
          { label: "Explore Features", href: "/school-admin/analytics" },
        ],
      },
    ]);
  };

  if (loading) {
    return (
      <div className="grid md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="border-2 border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                </div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded animate-pulse mb-2 w-3/4" />
                  <div className="h-3 bg-gray-100 rounded animate-pulse w-full" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error && insights.length === 0) {
    return (
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="border-2 border-orange-200 bg-orange-50 md:col-span-3">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-orange-500" />
              <p className="text-sm text-orange-700">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-3 gap-4">
      {insights.length > 0 ? (
        insights.map((insight, index) => (
          <AIInsightCard key={`insight-${index}`} {...insight} />
        ))
      ) : (
        <Card className="border-2 border-gray-200 md:col-span-3">
          <CardContent className="p-4">
            <p className="text-sm text-gray-500 text-center">No insights available at this time.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
