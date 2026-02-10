/**
 * PARENT PROGRESS PAGE
 *
 * Allows parents to view detailed progress of their child, including:
 * - Academic performance summary
 * - Attendance trends
 * - Homework completion rates
 * - Assessment results
 * - Teacher comments
 * - Comparison with class average
 */

"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChildSelector, Child } from "@/components/parent/child-selector";
import {
  TrendingUp,
  TrendingDown,
  BookOpen,
  CheckCircle,
  Clock,
  AlertCircle,
  Star,
  Calendar,
  MessageSquare,
  BarChart3,
  Award,
  Target,
  Download,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  GraduationCap,
} from "lucide-react";
import Link from "next/link";

// Mock children data
const mockChildren: Child[] = [
  {
    id: "child1",
    name: "Tashi Dorji",
    firstName: "Tashi",
    lastName: "Dorji",
    grade: "Class 10",
    classGrade: 10,
    section: "A",
    school: "Yangchenphug HSS",
    assessmentCompleted: true,
    riasecCode: "AIR",
  },
  {
    id: "child2",
    name: "Pema Lhamo",
    firstName: "Pema",
    lastName: "Lhamo",
    grade: "Class 8",
    classGrade: 8,
    section: "B",
    school: "Motithang HSS",
    assessmentCompleted: true,
    riasecCode: "SCE",
  },
];

// Mock academic data
const mockAcademicData = {
  overallAverage: 85,
  classAverage: 78,
  rank: 5,
  totalStudents: 32,
  term: "Spring 2025",
  subjects: [
    { name: "Mathematics", score: 88, classAvg: 75, trend: "up", grade: "A+" },
    { name: "English", score: 82, classAvg: 72, trend: "up", grade: "A" },
    { name: "Science", score: 85, classAvg: 78, trend: "stable", grade: "A" },
    { name: "Dzongkha", score: 78, classAvg: 68, trend: "down", grade: "B+" },
    { name: "History", score: 90, classAvg: 80, trend: "up", grade: "A+" },
    { name: "ICT", score: 95, classAvg: 82, trend: "up", grade: "A+" },
  ],
  attendance: {
    present: 45,
    absent: 2,
    late: 3,
    excused: 1,
    percentage: 92,
    trend: "up",
  },
  homework: {
    total: 24,
    submitted: 22,
    pending: 2,
    graded: 20,
    averageScore: 87,
    onTimeRate: 95,
  },
  assessments: [
    { name: "RIASEC", date: "2025-01-15", result: "AIR - Artistic", score: null },
    { name: "Midterm Exam", date: "2025-02-01", result: "85%", score: 85 },
    { name: "Unit Test - Math", date: "2025-02-10", result: "88%", score: 88 },
  ],
};

// Mock teacher comments
const mockTeacherComments = [
  {
    id: 1,
    teacher: "Mr. Wangchuk",
    subject: "Mathematics",
    date: "2025-02-08",
    comment: "Tashi shows excellent problem-solving skills. Consistently completes assignments on time and helps classmates.",
    sentiment: "positive",
  },
  {
    id: 2,
    teacher: "Ms. Tshering",
    subject: "English",
    date: "2025-02-05",
    comment: "Good participation in class discussions. Writing skills are improving. Encourage more reading at home.",
    sentiment: "positive",
  },
  {
    id: 3,
    teacher: "Mrs. Dorji",
    subject: "Science",
    date: "2025-02-03",
    comment: "Strong grasp of concepts. Lab reports are well-written. Could benefit from more independent research.",
    sentiment: "neutral",
  },
];

// Mock monthly progress
const mockMonthlyProgress = [
  { month: "Sep", average: 80, attendance: 88 },
  { month: "Oct", average: 82, attendance: 90 },
  { month: "Nov", average: 79, attendance: 85 },
  { month: "Dec", average: 84, attendance: 91 },
  { month: "Jan", average: 86, attendance: 93 },
  { month: "Feb", average: 85, attendance: 92 },
];

type TimeRange = "week" | "month" | "term" | "year";
type TabType = "overview" | "subjects" | "attendance" | "homework" | "comments";

export default function ParentProgressPage() {
  const [selectedChild, setSelectedChild] = useState<Child>(mockChildren[0]);
  const [timeRange, setTimeRange] = useState<TimeRange>("term");
  const [activeTab, setActiveTab] = useState<TabType>("overview");

  const parentPortalGradient = {
    background: "linear-gradient(135deg, rgb(107 114 128) 0%, rgb(75 85 99) 100%)"
  };

  const getTrendIcon = (trend: string) => {
    if (trend === "up") return <ArrowUp className="w-4 h-4 text-green-500" />;
    if (trend === "down") return <ArrowDown className="w-4 h-4 text-red-500" />;
    return <div className="w-4 h-4 bg-gray-300 rounded-full" />;
  };

  const getGradeColor = (grade: string) => {
    if (grade.startsWith("A")) return "text-green-600 bg-green-100";
    if (grade.startsWith("B")) return "text-blue-600 bg-blue-100";
    if (grade.startsWith("C")) return "text-yellow-600 bg-yellow-100";
    return "text-red-600 bg-red-100";
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <div className="space-y-6">
            {/* Performance Summary */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5" style={{ color: "rgb(107 114 128)" }} />
                    Academic Performance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Overall Average</p>
                      <p className="text-3xl font-bold text-gray-900">{mockAcademicData.overallAverage}%</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Class Average</p>
                      <p className="text-xl font-semibold text-gray-600">{mockAcademicData.classAverage}%</p>
                    </div>
                  </div>
                  <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${mockAcademicData.overallAverage}%`,
                        background: "linear-gradient(90deg, rgb(107 114 128), rgb(75 85 99))"
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-sm text-gray-500">Class Rank</span>
                    <span className="text-lg font-bold" style={{ color: "rgb(107 114 128)" }}>
                      #{mockAcademicData.rank} / {mockAcademicData.totalStudents}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    Attendance Rate
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">This Term</p>
                      <p className="text-3xl font-bold text-green-600">{mockAcademicData.attendance.percentage}%</p>
                    </div>
                    <div className="flex items-center gap-1 text-green-600">
                      <TrendingUp className="w-5 h-5" />
                      <span className="text-sm font-medium">+3%</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="p-2 bg-green-50 rounded">
                      <p className="text-lg font-bold text-green-600">{mockAcademicData.attendance.present}</p>
                      <p className="text-xs text-gray-500">Present</p>
                    </div>
                    <div className="p-2 bg-red-50 rounded">
                      <p className="text-lg font-bold text-red-600">{mockAcademicData.attendance.absent}</p>
                      <p className="text-xs text-gray-500">Absent</p>
                    </div>
                    <div className="p-2 bg-yellow-50 rounded">
                      <p className="text-lg font-bold text-yellow-600">{mockAcademicData.attendance.late}</p>
                      <p className="text-xs text-gray-500">Late</p>
                    </div>
                    <div className="p-2 bg-blue-50 rounded">
                      <p className="text-lg font-bold text-blue-600">{mockAcademicData.attendance.excused}</p>
                      <p className="text-xs text-gray-500">Excused</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Subject Performance */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Subject-wise Performance</CardTitle>
                    <CardDescription>Compared to class average</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/parent/progress?child=${selectedChild.id}&tab=subjects`}>
                      View All
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockAcademicData.subjects.slice(0, 4).map((subject) => (
                    <div key={subject.name} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{subject.name}</span>
                          {getTrendIcon(subject.trend)}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getGradeColor(subject.grade)}>{subject.grade}</Badge>
                          <span className="font-bold">{subject.score}%</span>
                          <span className="text-sm text-gray-500">(class: {subject.classAvg}%)</span>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${subject.score}%`,
                              background: "linear-gradient(90deg, rgb(107 114 128), rgb(75 85 99))"
                            }}
                          />
                        </div>
                        <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden relative">
                          <div
                            className="absolute h-full bg-blue-400 rounded-full"
                            style={{ left: `${subject.classAvg - 10}%`, width: "20px" }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Assessment Results */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500" />
                  Recent Assessment Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockAcademicData.assessments.map((assessment) => (
                    <div
                      key={assessment.name}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{assessment.name}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(assessment.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold" style={{ color: "rgb(107 114 128)" }}>
                          {assessment.result}
                        </p>
                        {assessment.score !== null && (
                          <Badge
                            className={
                              assessment.score >= 80
                                ? "bg-green-100 text-green-700"
                                : assessment.score >= 60
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-red-100 text-red-700"
                            }
                          >
                            {assessment.score >= 80 ? "Excellent" : assessment.score >= 60 ? "Good" : "Needs Work"}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case "subjects":
        return (
          <div className="space-y-4">
            {mockAcademicData.subjects.map((subject) => (
              <Card key={subject.name}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{subject.name}</h3>
                        {getTrendIcon(subject.trend)}
                        <Badge className={getGradeColor(subject.grade)}>{subject.grade}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-gray-500">Class Average: {subject.classAvg}%</span>
                        <span
                          className={`font-medium ${
                            subject.score > subject.classAvg ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {subject.score > subject.classAvg ? "+" : ""}
                          {subject.score - subject.classAvg}% vs class
                        </span>
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold" style={{ color: "rgb(107 114 128)" }}>
                        {subject.score}%
                      </p>
                    </div>
                  </div>
                  <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${subject.score}%`,
                        background: "linear-gradient(90deg, rgb(107 114 128), rgb(75 85 99))"
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        );

      case "attendance":
        return (
          <div className="space-y-6">
            {/* Monthly Attendance Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Monthly Attendance Trend</CardTitle>
                <CardDescription>Attendance percentage over the academic term</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between gap-2 h-48">
                  {mockMonthlyProgress.map((month) => (
                    <div key={month.month} className="flex-1 flex flex-col items-center gap-2">
                      <div
                        className="w-full rounded-t-lg transition-all hover:opacity-80"
                        style={{
                          height: `${month.attendance - 60}%`,
                          background: month.attendance >= 90
                            ? "rgb(34 197 94)"
                            : month.attendance >= 80
                            ? "rgb(234 179 8)"
                            : "rgb(239 68 68)",
                        }}
                      />
                      <span className="text-xs font-medium">{month.month}</span>
                      <span className="text-xs text-gray-500">{month.attendance}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Attendance Insights */}
            <Card>
              <CardHeader>
                <CardTitle>Attendance Insights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Excellent attendance record</p>
                    <p className="text-sm text-gray-600">
                      {selectedChild.name} has maintained attendance above 90% this term.
                    </p>
                  </div>
                </div>
                {mockAcademicData.attendance.late > 0 && (
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-yellow-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">Occasional late arrivals</p>
                      <p className="text-sm text-gray-600">
                        {mockAcademicData.attendance.late} late arrivals recorded. Consider adjusting morning routine.
                      </p>
                    </div>
                  </div>
                )}
                {mockAcademicData.attendance.absent > 0 && (
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">
                        {mockAcademicData.attendance.absent} absences this term
                      </p>
                      <p className="text-sm text-gray-600">Ensure make-up work is completed for missed classes.</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );

      case "homework":
        return (
          <div className="space-y-6">
            <div className="grid md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6 text-center">
                  <CheckCircle className="w-10 h-10 mx-auto mb-2 text-green-500" />
                  <p className="text-3xl font-bold text-green-600">{mockAcademicData.homework.submitted}</p>
                  <p className="text-sm text-gray-500">Submitted</p>
                  <p className="text-xs text-gray-400 mt-1">of {mockAcademicData.homework.total} total</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <Star className="w-10 h-10 mx-auto mb-2 text-yellow-500" />
                  <p className="text-3xl font-bold text-yellow-600">{mockAcademicData.homework.averageScore}%</p>
                  <p className="text-sm text-gray-500">Average Score</p>
                  <p className="text-xs text-gray-400 mt-1">on graded work</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <Clock className="w-10 h-10 mx-auto mb-2 text-blue-500" />
                  <p className="text-3xl font-bold text-blue-600">{mockAcademicData.homework.onTimeRate}%</p>
                  <p className="text-sm text-gray-500">On-Time Rate</p>
                  <p className="text-xs text-gray-400 mt-1"> submissions</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Homework Completion Insights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <Star className="w-5 h-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Strong homework performance</p>
                    <p className="text-sm text-gray-600">
                      {selectedChild.name} consistently completes assignments and maintains high scores.
                    </p>
                  </div>
                </div>
                {mockAcademicData.homework.pending > 0 && (
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-orange-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">{mockAcademicData.homework.pending} pending assignments</p>
                      <p className="text-sm text-gray-600">
                        Help {selectedChild.name} prioritize upcoming deadlines.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );

      case "comments":
        return (
          <div className="space-y-4">
            {mockTeacherComments.map((comment) => (
              <Card key={comment.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{comment.teacher}</h4>
                        <Badge variant="outline">{comment.subject}</Badge>
                      </div>
                      <p className="text-sm text-gray-500">
                        {new Date(comment.date).toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <div
                      className={`w-3 h-3 rounded-full ${
                        comment.sentiment === "positive"
                          ? "bg-green-500"
                          : comment.sentiment === "negative"
                          ? "bg-red-500"
                          : "bg-gray-400"
                      }`}
                    />
                  </div>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{comment.comment}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Academic Progress
          </h1>
          <p className="text-gray-600">
            Track {selectedChild.name}&apos;s academic journey
          </p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          Download Report
        </Button>
      </div>

      {/* Child Selector */}
      <ChildSelector
        children={mockChildren}
        selectedChildId={selectedChild.id}
        onChildChange={setSelectedChild}
      />

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-2 overflow-x-auto" aria-label="Progress tabs">
          {([
            { value: "overview", label: "Overview", icon: BarChart3 },
            { value: "subjects", label: "Subjects", icon: BookOpen },
            { value: "attendance", label: "Attendance", icon: CheckCircle },
            { value: "homework", label: "Homework", icon: Star },
            { value: "comments", label: "Comments", icon: MessageSquare },
          ] as const).map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value as TabType)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm whitespace-nowrap transition-colors min-h-[44px] ${
                activeTab === tab.value
                  ? "border-gray-500 text-gray-900"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              aria-current={activeTab === tab.value ? "page" : undefined}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {renderTabContent()}

      {/* AI Insights Card */}
      <Card
        className="border-2"
        style={{ borderColor: "rgb(107 114 128)", background: "linear-gradient(to right, rgb(249 250 251), rgb(243 244 246))" }}
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2" style={{ color: "rgb(55 65 81)" }}>
            <Target className="w-5 h-5" />
            AI-Powered Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <TrendingUp className="w-5 h-5 text-green-500 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900">Above class average in 5 subjects</p>
              <p className="text-sm text-gray-600">
                {selectedChild.name} is performing well above the class average, especially in ICT (95%) and History (90%).
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <GraduationCap className="w-5 h-5 text-blue-500 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900">Strong STEM aptitude</p>
              <p className="text-sm text-gray-600">
                Exceptional performance in Mathematics, Science, and ICT suggests strong analytical and technical skills.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900">Dzongkha needs attention</p>
              <p className="text-sm text-gray-600">
                Consider additional practice at home to improve Dzongkha language skills.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Back Navigation */}
      <div className="pt-4">
        <Button variant="outline" asChild>
          <Link href="/parent">
            Back to Parent Dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
}
