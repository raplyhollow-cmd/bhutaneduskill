/**
 * STUDENT DASHBOARD - Bubble/Gemini Style
 *
 * Key features:
 * - Clean, modern bubble-style cards
 * - School and class teacher info prominently displayed
 * - Conversational AI interface
 * - Well-organized card grid
 * - Better visual hierarchy
 */

"use client";

import { logger } from "@/lib/logger";
import { useEffect, useState, useCallback, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
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
  GraduationCap,
  User,
  School,
  Award,
  Flame,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { fetchStudentDashboard } from "../_actions";
import { Skeleton } from "@/components/ui/skeleton";
import { StudentAIInsights } from "./ai-insights-wrapper";
import { AssessmentProfileCard } from "@/components/student/assessment-profile-card";
import { AICareerCoachWidget } from "@/components/student/ai-career-coach-widget";
import { RoadmapTracker } from "@/components/student/roadmap-tracker";
import { MarksOverviewCard } from "@/components/student/marks-overview-card";
import { useRealtime } from "@/hooks/use-realtime";
import type { StudentDashboardData } from "@/lib/api/student";
import type { LucideIcon } from "lucide-react";

export const dynamic = 'force-dynamic';

// Loading component with bubble skeleton
function DashboardSkeleton() {
  return (
    <div className="space-y-6 p-4">
      <Skeleton className="h-32 w-full rounded-3xl" />
      <div className="grid md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-48 w-full rounded-2xl" />
    </div>
  );
}

// Bubble card component
function BubbleCard({ children, className = "", gradient = false }: { children: React.ReactNode; className?: string; gradient?: boolean }) {
  return (
    <Card className={`rounded-2xl border-0 shadow-sm hover:shadow-md transition-all duration-300 ${gradient ? "text-white" : ""} ${className}`}>
      <CardContent className="p-5">
        {children}
      </CardContent>
    </Card>
  );
}

// Stat bubble component
function StatBubble({
  icon: Icon,
  label,
  value,
  subtext,
  color = "orange",
  href,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  subtext?: string;
  color?: "orange" | "blue" | "green" | "purple";
  href?: string;
}) {
  const colors = {
    orange: "bg-gradient-to-br from-orange-400 to-orange-600 text-white",
    blue: "bg-gradient-to-br from-blue-400 to-blue-600 text-white",
    green: "bg-gradient-to-br from-emerald-400 to-emerald-600 text-white",
    purple: "bg-gradient-to-br from-purple-400 to-purple-600 text-white",
  };

  const content = (
    <BubbleCard className={colors[color]}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-white/80 text-sm font-medium mb-1">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
          {subtext && <p className="text-white/70 text-xs mt-1">{subtext}</p>}
        </div>
        <Icon className="w-8 h-8 text-white/30" />
      </div>
    </BubbleCard>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}

// Action bubble component
function ActionBubble({
  icon: Icon,
  title,
  description,
  badge,
  urgency = "medium",
  href,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  badge?: string;
  urgency?: "high" | "medium" | "low";
  href: string;
}) {
  const urgencyColors = {
    high: "border-l-4 border-l-red-500 bg-red-50 dark:bg-red-950/20",
    medium: "border-l-4 border-l-amber-500 bg-amber-50 dark:bg-amber-950/20",
    low: "border-l-4 border-l-blue-500 bg-blue-50 dark:bg-blue-950/20",
  };

  return (
    <Link href={href}>
      <Card className={`rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer ${urgencyColors[urgency]}`}>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center">
              <Icon className="w-6 h-6 text-gray-700 dark:text-gray-300" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 truncate">{title}</h4>
                {badge && <Badge className="text-xs">{badge}</Badge>}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{description}</p>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function StudentDashboardPage() {
  const [dashboardData, setDashboardData] = useState<StudentDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showUpdated, setShowUpdated] = useState(false);

  const hasFetched = useRef(false);
  const { isConnected, bind } = useRealtime();

  const refreshData = useCallback(async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      const data = await fetchStudentDashboard();
      setDashboardData(data);

      // Show updated indicator
      setShowUpdated(true);
      setTimeout(() => setShowUpdated(false), 2000);
    } catch (err) {
      logger.error("Dashboard refresh error:", err);
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing]);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    async function loadData() {
      try {
        const data = await fetchStudentDashboard();
        setDashboardData(data);
        setIsLoading(false);
      } catch (err) {
        logger.error("Dashboard error:", err);
        setError("Failed to load dashboard");
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  // Set up live refresh listeners for student-specific events
  useEffect(() => {
    if (!dashboardData?.student?.schoolId) return;

    const schoolId = dashboardData.student.schoolId;
    const userId = dashboardData.student.id;

    const cleanups: Array<() => void> = [];

    // Listen to school-wide channel for homework graded events
    const schoolChannel = `private-school-${schoolId}`;

    // Listen for homework graded events
    const unbind1 = bind(schoolChannel, "homework.graded", () => {
      refreshData();
    });

    // Listen for attendance checked-in events
    const unbind2 = bind(schoolChannel, "attendance.checked_in", () => {
      refreshData();
    });

    cleanups.push(unbind1, unbind2);

    // Also listen to user-specific channel
    const userChannel = `private-user-${userId}`;
    const unbind3 = bind(userChannel, "homework.graded", () => {
      refreshData();
    });
    cleanups.push(unbind3);

    return () => {
      cleanups.forEach((cleanup) => cleanup());
    };
  }, [dashboardData?.student?.schoolId, dashboardData?.student?.id, bind, refreshData]);

  if (isLoading) return <DashboardSkeleton />;

  if (error || !dashboardData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50 dark:from-gray-900 dark:to-gray-800">
        <Card className="max-w-md mx-4 rounded-2xl">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Dashboard Error</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              There was a problem loading your dashboard. Please try refreshing.
            </p>
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
  const assessmentXP = assessments.completed * 50;
  const homeworkXP = homework.graded * 25;
  const attendanceXP = Math.floor(attendance.rate * 2);
  const moduleXP = modulesCompleted * 100;
  const totalXP = assessmentXP + homeworkXP + attendanceXP + moduleXP;
  const level = Math.floor(totalXP / 500) + 1;
  const xpProgress = Math.round(((totalXP % 500) / 500) * 100);

  // Build recommended actions
  const recommendedActions = [];

  if (assessments.completed < 3) {
    const pendingAssessments = ["RIASEC", "DISC", "MBTI", "Work Values", "Learning Styles"].slice(assessments.completed);
    recommendedActions.push({
      id: "assessment",
      title: `Complete ${pendingAssessments[0] || "Career"} Assessment`,
      description: "Discover your strengths and interests",
      icon: ClipboardCheck,
      badge: assessments.completed === 0 ? "Start Here" : "Recommended",
      urgency: "high" as const,
      link: "/student/assessment",
    });
  }

  if (homework.pending > 0) {
    recommendedActions.push({
      id: "homework",
      title: `${homework.pending} Homework ${homework.pending > 1 ? "Assignments" : "Assignment"} Pending`,
      description: "Stay on top of your assignments",
      icon: BookOpen,
      badge: `${homework.pending} Pending`,
      urgency: homework.pending > 3 ? "high" : "medium" as const,
      link: "/student/homework",
    });
  }

  if (fees?.amountPending && fees.amountPending > 0 && fees.dueDate) {
    const dueDate = new Date(fees.dueDate);
    const daysUntil = Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysUntil <= 14) {
      recommendedActions.push({
        id: "fees",
        title: `Fee Payment Due (${daysUntil} day${daysUntil === 1 ? "" : "s"} left)`,
        description: `Nu. ${fees.amountPending} pending`,
        icon: AlertCircle,
        badge: "Action Needed",
        urgency: daysUntil <= 7 ? "high" : "medium" as const,
        link: "/student/fees",
      });
    }
  }

  if (assessments.completed >= 2) {
    recommendedActions.push({
      id: "colleges",
      title: "Explore RUB Colleges",
      description: "Find programs that match your profile",
      icon: Briefcase,
      badge: "Explore",
      urgency: "low" as const,
      link: "/student/rub",
    });
  }

  return (
    <div className="relative space-y-6 p-4 max-w-7xl mx-auto">
      {/* Live Update Indicator */}
      {showUpdated && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in-down">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span className="text-sm font-medium">Dashboard updated</span>
        </div>
      )}

      {/* Connection Status Indicator */}
      {isConnected ? (
        <div className="fixed bottom-4 right-4 z-50 bg-blue-500 text-white px-3 py-1 rounded-full shadow-lg flex items-center gap-2 text-xs">
          <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse" />
          <span>Live</span>
        </div>
      ) : null}
      {/* Welcome Header with School & Class Teacher Info */}
      <Card className="rounded-3xl border-0 overflow-hidden">
        <div className="bg-gradient-to-br from-orange-500 via-orange-600 to-amber-600 p-6 text-white">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Flame className="w-6 h-6 text-orange-200" />
                <h1 className="text-2xl md:text-3xl font-bold">Welcome back, {student.firstName}!</h1>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-orange-100 text-sm">
                {student.schoolName && (
                  <span className="flex items-center gap-1 bg-white/20 px-3 py-1 rounded-full">
                    <School className="w-4 h-4" />
                    {student.schoolName}
                  </span>
                )}
                {student.className && (
                  <span className="flex items-center gap-1 bg-white/20 px-3 py-1 rounded-full">
                    <GraduationCap className="w-4 h-4" />
                    Class {student.classGrade}{student.section ? ` ${student.section}` : ""}
                  </span>
                )}
                {student.classTeacherName && (
                  <span className="flex items-center gap-1 bg-white/20 px-3 py-1 rounded-full">
                    <User className="w-4 h-4" />
                    Class Teacher: {student.classTeacherName}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4 bg-white/20 rounded-2xl px-5 py-3">
              <div>
                <p className="text-orange-100 text-xs">Level</p>
                <p className="text-2xl font-bold">{level}</p>
              </div>
              <div className="w-px h-10 bg-white/30" />
              <div>
                <p className="text-orange-100 text-xs">Total XP</p>
                <p className="text-2xl font-bold">{totalXP}</p>
              </div>
            </div>
          </div>
          <Progress value={xpProgress} className="h-2 mt-4 bg-white/20" />
          <p className="text-orange-100 text-xs mt-1">{xpProgress}% to Level {level + 1}</p>
        </div>
      </Card>

      {/* Pending Enrollment Alert */}
      {dashboardData.onboardingStatus === "pending_enrollment" && (
        <Card className="rounded-2xl border-l-4 border-l-amber-500 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Clock className="w-6 h-6 text-amber-600" />
              <div className="flex-1">
                <h3 className="font-semibold text-amber-900 dark:text-amber-100">Enrollment Pending</h3>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  Your application is being reviewed. You can take assessments and explore careers while waiting.
                </p>
              </div>
              <Badge className="bg-amber-200 text-amber-800">Awaiting Approval</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Bubbles Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatBubble
          icon={ClipboardCheck}
          label="Assessments"
          value={`${assessments.completed}/5`}
          subtext="Career assessments"
          color="orange"
          href="/student/assessment"
        />
        <StatBubble
          icon={Briefcase}
          label="Career Matches"
          value={careerMatches.totalMatches}
          subtext={careerMatches.topMatches > 0 ? `${careerMatches.topMatches} top matches` : "Based on profile"}
          color="blue"
          href="/student/careers"
        />
        <StatBubble
          icon={Target}
          label="Active Goals"
          value={assessments.completed >= 1 ? "3" : "0"}
          subtext={assessments.completed >= 1 ? "Short-term goals" : "Complete assessment"}
          color="green"
          href="/student/plan"
        />
        <StatBubble
          icon={TrendingUp}
          label="Attendance"
          value={`${attendance.rate}%`}
          subtext={`${attendance.presentDays} present days`}
          color="purple"
        />
      </div>

      {/* AI Chat Section - Expandable Bubble */}
      <AICareerCoachWidget />

      {/* Recommended Actions - Bubble Style */}
      {recommendedActions.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
            <Target className="w-5 h-5 text-orange-500" />
            Recommended for You
          </h2>
          <div className="grid md:grid-cols-2 gap-3">
            {recommendedActions.slice(0, 4).map((action) => (
              <ActionBubble
                key={action.id}
                icon={action.icon}
                title={action.title}
                description={action.description}
                badge={action.badge}
                urgency={action.urgency}
                href={action.link}
              />
            ))}
          </div>
        </div>
      )}

      {/* Two Column Layout */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Roadmap Tracker */}
        <RoadmapTracker />

        {/* Marks Overview */}
        <MarksOverviewCard />
      </div>

      {/* Upcoming Deadlines - Clean List */}
      {deadlines.length > 0 && (
        <BubbleCard>
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-orange-500" />
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Upcoming Deadlines</h3>
          </div>
          <div className="space-y-2">
            {deadlines.slice(0, 5).map((deadline) => {
              const dueDate = new Date(deadline.dueDate);
              const daysUntil = Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
              const isPast = daysUntil < 0;

              return (
                <Link key={deadline.id} href={deadline.link}>
                  <div className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        deadline.type === "homework" ? "bg-blue-100 text-blue-600" :
                        deadline.type === "assessment" ? "bg-purple-100 text-purple-600" :
                        deadline.type === "fee" ? "bg-red-100 text-red-600" :
                        "bg-gray-100 text-gray-600"
                      }`}>
                        {deadline.type === "homework" ? <BookOpen className="w-5 h-5" /> :
                         deadline.type === "assessment" ? <ClipboardCheck className="w-5 h-5" /> :
                         deadline.type === "fee" ? <AlertCircle className="w-5 h-5" /> :
                         <Calendar className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{deadline.title}</p>
                        <p className="text-sm text-gray-500">{deadline.type}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={deadline.urgency === "high" ? "destructive" : deadline.urgency === "medium" ? "default" : "secondary"}>
                        {isPast ? "Overdue" : daysUntil === 0 ? "Today" : daysUntil === 1 ? "Tomorrow" : `${daysUntil} days`}
                      </Badge>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </BubbleCard>
      )}

      {/* Recent Achievements - Bubble Grid */}
      {achievements.length > 0 && (
        <BubbleCard>
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-5 h-5 text-orange-500" />
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Recent Achievements</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {achievements.slice(0, 6).map((achievement) => {
              const xpGain = achievement.type === "assessment" ? 50 : achievement.type === "module" ? 100 : 25;
              return (
                <div
                  key={achievement.id}
                  className="p-4 rounded-xl bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/10 border border-orange-200 dark:border-orange-900"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      achievement.type === "assessment" ? "bg-purple-100 text-purple-600" :
                      achievement.type === "module" ? "bg-green-100 text-green-600" :
                      "bg-blue-100 text-blue-600"
                    }`}>
                      {achievement.type === "assessment" ? <ClipboardCheck className="w-4 h-4" /> :
                       achievement.type === "module" ? <BookOpen className="w-4 h-4" /> :
                       <TrendingUp className="w-4 h-4" />}
                    </div>
                    <Badge className="bg-orange-200 text-orange-800 text-xs">+{xpGain} XP</Badge>
                  </div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2">{achievement.title}</p>
                  <p className="text-xs text-gray-500 mt-1">{formatRelativeDate(achievement.date)}</p>
                </div>
              );
            })}
          </div>
        </BubbleCard>
      )}

      {/* Assessment Profile Card */}
      {assessments.completed >= 1 && <AssessmentProfileCard />}
    </div>
  );
}

// Helper function for date formatting
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
