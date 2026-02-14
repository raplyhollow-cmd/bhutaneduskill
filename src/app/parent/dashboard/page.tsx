/**
 * PARENT DASHBOARD PAGE (WITH AI INSIGHTS)
 *
 * Key features:
 * - Multi-child selection
 * - Child progress overview with AI insights
 * - Fee payment alerts
 * - Communication with teachers
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  BookOpen,
  GraduationCap,
  Calendar,
  Bell,
  TrendingUp,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Clock,
  Mail,
  Phone,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { AIInsightCard } from "@/components/ai/ai-insight-card";

interface Child {
  id: string;
  firstName: string;
  lastName: string;
  classGrade: number;
  className: string;
  section: string;
  attendance: number;
  homeworkPending: number;
  recentGrades: Array<{
    id: string;
    subject: string;
    grade: string;
    date: string;
  }>;
  careerInterests?: string[];
  feeStatus?: {
    amountPaid: number;
    amountPending: number;
  };
}

interface ParentStats {
  totalChildren: number;
  totalMessages: number;
  pendingFees: number;
  upcomingMeetings: number;
}

export default function ParentDashboardPage() {
  const router = useRouter();
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<ParentStats | null>(null);

  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const fetchParentData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [profileRes, dashboardRes] = await Promise.all([
          fetch("/api/user/profile"),
          fetch("/api/parent/dashboard"),
        ]);

        if (!profileRes.ok) {
          throw new Error("Failed to fetch profile");
        }

        const profileData = await profileRes.json();
        const dashboardData = await dashboardRes.json();

        // Set children from dashboard API
        if (dashboardData.children && Array.isArray(dashboardData.children)) {
          setChildren(dashboardData.children);
          // Auto-select first child if none selected
          if (!selectedChildId && dashboardData.children.length > 0) {
            setSelectedChildId(dashboardData.children[0].id);
          }
        } else {
          setChildren([]);
        }

        // Use real stats from dashboard API response
        // The API now returns actual data instead of hardcoded values
        setStats({
          totalChildren: dashboardData.children?.length || 0,
          totalMessages: dashboardData.stats?.totalMessages || 0,
          pendingFees: dashboardData.children?.filter((c: Child) => c.feeStatus?.amountPending > 0).length || 0,
          upcomingMeetings: dashboardData.stats?.upcomingMeetings || 0,
        });

      } catch (err) {
        console.error("Error fetching parent data:", err);
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchParentData();
  }, []);

  // Selected child data
  const selectedChild = children.find((c) => c.id === selectedChildId);

  // Generate AI insights based on child data
  const generateAIInsights = (child: Child) => {
    const insights = [];

    if (child.attendance < 75) {
      insights.push({
        type: "warning" as const,
        title: "Attendance Alert",
        message: `${child.firstName}'s attendance is ${child.attendance}%. Consider discussing with their teachers to identify any challenges.`,
        actions: [{ label: "View Attendance", href: "/parent/attendance" }],
      });
    } else if (child.attendance >= 90) {
      insights.push({
        type: "success" as const,
        title: "Excellent Attendance!",
        message: `${child.firstName} has maintained ${child.attendance}% attendance. Keep up the great work!`,
        actions: [],
      });
    }

    if (child.homeworkPending > 3) {
      insights.push({
        type: "warning" as const,
        title: "Homework Pending",
        message: `${child.homeworkPending} homework assignments are pending. Encourage ${child.firstName} to complete them on time.`,
        actions: [{ label: "View Homework", href: "/parent/homework" }],
      });
    }

    if (child.feeStatus?.amountPending > 0) {
      insights.push({
        type: "warning" as const,
        title: "Fee Payment Reminder",
        message: `You have Nu. ${child.feeStatus.amountPending} pending in fees. Please clear dues to avoid late fees.`,
        actions: [{ label: "Pay Fees", href: "/parent/fees/pay" }],
      });
    }

    if (child.recentGrades && child.recentGrades.length > 0) {
      const recentGrades = child.recentGrades.slice(0, 3);
      const avgGrade = recentGrades.reduce((sum, g) => {
        const gradeMap: Record<string, number> = { "A+": 4.3, "A": 4.0, "B+": 3.7, "B": 3.3, "C+": 3.0, "C": 2.7, "D+": 2.3, "D": 2.0, "E": 1.7, "F": 1.3 };
        const gradePoints = gradeMap[g.grade] || 0;
        return sum + gradePoints;
      }, 0) / recentGrades.length;

      const avgGradePoint = avgGrade / recentGrades.length;

      // Determine grade label
      let gradeLabel = "";
      if (avgGradePoint >= 4.0) gradeLabel = "Excellent (A+)";
      else if (avgGradePoint >= 3.7) gradeLabel = "Very Good (A)";
      else if (avgGradePoint >= 3.3) gradeLabel = "Good (B+)";
      else if (avgGradePoint >= 2.7) gradeLabel = "Satisfactory (B)";
      else gradeLabel = "Needs Improvement";

      insights.push({
        type: avgGradePoint >= 3.7 ? "success" : "info",
        title: "Academic Performance",
        message: `${child.firstName}'s recent performance: ${gradeLabel}. Recent grades in ${recentGrades.map((g) => g.subject).join(", ")}.`,
        actions: [{ label: "View Progress", href: "/parent/progress" }],
      });
    }

    if (child.careerInterests && child.careerInterests.length > 0) {
      insights.push({
        type: "tip" as const,
        title: "Career Guidance",
        message: `${child.firstName} has shown interest in: ${child.careerInterests.slice(0, 2).join(", ")}. Consider exploring careers in these areas.`,
        actions: [{ label: "Career Plan", href: "/parent/careers" }],
      });
    }

    if (insights.length === 0) {
      insights.push({
        type: "info" as const,
        title: "Getting Started",
        message: `Encourage ${child.firstName} to take career assessments to discover their interests and strengths.`,
        actions: [{ label: "View Assessments", href: "/assessments" }],
      });
    }

    return insights;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-gray-600" />
            <p className="ml-3 text-gray-600">Loading dashboard...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-16 text-center">
            <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-red-900 mb-2">Error Loading Dashboard</h2>
            <p className="text-red-700">{error}</p>
            <Button onClick={() => window.location.reload()} className="mt-4">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!selectedChild || children.length === 0) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="py-16 text-center">
            <Users className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">No Children Found</h2>
            <p className="text-gray-500 mb-6">
              You don't have any children linked to your account yet.
              Please contact school administration to link your children.
            </p>
            <Link href="/contact">
              <Button className="bg-gray-600 hover:bg-gray-700">Contact School</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const aiInsights = selectedChild ? generateAIInsights(selectedChild) : [];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <Card
        style={{ background: "linear-gradient(135deg, rgb(75 255 246) 0%, rgb(107 114 128) 100%)" }}
        className="text-white border-0"
      >
        <CardContent className="pt-6">
          <h1 className="text-3xl font-bold mb-1">
            Welcome back, {selectedChild.firstName} {selectedChild.lastName}!
          </h1>
          <p className="text-orange-50">
            Here's what's happening with {selectedChild.firstName}'s education journey
          </p>
        </CardContent>
      </Card>

      {/* Multi-child Selector */}
      {children.length > 1 && (
        <div className="flex items-center gap-4 overflow-x-auto pb-4">
          <Badge className="bg-gray-100 text-gray-700 px-3 py-1.5 whitespace-nowrap">
            {children.length} Children
          </Badge>
          <span className="text-sm text-gray-500">
            Select a child to view their details
          </span>
        </div>
      )}

      {/* AI Insights Section */}
      <div className="grid md:grid-cols-2 gap-4">
        {aiInsights.map((insight, index) => (
          <AIInsightCard
            key={index}
            type={insight.type}
            title={insight.title}
            message={insight.message}
            actions={insight.actions}
          />
        ))}
      </div>

      {/* Quick Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-gray-500 flex items-center gap-2">
              <Users className="w-3 h-3" />
              Children
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {stats?.totalChildren || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-gray-500 flex items-center gap-2">
              <BookOpen className="w-3 h-3" />
              Classes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {selectedChild.classGrade} - {selectedChild.section}
            </div>
            <p className="text-xs text-gray-500">Current class</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-gray-500 flex items-center gap-2">
              <TrendingUp className="w-3 h-3" />
              Attendance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {selectedChild.attendance}%
            </div>
            <p className="text-xs text-gray-500">This semester</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-gray-500 flex items-center gap-2">
              <DollarSign className="w-3 h-3" />
              Fees
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {selectedChild.feeStatus?.amountPaid || 0}
            </div>
            <p className="text-xs text-gray-500">Paid this term</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Grades */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Grades</CardTitle>
            <Button variant="outline" size="sm" asChild>
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {selectedChild.recentGrades && selectedChild.recentGrades.length > 0 ? (
            <div className="space-y-3">
              {selectedChild.recentGrades.slice(0, 5).map((grade) => {
                const gradeColorMap: Record<string, string> = {
                  "A+": "bg-green-100 text-green-700",
                  "A": "bg-green-100 text-green-700",
                  "B+": "bg-blue-100 text-blue-700",
                  "B": "bg-blue-100 text-blue-700",
                  "C+": "bg-yellow-100 text-yellow-700",
                  "C": "bg-orange-100 text-orange-700",
                  "D+": "bg-orange-100 text-orange-700",
                  "D": "bg-red-100 text-red-700",
                  "E": "bg-red-100 text-red-700",
                  "F": "bg-red-100 text-red-700",
                };
                const gradeColor = gradeColorMap[grade.grade] || "bg-gray-100 text-gray-700";

                return (
                  <div
                    key={grade.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{grade.subject}</p>
                      <p className="text-sm text-gray-500">{grade.date}</p>
                    </div>
                    <Badge className={gradeColor}>
                      {grade.grade}
                    </Badge>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No recent grades available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" asChild className="w-full">
              <Mail className="w-4 h-4 mb-2" />
              <div>
                <p className="font-medium">Messages</p>
                <p className="text-xs text-gray-500">Contact teachers</p>
              </div>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Calendar className="w-4 h-4 mb-2" />
              <div>
                <p className="font-medium">Schedule</p>
                <p className="text-xs text-gray-500">View calendar</p>
              </div>
            </Button>
            <Button variant="outline" asChild className="w-full" style={{ background: "linear-gradient(135deg, rgb(249 115 22) 0%, rgb(194 65 12) 100%)" }}>
              <DollarSign className="w-4 h-4 mr-2 text-white" />
              <div>
                <p className="font-medium text-white">Pay Fees</p>
                <p className="text-xs text-orange-50">Pay online</p>
              </div>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <GraduationCap className="w-4 h-4 mb-2" />
              <div>
                <p className="font-medium">Progress</p>
                <p className="text-xs text-gray-500">View detailed</p>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Events */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Events</CardTitle>
          <CardDescription>
            School events and meetings for {selectedChild.firstName}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                <Calendar className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">Parent-Teacher Meeting</p>
                <p className="text-sm text-gray-500">
                  March 25, 2025 · 3:00 PM
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                <Bell className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">Mid-Term Results</p>
                <p className="text-sm text-gray-500">
                  Expected: March 30, 2025
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
