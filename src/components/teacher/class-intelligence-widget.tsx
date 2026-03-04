"use client";

/**
 * CLASS INTELLIGENCE WIDGET
 *
 * Displays AI-powered class intelligence including:
 * - At-risk student alerts
 * - Teaching recommendations
 * - Class performance insights
 * - Intervention suggestions
 */

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, TrendingUp, Users, AlertCircle, CheckCircle2, Lightbulb, ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface ClassIntelligenceWidgetProps {
  classId?: string;
  teacherId?: string;
}

interface RiskFactor {
  type: string;
  severity: "low" | "medium" | "high" | "critical";
  description: string;
}

interface AtRiskStudent {
  studentId: string;
  studentName: string;
  riskLevel: string;
  primaryConcern: string;
}

interface TeachingRecommendation {
  category: string;
  recommendation: string;
  reason: string;
  impact: string;
}

interface ClassInsight {
  type: string;
  title: string;
  description: string;
  priority: string;
}

interface IntelligenceData {
  classId: string;
  className: string;
  totalStudents: number;
  insights: ClassInsight[];
  recommendations: TeachingRecommendation[];
  atRiskStudents: AtRiskStudent[];
  summary: {
    averageEngagement: number;
    averagePerformance: number;
    attendanceRate: number;
    overallHealth: string;
  };
}

const RISK_COLORS = {
  critical: "bg-red-100 text-red-800 border-red-300",
  high: "bg-orange-100 text-orange-800 border-orange-300",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-300",
  low: "bg-blue-100 text-blue-800 border-blue-300",
  none: "bg-gray-100 text-gray-800 border-gray-300",
};

const HEALTH_COLORS = {
  excellent: "text-green-600",
  good: "text-blue-600",
  concerning: "text-yellow-600",
  critical: "text-red-600",
};

export function ClassIntelligenceWidget({ classId, teacherId }: ClassIntelligenceWidgetProps) {
  const [intelligence, setIntelligence] = useState<IntelligenceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFullReport, setShowFullReport] = useState(false);

  useEffect(() => {
    const fetchIntelligence = async () => {
      try {
        setIsLoading(true);
        const params = new URLSearchParams();
        if (classId) params.set("classId", classId);

        const response = await fetch(`/api/teacher/intelligence?${params.toString()}`);
        if (!response.ok) throw new Error("Failed to fetch intelligence");

        const data = await response.json();
        setIntelligence(data);
      } catch (err) {
        console.error("Failed to fetch class intelligence:", err);
        setError("Unable to load intelligence data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchIntelligence();
  }, [classId]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !intelligence) {
    return null; // Don't show widget on error, or show a minimal version
  }

  const { atRiskStudents, recommendations, insights, summary } = intelligence;

  // Count risk levels
  const criticalCount = atRiskStudents.filter(s => s.riskLevel === "critical").length;
  const highRiskCount = atRiskStudents.filter(s => s.riskLevel === "high").length;

  return (
    <div className="space-y-6">
      {/* Intelligence Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Lightbulb className="w-6 h-6 text-orange-500" />
            Class Intelligence
          </h2>
          <p className="text-gray-600 mt-1">
            AI-powered insights for {intelligence.className}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFullReport(!showFullReport)}
        >
          {showFullReport ? "Hide" : "Show"} Full Report
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Class Health</p>
                <p className={`text-2xl font-bold ${HEALTH_COLORS[summary.overallHealth as keyof typeof HEALTH_COLORS]}`}>
                  {summary.overallHealth.charAt(0).toUpperCase() + summary.overallHealth.slice(1)}
                </p>
              </div>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                summary.overallHealth === "excellent" || summary.overallHealth === "good"
                  ? "bg-green-100"
                  : "bg-red-100"
              }`}>
                {summary.overallHealth === "excellent" || summary.overallHealth === "good" ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Performance</p>
                <p className="text-2xl font-bold text-gray-900">{summary.averagePerformance}%</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Engagement</p>
                <p className="text-2xl font-bold text-gray-900">{summary.averageEngagement}%</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">At Risk</p>
                <p className="text-2xl font-bold text-gray-900">{atRiskStudents.length}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Critical/High Risk Alerts */}
      {(criticalCount > 0 || highRiskCount > 0) && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="w-5 h-5" />
              Urgent Attention Required
            </CardTitle>
            <CardDescription className="text-red-700">
              {criticalCount > 0 && `${criticalCount} critical`}
              {criticalCount > 0 && highRiskCount > 0 && " + "}
              {highRiskCount > 0 && `${highRiskCount} high risk`}
              {criticalCount + highRiskCount === 1 ? " student" : " students"} need immediate support
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {atRiskStudents
                .filter(s => s.riskLevel === "critical" || s.riskLevel === "high")
                .slice(0, 5)
                .map((student) => (
                  <div
                    key={student.studentId}
                    className="flex items-center justify-between p-3 bg-white rounded-lg border border-red-200"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{student.studentName}</p>
                      <p className="text-sm text-gray-600">{student.primaryConcern}</p>
                    </div>
                    <Badge className={RISK_COLORS[student.riskLevel as keyof typeof RISK_COLORS]}>
                      {student.riskLevel.toUpperCase()}
                    </Badge>
                  </div>
                ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="mt-4 border-red-300 text-red-700 hover:bg-red-100"
              asChild
            >
              <a href="/teacher/interventions">
                View Interventions <ArrowRight className="w-4 h-4 ml-2" />
              </a>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Teaching Recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-yellow-500" />
              Teaching Recommendations
            </CardTitle>
            <CardDescription>
              AI-suggested actions to improve class outcomes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recommendations.slice(0, showFullReport ? undefined : 3).map((rec, index) => (
                <div
                  key={index}
                  className="p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className="text-xs">
                          {rec.category}
                        </Badge>
                        <Badge
                          variant={rec.impact === "high" ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {rec.impact} impact
                        </Badge>
                      </div>
                      <p className="font-medium text-gray-900">{rec.recommendation}</p>
                      <p className="text-sm text-gray-600 mt-1">{rec.reason}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Insights */}
      {insights.length > 0 && showFullReport && (
        <Card>
          <CardHeader>
            <CardTitle>Performance Insights</CardTitle>
            <CardDescription>Detailed analysis of class patterns</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {insights.map((insight, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${
                    insight.type === "alert"
                      ? "border-red-200 bg-red-50"
                      : insight.type === "opportunity"
                      ? "border-green-200 bg-green-50"
                      : "border-blue-200 bg-blue-50"
                  }`}
                >
                  <p className="font-medium text-gray-900">{insight.title}</p>
                  <p className="text-sm text-gray-600 mt-1">{insight.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
