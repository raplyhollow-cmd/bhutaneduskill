/**
 * PARENT DASHBOARD PAGE
 *
 * Server-side dashboard with multi-child selection, progress overview,
 * and AI-powered insights.
 */

// Force dynamic rendering because this page uses authentication
export const dynamic = 'force-dynamic';

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
  Mail,
} from "lucide-react";
import Link from "next/link";
import { ParentChildSelector } from "./child-selector";
import { ParentAIInsights } from "./ai-insights-wrapper";
import { getParentDashboardData } from "./_actions";

interface ParentDashboardProps {
  params: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ParentDashboardPage({ params }: ParentDashboardProps) {
  // Resolve params promise
  const resolvedParams = await params;

  const dashboardData = await getParentDashboardData();

  if (!dashboardData) {
    return (
      <div className="space-y-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-16 text-center">
            <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-red-900 mb-2">Error Loading Dashboard</h2>
            <p className="text-red-700">Failed to load dashboard data. Please try refreshing.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { children, stats } = dashboardData;

  if (children.length === 0) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="py-16 text-center">
            <Users className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">No Children Found</h2>
            <p className="text-gray-500 mb-6">
              You don&apos;t have any children linked to your account yet.
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

  // Get selected child from URL params or default to first child
  const selectedChildId = typeof resolvedParams.child === "string"
    ? resolvedParams.child
    : children[0]?.id;

  const selectedChild = children.find((c) => c.id === selectedChildId) || children[0];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <Card
        style={{ background: "linear-gradient(135deg, rgb(107 114 128) 0%, rgb(75 85 99) 100%)" }}
        className="text-white border-0"
      >
        <CardContent className="pt-6">
          <h1 className="text-3xl font-bold mb-1">
            Welcome back, {selectedChild.firstName} {selectedChild.lastName}!
          </h1>
          <p className="text-gray-200">
            Here&apos;s what&apos;s happening with {selectedChild.firstName}&apos;s education journey
          </p>
        </CardContent>
      </Card>

      {/* Multi-child Selector */}
      {children.length > 1 && (
        <ParentChildSelector
          children={children}
          selectedChildId={selectedChildId}
        />
      )}

      {/* AI Insights Section */}
      <ParentAIInsights childData={selectedChild} />

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
              Class
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {selectedChild.classGrade || "-"} - {selectedChild.section || "-"}
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
              Nu. {selectedChild.feeStatus?.amountPaid || 0}
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
              <Link href={`/parent/progress?child=${selectedChildId}`}>View All</Link>
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

      {/* Fee Status */}
      {selectedChild.feeStatus?.amountPending && selectedChild.feeStatus.amountPending > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-900">
              <Bell className="w-5 h-5" />
              Fee Payment Reminder
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-amber-800">
              You have <strong>Nu. {selectedChild.feeStatus.amountPending}</strong> pending for fee payment.
            </p>
            <div className="mt-4">
              <Button style={{ background: "linear-gradient(135deg, rgb(249 115 22) 0%, rgb(194 65 12) 100%)" }} asChild>
                <Link href={`/parent/fees/pay?child=${selectedChildId}`}>
                  <DollarSign className="w-4 h-4 mr-2 text-white" />
                  Pay Fees Online
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" asChild className="w-full">
              <Link href={`/parent/messages?child=${selectedChildId}`}>
                <Mail className="w-4 h-4 mr-2" />
                Messages
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link href={`/parent/schedule?child=${selectedChildId}`}>
                <Calendar className="w-4 h-4 mr-2" />
                Schedule
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link href={`/parent/progress?child=${selectedChildId}`}>
                <GraduationCap className="w-4 h-4 mr-2" />
                Progress
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link href={`/parent/fees/pay?child=${selectedChildId}`}>
                <DollarSign className="w-4 h-4 mr-2" />
                Fees
              </Link>
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
