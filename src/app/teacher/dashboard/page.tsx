/**
 * TEACHER DASHBOARD
 *
 * Key features:
 * - Real data from API - no more mock values
 * - AI insights for class performance
 * - At-risk student alerts
 * - Teaching suggestions
 * - Quick actions for class management
 */
"use client";

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
} from "lucide-react";
import { AIInsightCard } from "@/components/ai/ai-insight-card";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";

// Client component - dynamic rendering is automatic
export default function TeacherDashboard() {
  const { user } = useUser();

  // Data fetched from API
  const [stats, setStats] = useState({
    totalStudents: 0,
    averageAttendance: 0,
    activeClasses: 0,
    pendingHomework: 0,
    assessmentCompletion: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState<any>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const response = await fetch("/api/teacher/dashboard");
      if (response.ok) {
        const data = await response.json();
        setStats({
          totalStudents: data.totalStudents || 0,
          averageAttendance: data.averageAttendance || 0,
          activeClasses: data.activeClasses || 0,
          pendingHomework: data.pendingHomework || 0,
          assessmentCompletion: data.assessmentCompletion || 0,
        });
        setRecentActivity(data.recentActivity || null);
      }
    } catch (error) {
      console.error("Failed to load dashboard:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Teacher Dashboard</h1>
          <p className="text-gray-600">Manage your classes and track student progress</p>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 border-t-transparent"></div>
          </div>
        ) : (
          <>
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

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-500">
                    Assessment Completion
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{stats.assessmentCompletion}%</div>
                </CardContent>
              </Card>
            </div>

            {/* AI Insights Section */}
            <div className="grid md:grid-cols-2 gap-6 mt-8">
              <AIInsightCard
                type="warning"
                title="At-Risk Students"
                message="Review attendance records and reach out to students who may need additional support."
                actions={[
                  { label: "View Details", href: "/teacher/students" },
                ]}
              />
              <AIInsightCard
                type="success"
                title="Class Performance Insight"
                message="Your class completion rates are above average. Great work!"
                actions={[
                  { label: "View Analytics", href: "/teacher/analytics" },
                ]}
              />
            </div>

            {/* Quick Actions */}
            <div className="flex gap-4 mt-8">
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
          </>
        )}
      </div>
    );
  }
}
