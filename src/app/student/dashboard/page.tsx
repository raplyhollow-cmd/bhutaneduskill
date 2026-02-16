/**
 * STUDENT DASHBOARD
 *
 * Key features:
 * - Welcome banner with student name
 * - Quick stats (assessments, career matches, goals, XP)
 * - Recommended next steps
 * - Upcoming deadlines
 * - Recent activity
 *
 * Now using real database data via server actions.
 */

import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ClipboardCheck,
  Briefcase,
  Target,
  TrendingUp,
  BookOpen,
  Calendar,
  Sparkles,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { fetchStudentDashboard } from "../_actions";
import { Skeleton } from "@/components/ui/skeleton";
import { AIInsightCard } from "@/components/ai/ai-insight-card";

// Force dynamic rendering - this page uses server actions that require headers
export const dynamic = 'force-dynamic';

// Loading component
function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <Card className="border-0">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-4 w-96" />
            </div>
            <Skeleton className="w-16 h-16 rounded-full" />
          </div>
        </CardContent>
      </Card>
      <div className="grid md:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-3">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Calculate XP based on achievements
function calculateXP(
  completedAssessments: number,
  homeworkGraded: number,
  attendanceRate: number,
  modulesCompleted: number
): { xp: number; level: number; progress: number } {
  const assessmentXP = completedAssessments * 50;
  const homeworkXP = homeworkGraded * 25;
  const attendanceXP = Math.floor(attendanceRate * 2);
  const moduleXP = modulesCompleted * 100;

  const totalXP = assessmentXP + homeworkXP + attendanceXP + moduleXP;
  const level = Math.floor(totalXP / 500) + 1;
  const xpInLevel = totalXP % 500;
  const progress = Math.round((xpInLevel / 500) * 100);

  return { xp: totalXP, level, progress };
}

// Get urgency badge style
function getUrgencyBadge(urgency: "high" | "medium" | "low") {
  switch (urgency) {
    case "high":
      return "bg-red-100 text-red-700";
    case "medium":
      return "bg-yellow-100 text-yellow-700";
    case "low":
      return "bg-gray-100 text-gray-600";
  }
}

// Format date relative to today
function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays <= 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
}

export default async function StudentDashboardPage() {
  let dashboardData;
  try {
    dashboardData = await fetchStudentDashboard();
  } catch (error) {
    // Don't redirect - show error page instead
    console.error("Dashboard error:", error);
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md mx-4">
          <CardHeader>
            <CardTitle className="text-red-600">Dashboard Error</CardTitle>
            <CardDescription>
              There was a problem loading your dashboard. Please try refreshing the page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/student">Reload Page</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { student, homework, assessments, attendance, achievements, deadlines, careerMatches, fees } = dashboardData;

  // Calculate XP
  const modulesCompleted = achievements.filter(a => a.type === "module").length;
  const { xp, level, progress: xpProgress } = calculateXP(
    assessments.completed,
    homework.graded,
    attendance.rate,
    modulesCompleted
  );

  // Determine recommended actions based on actual data
  const recommendedActions = [];

  // Assessment recommendation
  if (assessments.completed < 3) {
    const pendingAssessments = ["RIASEC", "DISC", "MBTI", "Work Values", "Learning Styles"].slice(assessments.completed);
    recommendedActions.push({
      id: "assessment",
      title: `Complete ${pendingAssessments[0] || "Career"} Assessment`,
      description: "Discover your strengths and interests",
      icon: ClipboardCheck,
      iconBg: "bg-orange-100",
      iconColor: "text-orange-600",
      badge: assessments.completed === 0 ? "Start Here" : "Recommended",
      badgeColor: "bg-orange-100 text-orange-700",
      link: "/dashboard/assessment",
    });
  }

  // Career plan recommendation
  if (assessments.completed >= 1) {
    recommendedActions.push({
      id: "plan",
      title: "Update Your Career Plan",
      description: "Set goals based on your assessment results",
      icon: Target,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      badge: "Update",
      badgeColor: "bg-blue-100 text-blue-700",
      link: "/student/plan",
    });
  }

  // Pending homework recommendation
  if (homework.pending > 0) {
    recommendedActions.push({
      id: "homework",
      title: `${homework.pending} Homework Assignment${homework.pending > 1 ? "s" : ""} Pending`,
      description: "Stay on top of your assignments",
      icon: BookOpen,
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
      badge: `${homework.pending} Pending`,
      badgeColor: "bg-amber-100 text-amber-700",
      link: "/student/homework",
    });
  }

  // Explore colleges recommendation
  if (assessments.completed >= 2) {
    recommendedActions.push({
      id: "colleges",
      title: "Explore RUB Colleges",
      description: "Find programs that match your profile",
      icon: Briefcase,
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
      badge: "Explore",
      badgeColor: "bg-purple-100 text-purple-700",
      link: "/student/rub",
    });
  }

  // Fee reminder
  if (fees && fees.amountPending > 0 && fees.dueDate) {
    const dueDate = new Date(fees.dueDate);
    const daysUntil = Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysUntil <= 14) {
      recommendedActions.push({
        id: "fees",
        title: `Fee Payment Due (${daysUntil} ${daysUntil === 1 ? "day" : "days"} left)`,
        description: `Nu. ${fees.amountPending} pending`,
        icon: AlertCircle,
        iconBg: "bg-red-100",
        iconColor: "text-red-600",
        badge: "Action Needed",
        badgeColor: "bg-red-100 text-red-700",
        link: "/student/fees",
      });
    }
  }

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <Card style={{ background: 'linear-gradient(135deg, rgb(249 115 22) 0%, rgb(194 65 12) 100%)' }} className="text-white border-0">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Welcome back, {student.firstName}!
              </h1>
              <p className="text-orange-50">
                {student.className ? `Class ${student.classGrade}${student.section ? " " + student.section : ""}` : "Student"} • Continue your career exploration journey
              </p>
            </div>
            <Sparkles className="w-16 h-16 text-orange-200 opacity-50" />
          </div>
        </CardContent>
      </Card>

      {/* AI Insights Section */}
      <div className="grid md:grid-cols-3 gap-4">
        <AIInsightCard
          type="tip"
          title="AI Career Insight"
          message={assessments.completed >= 1
            ? `Based on your ${assessments.completed} assessment${assessments.completed > 1 ? "s" : ""}, you show strong potential in ${careerMatches.topMatches > 0 ? "analytical and creative fields." : "exploring new paths."}`
            : "Complete your first assessment to unlock personalized AI career insights!"}
          actions={assessments.completed >= 1 ? [
            { label: "View Careers", href: "/dashboard/careers" }
          ] : [
            { label: "Take Assessment", href: "/dashboard/assessment/riasec" }
          ]}
        />

        <AIInsightCard
          type="info"
          title="Study Recommendation"
          message={homework.pending > 0
            ? `You have ${homework.pending} pending assignment${homework.pending > 1 ? "s" : ""}. Focus on completing them this weekend for better grades.`
            : "All caught up! Keep up the great work on your studies."}
          actions={homework.pending > 0 ? [
            { label: "View Homework", href: "/student/homework" }
          ] : []}
        />

        <AIInsightCard
          type="success"
          title="Attendance Goal"
          message={attendance.rate >= 80
            ? `Excellent! Your ${attendance.rate}% attendance rate shows great dedication. Keep it up!`
            : `Your attendance is ${attendance.rate}%. Aim for 85%+ to qualify for perfect attendance awards.`}
          actions={attendance.rate < 85 ? [
            { label: "View Calendar", href: "/student/attendance" }
          ] : []}
        />
      </div>

      {/* Quick Stats */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4" />
              Assessments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {assessments.completed}/5
            </div>
            <p className="text-xs text-gray-500 mt-1">Completed</p>
            <Progress value={assessments.total > 0 ? (assessments.completed / assessments.total) * 100 : 0} className="h-2 mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              Career Matches
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {careerMatches.topMatches > 0 ? careerMatches.topMatches : careerMatches.totalMatches}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {careerMatches.topMatches > 0 ? "Top matches" : "Complete assessment"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Target className="w-4 h-4" />
              Homework
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {homework.submitted}/{homework.total}
            </div>
            <p className="text-xs text-gray-500 mt-1">Submitted</p>
            <Progress value={homework.total > 0 ? (homework.submitted / homework.total) * 100 : 0} className="h-2 mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              XP Points
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{xp.toLocaleString()}</div>
            <p className="text-xs text-gray-500 mt-1">Level {level}</p>
            <Progress value={xpProgress} className="h-2 mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Attendance & Fee Status Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Attendance Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Attendance Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20">
                <svg className="w-20 h-20 transform -rotate-90">
                  <circle
                    cx="40"
                    cy="40"
                    r="36"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-gray-200"
                  />
                  <circle
                    cx="40"
                    cy="40"
                    r="36"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${attendance.rate * 2.26} 226`}
                    className={attendance.rate >= 80 ? "text-green-500" : attendance.rate >= 60 ? "text-yellow-500" : "text-red-500"}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold">{attendance.rate}%</span>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600">
                  <span className="font-medium text-green-600">{attendance.presentDays} present</span> out of {attendance.totalDays} days
                </p>
                <p className="text-xs text-gray-500 mt-1">Last 30 days</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fee Status Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              Fee Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {fees ? (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Amount:</span>
                  <span className="font-medium">Nu. {fees.totalAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Amount Paid:</span>
                  <span className="font-medium text-green-600">Nu. {fees.amountPaid.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Pending:</span>
                  <span className={`font-medium ${fees.amountPending > 0 ? "text-orange-600" : "text-green-600"}`}>
                    Nu. {fees.amountPending.toLocaleString()}
                  </span>
                </div>
                <div className="pt-2">
                  <Badge
                    className={
                      fees.status === "paid"
                        ? "bg-green-100 text-green-700"
                        : fees.status === "partial"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-red-100 text-red-700"
                    }
                  >
                    {fees.status === "paid" ? "Paid" : fees.status === "partial" ? "Partial Payment" : "Pending"}
                  </Badge>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">No fee information available</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recommended Actions */}
      {recommendedActions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recommended Next Steps</CardTitle>
            <CardDescription>Personalized based on your progress</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recommendedActions.slice(0, 4).map((action) => (
              <div
                key={action.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 ${action.iconBg} rounded-full flex items-center justify-center`}>
                    <action.icon className={`w-5 h-5 ${action.iconColor}`} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{action.title}</p>
                    <p className="text-sm text-gray-500">{action.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={action.badgeColor}>{action.badge}</Badge>
                  <Button size="sm" variant="outline" asChild>
                    <Link href={action.link}>
                      {action.id === "homework" || action.id === "fees" ? "View" : action.badge}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Upcoming Deadlines & Recent Activity */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Upcoming Deadlines */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Upcoming Deadlines
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {deadlines.length > 0 ? (
              deadlines.slice(0, 5).map((deadline) => (
                <div
                  key={deadline.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{deadline.title}</p>
                    <p className="text-sm text-gray-500">{deadline.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getUrgencyBadge(deadline.urgency)} variant="outline">
                      {deadline.daysUntil === 0 ? "Today" : deadline.daysUntil === 1 ? "Tomorrow" : `${deadline.daysUntil} days`}
                    </Badge>
                    <Button size="sm" variant="ghost" asChild>
                      <Link href={deadline.link}>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-gray-500">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No upcoming deadlines</p>
                <p className="text-sm">You're all caught up!</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {achievements.length > 0 ? (
              achievements.map((achievement) => {
                const IconComponent =
                  achievement.type === "assessment"
                    ? ClipboardCheck
                    : achievement.type === "homework"
                    ? BookOpen
                    : achievement.type === "module"
                    ? CheckCircle2
                    : Calendar;

                const iconColor =
                  achievement.type === "assessment"
                    ? "bg-green-100 text-green-600"
                    : achievement.type === "homework"
                    ? "bg-blue-100 text-blue-600"
                    : achievement.type === "module"
                    ? "bg-purple-100 text-purple-600"
                    : "bg-gray-100 text-gray-600";

                return (
                  <div key={achievement.id} className="flex items-center gap-3 text-sm">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${iconColor}`}>
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-900">{achievement.title}</p>
                      <p className="text-xs text-gray-500">{achievement.description}</p>
                    </div>
                    <span className="text-gray-500 text-xs whitespace-nowrap">
                      {formatRelativeDate(achievement.date)}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-6 text-gray-500">
                <p>No recent activity</p>
                <p className="text-sm">Start by completing an assessment!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Access Grid */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Access</h2>
        <div className="grid md:grid-cols-4 gap-4">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link href="/student/homework">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-medium">Homework</p>
                    <p className="text-xs text-gray-500">
                      {homework.pending} pending
                    </p>
                  </div>
                </div>
              </CardContent>
            </Link>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link href="/student/learning">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Briefcase className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">Learning</p>
                    <p className="text-xs text-gray-500">Modules & courses</p>
                  </div>
                </div>
              </CardContent>
            </Link>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link href="/student/attendance">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">Attendance</p>
                    <p className="text-xs text-gray-500">{attendance.rate}% rate</p>
                  </div>
                </div>
              </CardContent>
            </Link>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link href="/student/results">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium">Results</p>
                    <p className="text-xs text-gray-500">View grades</p>
                  </div>
                </div>
              </CardContent>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
