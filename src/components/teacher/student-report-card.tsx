/**
 * STUDENT REPORT CARD COMPONENT
 *
 * Displays aggregated student snapshot including:
 * - Academic performance
 * - Attendance
 * - Behavior summary
 * - Homework completion
 */

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  Calendar,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  Mail,
} from "lucide-react";

interface StudentReportCardProps {
  snapshot: {
    student: {
      name: string;
      className: string;
      grade: number;
      section: string;
      photo?: string;
    };
    academic: {
      averageScore: number;
      grade: string;
      subjects: Array<{ subject: string; score: number; grade: string }>;
    };
    attendance: {
      percentage: number;
      presentDays: number;
      absentDays: number;
      totalDays: number;
      status: "excellent" | "good" | "concern" | "critical";
    };
    behavior: {
      meritPoints: number;
      demeritPoints: number;
      netScore: number;
      status: "excellent" | "good" | "review_required" | "concern";
      recentLogs: Array<{
        date: string;
        type: "merit" | "demerit";
        category: string;
        description: string;
        points: number;
      }>;
    };
    homework: {
      completionRate: number;
      averageScore: number;
      submittedOnTime: number;
      missing: number;
    };
    summary: {
      overallStatus: "excellent" | "good" | "satisfactory" | "needs_attention";
      strengths: string[];
      concerns: string[];
      recommendations: string[];
    };
  };
  onEmailParent?: () => void;
  onDownloadPDF?: () => void;
}

const OVERALL_STATUS_CONFIG = {
  excellent: {
    label: "Excellent",
    color: "bg-green-100 text-green-700 border-green-200",
    icon: "🌟",
  },
  good: {
    label: "Good",
    color: "bg-blue-100 text-blue-700 border-blue-200",
    icon: "👍",
  },
  satisfactory: {
    label: "Satisfactory",
    color: "bg-yellow-100 text-yellow-700 border-yellow-200",
    icon: "📊",
  },
  needs_attention: {
    label: "Needs Attention",
    color: "bg-red-100 text-red-700 border-red-200",
    icon: "⚠️",
  },
};

export function StudentReportCard({
  snapshot,
  onEmailParent,
  onDownloadPDF,
}: StudentReportCardProps) {
  const overallConfig = OVERALL_STATUS_CONFIG[snapshot.summary.overallStatus];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {snapshot.student.photo && (
            <img
              src={snapshot.student.photo}
              alt={snapshot.student.name}
              className="w-16 h-16 rounded-full object-cover border-2 border-ceramic-border"
            />
          )}
          <div>
            <h2 className="text-xl font-bold text-ceramic-primary">
              {snapshot.student.name}
            </h2>
            <p className="text-sm text-ceramic-secondary">
              Grade {snapshot.student.grade} - {snapshot.student.section} •{" "}
              {snapshot.student.className}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {onEmailParent && (
            <Button variant="ceramic-outline" size="sm" onClick={onEmailParent}>
              <Mail className="w-4 h-4 mr-2" />
              Email Parent
            </Button>
          )}
          {onDownloadPDF && (
            <Button variant="ceramic" size="sm" onClick={onDownloadPDF}>
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
          )}
        </div>
      </div>

      {/* Overall Status Badge */}
      <Badge
        variant="default"
        className={`${overallConfig.color} px-4 py-2 text-sm`}
      >
        <span className="mr-2">{overallConfig.icon}</span>
        Overall: {overallConfig.label}
      </Badge>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Academic */}
        <Card variant="ceramic">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-ceramic-secondary">Academic</p>
                <p className="text-2xl font-bold text-ceramic-primary">
                  {snapshot.academic.averageScore}%
                </p>
                <p className="text-xs text-ceramic-dimmed">Grade: {snapshot.academic.grade}</p>
              </div>
              <BookOpen className="w-8 h-8 text-ceramic-blue-500" />
            </div>
          </CardContent>
        </Card>

        {/* Attendance */}
        <Card variant="ceramic">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-ceramic-secondary">Attendance</p>
                <p className="text-2xl font-bold text-ceramic-primary">
                  {snapshot.attendance.percentage}%
                </p>
                <p className="text-xs text-ceramic-dimmed">
                  {snapshot.attendance.presentDays}/{snapshot.attendance.totalDays} days
                </p>
              </div>
              <Calendar className="w-8 h-8 text-ceramic-green-500" />
            </div>
          </CardContent>
        </Card>

        {/* Behavior */}
        <Card variant="ceramic">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-ceramic-secondary">Behavior</p>
                <p className="text-2xl font-bold text-ceramic-primary">
                  {snapshot.behavior.netScore > 0 ? "+" : ""}
                  {snapshot.behavior.netScore}
                </p>
                <p className="text-xs text-ceramic-dimmed">
                  {snapshot.behavior.meritPoints} merits / {snapshot.behavior.demeritPoints} demerits
                </p>
              </div>
              {snapshot.behavior.netScore >= 0 ? (
                <TrendingUp className="w-8 h-8 text-ceramic-green-500" />
              ) : (
                <TrendingDown className="w-8 h-8 text-ceramic-red-500" />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Homework */}
        <Card variant="ceramic">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-ceramic-secondary">Homework</p>
                <p className="text-2xl font-bold text-ceramic-primary">
                  {snapshot.homework.completionRate}%
                </p>
                <p className="text-xs text-ceramic-dimmed">
                  {snapshot.homework.missing} missing
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-ceramic-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Section */}
      <Card variant="ceramic">
        <CardHeader>
          <CardTitle className="text-lg">Performance Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Strengths */}
          {snapshot.summary.strengths.length > 0 && (
            <div>
              <p className="text-sm font-medium text-green-700 mb-2 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Strengths
              </p>
              <ul className="space-y-1">
                {snapshot.summary.strengths.map((strength, idx) => (
                  <li key={idx} className="text-sm text-ceramic-secondary pl-6">
                    • {strength}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Concerns */}
          {snapshot.summary.concerns.length > 0 && (
            <div>
              <p className="text-sm font-medium text-red-700 mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Areas for Improvement
              </p>
              <ul className="space-y-1">
                {snapshot.summary.concerns.map((concern, idx) => (
                  <li key={idx} className="text-sm text-ceramic-secondary pl-6">
                    • {concern}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendations */}
          {snapshot.summary.recommendations.length > 0 && (
            <div>
              <p className="text-sm font-medium text-ceramic-blue-600 mb-2 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Recommendations
              </p>
              <ul className="space-y-1">
                {snapshot.summary.recommendations.map((rec, idx) => (
                  <li key={idx} className="text-sm text-ceramic-secondary pl-6">
                    • {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Behavior Logs */}
      {snapshot.behavior.recentLogs.length > 0 && (
        <Card variant="ceramic">
          <CardHeader>
            <CardTitle className="text-lg">Recent Behavior Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {snapshot.behavior.recentLogs.map((log, idx) => (
                <div
                  key={idx}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    log.type === "merit"
                      ? "bg-green-50 border border-green-200"
                      : "bg-red-50 border border-red-200"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {log.type === "merit" ? (
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-600" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-ceramic-primary">
                        {log.description}
                      </p>
                      <p className="text-xs text-ceramic-dimmed">
                        {log.category} • {log.date}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={log.type === "merit" ? "ceramic-success" : "ceramic-error"}
                    className="text-xs"
                  >
                    {log.points > 0 ? "+" : ""}
                    {log.points}
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
