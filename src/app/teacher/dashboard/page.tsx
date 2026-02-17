"use client";

/**
 * TEACHER DASHBOARD
 *
 * Key features:
 * - Real data from API - no more mock values
 * - AI insights for class performance (fetched from /api/ai/insights)
 * - At-risk student alerts
 * - Teaching suggestions
 * - Quick actions for class management
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  BookOpen,
  Calendar,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { AIInsightCard } from "@/components/ai/ai-insight-card";
import Link from "next/link";

interface TeacherStats {
  totalStudents: number;
  averageAttendance: number;
  activeClasses: number;
  pendingHomework: number;
  assessmentCompletion: number;
  atRiskStudents?: number;
  averageScore?: number;
}

interface AIInsight {
  type: "warning" | "success" | "info" | "tip";
  title: string;
  message: string;
  actions?: Array<{ label: string; href: string }>;
}

// Client component - dynamic rendering is automatic
export default function TeacherDashboard() {
  // Data fetched from API
  const [stats, setStats] = useState<TeacherStats>({
    totalStudents: 0,
    averageAttendance: 0,
    activeClasses: 0,
    pendingHomework: 0,
    assessmentCompletion: 0,
    atRiskStudents: 0,
    averageScore: 0,
  });
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingInsights, setIsLoadingInsights] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load dashboard stats
      const response = await fetch("/api/teacher/dashboard");
      if (response.ok) {
        const data = await response.json();
        setStats({
          totalStudents: data.totalStudents || 0,
          averageAttendance: data.averageAttendance || 0,
          activeClasses: data.activeClasses || 0,
          pendingHomework: data.pendingHomework || 0,
          assessmentCompletion: data.assessmentCompletion || 0,
          atRiskStudents: data.atRiskStudents || 0,
          averageScore: data.averageScore || 0,
        });
      }

      // Load AI insights
      await loadAIInsights();
    } catch (error) {
      console.error("Failed to load dashboard:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAIInsights = async () => {
    try {
      setIsLoadingInsights(true);
      const response = await fetch("/api/ai/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userRole: "teacher",
          contextData: {
            stats,
          },
        }),
      });

      // Log for debugging
      console.log("[Teacher Dashboard] AI Insights API status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("[Teacher Dashboard] AI Insights received:", data.insights?.length || 0, "insights");
        setAiInsights(data.insights || []);
      } else {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        console.error("[Teacher Dashboard] AI Insights API error:", errorData);
        setAiInsights([]);
      }
    } catch (error) {
      console.error("[Teacher Dashboard] Failed to load AI insights:", error);
      setAiInsights([]);
    } finally {
      setIsLoadingInsights(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  // Use AI insights from API, or fallback to static insights if API failed
  const insightsToShow = aiInsights.length > 0 ? aiInsights : [
    {
      type: "info" as const,
      title: "Dashboard Overview",
      message: `You have ${stats.totalStudents} students across ${stats.activeClasses} classes. Track attendance and homework to monitor student progress.`,
      actions: [{ label: "View Students", href: "/teacher/students" }],
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Teacher Dashboard</h1>
        <p className="text-gray-600">Manage your classes and track student progress</p>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">
              Total Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.totalStudents}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">
              Active Classes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.activeClasses}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">
              Pending Homework
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.pendingHomework}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">
              Avg Attendance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.averageAttendance}%</div>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights Section - Dynamic from API */}
      <div className="grid md:grid-cols-2 gap-6">
        {isLoadingInsights ? (
          <>
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </CardContent>
            </Card>
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

      {/* Quick Actions */}
      <div className="flex gap-4 flex-wrap">
        <Button variant="outline" asChild>
          <Link href="/teacher/students">
            <Users className="w-4 h-4 mr-2" />
            Manage Students
          </Link>
        </Button>
        <Button asChild>
          <Link href="/teacher/homework">
            <BookOpen className="w-4 h-4 mr-2" />
            Create Homework
          </Link>
        </Button>
        <Button asChild>
          <Link href="/teacher/schedule">
            <Calendar className="w-4 h-4 mr-2" />
            View Schedule
          </Link>
        </Button>
      </div>
    </div>
  );
}
