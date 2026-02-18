"use client";

/**
 * STUDENT RESULTS PAGE
 * View all exam results, graded homework, and assessment results
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  FileText,
  BookOpen,
  ClipboardCheck,
  TrendingUp,
  TrendingDown,
  Award,
  Filter,
  Download,
  Calendar,
  Clock,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

// Types
interface ExamResult {
  id: string;
  examName: string;
  subject: string;
  examType: "mid_term" | "final" | "board" | "unit_test";
  date: string;
  totalMarks: number;
  obtainedMarks: number;
  percentage: number;
  grade: string;
  rank?: number;
  classAverage: number;
  term: string;
}

interface HomeworkResult {
  id: string;
  title: string;
  subject: string;
  submittedDate: string;
  gradedDate: string;
  totalPoints: number;
  earnedPoints: number;
  percentage: number;
  grade: string;
  teacherName: string;
}

interface AssessmentResult {
  id: string;
  assessmentName: string;
  assessmentType: "RIASEC" | "MBTI" | "DISC" | "Learning Styles" | "Work Values";
  completedDate: string;
  result: string;
  description: string;
}

type ResultTab = "exams" | "homework" | "assessments";

// Mock data
const mockExamResults: ExamResult[] = [
  {
    id: "ex1",
    examName: "Mid-Term Examination",
    subject: "Mathematics",
    examType: "mid_term",
    date: "2025-01-15",
    totalMarks: 100,
    obtainedMarks: 87,
    percentage: 87,
    grade: "A",
    rank: 3,
    classAverage: 72,
    term: "Winter 2024",
  },
  {
    id: "ex2",
    examName: "Mid-Term Examination",
    subject: "English",
    examType: "mid_term",
    date: "2025-01-18",
    totalMarks: 100,
    obtainedMarks: 82,
    percentage: 82,
    grade: "A-",
    classAverage: 75,
    term: "Winter 2024",
  },
  {
    id: "ex3",
    examName: "Mid-Term Examination",
    subject: "Science",
    examType: "mid_term",
    date: "2025-01-20",
    totalMarks: 100,
    obtainedMarks: 79,
    percentage: 79,
    grade: "B+",
    classAverage: 68,
    term: "Winter 2024",
  },
  {
    id: "ex4",
    examName: "Unit Test 3",
    subject: "Mathematics",
    examType: "unit_test",
    date: "2024-12-10",
    totalMarks: 50,
    obtainedMarks: 46,
    percentage: 92,
    grade: "A+",
    classAverage: 78,
    term: "Winter 2024",
  },
  {
    id: "ex5",
    examName: "BCSE Mock Exam",
    subject: "General",
    examType: "board",
    date: "2024-11-25",
    totalMarks: 500,
    obtainedMarks: 412,
    percentage: 82.4,
    grade: "A",
    classAverage: 68,
    term: "Fall 2024",
  },
];

const mockHomeworkResults: HomeworkResult[] = [
  {
    id: "hw1",
    title: "Quadratic Equations Practice",
    subject: "Mathematics",
    submittedDate: "2025-02-14",
    gradedDate: "2025-02-15",
    totalPoints: 50,
    earnedPoints: 42,
    percentage: 84,
    grade: "B+",
    teacherName: "Mrs. Wangmo",
  },
  {
    id: "hw2",
    title: "Essay: Environmental Conservation",
    subject: "English",
    submittedDate: "2025-02-10",
    gradedDate: "2025-02-12",
    totalPoints: 100,
    earnedPoints: 88,
    percentage: 88,
    grade: "A",
    teacherName: "Mr. Dorji",
  },
  {
    id: "hw3",
    title: "Chemical Bonding Worksheet",
    subject: "Science",
    submittedDate: "2025-02-08",
    gradedDate: "2025-02-09",
    totalPoints: 30,
    earnedPoints: 27,
    percentage: 90,
    grade: "A",
    teacherName: "Ms. Pema",
  },
  {
    id: "hw4",
    title: "History: Bhutan's Unification",
    subject: "History",
    submittedDate: "2025-02-05",
    gradedDate: "2025-02-06",
    totalPoints: 40,
    earnedPoints: 35,
    percentage: 87.5,
    grade: "A",
    teacherName: "Mr. Tshering",
  },
  {
    id: "hw5",
    title: "Geography: Map Reading",
    subject: "Geography",
    submittedDate: "2025-02-01",
    gradedDate: "2025-02-02",
    totalPoints: 25,
    earnedPoints: 19,
    percentage: 76,
    grade: "B",
    teacherName: "Ms. Deki",
  },
];

const mockAssessmentResults: AssessmentResult[] = [
  {
    id: "as1",
    assessmentName: "RIASEC Career Assessment",
    assessmentType: "RIASEC",
    completedDate: "2025-02-01",
    result: "Investigative (I) - Conventional (C) - Artistic (A)",
    description: "Your Holland Code suggests careers in science, research, data analysis, and creative problem-solving.",
  },
  {
    id: "as2",
    assessmentName: "MBTI Personality Test",
    assessmentType: "MBTI",
    completedDate: "2025-01-28",
    result: "INFJ - The Advocate",
    description: "Introverted, Intuitive, Feeling, Judging. You are idealistic, organized, and insightful.",
  },
  {
    id: "as3",
    assessmentName: "DISC Workplace Assessment",
    assessmentType: "DISC",
    completedDate: "2025-01-20",
    result: "Steadiness (S) - Conscientiousness (C)",
    description: "You are cooperative, reliable, and value accuracy and stability in your work environment.",
  },
  {
    id: "as4",
    assessmentName: "Learning Styles Inventory",
    assessmentType: "Learning Styles",
    completedDate: "2025-01-15",
    result: "Visual - Kinesthetic",
    description: "You learn best through seeing and doing. Diagrams, charts, and hands-on activities work best for you.",
  },
  {
    id: "as5",
    assessmentName: "Work Values Inventory",
    assessmentType: "Work Values",
    completedDate: "2025-01-10",
    result: "Achievement - Independence - Security",
    description: "You value professional growth, autonomy in decision-making, and job stability.",
  },
];

export default function StudentResultsPage() {
  const [activeTab, setActiveTab] = useState<ResultTab>("exams");
  const [filterType, setFilterType] = useState<string>("all");

  const filteredExams = mockExamResults.filter(
    (exam) => filterType === "all" || exam.examType === filterType
  );

  // Calculate stats
  const examAverage =
    mockExamResults.reduce((sum, exam) => sum + exam.percentage, 0) / mockExamResults.length;
  const homeworkAverage =
    mockHomeworkResults.reduce((sum, hw) => sum + hw.percentage, 0) / mockHomeworkResults.length;
  const totalAssignments = mockHomeworkResults.length;
  const aboveAverageCount = mockExamResults.filter((e) => e.percentage >= e.classAverage).length;

  const getGradeColor = (grade: string) => {
    if (grade.startsWith("A")) return "bg-green-100 text-green-700 border-green-200";
    if (grade.startsWith("B")) return "bg-blue-100 text-blue-700 border-blue-200";
    if (grade.startsWith("C")) return "bg-yellow-100 text-yellow-700 border-yellow-200";
    return "bg-red-100 text-red-700 border-red-200";
  };

  const getGradeBadgeColor = (grade: string) => {
    if (grade.startsWith("A")) return "bg-green-100 text-green-700";
    if (grade.startsWith("B")) return "bg-blue-100 text-blue-700";
    if (grade.startsWith("C")) return "bg-yellow-100 text-yellow-700";
    return "bg-red-100 text-red-700";
  };

  const getExamTypeLabel = (type: string) => {
    switch (type) {
      case "mid_term":
        return "Mid-Term";
      case "final":
        return "Final Exam";
      case "board":
        return "Board Exam";
      case "unit_test":
        return "Unit Test";
      default:
        return type;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Results</h1>
        <p className="text-gray-600 mt-1">Track your academic performance and achievements</p>
      </div>

      {/* Overview Stats */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Exam Average
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{examAverage.toFixed(1)}%</div>
              <p className="text-xs text-gray-500 mt-1">Across {mockExamResults.length} exams</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Homework Average
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{homeworkAverage.toFixed(1)}%</div>
              <p className="text-xs text-gray-500 mt-1">{totalAssignments} assignments</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Above Class Average
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {aboveAverageCount}/{mockExamResults.length}
              </div>
              <p className="text-xs text-gray-500 mt-1">Exams above average</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <ClipboardCheck className="w-4 h-4" />
                Assessments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{mockAssessmentResults.length}</div>
              <p className="text-xs text-gray-500 mt-1">Completed</p>
            </CardContent>
          </Card>
        </div>

        {/* Performance Summary Banner */}
        <Card
          style={{ background: 'linear-gradient(135deg, rgb(249 115 22) 0%, rgb(194 65 12) 100%)' }}
          className="text-white border-0"
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Great Performance This Term!</h3>
                  <p className="text-orange-100 text-sm">
                    You're scoring {examAverage.toFixed(1)}% on average, {examAverage > 75 ? "above" : "at"} the class average.
                    Keep up the good work!
                  </p>
                </div>
              </div>
              <Button variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-0">
                <Download className="w-4 h-4 mr-2" />
                Download Report
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex gap-2">
                <Button
                  variant={activeTab === "exams" ? "default" : "outline"}
                  onClick={() => setActiveTab("exams")}
                  className={activeTab === "exams" ? "" : ""}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Exam Results
                  <Badge variant="secondary" className="ml-2">
                    {mockExamResults.length}
                  </Badge>
                </Button>
                <Button
                  variant={activeTab === "homework" ? "default" : "outline"}
                  onClick={() => setActiveTab("homework")}
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Homework
                  <Badge variant="secondary" className="ml-2">
                    {mockHomeworkResults.length}
                  </Badge>
                </Button>
                <Button
                  variant={activeTab === "assessments" ? "default" : "outline"}
                  onClick={() => setActiveTab("assessments")}
                >
                  <ClipboardCheck className="w-4 h-4 mr-2" />
                  Assessments
                  <Badge variant="secondary" className="ml-2">
                    {mockAssessmentResults.length}
                  </Badge>
                </Button>
              </div>

              {activeTab === "exams" && (
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-muted-foreground" />
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="border rounded-md px-3 py-1.5 text-sm"
                  >
                    <option value="all">All Types</option>
                    <option value="mid_term">Mid-Term</option>
                    <option value="final">Final</option>
                    <option value="board">Board Exam</option>
                    <option value="unit_test">Unit Test</option>
                  </select>
                </div>
              )}
            </div>

            {/* Exams Tab */}
            {activeTab === "exams" && (
              <div className="space-y-4">
                {filteredExams.length === 0 ? (
                  <div className="text-center py-12">
                    <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-muted-foreground">No exam results found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-medium text-gray-500">Exam</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-500">Subject</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-500">Date</th>
                          <th className="text-center py-3 px-4 font-medium text-gray-500">Score</th>
                          <th className="text-center py-3 px-4 font-medium text-gray-500">Grade</th>
                          <th className="text-center py-3 px-4 font-medium text-gray-500">vs Class</th>
                          <th className="text-right py-3 px-4 font-medium text-gray-500">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredExams.map((exam) => {
                          const vsClass = exam.percentage - exam.classAverage;
                          return (
                            <tr key={exam.id} className="border-b hover:bg-gray-50">
                              <td className="py-3 px-4">
                                <div>
                                  <p className="font-medium">{exam.examName}</p>
                                  <Badge variant="outline" className="text-xs mt-1">
                                    {getExamTypeLabel(exam.examType)}
                                  </Badge>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-sm">{exam.subject}</td>
                              <td className="py-3 px-4 text-sm text-muted-foreground">
                                {new Date(exam.date).toLocaleDateString()}
                              </td>
                              <td className="py-3 px-4 text-center">
                                <div>
                                  <p className="font-medium">
                                    {exam.obtainedMarks}/{exam.totalMarks}
                                  </p>
                                  <p className="text-sm text-muted-foreground">{exam.percentage}%</p>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <Badge className={getGradeBadgeColor(exam.grade)}>{exam.grade}</Badge>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  {vsClass >= 0 ? (
                                    <TrendingUp className="w-4 h-4 text-green-500" />
                                  ) : (
                                    <TrendingDown className="w-4 h-4 text-red-500" />
                                  )}
                                  <span
                                    className={`text-sm font-medium ${
                                      vsClass >= 0 ? "text-green-600" : "text-red-600"
                                    }`}
                                  >
                                    {vsClass > 0 ? "+" : ""}
                                    {vsClass.toFixed(1)}%
                                  </span>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-right">
                                <Button variant="ghost" size="sm">
                                  View <ChevronRight className="w-4 h-4 ml-1" />
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Homework Tab */}
            {activeTab === "homework" && (
              <div className="space-y-4">
                {mockHomeworkResults.length === 0 ? (
                  <div className="text-center py-12">
                    <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-muted-foreground">No graded homework found</p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-4">
                    {mockHomeworkResults.map((hw) => (
                      <Card key={hw.id} className="hover:shadow-md transition-shadow">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-base">{hw.title}</CardTitle>
                              <CardDescription className="flex items-center gap-2 mt-1">
                                <Badge variant="outline">{hw.subject}</Badge>
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {new Date(hw.gradedDate).toLocaleDateString()}
                                </span>
                              </CardDescription>
                            </div>
                            <Badge className={getGradeBadgeColor(hw.grade)}>{hw.grade}</Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div>
                              <div className="flex items-center justify-between text-sm mb-1">
                                <span className="text-muted-foreground">Score</span>
                                <span className="font-medium">
                                  {hw.earnedPoints}/{hw.totalPoints} ({hw.percentage}%)
                                </span>
                              </div>
                              <Progress value={hw.percentage} className="h-2" />
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Graded by</span>
                              <span>{hw.teacherName}</span>
                            </div>
                            <Link
                              href={`/student/homework/${hw.id}/feedback`}
                              className="block"
                            >
                              <Button variant="outline" className="w-full mt-2">
                                View Feedback
                                <ChevronRight className="w-4 h-4 ml-2" />
                              </Button>
                            </Link>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Assessments Tab */}
            {activeTab === "assessments" && (
              <div className="space-y-4">
                {mockAssessmentResults.length === 0 ? (
                  <div className="text-center py-12">
                    <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-muted-foreground">No assessment results found</p>
                    <Link href="/student/assessment">
                      <Button className="mt-4">Take an Assessment</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {mockAssessmentResults.map((assessment) => (
                      <Card key={assessment.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <ClipboardCheck className="w-5 h-5 text-purple-500" />
                                <h3 className="font-semibold">{assessment.assessmentName}</h3>
                                <Badge variant="outline" className="text-xs">
                                  {assessment.assessmentType}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">
                                Completed: {new Date(assessment.completedDate).toLocaleDateString()}
                              </p>
                              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-2">
                                <p className="font-medium text-purple-900">{assessment.result}</p>
                              </div>
                              <p className="text-sm text-gray-600">{assessment.description}</p>
                            </div>
                            <Link href={`/student/results/${assessment.id}`}>
                              <Button variant="outline" size="sm">
                                View Details
                                <ChevronRight className="w-4 h-4 ml-2" />
                              </Button>
                            </Link>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
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
            <div className="grid md:grid-cols-3 gap-4">
              <Link href="/student/assessment" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <ClipboardCheck className="w-4 h-4 mr-2" />
                  Take New Assessment
                </Button>
              </Link>
              <Link href="/student/homework" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <BookOpen className="w-4 h-4 mr-2" />
                  View Homework
                </Button>
              </Link>
              <Button variant="outline" className="w-full justify-start">
                <Download className="w-4 h-4 mr-2" />
                Download All Results
              </Button>
            </div>
          </CardContent>
        </Card>
    </div>
  );
}
