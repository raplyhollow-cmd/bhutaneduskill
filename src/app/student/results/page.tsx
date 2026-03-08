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
  Award,
  Filter,
  Download,
  Calendar,
  ChevronRight,
  AlertCircle,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { logger } from "@/lib/logger";
import { fetchResults } from "../_actions";

// Types based on database schema
interface SubjectResult {
  subjectId: string;
  subjectName: string;
  marksObtained: number;
  maxMarks: number;
  grade: string;
  percentage: number;
}

interface ExamResult {
  id: string;
  examName: string;
  examType: string;
  examDate: string;
  examYear: number;
  academicYear: string;
  term: string;
  subjects?: SubjectResult[];
  subjectResults?: SubjectResult[];
  totalMarks: number;
  maxTotalMarks: number;
  totalMarksObtained?: number;
  percentage: number;
  overallPercentage?: number;
  grade: string;
  rank?: number;
  classRank?: number;
  division?: string;
  remarks?: string;
  isVerified: boolean;
}

interface ExamResultsResponse {
  results: ExamResult[];
  summary: {
    totalExams: number;
    averagePercentage: number;
    bestResult: {
      examName: string;
      overallPercentage: number;
      division: string;
      examYear: number;
    };
    worstResult: {
      examName: string;
      overallPercentage: number;
      division: string;
      examYear: number;
    };
    latestResult: {
      examName: string;
      overallPercentage: number;
      division: string;
      examYear: number;
    } | null;
  } | null;
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

export default function StudentResultsPage() {
  const [activeTab, setActiveTab] = useState<ResultTab>("exams");
  const [filterType, setFilterType] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [examResultsData, setExamResultsData] = useState<ExamResultsResponse | null>(null);
  const [homeworkResults, setHomeworkResults] = useState<HomeworkResult[]>([]);
  const [assessmentResults, setAssessmentResults] = useState<AssessmentResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Fetch all results using server actions
  useEffect(() => {
    const fetchAllResults = async () => {
      try {
        setIsLoading(true);

        // Fetch all results using server action
        const resultsData = await fetchResults();

        // Transform data to match existing interfaces
        setExamResultsData({
          results: resultsData.exams.map((e) => ({
            id: e.id,
            examName: e.examName,
            examType: "terminal",
            examDate: e.date,
            examYear: new Date().getFullYear(),
            academicYear: "",
            term: "",
            totalMarks: e.totalMarks,
            maxTotalMarks: e.totalMarks,
            totalMarksObtained: e.marks,
            percentage: e.percentage,
            overallPercentage: e.percentage,
            grade: e.grade,
            isVerified: true,
          })),
          summary: resultsData.exams.length > 0 ? {
            totalExams: resultsData.exams.length,
            averagePercentage: Math.round(resultsData.exams.reduce((sum, e) => sum + e.percentage, 0) / resultsData.exams.length),
            bestResult: {
              examName: resultsData.exams[0].examName,
              overallPercentage: resultsData.exams[0].percentage,
              division: "I",
              examYear: new Date().getFullYear(),
            },
            worstResult: {
              examName: resultsData.exams[resultsData.exams.length - 1].examName,
              overallPercentage: resultsData.exams[resultsData.exams.length - 1].percentage,
              division: "II",
              examYear: new Date().getFullYear(),
            },
            latestResult: {
              examName: resultsData.exams[0].examName,
              overallPercentage: resultsData.exams[0].percentage,
              division: "I",
              examYear: new Date().getFullYear(),
            },
          } : null,
        });

        setHomeworkResults(resultsData.homework.map((h) => ({
          id: h.id,
          title: h.title,
          subject: h.subject,
          submittedDate: h.date,
          gradedDate: h.date,
          totalPoints: h.maxScore,
          earnedPoints: h.score,
          percentage: Math.round((h.score / h.maxScore) * 100),
          grade: h.score >= 80 ? "A" : h.score >= 60 ? "B" : "C",
          teacherName: "Teacher",
        })));

        setAssessmentResults(resultsData.assessments.map((a) => ({
          id: a.id,
          assessmentName: a.title,
          assessmentType: a.assessmentType as "RIASEC" | "MBTI" | "DISC" | "Learning Styles" | "Work Values",
          completedDate: a.completedAt,
          result: "Completed",
          description: `${a.assessmentType} assessment completed`,
        })));
      } catch (err) {
        logger.error("Error fetching results:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch results");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllResults();
  }, []);

  // Flatten subject results into individual exam records for display
  const flattenedExamResults: ExamResult[] = [];
  if (examResultsData?.results) {
    for (const exam of examResultsData.results) {
      const subjects = exam.subjects || exam.subjectResults || [];
      if (subjects.length > 0) {
        // Create a record for each subject
        for (const subject of subjects) {
          flattenedExamResults.push({
            id: `${exam.id}-${subject.subjectId}`,
            examName: exam.examName,
            examType: exam.examType,
            examDate: exam.examDate,
            examYear: exam.examYear,
            academicYear: exam.academicYear,
            term: exam.term,
            totalMarks: subject.maxMarks,
            maxTotalMarks: exam.maxTotalMarks,
            percentage: subject.percentage,
            grade: subject.grade,
            division: exam.division,
            rank: exam.rank,
            classRank: exam.classRank,
            isVerified: exam.isVerified,
          });
        }
      } else {
        // No subject breakdown, add the overall exam result
        flattenedExamResults.push(exam);
      }
    }
  }

  const filteredExams = flattenedExamResults.filter(
    (exam) => filterType === "all" || exam.examType === filterType
  );

  // Calculate stats from real data
  const examAverage = examResultsData?.summary?.averagePercentage ?? 0;
  const totalExams = examResultsData?.summary?.totalExams ?? 0;
  const homeworkAverage = homeworkResults.length > 0
    ? homeworkResults.reduce((sum, hw) => sum + hw.percentage, 0) / homeworkResults.length
    : 0;
  const totalAssignments = homeworkResults.length;

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

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
          <span className="ml-3 text-gray-600">Loading your results...</span>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <div>
                <p className="font-medium text-red-900">Failed to load results</p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Overview Stats */}
      {!isLoading && !error && (
        <>
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
              <p className="text-xs text-gray-500 mt-1">Across {totalExams} exam{totalExams !== 1 ? 's' : ''}</p>
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
                Best Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {examResultsData?.summary?.bestResult?.overallPercentage ?? 0}%
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {examResultsData?.summary?.bestResult?.examName ?? 'N/A'}
              </p>
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
              <div className="text-2xl font-bold text-purple-600">{assessmentResults.length}</div>
              <p className="text-xs text-gray-500 mt-1">Completed</p>
            </CardContent>
          </Card>
        </div>

        {/* Performance Summary Banner */}
        {examResultsData?.summary && (
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
                    <h3 className="text-lg font-semibold">
                      {examAverage >= 75 ? "Great Performance!" : "Keep Working Hard!"}
                    </h3>
                    <p className="text-orange-100 text-sm">
                      You're scoring {examAverage.toFixed(1)}% on average.
                      {examResultsData.summary.latestResult && (
                        <> Latest: {examResultsData.summary.latestResult.examName} ({examResultsData.summary.latestResult.overallPercentage}%).</>
                      )}
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
        )}

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
                    {flattenedExamResults.length}
                  </Badge>
                </Button>
                <Button
                  variant={activeTab === "homework" ? "default" : "outline"}
                  onClick={() => setActiveTab("homework")}
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Homework
                  <Badge variant="secondary" className="ml-2">
                    {homeworkResults.length}
                  </Badge>
                </Button>
                <Button
                  variant={activeTab === "assessments" ? "default" : "outline"}
                  onClick={() => setActiveTab("assessments")}
                >
                  <ClipboardCheck className="w-4 h-4 mr-2" />
                  Assessments
                  <Badge variant="secondary" className="ml-2">
                    {assessmentResults.length}
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
                          <th className="text-left py-3 px-4 font-medium text-gray-500">Date</th>
                          <th className="text-center py-3 px-4 font-medium text-gray-500">Score</th>
                          <th className="text-center py-3 px-4 font-medium text-gray-500">Grade</th>
                          <th className="text-center py-3 px-4 font-medium text-gray-500">Rank</th>
                          <th className="text-right py-3 px-4 font-medium text-gray-500">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredExams.map((exam) => (
                          <tr key={exam.id} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4">
                              <div>
                                <p className="font-medium">{exam.examName}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="outline" className="text-xs">
                                    {getExamTypeLabel(exam.examType)}
                                  </Badge>
                                  {exam.term && (
                                    <span className="text-xs text-gray-500">{exam.term}</span>
                                  )}
                                  {exam.division && (
                                    <span className="text-xs text-gray-500">• {exam.division}</span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-sm text-muted-foreground">
                              {exam.examDate ? new Date(exam.examDate).toLocaleDateString() : 'N/A'}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <div>
                                <p className="font-medium">
                                  {exam.totalMarksObtained ?? exam.percentage}/{exam.maxTotalMarks}
                                </p>
                                <p className="text-sm text-muted-foreground">{exam.percentage}%</p>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <Badge className={getGradeBadgeColor(exam.grade)}>{exam.grade}</Badge>
                            </td>
                            <td className="py-3 px-4 text-center">
                              {exam.classRank ? (
                                <span className="text-sm font-medium text-gray-700">#{exam.classRank}</span>
                              ) : exam.rank ? (
                                <span className="text-sm font-medium text-gray-700">#{exam.rank}</span>
                              ) : (
                                <span className="text-sm text-gray-400">—</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <Button variant="ghost" size="sm">
                                View <ChevronRight className="w-4 h-4 ml-1" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Homework Tab */}
            {activeTab === "homework" && (
              <div className="space-y-4">
                {homeworkResults.length === 0 ? (
                  <div className="text-center py-12">
                    <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-muted-foreground">No graded homework found</p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-4">
                    {homeworkResults.map((hw) => (
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
                {assessmentResults.length === 0 ? (
                  <div className="text-center py-12">
                    <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-muted-foreground">No assessment results found</p>
                    <Link href="/student/assessment">
                      <Button className="mt-4">Take an Assessment</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {assessmentResults.map((assessment) => (
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
        </>
      )}
    </div>
  );
}
