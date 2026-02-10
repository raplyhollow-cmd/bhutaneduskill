/**
 * TEACHER REPORTS PAGE
 * Class performance, student progress, attendance summaries, grade distribution
 */
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  CheckCircle,
  Clock,
  FileText,
  Download,
  Calendar,
  Award,
  AlertCircle,
  Loader2,
  BookOpen,
} from "lucide-react";

interface ReportData {
  classPerformance: ClassPerformance[];
  studentProgress: StudentProgress[];
  attendanceSummary: AttendanceSummary[];
  gradeDistribution: GradeDistribution;
}

interface ClassPerformance {
  classId: string;
  className: string;
  subject: string;
  avgScore: number;
  completionRate: number;
  totalStudents: number;
  topPerformers: number;
  needsImprovement: number;
}

interface StudentProgress {
  studentId: string;
  name: string;
  classGrade: number;
  section: string;
  avgScore: number;
  attendanceRate: number;
  homeworkCompletion: number;
  trend: "up" | "down" | "stable";
}

interface AttendanceSummary {
  classId: string;
  className: string;
  presentRate: number;
  absentRate: number;
  lateRate: number;
  mostAbsent: string[];
}

interface GradeDistribution {
  excellent: number; // 90-100%
  good: number; // 75-89%
  average: number; // 60-74%
  belowAverage: number; // < 60%
}

export default function TeacherReportsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [selectedTerm, setSelectedTerm] = useState<string>("current");
  const [reportType, setReportType] = useState<"overview" | "performance" | "attendance" | "grades">(
    "overview"
  );
  const [reportData, setReportData] = useState<ReportData | null>(null);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setIsLoading(true);

        const response = await fetch("/api/teacher/reports");
        if (response.ok) {
          const data = await response.json();
          setReportData(data);
        } else {
          // Mock data
          setReportData({
            classPerformance: [
              {
                classId: "c1",
                className: "Class 10 A",
                subject: "Mathematics",
                avgScore: 78,
                completionRate: 88,
                totalStudents: 42,
                topPerformers: 15,
                needsImprovement: 5,
              },
              {
                classId: "c2",
                className: "Class 10 B",
                subject: "Mathematics",
                avgScore: 72,
                completionRate: 75,
                totalStudents: 38,
                topPerformers: 10,
                needsImprovement: 8,
              },
              {
                classId: "c3",
                className: "Class 9 A",
                subject: "Physics",
                avgScore: 81,
                completionRate: 92,
                totalStudents: 40,
                topPerformers: 18,
                needsImprovement: 3,
              },
            ],
            studentProgress: [
              {
                studentId: "s1",
                name: "Tashi Dorji",
                classGrade: 10,
                section: "A",
                avgScore: 92,
                attendanceRate: 95,
                homeworkCompletion: 98,
                trend: "up",
              },
              {
                studentId: "s2",
                name: "Karma Wangmo",
                classGrade: 10,
                section: "A",
                avgScore: 65,
                attendanceRate: 78,
                homeworkCompletion: 70,
                trend: "down",
              },
              {
                studentId: "s3",
                name: "Pema Lhamo",
                classGrade: 10,
                section: "B",
                avgScore: 88,
                attendanceRate: 91,
                homeworkCompletion: 95,
                trend: "up",
              },
              {
                studentId: "s4",
                name: "Dorji Wangchuk",
                classGrade: 9,
                section: "A",
                avgScore: 74,
                attendanceRate: 85,
                homeworkCompletion: 80,
                trend: "stable",
              },
            ],
            attendanceSummary: [
              {
                classId: "c1",
                className: "Class 10 A",
                presentRate: 88,
                absentRate: 8,
                lateRate: 4,
                mostAbsent: ["Karma Wangmo", "Sonam Choden"],
              },
              {
                classId: "c2",
                className: "Class 10 B",
                presentRate: 85,
                absentRate: 10,
                lateRate: 5,
                mostAbsent: ["Jigme Tenzin", "Dechen Wangmo"],
              },
            ],
            gradeDistribution: {
              excellent: 35,
              good: 40,
              average: 18,
              belowAverage: 7,
            },
          });
        }
      } catch (error) {
        console.error("Error fetching reports:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReports();
  }, []);

  const reportTabs = [
    { value: "overview", label: "Overview", icon: BarChart3 },
    { value: "performance", label: "Class Performance", icon: TrendingUp },
    { value: "attendance", label: "Attendance", icon: CheckCircle },
    { value: "grades", label: "Grade Distribution", icon: Award },
  ];

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6 flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-gray-600">Loading reports...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600">Class performance and student progress analytics</p>
        </div>
        <Button
          style={{ background: "linear-gradient(135deg, rgb(59 130 246) 0%, rgb(37 99 235) 100%)" }}
        >
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="w-full sm:w-[200px] h-11">
                <SelectValue placeholder="Select class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                <SelectItem value="c1">Class 10 A</SelectItem>
                <SelectItem value="c2">Class 10 B</SelectItem>
                <SelectItem value="c3">Class 9 A</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedTerm} onValueChange={setSelectedTerm}>
              <SelectTrigger className="w-full sm:w-[180px] h-11">
                <SelectValue placeholder="Select term" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current">Current Term</SelectItem>
                <SelectItem value="last">Last Term</SelectItem>
                <SelectItem value="year">Academic Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Report Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {reportTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = reportType === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => setReportType(tab.value as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg whitespace-nowrap transition-all min-h-[44px] ${
                isActive
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Overview Report */}
      {reportType === "overview" && reportData && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {reportData.classPerformance.reduce((sum, c) => sum + c.totalStudents, 0)}
                    </p>
                    <p className="text-sm text-gray-600">Total Students</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {Math.round(
                        reportData.classPerformance.reduce((sum, c) => sum + c.avgScore, 0) /
                          reportData.classPerformance.length
                      )}
                      %
                    </p>
                    <p className="text-sm text-gray-600">Avg Score</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {Math.round(
                        reportData.classPerformance.reduce((sum, c) => sum + c.completionRate, 0) /
                          reportData.classPerformance.length
                      )}
                      %
                    </p>
                    <p className="text-sm text-gray-600">Homework Completion</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center">
                    <Clock className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {Math.round(
                        reportData.attendanceSummary.reduce((sum, c) => sum + c.presentRate, 0) /
                          reportData.attendanceSummary.length
                      )}
                      %
                    </p>
                    <p className="text-sm text-gray-600">Attendance Rate</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Class Performance Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Class Performance Summary</CardTitle>
              <CardDescription>Overview of your classes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reportData.classPerformance.map((cls) => (
                  <div key={cls.classId} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">{cls.className}</h3>
                        <p className="text-sm text-gray-600">{cls.subject}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">{cls.avgScore}%</p>
                        <p className="text-xs text-gray-600">Avg Score</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4 text-center">
                      <div>
                        <p className="text-sm text-gray-600">Students</p>
                        <p className="font-semibold">{cls.totalStudents}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Completion</p>
                        <p className="font-semibold text-green-600">{cls.completionRate}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Top</p>
                        <p className="font-semibold text-blue-600">{cls.topPerformers}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Needs Help</p>
                        <p className="font-semibold text-orange-600">{cls.needsImprovement}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Class Performance Report */}
      {reportType === "performance" && reportData && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Student Progress</CardTitle>
              <CardDescription>Individual student performance tracking</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2 font-medium text-gray-600">Student</th>
                      <th className="text-center py-3 px-2 font-medium text-gray-600">Class</th>
                      <th className="text-center py-3 px-2 font-medium text-gray-600">Avg Score</th>
                      <th className="text-center py-3 px-2 font-medium text-gray-600">Attendance</th>
                      <th className="text-center py-3 px-2 font-medium text-gray-600">Homework</th>
                      <th className="text-center py-3 px-2 font-medium text-gray-600">Trend</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.studentProgress.map((student) => (
                      <tr key={student.studentId} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-2 font-medium">{student.name}</td>
                        <td className="text-center py-3 px-2 text-sm text-gray-600">
                          {student.classGrade}-{student.section}
                        </td>
                        <td className="text-center py-3 px-2">
                          <span
                            className={`font-semibold ${
                              student.avgScore >= 80
                                ? "text-green-600"
                                : student.avgScore >= 60
                                ? "text-orange-600"
                                : "text-red-600"
                            }`}
                          >
                            {student.avgScore}%
                          </span>
                        </td>
                        <td className="text-center py-3 px-2">{student.attendanceRate}%</td>
                        <td className="text-center py-3 px-2">{student.homeworkCompletion}%</td>
                        <td className="text-center py-3 px-2">
                          {student.trend === "up" ? (
                            <TrendingUp className="w-5 h-5 text-green-600 inline" />
                          ) : student.trend === "down" ? (
                            <TrendingDown className="w-5 h-5 text-red-600 inline" />
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

          <Card>
            <CardHeader>
              <CardTitle>Homework Submission Rates</CardTitle>
              <CardDescription>By class and subject</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reportData.classPerformance.map((cls) => (
                  <div key={cls.classId}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{cls.className}</span>
                      <span className="text-sm text-gray-600">{cls.completionRate}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="h-3 rounded-full"
                        style={{
                          width: `${cls.completionRate}%`,
                          background: "linear-gradient(90deg, rgb(59 130 246) 0%, rgb(37 99 235) 100%)",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Attendance Report */}
      {reportType === "attendance" && reportData && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Summary</CardTitle>
              <CardDescription>Class-wise attendance breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {reportData.attendanceSummary.map((summary) => (
                  <div key={summary.classId} className="border rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-4">{summary.className}</h3>

                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-gray-600">Present</span>
                          <span className="font-medium text-green-600">{summary.presentRate}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{ width: `${summary.presentRate}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-gray-600">Absent</span>
                          <span className="font-medium text-red-600">{summary.absentRate}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-red-500 h-2 rounded-full"
                            style={{ width: `${summary.absentRate}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-gray-600">Late</span>
                          <span className="font-medium text-orange-600">{summary.lateRate}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-orange-500 h-2 rounded-full"
                            style={{ width: `${summary.lateRate}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {summary.mostAbsent.length > 0 && (
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-xs text-gray-600 mb-2">Most Absent:</p>
                        <div className="flex flex-wrap gap-1">
                          {summary.mostAbsent.map((name) => (
                            <Badge key={name} variant="outline" className="text-xs">
                              {name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Grade Distribution Report */}
      {reportType === "grades" && reportData?.gradeDistribution && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Grade Distribution</CardTitle>
              <CardDescription>Overall performance across all classes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div
                    className="w-24 h-24 rounded-full mx-auto flex items-center justify-center text-white font-bold text-xl"
                    style={{ background: "linear-gradient(135deg, rgb(34 197 94) 0%, rgb(22 163 74) 100%)" }}
                  >
                    {reportData.gradeDistribution.excellent}%
                  </div>
                  <p className="font-semibold mt-3">Excellent</p>
                  <p className="text-sm text-gray-600">90-100%</p>
                </div>

                <div className="text-center">
                  <div
                    className="w-24 h-24 rounded-full mx-auto flex items-center justify-center text-white font-bold text-xl"
                    style={{ background: "linear-gradient(135deg, rgb(59 130 246) 0%, rgb(37 99 235) 100%)" }}
                  >
                    {reportData.gradeDistribution.good}%
                  </div>
                  <p className="font-semibold mt-3">Good</p>
                  <p className="text-sm text-gray-600">75-89%</p>
                </div>

                <div className="text-center">
                  <div
                    className="w-24 h-24 rounded-full mx-auto flex items-center justify-center text-white font-bold text-xl"
                    style={{ background: "linear-gradient(135deg, rgb(249 115 22) 0%, rgb(194 65 12) 100%)" }}
                  >
                    {reportData.gradeDistribution.average}%
                  </div>
                  <p className="font-semibold mt-3">Average</p>
                  <p className="text-sm text-gray-600">60-74%</p>
                </div>

                <div className="text-center">
                  <div
                    className="w-24 h-24 rounded-full mx-auto flex items-center justify-center text-white font-bold text-xl"
                    style={{ background: "linear-gradient(135deg, rgb(239 68 68) 0%, rgb(220 38 38) 100%)" }}
                  >
                    {reportData.gradeDistribution.belowAverage}%
                  </div>
                  <p className="font-semibold mt-3">Below Average</p>
                  <p className="text-sm text-gray-600">&lt; 60%</p>
                </div>
              </div>

              {/* Visualization Bar */}
              <div className="mt-8">
                <div className="h-8 rounded-full overflow-hidden flex">
                  <div
                    className="bg-green-500"
                    style={{ width: `${reportData.gradeDistribution.excellent}%` }}
                    title={`Excellent: ${reportData.gradeDistribution.excellent}%`}
                  />
                  <div
                    className="bg-blue-500"
                    style={{ width: `${reportData.gradeDistribution.good}%` }}
                    title={`Good: ${reportData.gradeDistribution.good}%`}
                  />
                  <div
                    className="bg-orange-500"
                    style={{ width: `${reportData.gradeDistribution.average}%` }}
                    title={`Average: ${reportData.gradeDistribution.average}%`}
                  />
                  <div
                    className="bg-red-500"
                    style={{ width: `${reportData.gradeDistribution.belowAverage}%` }}
                    title={`Below Average: ${reportData.gradeDistribution.belowAverage}%`}
                  />
                </div>
                <div className="flex justify-between mt-2 text-xs text-gray-600">
                  <span>Excellent (90%+)</span>
                  <span>Good (75-89%)</span>
                  <span>Average (60-74%)</span>
                  <span>Below Average (&lt;60%)</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top Performers Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5 text-yellow-600" />
                Recognition
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <h4 className="font-semibold text-green-800 mb-2">Top Performers</h4>
                  <p className="text-sm text-green-700">
                    Students who scored above 90% across all assessments. Consider recommending
                    them for advanced programs or leadership roles.
                  </p>
                </div>

                <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <h4 className="font-semibold text-orange-800 mb-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Needs Support
                  </h4>
                  <p className="text-sm text-orange-700">
                    Students who scored below 60%. Schedule one-on-one sessions to understand
                    challenges and provide additional support.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
