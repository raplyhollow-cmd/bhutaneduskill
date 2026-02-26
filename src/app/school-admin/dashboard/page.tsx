/**
 * SCHOOL ADMIN DASHBOARD
 *
 * Premium Vercel/Ceramic-inspired dashboard with:
 * - Modern stat cards with trends
 * - Quick action cards
 * - Pending applications badge
 * - Recent announcements section
 * - Upcoming events section
 * - Clean, professional ceramic design system
 */

"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CeramicCallout } from "@/components/ui/ceramic-callout";
import { StatsCard, MobileCardGrid } from "@/components/ui/mobile-card";
import { StatCardSkeleton, CardGridSkeleton } from "@/components/ui/skeleton/card-skeleton";
import { ListSkeleton } from "@/components/ui/skeleton/list-skeleton";
import {
  Users,
  UserCheck,
  Calendar,
  DollarSign,
  TrendingUp,
  AlertCircle,
  ArrowRight,
  BookOpen,
  FileText,
  CheckCircle2,
  Clock,
  Sparkles,
  GraduationCap,
  Bell,
  Plus,
  ClipboardCheck,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchDashboardStats, fetchClasses } from "../_actions";
import { AIInsightsSection } from "@/components/school-admin/ai-insights-section";
import { CapacityStatusCard } from "@/components/school-admin/capacity-status-card";
import type { ClassData } from "@/lib/api/school-admin";

export default function SchoolAdminDashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState("School Admin");
  const [userImage, setUserImage] = useState<string | undefined>(undefined);
  const [schoolStats, setSchoolStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalClasses: 0,
    pendingAttendance: 0,
    pendingFees: 0,
    totalRevenue: 0,
  });
  const [classesData, setClassesData] = useState({ classesList: [] });

  useEffect(() => {
    async function loadData() {
      try {
        const [stats, classes] = await Promise.all([
          fetchDashboardStats(),
          fetchClasses({ limit: 5 }),
        ]);
        setSchoolStats(stats);
        setClassesData(classes);
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // Transform classes to today's classes format
  const todayClasses = classesData.classesList?.slice(0, 5).map((cls: ClassData) => ({
    id: cls.id,
    name: cls.name || `Class ${cls.grade}`,
    teacher: cls.classTeacher || "Not Assigned",
    subject: "General",
    time: "9:00 AM",
    attendanceStatus: "completed" as const,
  })) || [];

  // Generate pending actions based on stats
  const pendingActions = [
    {
      id: "1",
      type: "attendance",
      title: `${schoolStats.pendingAttendance} classes pending attendance`,
      urgency: schoolStats.pendingAttendance > 3 ? "high" : "medium" as "high" | "medium" | "low",
      action: "Mark Attendance",
      link: "/school-admin/attendance",
    },
    {
      id: "2",
      type: "fees",
      title: `${schoolStats.pendingFees} students with pending fees`,
      urgency: schoolStats.pendingFees > 20 ? "high" : "medium" as "high" | "medium" | "low",
      action: "View Details",
      link: "/school-admin/fees",
    },
    {
      id: "3",
      type: "homework",
      title: "View homework assignments",
      urgency: "low" as const,
      action: "View Homework",
      link: "/school-admin/homework",
    },
  ];

  // Recent activities (generated from data)
  const recentActivities = [
    {
      id: "1",
      type: "enrollment",
      message: `${schoolStats.totalStudents} students enrolled`,
      time: "This academic year",
      icon: UserCheck,
    },
    {
      id: "2",
      type: "homework",
      message: `${schoolStats.totalClasses} classes active`,
      time: "This semester",
      icon: FileText,
    },
    {
      id: "3",
      type: "result",
      message: `${schoolStats.totalTeachers} teachers on staff`,
      time: "Current",
      icon: CheckCircle2,
    },
    {
      id: "4",
      type: "fee",
      message: `Revenue: Nu. ${(schoolStats.totalRevenue / 1000).toFixed(0)}K`,
      time: "This month",
      icon: DollarSign,
    },
  ];

  // Upcoming events (static for now)
  const upcomingEvents = [
    {
      id: "1",
      title: "Parent-Teacher Meeting",
      date: "Upcoming",
      time: "TBD",
      type: "meeting",
    },
    {
      id: "2",
      title: "Midterm Examinations",
      date: "Scheduled",
      time: "All Day",
      type: "exam",
    },
    {
      id: "3",
      title: "Career Counseling Session",
      date: "Available",
      time: "By Appointment",
      type: "counseling",
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6 p-4 lg:p-8">
        {/* Welcome Banner Skeleton */}
        <div className="relative overflow-hidden rounded-2xl p-6 lg:p-8 text-white shadow-lg">
          <div className="animate-pulse bg-violet-200/30 absolute inset-0" />
          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="space-y-3">
                <div className="h-8 w-64 bg-white/20 rounded-lg animate-pulse" />
                <div className="h-4 w-96 bg-white/10 rounded animate-pulse" />
              </div>
              <div className="flex gap-2">
                <div className="h-10 w-32 bg-white/20 rounded-lg animate-pulse" />
                <div className="h-10 w-32 bg-white/30 rounded-lg animate-pulse" />
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid Skeleton */}
        <CardGridSkeleton count={4} />

        {/* Quick Actions Skeleton */}
        <CardGridSkeleton count={3} />

        {/* Today's Classes Skeleton */}
        <Card>
          <CardHeader>
            <div className="h-6 w-40 bg-muted rounded-lg animate-pulse" />
            <div className="h-4 w-60 bg-muted rounded animate-pulse mt-2" />
          </CardHeader>
          <CardContent>
            <ListSkeleton items={5} showIcon showAction />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Purple/Indigo gradient for school admin
  const primaryGradient = "linear-gradient(135deg, rgb(139 92 246) 0%, rgb(124 58 237) 100%)";
  const primaryLight = "rgb(139 92 246)";

  return (
    <div className="space-y-6 p-4 lg:p-8">
          {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl p-6 lg:p-8 text-white shadow-lg">
        <div style={{ background: primaryGradient }} className="absolute inset-0" />
        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold mb-2">
                Welcome to Your Dashboard
              </h1>
              <p className="text-white/90 text-sm lg:text-base">
                Manage your school, students, teachers, and track progress all in one place.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="bg-white/10 hover:bg-white/20 text-white border-white/20"
                asChild
              >
                <Link href="/school-admin/analytics">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  View Analytics
                </Link>
              </Button>
              <Button
                className="bg-white text-violet-700 hover:bg-white/90 shadow-lg"
                asChild
              >
                <Link href="/school-admin/students/create">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Student
                </Link>
              </Button>
            </div>
          </div>
        </div>
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
      </div>

      {/* Premium Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Students"
          value={schoolStats.totalStudents.toLocaleString()}
          change={12}
          changeType="increase"
          icon={Users}
          iconColor={primaryLight}
          iconBackgroundColor="rgb(239 232 251)"
        />
        <StatsCard
          title="Teachers"
          value={schoolStats.totalTeachers.toString()}
          change={2}
          changeType="increase"
          icon={GraduationCap}
          iconColor="rgb(59 130 246)"
          iconBackgroundColor="rgb(219 234 254)"
        />
        <StatsCard
          title="Active Classes"
          value={schoolStats.totalClasses.toString()}
          icon={BookOpen}
          iconColor="rgb(245 158 11)"
          iconBackgroundColor="rgb(254 243 199)"
        />
        <StatsCard
          title="Attendance Rate"
          value="92.5%"
          change={3}
          changeType="increase"
          icon={UserCheck}
          iconColor="rgb(34 197 94)"
          iconBackgroundColor="rgb(220 252 231)"
        />
      </div>

      {/* Seat Capacity Card - Shows billing warnings */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <CapacityStatusCard />
        </div>
      </div>

      {/* Pending Items - Ceramic Styled */}
      {(schoolStats.pendingAttendance > 0 || schoolStats.pendingFees > 0) && (
        <CeramicCallout variant="ceramic-warning" className="border-ceramic-orange-200">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-5 h-5 text-ceramic-orange-600" />
            <h3 className="font-semibold text-ceramic-primary">Requires Attention</h3>
          </div>
          <div className="flex flex-wrap gap-4">
            {schoolStats.pendingAttendance > 0 && (
              <Link href="/school-admin/attendance" className="flex items-center gap-2 px-4 py-2 bg-ceramic-white rounded-lg border border-ceramic-orange-200 hover:border-ceramic-orange-300 transition-colors">
                <Calendar className="w-4 h-4 text-ceramic-orange-600" />
                <div>
                  <p className="text-sm font-medium text-ceramic-primary">{schoolStats.pendingAttendance} classes pending attendance</p>
                  <p className="text-xs text-ceramic-secondary">Mark attendance now</p>
                </div>
                <ArrowRight className="w-4 h-4 text-ceramic-dimmed ml-auto" />
              </Link>
            )}
            {schoolStats.pendingFees > 0 && (
              <Link href="/school-admin/fees" className="flex items-center gap-2 px-4 py-2 bg-ceramic-white rounded-lg border border-ceramic-orange-200 hover:border-ceramic-orange-300 transition-colors">
                <DollarSign className="w-4 h-4 text-ceramic-orange-600" />
                <div>
                  <p className="text-sm font-medium text-ceramic-primary">{schoolStats.pendingFees} students with pending fees</p>
                  <p className="text-xs text-ceramic-secondary">Send reminders</p>
                </div>
                <ArrowRight className="w-4 h-4 text-ceramic-dimmed ml-auto" />
              </Link>
            )}
          </div>
        </CeramicCallout>
      )}

      {/* AI Insights Section - Dynamic */}
      <AIInsightsSection
        stats={{
          pendingFees: schoolStats.pendingFees,
          pendingAttendance: schoolStats.pendingAttendance,
          totalStudents: schoolStats.totalStudents,
          totalTeachers: schoolStats.totalTeachers,
          totalRevenue: schoolStats.totalRevenue,
          totalClasses: schoolStats.totalClasses,
        }}
      />

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Today's Classes & Attendance - Ceramic Styled */}
        <div className="lg:col-span-2">
          <Card variant="ceramic">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Active Classes</CardTitle>
                  <CardDescription>View and manage class attendance</CardDescription>
                </div>
                <Button variant="ceramic-ghost" size="sm" asChild>
                  <Link href="/school-admin/classes">View All</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {todayClasses.length > 0 ? todayClasses.map((cls) => (
                  <div
                    key={cls.id}
                    className="flex items-center justify-between p-4 bg-ceramic-gray-50 rounded-lg hover:bg-ceramic-gray-100 transition-colors dark:bg-ceramic-gray-800 dark:hover:bg-ceramic-gray-700"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-ceramic-purple-100 rounded-lg flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-ceramic-brand" />
                      </div>
                      <div>
                        <p className="font-medium text-ceramic-primary">{cls.name}</p>
                        <p className="text-sm text-ceramic-secondary">
                          {cls.teacher} • {cls.subject}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-ceramic-secondary">{cls.time}</p>
                      <Badge
                        variant={cls.attendanceStatus === "completed" ? "ceramic-success" : "ceramic-warning"}
                      >
                        {cls.attendanceStatus === "completed" ? "Active" : "Pending"}
                      </Badge>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-8 text-ceramic-secondary">
                    No classes found. Create your first class to get started.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Actions - Ceramic Styled */}
        <div>
          <Card variant="ceramic" className="border-ceramic-orange-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-ceramic-orange-600" />
                Pending Actions
              </CardTitle>
              <CardDescription>Requires your attention</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {pendingActions.map((action) => (
                <div key={action.id} className="p-3 bg-ceramic-gray-50 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-ceramic-primary">{action.title}</p>
                      <Badge
                        variant={
                          action.urgency === "high"
                            ? "ceramic-error"
                            : action.urgency === "medium"
                            ? "ceramic-warning"
                            : "ceramic-default"
                        }
                        className="mt-1"
                      >
                        {action.urgency}
                      </Badge>
                    </div>
                    <Button size="sm" variant="ceramic-ghost" asChild>
                      <Link href={action.link}>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Actions - Ceramic Styled */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-ceramic-primary">Quick Actions</h2>
        </div>
        <MobileCardGrid>
          <Link href="/school-admin/students/create" className="group">
            <div className="flex items-center gap-3 p-4 rounded-xl border border-ceramic-border bg-ceramic-white hover:border-ceramic-purple-300 hover:shadow-md transition-all dark:bg-ceramic-gray-800">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-ceramic-purple-100">
                <Users className="w-6 h-6 text-ceramic-brand" />
              </div>
              <div>
                <p className="font-semibold text-ceramic-primary">Add Student</p>
                <p className="text-sm text-ceramic-secondary">Enroll new student</p>
              </div>
              <ArrowRight className="w-5 h-5 text-ceramic-dimmed ml-auto group-hover:text-ceramic-brand transition-colors" />
            </div>
          </Link>

          <Link href="/school-admin/teachers/create" className="group">
            <div className="flex items-center gap-3 p-4 rounded-xl border border-ceramic-border bg-ceramic-white hover:border-ceramic-blue-300 hover:shadow-md transition-all dark:bg-ceramic-gray-800">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-ceramic-blue-100">
                <GraduationCap className="w-6 h-6 text-ceramic-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-ceramic-primary">Add Teacher</p>
                <p className="text-sm text-ceramic-secondary">Hire new staff</p>
              </div>
              <ArrowRight className="w-5 h-5 text-ceramic-dimmed ml-auto group-hover:text-ceramic-blue-600 transition-colors" />
            </div>
          </Link>

          <Link href="/school-admin/classes/create" className="group">
            <div className="flex items-center gap-3 p-4 rounded-xl border border-ceramic-border bg-ceramic-white hover:border-ceramic-yellow-300 hover:shadow-md transition-all dark:bg-ceramic-gray-800">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-ceramic-yellow-100">
                <BookOpen className="w-6 h-6 text-ceramic-orange-600" />
              </div>
              <div>
                <p className="font-semibold text-ceramic-primary">Create Class</p>
                <p className="text-sm text-ceramic-secondary">Setup new class</p>
              </div>
              <ArrowRight className="w-5 h-5 text-ceramic-dimmed ml-auto group-hover:text-ceramic-orange-600 transition-colors" />
            </div>
          </Link>

          <Link href="/school-admin/attendance" className="group">
            <div className="flex items-center gap-3 p-4 rounded-xl border border-ceramic-border bg-ceramic-white hover:border-ceramic-green-300 hover:shadow-md transition-all dark:bg-ceramic-gray-800">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-ceramic-green-100">
                <ClipboardCheck className="w-6 h-6 text-ceramic-positive" />
              </div>
              <div>
                <p className="font-semibold text-ceramic-primary">Mark Attendance</p>
                <p className="text-sm text-ceramic-secondary">Daily attendance</p>
              </div>
              <ArrowRight className="w-5 h-5 text-ceramic-dimmed ml-auto group-hover:text-ceramic-positive transition-colors" />
            </div>
          </Link>
        </MobileCardGrid>
      </div>

      {/* Recent Activity & Upcoming Events - Ceramic Styled */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card variant="ceramic">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest updates in your school</CardDescription>
              </div>
              <Button variant="ceramic-ghost" size="sm" asChild>
                <Link href="/school-admin/reports">
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-ceramic-gray-50 transition-colors dark:hover:bg-ceramic-gray-800">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    activity.type === "enrollment" ? "bg-ceramic-green-100" :
                    activity.type === "homework" ? "bg-ceramic-blue-100" :
                    activity.type === "result" ? "bg-ceramic-purple-100" : "bg-ceramic-yellow-100"
                  }`}>
                    <activity.icon className={`w-5 h-5 ${
                      activity.type === "enrollment" ? "text-ceramic-positive" :
                      activity.type === "homework" ? "text-ceramic-blue-600" :
                      activity.type === "result" ? "text-ceramic-brand" : "text-ceramic-orange-600"
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ceramic-primary truncate">{activity.message}</p>
                    <p className="text-xs text-ceramic-secondary">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card variant="ceramic">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Upcoming Events</CardTitle>
                <CardDescription>Important dates & activities</CardDescription>
              </div>
              <Button variant="ceramic-ghost" size="sm" asChild>
                <Link href="/school-admin/calendar">
                  <Calendar className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingEvents.map((event) => (
                <div key={event.id} className="flex items-center gap-4 p-3 bg-ceramic-gray-50 rounded-lg hover:bg-ceramic-gray-100 transition-colors dark:bg-ceramic-gray-800 dark:hover:bg-ceramic-gray-700">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-sm"
                    style={{ background: primaryGradient }}
                  >
                    <Clock className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-ceramic-primary truncate">{event.title}</p>
                    <p className="text-sm text-ceramic-secondary">{event.date}</p>
                  </div>
                  <Badge
                    variant={
                      event.type === "meeting" ? "ceramic-info" :
                      event.type === "exam" ? "ceramic-error" : "ceramic"
                    }
                  >
                    {event.type}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}