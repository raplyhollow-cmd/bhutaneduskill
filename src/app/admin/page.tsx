"use client";

/**
 * PLATFORM ADMIN DASHBOARD
 *
 * Modern dashboard with:
 * - Premium stat cards with hover effects
 * - AI-driven insights
 * - Quick action cards
 * - Responsive grid layout
 */

import { logger } from "@/lib/logger";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CeramicCallout } from "@/components/ui/ceramic-callout";
import {
  Building2,
  Users,
  GraduationCap,
  TrendingUp,
  Activity,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  Globe,
  FileText,
  Loader2,
  CheckCircle,
  Clock,
  Plus,
  Settings,
  BarChart3,
  Bell,
  Command,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { AIInsightCard } from "@/components/ai/ai-insight-card";
import { PremiumCard } from "@/components/admin/premium-card";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface AdminStats {
  totalSchools: number;
  totalStudents: number;
  totalTeachers: number;
  totalAssessments: number;
  completionRate: number;
  activeNow: number;
  pendingApplications: number;
  revenue: number;
}

interface TopSchool {
  id: string;
  name: string;
  students: number;
  completion: number;
  change: number;
}

interface CareerInterest {
  career: string;
  percentage: number;
  trend: "up" | "down" | "stable";
}

interface Alert {
  type: "warning" | "info" | "success";
  message: string;
}

interface AIInsight {
  type: "warning" | "success" | "info" | "tip";
  title: string;
  message: string;
  actions?: Array<{ label: string; href: string }>;
}

// Quick Action Cards - with ceramic styling
const quickActions = [
  {
    icon: Command,
    label: "Command Center",
    href: "/admin/command-center",
    gradient: "linear-gradient(135deg, rgb(6 182 212) 0%, rgb(8 145 178) 100%)",
    bgColor: "bg-cyan-50",
    ceramicBg: "bg-cyan-50",
    ceramicColor: "text-cyan-600"
  },
  {
    icon: Plus,
    label: "Add School",
    href: "/admin/schools",
    gradient: "linear-gradient(135deg, rgb(236 72 153) 0%, rgb(219 39 119) 100%)",
    bgColor: "bg-pink-50",
    ceramicBg: "bg-ceramic-pink-50",
    ceramicColor: "text-ceramic-pink-600"
  },
  {
    icon: Users,
    label: "Manage Users",
    href: "/admin/users",
    gradient: "linear-gradient(135deg, rgb(59 130 246) 0%, rgb(37 99 235) 100%)",
    bgColor: "bg-blue-50",
    ceramicBg: "bg-ceramic-blue-50",
    ceramicColor: "text-ceramic-blue-600"
  },
  {
    icon: CheckCircle,
    label: "Review Applications",
    href: "/admin/school-admin-applications",
    gradient: "linear-gradient(135deg, rgb(34 197 94) 0%, rgb(22 163 74) 100%)",
    bgColor: "bg-green-50",
    ceramicBg: "bg-ceramic-green-50",
    ceramicColor: "text-ceramic-positive",
    badgeKey: "pendingApplications"
  },
  {
    icon: BarChart3,
    label: "View Analytics",
    href: "/admin/analytics",
    gradient: "linear-gradient(135deg, rgb(139 92 246) 0%, rgb(124 58 237) 100%)",
    bgColor: "bg-purple-50",
    ceramicBg: "bg-ceramic-purple-50",
    ceramicColor: "text-ceramic-brand"
  },
  {
    icon: Bell,
    label: "Send Notification",
    href: "/admin/notifications",
    gradient: "linear-gradient(135deg, rgb(234 179 8) 0%, rgb(202 138 4) 100%)",
    bgColor: "bg-yellow-50",
    ceramicBg: "bg-ceramic-warning/10",
    ceramicColor: "text-ceramic-warning"
  },
  {
    icon: Settings,
    label: "Platform Settings",
    href: "/admin/settings",
    gradient: "linear-gradient(135deg, rgb(107 114 128) 0%, rgb(75 85 99) 100%)",
    bgColor: "bg-gray-50",
    ceramicBg: "bg-ceramic-gray-100",
    ceramicColor: "text-ceramic-secondary"
  },
];

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats>({
    totalSchools: 0,
    totalStudents: 0,
    totalTeachers: 0,
    totalAssessments: 0,
    completionRate: 0,
    activeNow: 0,
    pendingApplications: 0,
    revenue: 0,
  });
  const [topSchools, setTopSchools] = useState<TopSchool[]>([]);
  const [careerInterests, setCareerInterests] = useState<CareerInterest[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingInsights, setIsLoadingInsights] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    if (!isLoading && stats && topSchools && careerInterests) {
      loadAIInsights();
    }
  }, [isLoading, stats, topSchools, careerInterests]);

  const loadDashboardData = async () => {
    try {
      const response = await fetch("/api/admin/dashboard");

      // Handle authentication errors explicitly
      if (response.status === 401 || response.status === 403) {
        setApiError("You need to sign in to access this page");
        // Redirect to sign-in after a short delay to allow error message to be seen
        setTimeout(() => {
          window.location.href = "/sign-in?redirect_url=" + encodeURIComponent(window.location.pathname);
        }, 1500);
        setIsLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const json = await response.json();
      // API returns { data: { stats, topSchools, careerInterests } }
      const data = json.data || json;
      setStats(data.stats || stats);
      setTopSchools(data.topSchools || []);
      setCareerInterests(data.careerInterests || []);
      setApiError(null); // Clear any previous error

      // Generate alerts from data
      const newAlerts: Alert[] = [];
      if (data.topSchools && data.topSchools.some((s: TopSchool) => s.completion < 80)) {
        const lowCount = data.topSchools.filter((s: TopSchool) => s.completion < 80).length;
        newAlerts.push({ type: "warning", message: `${lowCount} schools have low assessment completion rates` });
      }
      if (data.stats && data.stats.totalSchools > 10) {
        newAlerts.push({ type: "info", message: `Platform now serving ${data.stats.totalSchools} schools across Bhutan` });
      }
      setAlerts(newAlerts);
    } catch (error) {
      logger.error("Failed to load admin dashboard:", error);
      setApiError("Failed to load dashboard data. Please refresh the page or try again later.");
      setStats({
        totalSchools: 0,
        totalStudents: 0,
        totalTeachers: 0,
        totalAssessments: 0,
        completionRate: 0,
        activeNow: 0,
        pendingApplications: 0,
        revenue: 0,
      });
      setTopSchools([]);
      setCareerInterests([]);
      setAlerts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAIInsights = async () => {
    try {
      const response = await fetch("/api/ai/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userRole: "admin",
          contextData: {
            stats,
            schools: topSchools,
            careerInterests,
          },
        }),
      });

      if (response.ok) {
        const json = await response.json();
        setAiInsights(json.data?.insights || []);
      } else {
        setAiInsights([]);
      }
    } catch (error) {
      logger.error("Failed to load AI insights:", error);
      setAiInsights([]);
    } finally {
      setIsLoadingInsights(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <div className="h-7 w-48 bg-ceramic-gray-100 rounded animate-pulse" />
            <div className="h-4 w-64 bg-ceramic-gray-100/60 rounded animate-pulse" />
          </div>
          <div className="flex gap-2">
            <div className="h-9 w-24 bg-ceramic-gray-100 rounded animate-pulse" />
            <div className="h-9 w-32 bg-ceramic-gray-100 rounded animate-pulse" />
          </div>
        </div>

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-5 bg-white rounded-lg border border-ceramic-border">
              <div className="flex items-start justify-between mb-4">
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-24 bg-ceramic-gray-100 rounded animate-pulse" />
                  <div className="h-8 w-16 bg-ceramic-gray-100/60 rounded animate-pulse" />
                </div>
                <div className="w-12 h-12 bg-ceramic-gray-100 rounded-lg animate-pulse" />
              </div>
              <div className="h-4 w-20 bg-ceramic-gray-100/40 rounded animate-pulse" />
            </div>
          ))}
        </div>

        {/* Quick Actions Skeleton */}
        <div className="space-y-4">
          <div className="h-5 w-32 bg-ceramic-gray-100 rounded animate-pulse" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-32 bg-ceramic-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        </div>

        {/* Content Sections Skeleton */}
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="p-6 bg-white rounded-lg border border-ceramic-border">
            <div className="space-y-3 mb-4">
              <div className="h-5 w-32 bg-ceramic-gray-100 rounded animate-pulse" />
              <div className="h-4 w-48 bg-ceramic-gray-100/60 rounded animate-pulse" />
            </div>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 py-2">
                <div className="w-8 h-8 bg-ceramic-gray-100 rounded-full animate-pulse" />
                <div className="flex-1 space-y-1">
                  <div className="h-4 w-full bg-ceramic-gray-100 rounded animate-pulse" />
                  <div className="h-3 w-3/4 bg-ceramic-gray-100/60 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
          <div className="p-6 bg-white rounded-lg border border-ceramic-border">
            <div className="space-y-3 mb-4">
              <div className="h-5 w-40 bg-ceramic-gray-100 rounded animate-pulse" />
              <div className="h-4 w-56 bg-ceramic-gray-100/60 rounded animate-pulse" />
            </div>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 py-2">
                <div className="w-6 h-6 bg-ceramic-gray-100 rounded-full animate-pulse" />
                <div className="flex-1 space-y-1">
                  <div className="h-4 w-full bg-ceramic-gray-100 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Show error message if API call failed
  if (apiError) {
    return (
      <div className="space-y-6">
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <div>
              <h3 className="font-semibold text-red-900">Error Loading Dashboard</h3>
              <p className="text-sm text-red-700 mt-1">{apiError}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-3 text-sm font-medium text-red-800 hover:text-red-900 underline"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header - Ceramic styled */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ceramic-primary">
            Welcome back, Platform Admin
          </h1>
          <p className="text-ceramic-secondary mt-1">
            Here's what's happening across your platform today
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="ceramic-ghost" size="sm">
            Export Report
          </Button>
          <Button variant="ceramic" size="sm" asChild className="bg-cyan-600 hover:bg-cyan-700">
            <Link href="/admin/command-center" className="flex items-center gap-2">
              <Command className="w-4 h-4" />
              Command Center
            </Link>
          </Button>
          <Button variant="ceramic" size="sm" asChild>
            <Link href="/admin/schools">Manage Schools</Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid - Ceramic styled */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <PremiumCard className="p-5 group ceramic-interactive">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-ceramic-dimmed">Total Schools</p>
              <p className="text-3xl font-bold text-ceramic-primary mt-1">{stats.totalSchools}</p>
              <p className="text-xs text-ceramic-positive mt-2 flex items-center gap-1">
                <ArrowUp className="w-3 h-3" /> 2 new this month
              </p>
            </div>
            <div className="p-3 rounded-lg bg-ceramic-pink-50 group-hover:bg-ceramic-pink-100 transition-colors">
              <Building2 className="w-5 h-5 text-ceramic-pink-600" />
            </div>
          </div>
        </PremiumCard>

        <PremiumCard className="p-5 group ceramic-interactive">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-ceramic-dimmed">Total Students</p>
              <p className="text-3xl font-bold text-ceramic-primary mt-1">{stats.totalStudents.toLocaleString()}</p>
              <p className="text-xs text-ceramic-positive mt-2 flex items-center gap-1">
                <ArrowUp className="w-3 h-3" /> +12% from last month
              </p>
            </div>
            <div className="p-3 rounded-lg bg-ceramic-blue-50 group-hover:bg-ceramic-blue-100 transition-colors">
              <Users className="w-5 h-5 text-ceramic-blue-600" />
            </div>
          </div>
        </PremiumCard>

        <PremiumCard className="p-5 group ceramic-interactive">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-ceramic-dimmed">Total Teachers</p>
              <p className="text-3xl font-bold text-ceramic-primary mt-1">{stats.totalTeachers.toLocaleString()}</p>
              <p className="text-xs text-ceramic-positive mt-2 flex items-center gap-1">
                <ArrowUp className="w-3 h-3" /> +8 this month
              </p>
            </div>
            <div className="p-3 rounded-lg bg-ceramic-purple-50 group-hover:bg-ceramic-purple-100 transition-colors">
              <GraduationCap className="w-5 h-5 text-ceramic-brand" />
            </div>
          </div>
        </PremiumCard>

        <PremiumCard className="p-5 group ceramic-interactive">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-ceramic-dimmed">Active Now</p>
              <p className="text-3xl font-bold text-ceramic-positive mt-1">{stats.activeNow}</p>
              <p className="text-xs text-ceramic-secondary mt-2">Currently online</p>
            </div>
            <div className="p-3 rounded-lg bg-ceramic-green-50 group-hover:bg-ceramic-green-100 transition-colors">
              <Activity className="w-5 h-5 text-ceramic-positive" />
            </div>
          </div>
        </PremiumCard>
      </div>

      {/* AI Insights */}
      <div className="grid md:grid-cols-3 gap-4">
        {isLoadingInsights ? (
          <>
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </CardContent>
              </Card>
            ))}
          </>
        ) : aiInsights.length > 0 ? (
          aiInsights.map((insight, index) => (
            <AIInsightCard
              key={index}
              type={insight.type}
              title={insight.title}
              message={insight.message}
              actions={insight.actions}
            />
          ))
        ) : (
          <>
            <AIInsightCard
              type="warning"
              title="School Engagement Alert"
              message={`${topSchools.filter(s => s.completion < 80).length} schools below 80% completion threshold.`}
              actions={[
                { label: "View Schools", href: "/admin/schools" },
                { label: "Send Alert", href: "/admin/notifications" },
              ]}
            />

            <AIInsightCard
              type="success"
              title="Platform Growth Positive"
              message={`${stats.totalStudents} students across ${stats.totalSchools} schools. 15% increase in new registrations this month.`}
              actions={[
                { label: "View Analytics", href: "/admin/analytics" },
              ]}
            />

            <AIInsightCard
              type="tip"
              title="Popular Career Interests"
              message={`AI analysis shows ${careerInterests[0]?.career || "Technology"} and ${careerInterests[1]?.career || "Healthcare"} as top interests.`}
              actions={[
                { label: "View Content", href: "/admin/content" },
              ]}
            />
          </>
        )}
      </div>

      {/* Quick Actions - Ceramic styled */}
      <div>
        <h2 className="text-lg font-semibold text-ceramic-primary mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            // Get dynamic badge value - check if badgeKey exists and has corresponding stat
            const badgeValue = 'badgeKey' in action && action.badgeKey
              ? `${stats[action.badgeKey as keyof AdminStats] || 0} pending`
              : ('badge' in action ? action.badge : undefined);

            return (
              <Link
                key={action.label}
                href={action.href}
                className="group"
              >
                <PremiumCard className="p-4 text-center hover:scale-105 transition-transform ceramic-interactive h-full min-h-[140px] flex flex-col items-center justify-center">
                  <div className={`w-12 h-12 rounded-xl ${action.ceramicBg} flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform`}>
                    <Icon className={`w-6 h-6 ${action.ceramicColor}`} />
                  </div>
                  <p className="text-sm font-medium text-ceramic-primary">{action.label}</p>
                  {badgeValue && (
                    <Badge variant="ceramic" className="mt-2 text-xs">
                      {String(badgeValue)}
                    </Badge>
                  )}
                </PremiumCard>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Content Sections - Ceramic styled */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top Schools */}
        <Card variant="ceramic">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Top Schools by Engagement</CardTitle>
                <CardDescription>Assessment completion rates</CardDescription>
              </div>
              <Badge variant="ceramic" className="text-xs">
                Live
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {topSchools.length === 0 ? (
              <p className="text-sm text-ceramic-secondary text-center py-8">No schools data available</p>
            ) : (
              topSchools.map((school, index) => (
                <div key={school.name} className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                    index === 0 ? "bg-ceramic-yellow-100 text-ceramic-yellow-700" :
                    index === 1 ? "bg-ceramic-gray-200 text-ceramic-gray-700" :
                    index === 2 ? "bg-ceramic-orange-100 text-ceramic-orange-700" :
                    "bg-ceramic-gray-100 text-ceramic-gray-600"
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-ceramic-primary truncate">{school.name}</span>
                      <span className="text-sm text-ceramic-secondary ml-2">{school.students} students</span>
                    </div>
                    <div className="w-full bg-ceramic-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${school.completion}%`,
                          background: "linear-gradient(90deg, rgb(236 72 153) 0%, rgb(219 39 119) 100%)"
                        }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-ceramic-secondary">{school.completion}%</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Career Interests */}
        <Card variant="ceramic">
          <CardHeader>
            <CardTitle>Career Interests Distribution</CardTitle>
            <CardDescription>Most popular career choices across all students</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {careerInterests.length === 0 ? (
              <p className="text-sm text-ceramic-secondary text-center py-8">No career data available</p>
            ) : (
              careerInterests.map((item, index) => (
                <div key={item.career} className="flex items-center gap-4">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    index === 0 ? "bg-ceramic-pink-100 text-ceramic-pink-700" :
                    index === 1 ? "bg-ceramic-blue-100 text-ceramic-blue-700" :
                    index === 2 ? "bg-ceramic-purple-100 text-ceramic-purple-700" :
                    "bg-ceramic-gray-100 text-ceramic-gray-600"
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-ceramic-primary truncate">{item.career}</span>
                      <span className="text-sm font-semibold text-ceramic-secondary">{item.percentage}%</span>
                    </div>
                    <div className="w-full bg-ceramic-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full"
                        style={{
                          width: `${item.percentage * 4}%`,
                          background: "linear-gradient(90deg, rgb(59 130 246) 0%, rgb(139 92 246) 100%)"
                        }}
                      />
                    </div>
                  </div>
                  {item.trend === "up" && <ArrowUp className="w-4 h-4 text-ceramic-positive flex-shrink-0" />}
                  {item.trend === "down" && <ArrowDown className="w-4 h-4 text-ceramic-negative flex-shrink-0" />}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Alerts - Ceramic styled */}
      {alerts.length > 0 && (
        <div className="space-y-3">
          {alerts.map((alert, index) => (
            <CeramicCallout
              key={index}
              variant={
                alert.type === "warning"
                  ? "ceramic-warning"
                  : alert.type === "success"
                  ? "ceramic-success"
                  : "ceramic-info"
              }
              className="flex items-center gap-3"
            >
              <span className="flex-1 text-sm">{alert.message}</span>
            </CeramicCallout>
          ))}
        </div>
      )}
    </div>
  );
}
