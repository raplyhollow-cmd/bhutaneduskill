"use client";

import { logger } from "@/lib/logger";
/**
 * PARENT DASHBOARD PAGE (WITH AI INSIGHTS)
 *
 * Key features:
 * - Multi-child selection
 * - Child progress overview with AI insights
 * - Fee payment alerts
 * - Communication with teachers
 */


import { useState, useEffect, useRef, useMemo } from "react";
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
  RefreshCw,
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

interface AIInsight {
  type: "warning" | "success" | "info" | "tip";
  title: string;
  message: string;
  actions?: Array<{ label: string; href: string }>;
}

export default function ParentDashboardPage() {
  const router = useRouter();
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<ParentStats | null>(null);
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([]);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsError, setInsightsError] = useState<string | null>(null);

  const hasFetched = useRef(false);
  const insightsFetchedRef = useRef<Set<string>>(new Set());

  // Selected child data (memoized to avoid issues with useEffect dependency)
  const selectedChild = useMemo(
    () => children.find((c) => c.id === selectedChildId),
    [children, selectedChildId]
  );

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
        logger.error("Error fetching parent data:", err);
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchParentData();
  }, []);

  // Fetch AI insights when selected child changes
  useEffect(() => {
    if (!selectedChildId || !selectedChild) return;

    // Skip if we've already fetched insights for this child
    if (insightsFetchedRef.current.has(selectedChildId)) return;

    const fetchAIInsights = async () => {
      try {
        setInsightsLoading(true);
        setInsightsError(null);

        // Calculate average score from recent grades
        let averageScore = 0;
        if (selectedChild.recentGrades && selectedChild.recentGrades.length > 0) {
          const recentGrades = selectedChild.recentGrades.slice(0, 5);
          const gradeMap: Record<string, number> = {
            "A+": 95, "A": 90, "B+": 85, "B": 80, "C+": 75, "C": 70,
            "D+": 65, "D": 60, "E": 55, "F": 50
          };
          const totalScore = recentGrades.reduce((sum, g) => sum + (gradeMap[g.grade] || 0), 0);
          averageScore = Math.round(totalScore / recentGrades.length);
        }

        const response = await fetch("/api/ai/insights", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userRole: "parent",
            contextData: {
              stats: {
                childName: `${selectedChild.firstName} ${selectedChild.lastName}`,
                attendance: selectedChild.attendance,
                pendingHomework: selectedChild.homeworkPending,
                averageScore: averageScore,
                classGrade: selectedChild.classGrade,
                section: selectedChild.section,
                careerInterests: selectedChild.careerInterests || [],
                feePending: selectedChild.feeStatus?.amountPending || 0,
              }
            }
          })
        });

        if (!response.ok) {
          throw new Error("Failed to fetch AI insights");
        }

        const data = await response.json();

        if (data.success && data.insights) {
          setAiInsights(data.insights);
        } else {
          // Fall back to empty array if API returns no insights
          setAiInsights([]);
        }

        // Mark that we've fetched insights for this child
        insightsFetchedRef.current.add(selectedChildId);

      } catch (err) {
        logger.error("Error fetching AI insights:", err);
        setInsightsError("Failed to load AI insights");
        setAiInsights([]);
      } finally {
        setInsightsLoading(false);
      }
    };

    fetchAIInsights();
  }, [selectedChildId, selectedChild]);

  // Refresh AI insights function
  const refreshInsights = async () => {
    if (!selectedChildId || !selectedChild) return;

    try {
      setInsightsLoading(true);
      setInsightsError(null);

      // Clear the cached insights for this child
      insightsFetchedRef.current.delete(selectedChildId);

      // Calculate average score from recent grades
      let averageScore = 0;
      if (selectedChild.recentGrades && selectedChild.recentGrades.length > 0) {
        const recentGrades = selectedChild.recentGrades.slice(0, 5);
        const gradeMap: Record<string, number> = {
          "A+": 95, "A": 90, "B+": 85, "B": 80, "C+": 75, "C": 70,
          "D+": 65, "D": 60, "E": 55, "F": 50
        };
        const totalScore = recentGrades.reduce((sum, g) => sum + (gradeMap[g.grade] || 0), 0);
        averageScore = Math.round(totalScore / recentGrades.length);
      }

      const response = await fetch("/api/ai/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userRole: "parent",
          contextData: {
            stats: {
              childName: `${selectedChild.firstName} ${selectedChild.lastName}`,
              attendance: selectedChild.attendance,
              pendingHomework: selectedChild.homeworkPending,
              averageScore: averageScore,
              classGrade: selectedChild.classGrade,
              section: selectedChild.section,
              careerInterests: selectedChild.careerInterests || [],
              feePending: selectedChild.feeStatus?.amountPending || 0,
            }
          }
        })
      });

      if (!response.ok) {
        throw new Error("Failed to fetch AI insights");
      }

      const data = await response.json();

      if (data.success && data.insights) {
        setAiInsights(data.insights);
      } else {
        setAiInsights([]);
      }

      // Mark that we've fetched insights for this child
      insightsFetchedRef.current.add(selectedChildId);

    } catch (err) {
      logger.error("Error refreshing AI insights:", err);
      setInsightsError("Failed to refresh AI insights");
      setAiInsights([]);
    } finally {
      setInsightsLoading(false);
    }
  };

  // Handle child selection change
  const handleChildChange = (childId: string) => {
    setSelectedChildId(childId);
    setAiInsights([]); // Clear insights for new child
    setInsightsError(null);
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
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-4 overflow-x-auto pb-2">
              <Badge className="bg-gray-100 text-gray-700 px-3 py-1.5 whitespace-nowrap">
                {children.length} Children
              </Badge>
              <div className="flex gap-2">
                {children.map((child) => (
                  <Button
                    key={child.id}
                    variant={selectedChildId === child.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleChildChange(child.id)}
                    className="whitespace-nowrap"
                    style={
                      selectedChildId === child.id
                        ? { background: "linear-gradient(135deg, rgb(107 114 128) 0%, rgb(75 85 99) 100%)" }
                        : undefined
                    }
                  >
                    {child.firstName} {child.lastName}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Insights Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            AI Insights for {selectedChild.firstName}
          </h2>
          <div className="flex items-center gap-2">
            {insightsLoading && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </div>
            )}
            {!insightsLoading && (
              <Button
                variant="ghost"
                size="sm"
                onClick={refreshInsights}
                className="text-gray-500 hover:text-gray-700"
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                Refresh
              </Button>
            )}
          </div>
        </div>

        {insightsLoading ? (
          <div className="grid md:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <Card key={i} className="border-2 border-gray-200">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-100 animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
                      <div className="h-3 bg-gray-200 rounded animate-pulse w-full" />
                      <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : insightsError ? (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-900">Could not load AI insights</p>
                  <p className="text-sm text-amber-700">{insightsError}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => {
                      setInsightsError(null);
                      insightsFetchedRef.current.delete(selectedChildId);
                      window.location.reload();
                    }}
                  >
                    Retry
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : aiInsights.length > 0 ? (
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
        ) : (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-900">No insights available</p>
                  <p className="text-sm text-blue-700">
                    AI insights will appear here once {selectedChild.firstName} has more activity data.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
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
