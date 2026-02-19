/**
 * STUDENT PROGRESS PAGE
 *
 * Key features:
 * - Academic performance overview
 * - Subject-wise performance tracking
 * - Attendance trends visualization
 * - Exam results history
 * - Learning module progress
 * - Homework completion rates
 * - AI-powered insights and recommendations
 *
 * Uses real database data via server actions.
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  BookOpen,
  Calendar,
  Award,
  CheckCircle2,
  Clock,
  FileText,
  Users,
  BarChart3,
  Download,
  Lightbulb,
  Target,
  Brain,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { fetchStudentProgress } from "../_actions";
import { Skeleton } from "@/components/ui/skeleton";
import { AICareerCoach } from "@/components/ai/career-coach";
import { cn } from "@/lib/utils";
import { getHomeworkSubmissionStats } from "@/lib/services/progress.service";

// Loading component
function ProgressSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-48 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-48 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Get trend icon based on value
function getTrendIcon(trend: "up" | "down" | "stable") {
  switch (trend) {
    case "up":
      return <TrendingUp className="w-4 h-4 text-green-600" />;
    case "down":
      return <TrendingDown className="w-4 h-4 text-red-600" />;
    default:
      return <Minus className="w-4 h-4 text-gray-400" />;
  }
}

// Get performance color class
function getPerformanceColor(score: number): string {
  if (score >= 80) return "text-green-600";
  if (score >= 60) return "text-yellow-600";
  if (score >= 40) return "text-orange-600";
  return "text-red-600";
}

// Get performance background class
function getPerformanceBg(score: number): string {
  if (score >= 80) return "bg-green-100";
  if (score >= 60) return "bg-yellow-100";
  if (score >= 40) return "bg-orange-100";
  return "bg-red-100";
}

// Get attendance status badge
function getAttendanceBadge(status: string): { class: string; label: string } {
  switch (status) {
    case "present":
      return { class: "bg-green-100 text-green-700", label: "Present" };
    case "absent":
      return { class: "bg-red-100 text-red-700", label: "Absent" };
    case "late":
      return { class: "bg-yellow-100 text-yellow-700", label: "Late" };
    case "excused":
      return { class: "bg-blue-100 text-blue-700", label: "Excused" };
    case "sick_leave":
      return { class: "bg-purple-100 text-purple-700", label: "Sick Leave" };
    default:
      return { class: "bg-gray-100 text-gray-700", label: status };
  }
}

export default async function StudentProgressPage() {
  // Fetch real data from database
  let progressData;
  let homeworkStats;
  try {
    progressData = await fetchStudentProgress();
    homeworkStats = await getHomeworkSubmissionStats(
      (await fetchStudentProgress()).student.id
    );
  } catch (error) {
    return <ProgressSkeleton />;
  }

  const { student, subjects, attendance, examResults, learningProgress, gradeAverage } = progressData;

  // Calculate overall stats
  const totalAssignments = subjects.reduce((sum, s) => sum + s.totalAssignments, 0);
  const completedAssignments = subjects.reduce((sum, s) => sum + s.completedAssignments, 0);
  const homeworkCompletionRate = totalAssignments > 0 ? Math.round((completedAssignments / totalAssignments) * 100) : 0;

  const averageSubjectScore = subjects.length > 0
    ? Math.round(subjects.reduce((sum, s) => sum + s.averageScore, 0) / subjects.length)
    : 0;

  const modulesInProgress = learningProgress.filter(m => !m.isCompleted && m.progress > 0).length;
  const modulesCompleted = learningProgress.filter(m => m.isCompleted).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Academic Progress</h1>
          <p className="text-gray-600 mt-1">
            {student.className || "Student"} • Track your learning journey
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/student/results">
              <FileText className="w-4 h-4 mr-2" />
              View Results
            </Link>
          </Button>
          <Button className="text-white" style={{ background: 'linear-gradient(135deg, rgb(249 115 22) 0%, rgb(194 65 12) 100%)' }} asChild>
            <Link href="/student/homework">
              <BookOpen className="w-4 h-4 mr-2" />
              View Homework
            </Link>
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Grade Average</p>
                <p className={`text-2xl font-bold ${getPerformanceColor(gradeAverage)}`}>
                  {gradeAverage}%
                </p>
              </div>
              <div className={`w-12 h-12 rounded-lg ${getPerformanceBg(gradeAverage)} flex items-center justify-center`}>
                <Award className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Attendance Rate</p>
                <p className={`text-2xl font-bold ${getPerformanceColor(attendance.rate)}`}>
                  {attendance.rate}%
                </p>
              </div>
              <div className={`w-12 h-12 rounded-lg ${getPerformanceBg(attendance.rate)} flex items-center justify-center`}>
                <Calendar className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Homework</p>
                <p className="text-2xl font-bold text-blue-600">
                  {homeworkCompletionRate}%
                </p>
                <p className="text-xs text-gray-500">{completedAssignments}/{totalAssignments} completed</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Learning Modules</p>
                <p className="text-2xl font-bold text-purple-600">
                  {modulesCompleted}/{learningProgress.length}
                </p>
                <p className="text-xs text-gray-500">{modulesInProgress} in progress</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Subject Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Subject Performance
            </CardTitle>
            <CardDescription>Your performance across different subjects</CardDescription>
          </CardHeader>
          <CardContent>
            {subjects.length > 0 ? (
              <div className="space-y-4">
                {subjects.map((subject) => (
                  <div key={subject.subject} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{subject.subject}</span>
                        {getTrendIcon(subject.trend)}
                      </div>
                      <span className={`text-sm font-medium ${getPerformanceColor(subject.averageScore)}`}>
                        {subject.averageScore}%
                      </span>
                    </div>
                    <Progress
                      value={subject.averageScore}
                      className="h-2"
                    />
                    <p className="text-xs text-gray-500">
                      {subject.completedAssignments}/{subject.totalAssignments} assignments completed
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <BookOpen className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No subject performance data yet</p>
                <p className="text-sm">Complete some homework to see your progress!</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Attendance Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Attendance Overview
            </CardTitle>
            <CardDescription>Last 30 days attendance record</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{attendance.present}</p>
                  <p className="text-xs text-gray-500">Present</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">{attendance.absent}</p>
                  <p className="text-xs text-gray-500">Absent</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-yellow-600">{attendance.late}</p>
                  <p className="text-xs text-gray-500">Late</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-600">{attendance.records.length}</p>
                  <p className="text-xs text-gray-500">Total Days</p>
                </div>
              </div>

              {/* Recent Records */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Recent Attendance</p>
                {attendance.records.slice(0, 8).map((record) => {
                  const badge = getAttendanceBadge(record.status);
                  return (
                    <div key={record.date} className="flex items-center justify-between p-2 bg-white rounded border">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className={`w-4 h-4 ${
                          record.status === "present" ? "text-green-600" :
                          record.status === "late" ? "text-yellow-600" :
                          record.status === "absent" ? "text-red-600" : "text-blue-600"
                        }`} />
                        <div>
                          <p className="text-sm font-medium">{record.class}</p>
                          <p className="text-xs text-gray-500">{new Date(record.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</p>
                        </div>
                      </div>
                      <Badge className={badge.class} variant="outline">
                        {badge.label}
                      </Badge>
                    </div>
                  );
                })}
              </div>

              {attendance.records.length === 0 && (
                <div className="text-center py-4 text-gray-500 text-sm">
                  No attendance records available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Exam Results */}
      {examResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Exam Results
            </CardTitle>
            <CardDescription>Your performance in major examinations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Exam</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Type</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Year</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Score</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Division</th>
                  </tr>
                </thead>
                <tbody>
                  {examResults.map((result) => (
                    <tr key={result.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{result.examName}</td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className="capitalize">
                          {result.examType.replace("_", " ")}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">{result.examYear}</td>
                      <td className="py-3 px-4">
                        <span className={`font-medium ${getPerformanceColor(result.overallPercentage)}`}>
                          {result.overallPercentage}%
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {result.division ? (
                          <Badge className={getPerformanceBg(result.overallPercentage)}>
                            {result.division}
                          </Badge>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Learning Progress */}
      {learningProgress.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Learning Modules
            </CardTitle>
            <CardDescription>Track your progress in online learning modules</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {learningProgress.map((module) => (
                <div key={module.moduleId} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{module.moduleTitle}</h4>
                      <p className="text-sm text-gray-500">{module.subject}</p>
                    </div>
                    {module.isCompleted ? (
                      <Badge className="bg-green-100 text-green-700">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Complete
                      </Badge>
                    ) : module.progress > 0 ? (
                      <Badge className="bg-blue-100 text-blue-700">
                        In Progress
                      </Badge>
                    ) : (
                      <Badge variant="outline">Not Started</Badge>
                    )}
                  </div>

                  <Progress value={module.progress} className="h-2 mb-2" />
                  <p className="text-xs text-gray-500 mb-3">{module.progress}% complete</p>

                  <div className="flex items-center justify-between">
                    {module.isCompleted && module.certificateUrl ? (
                      <Button size="sm" variant="outline" asChild>
                        <Link href={module.certificateUrl} target="_blank">
                          <Download className="w-3 h-3 mr-1" />
                          Certificate
                        </Link>
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/student/learning/${module.moduleId}`}>
                          {module.progress > 0 ? "Continue" : "Start"}
                        </Link>
                      </Button>
                    )}

                    {module.isCompleted && (
                      <span className="text-xs text-gray-500">
                        {new Date(module.completedAt || "").toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Homework Submission Statistics */}
      {homeworkStats && homeworkStats.totalSubmissions > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Homework Submission Statistics
            </CardTitle>
            <CardDescription>Your homework submission performance and grading status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4 mb-6">
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm text-green-700 font-medium">On-Time Submissions</p>
                <p className="text-2xl font-bold text-green-800">
                  {homeworkStats.onTimeSubmissions}
                </p>
                <p className="text-xs text-green-600">
                  {homeworkStats.totalSubmissions > 0
                    ? Math.round((homeworkStats.onTimeSubmissions / homeworkStats.totalSubmissions) * 100)
                    : 0}%
                </p>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                <p className="text-sm text-orange-700 font-medium">Late Submissions</p>
                <p className="text-2xl font-bold text-orange-800">
                  {homeworkStats.lateSubmissions}
                </p>
                <p className="text-xs text-orange-600">
                  {homeworkStats.totalSubmissions > 0
                    ? Math.round((homeworkStats.lateSubmissions / homeworkStats.totalSubmissions) * 100)
                    : 0}%
                </p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-700 font-medium">Graded</p>
                <p className="text-2xl font-bold text-blue-800">
                  {homeworkStats.gradedSubmissions}
                </p>
                <p className="text-xs text-blue-600">
                  {homeworkStats.pendingGrading > 0
                    ? `${homeworkStats.pendingGrading} pending`
                    : "All graded"}
                </p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <p className="text-sm text-purple-700 font-medium">Average Score</p>
                <p className={`text-2xl font-bold ${
                  homeworkStats.averageScore >= 80 ? "text-green-800" :
                  homeworkStats.averageScore >= 60 ? "text-yellow-800" :
                  "text-red-800"
                }`}>
                  {homeworkStats.averageScore}%
                </p>
                <p className="text-xs text-purple-600">
                  Range: {homeworkStats.lowestScore}-{homeworkStats.highestScore}
                </p>
              </div>
            </div>

            {homeworkStats.recentSubmissions.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Recent Submissions</h4>
                <div className="space-y-2">
                  {homeworkStats.recentSubmissions.slice(0, 5).map((submission) => (
                    <div key={submission.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        {submission.isLate ? (
                          <Clock className="w-4 h-4 text-orange-500" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {submission.homeworkTitle}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(submission.submittedAt).toLocaleDateString()}
                            {submission.isLate && " • Late"}
                          </p>
                        </div>
                      </div>
                      {submission.score !== null ? (
                        <Badge
                          className={cn(
                            submission.score >= 80 ? "bg-green-100 text-green-700" :
                            submission.score >= 60 ? "bg-yellow-100 text-yellow-700" :
                            "bg-red-100 text-red-700"
                          )}
                        >
                          {submission.score}%
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          {submission.status === "submitted" ? "Pending" : submission.status}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Empty States when no data */}
      {subjects.length === 0 && examResults.length === 0 && learningProgress.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Progress Data Yet</h3>
            <p className="text-gray-500 mb-4 max-w-md mx-auto">
              Start completing homework and taking assessments to track your academic progress here.
            </p>
            <div className="flex justify-center gap-3">
              <Button variant="outline" asChild>
                <Link href="/student/homework">View Homework</Link>
              </Button>
              <Button className="text-white" style={{ background: 'linear-gradient(135deg, rgb(249 115 22) 0%, rgb(194 65 12) 100%)' }} asChild>
                <Link href="/student/assessment">Take Assessment</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI-Powered Academic Insights */}
      <Card className="bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 border-orange-200 overflow-hidden relative">
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-orange-200/20 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-amber-200/20 to-transparent rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <CardHeader className="relative">
          <CardTitle className="flex items-center gap-2 text-orange-900">
            <Brain className="w-5 h-5" />
            AI Academic Insights
          </CardTitle>
          <CardDescription className="text-orange-700">
            Personalized recommendations based on your performance
          </CardDescription>
        </CardHeader>
        <CardContent className="relative space-y-4">
          {/* Performance Summary */}
          <div className="grid md:grid-cols-3 gap-4">
            <div className={cn(
              "p-4 rounded-xl border",
              gradeAverage >= 80 ? "bg-green-50 border-green-200" :
              gradeAverage >= 60 ? "bg-yellow-50 border-yellow-200" :
              gradeAverage >= 40 ? "bg-orange-50 border-orange-200" :
              "bg-red-50 border-red-200"
            )}>
              <div className="flex items-center gap-2 mb-2">
                <Award className={cn(
                  "w-5 h-5",
                  gradeAverage >= 80 ? "text-green-600" :
                  gradeAverage >= 60 ? "text-yellow-600" :
                  gradeAverage >= 40 ? "text-orange-600" :
                  "text-red-600"
                )} />
                <span className="font-semibold text-slate-900">Overall Performance</span>
              </div>
              <p className={cn(
                "text-3xl font-bold",
                gradeAverage >= 80 ? "text-green-600" :
                gradeAverage >= 60 ? "text-yellow-600" :
                gradeAverage >= 40 ? "text-orange-600" :
                "text-red-600"
              )}>
                {gradeAverage}%
              </p>
              <p className="text-sm text-slate-600 mt-1">
                {gradeAverage >= 80 ? "Excellent! Keep it up!" :
                 gradeAverage >= 60 ? "Good progress. Room to grow." :
                 gradeAverage >= 40 ? "Needs improvement." :
                 "Requires immediate attention."}
              </p>
            </div>

            <div className={cn(
              "p-4 rounded-xl border",
              attendance.rate >= 90 ? "bg-green-50 border-green-200" :
              attendance.rate >= 75 ? "bg-yellow-50 border-yellow-200" :
              "bg-red-50 border-red-200"
            )}>
              <div className="flex items-center gap-2 mb-2">
                <Calendar className={cn(
                  "w-5 h-5",
                  attendance.rate >= 90 ? "text-green-600" :
                  attendance.rate >= 75 ? "text-yellow-600" :
                  "text-red-600"
                )} />
                <span className="font-semibold text-slate-900">Attendance</span>
              </div>
              <p className={cn(
                "text-3xl font-bold",
                attendance.rate >= 90 ? "text-green-600" :
                attendance.rate >= 75 ? "text-yellow-600" :
                "text-red-600"
              )}>
                {attendance.rate}%
              </p>
              <p className="text-sm text-slate-600 mt-1">
                {attendance.rate >= 90 ? "Outstanding attendance!" :
                 attendance.rate >= 75 ? "Good, but aim higher." :
                 "Low attendance affects learning."}
              </p>
            </div>

            <div className={cn(
              "p-4 rounded-xl border",
              homeworkCompletionRate >= 80 ? "bg-green-50 border-green-200" :
              homeworkCompletionRate >= 50 ? "bg-yellow-50 border-yellow-200" :
              "bg-red-50 border-red-200"
            )}>
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className={cn(
                  "w-5 h-5",
                  homeworkCompletionRate >= 80 ? "text-green-600" :
                  homeworkCompletionRate >= 50 ? "text-yellow-600" :
                  "text-red-600"
                )} />
                <span className="font-semibold text-slate-900">Homework</span>
              </div>
              <p className={cn(
                "text-3xl font-bold",
                homeworkCompletionRate >= 80 ? "text-green-600" :
                homeworkCompletionRate >= 50 ? "text-yellow-600" :
                "text-red-600"
              )}>
                {homeworkCompletionRate}%
              </p>
              <p className="text-sm text-slate-600 mt-1">
                {homeworkCompletionRate >= 80 ? "Great homework habits!" :
                 homeworkCompletionRate >= 50 ? "Stay consistent." :
                 "Complete more assignments."}
              </p>
            </div>
          </div>

          {/* AI Recommendations */}
          <div className="space-y-3">
            <h4 className="font-semibold text-orange-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              AI Recommendations
            </h4>

            {gradeAverage < 60 && (
              <div className="flex items-start gap-3 p-4 bg-white/70 rounded-lg border border-orange-200">
                <Target className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-slate-900">Focus on Improving Grades</p>
                  <p className="text-sm text-slate-600">
                    Your current average is {gradeAverage}%. Consider:
                  </p>
                  <ul className="text-sm text-slate-600 mt-2 space-y-1">
                    <li>• Attend extra help sessions with teachers</li>
                    <li>• Form study groups with classmates</li>
                    <li>• Use the AI tutor for difficult subjects</li>
                    <li>• Complete all homework on time</li>
                  </ul>
                </div>
              </div>
            )}

            {attendance.rate < 80 && (
              <div className="flex items-start gap-3 p-4 bg-white/70 rounded-lg border border-amber-200">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-slate-900">Improve Your Attendance</p>
                  <p className="text-sm text-slate-600">
                    Your attendance is {attendance.rate}%. Regular attendance is crucial for academic success. Each missed class is a missed learning opportunity.
                  </p>
                </div>
              </div>
            )}

            {homeworkCompletionRate < 70 && subjects.length > 0 && (
              <div className="flex items-start gap-3 p-4 bg-white/70 rounded-lg border border-blue-200">
                <BookOpen className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-slate-900">Complete More Homework</p>
                  <p className="text-sm text-slate-600">
                    You've completed {homeworkCompletionRate}% of assignments. Homework reinforces what you learn in class and significantly impacts your grades.
                  </p>
                </div>
              </div>
            )}

            {gradeAverage >= 80 && attendance.rate >= 90 && homeworkCompletionRate >= 80 && (
              <div className="flex items-start gap-3 p-4 bg-white/70 rounded-lg border border-green-200">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-slate-900">Excellent Work!</p>
                  <p className="text-sm text-slate-600">
                    You're performing exceptionally well! Consider:
                  </p>
                  <ul className="text-sm text-slate-600 mt-2 space-y-1">
                    <li>• Help classmates who are struggling</li>
                    <li>• Explore advanced courses and electives</li>
                    <li>• Prepare for national competitions</li>
                    <li>• Take career assessments to plan ahead</li>
                  </ul>
                </div>
              </div>
            )}

            {subjects.length > 0 && (
              <div className="flex items-start gap-3 p-4 bg-white/70 rounded-lg border border-purple-200">
                <Lightbulb className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-slate-900">Subject Focus Areas</p>
                  <p className="text-sm text-slate-600">
                    {subjects.filter(s => s.averageScore < 60).length > 0
                      ? `Focus on improving: ${subjects.filter(s => s.averageScore < 60).map(s => s.subject).join(", ")}`
                      : "You're doing well across all subjects! Keep up the great work."}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2 pt-4 border-t border-orange-200">
            <Button variant="outline" size="sm" asChild>
              <Link href="/student/assessment">
                <Brain className="w-4 h-4 mr-2" />
                Take Career Assessment
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/student/homework">
                <BookOpen className="w-4 h-4 mr-2" />
                View Homework
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/student/plan">
                <Target className="w-4 h-4 mr-2" />
                Update Study Plan
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* AI Career Coach */}
      <Card className="border-blue-200 bg-blue-50/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <Sparkles className="w-5 h-5" />
            Ask AI About Your Progress
          </CardTitle>
          <CardDescription className="text-blue-700">
            Get personalized study tips, career guidance, and academic advice
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AICareerCoach />
        </CardContent>
      </Card>
    </div>
  );
}
