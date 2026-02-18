/**
 * STUDENT DASHBOARD
 *
 * Key features:
 * - Welcome banner with student name
 * - Quick stats (assessments, career matches, goals, XP)
 * - Recommended next steps
 * - Upcoming deadlines
 * - Recent activity
 * Now using real database data via server actions.
 */

"use client";

import { logger } from "@/lib/logger";
import { useEffect, useState } from "react";
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
import { StudentAIInsights } from "./ai-insights-wrapper";
import { AssessmentProfileCard } from "@/components/student/assessment-profile-card";
import type { StudentDashboardData } from "@/lib/api/student";

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

export default function StudentDashboardPage() {
  const [dashboardData, setDashboardData] = useState<StudentDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        const data = await fetchStudentDashboard();
        if (mounted) {
          setDashboardData(data);
          setIsLoading(false);
        }
      } catch (err) {
        if (mounted) {
          logger.error("Dashboard error:", err);
          setError("Failed to load dashboard");
          setIsLoading(false);
        }
      }
    }

    loadData();

    return () => {
      mounted = false;
    };
  }, []);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (error || !dashboardData) {
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
      link: "/student/assessment",
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

      {/* AI Insights Section - Dynamic from API */}
      <StudentAIInsights
        dashboardData={{
          assessments,
          homework,
          attendance,
          careerMatches,
          fees,
        }}
      />

      {/* Quick Stats */}
      <div className="grid md:grid-cols-4 gap-6">
        {/* Assessments Completed */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4" />
              Assessments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{assessments.completed}/5</div>
            <p className="text-xs text-gray-500 mt-1">Career assessments</p>
            {assessments.completed < 5 && (
              <Link href="/student/assessment" className="text-xs text-orange-600 hover:underline mt-2 inline-block">
                Complete more →
              </Link>
            )}
          </CardContent>
        </Card>

        {/* Career Matches */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              Career Matches
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{careerMatches.totalMatches}</div>
            <p className="text-xs text-gray-500 mt-1">
              {careerMatches.topMatches > 0 ? `${careerMatches.topMatches} top matches` : "Based on your profile"}
            </p>
            {careerMatches.totalMatches > 0 && (
              <Link href="/student/careers" className="text-xs text-orange-600 hover:underline mt-2 inline-block">
                View careers →
              </Link>
            )}
          </CardContent>
        </Card>

        {/* Goals Set */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Target className="w-4 h-4" />
              Active Goals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{assessments.completed >= 1 ? "3" : "0"}</div>
            <p className="text-xs text-gray-500 mt-1">
              {assessments.completed >= 1 ? "Short-term goals set" : "Complete assessment first"}
            </p>
            {assessments.completed >= 1 && (
              <Link href="/student/plan" className="text-xs text-orange-600 hover:underline mt-2 inline-block">
                Update goals →
              </Link>
            )}
          </CardContent>
        </Card>

        {/* XP & Level */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Your Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2">
              <div className="text-2xl font-bold text-gray-900">Level {level}</div>
              <div className="text-sm text-gray-500 mb-1">{xp} XP</div>
            </div>
            <Progress value={xpProgress} className="h-2 mt-2" />
            <p className="text-xs text-gray-500 mt-1">{xpProgress}% to Level {level + 1}</p>
          </CardContent>
        </Card>
      </div>

      {/* Recommended Next Steps */}
      {recommendedActions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recommended for You</CardTitle>
            <CardDescription>Personalized next steps based on your progress</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recommendedActions.slice(0, 4).map((action) => (
                <Link key={action.id} href={action.link}>
                  <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-orange-300 hover:bg-orange-50/50 transition-colors cursor-pointer group">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full ${action.iconBg} flex items-center justify-center`}>
                        <action.icon className={`w-5 h-5 ${action.iconColor}`} />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 flex items-center gap-2">
                          {action.title}
                          <Badge className={action.badgeColor}>{action.badge}</Badge>
                        </div>
                        <div className="text-sm text-gray-500">{action.description}</div>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-orange-600 transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Assessment Profile Card */}
      {assessments.completed >= 1 && (
        <AssessmentProfileCard />
      )}

      {/* Upcoming Deadlines */}
      {deadlines.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Upcoming Deadlines
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {deadlines.slice(0, 5).map((deadline) => (
                <div key={deadline.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      deadline.urgency === "high" ? "bg-red-500" :
                      deadline.urgency === "medium" ? "bg-yellow-500" :
                      "bg-green-500"
                    }`} />
                    <div>
                      <div className="font-medium text-gray-900">{deadline.title}</div>
                      <div className="text-sm text-gray-500">{deadline.type}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={getUrgencyBadge(deadline.urgency)}>
                      {deadline.urgency === "high" ? "Due Soon" :
                       deadline.urgency === "medium" ? "This Week" : "Upcoming"}
                    </Badge>
                    <div className="text-sm text-gray-600 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatRelativeDate(deadline.dueDate)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Achievements */}
      {achievements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              Recent Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-3">
              {achievements.slice(0, 6).map((achievement) => (
                <div key={achievement.id} className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100">
                  <div className={`w-10 h-10 rounded-full ${
                    achievement.type === "assessment" ? "bg-purple-100" :
                    achievement.type === "module" ? "bg-green-100" :
                    "bg-blue-100"
                  } flex items-center justify-center`}>
                    {achievement.type === "assessment" ? (
                      <ClipboardCheck className="w-5 h-5 text-purple-600" />
                    ) : achievement.type === "module" ? (
                      <BookOpen className="w-5 h-5 text-green-600" />
                    ) : (
                      <TrendingUp className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{achievement.title}</div>
                    <div className="text-xs text-gray-500">{formatRelativeDate(achievement.date)}</div>
                  </div>
                  <Badge className="bg-orange-100 text-orange-700">
                    {achievement.type === "assessment" ? "+50 XP" :
                     achievement.type === "module" ? "+100 XP" : "+25 XP"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
