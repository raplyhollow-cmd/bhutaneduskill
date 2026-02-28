"use client";

/**
 * PARENT PORTAL - PROGRESS PAGE
 *
 * Track child's academic progress including:
 * - Subject-wise grades and performance
 * - Assessment results
 * - Attendance correlation
 * - Progress over time
 * - Report cards
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp, TrendingDown, BookOpen, GraduationCap, Calendar, Award, AlertCircle } from "lucide-react";

// ============================================================================
// TYPES
// ============================================================================

interface SubjectGrade {
  subject: string;
  grade: string;
  score: number;
  maxScore: number;
  percentage: number;
  trend: "up" | "down" | "stable";
}

interface AssessmentResult {
  id: string;
  type: string;
  title: string;
  score: number;
  status: "completed" | "in_progress" | "pending";
  completedAt?: string;
}

interface ProgressData {
  studentId: string;
  studentName: string;
  classGrade: number;
  section: string;
  academicYear: string;
  overallPercentage: number;
  overallGrade: string;
  classRank?: number;
  totalStudents?: number;
  subjects: SubjectGrade[];
  assessments: AssessmentResult[];
  attendanceRate: number;
  totalClasses: number;
  presentDays: number;
  term: string;
}

// ============================================================================
// COMPONENTS
// ============================================================================

function SubjectGradeCard({ subject }: { subject: SubjectGrade }) {
  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return "bg-green-100 text-green-700 border-green-200";
    if (percentage >= 75) return "bg-blue-100 text-blue-700 border-blue-200";
    if (percentage >= 60) return "bg-yellow-100 text-yellow-700 border-yellow-200";
    return "bg-red-100 text-red-700 border-red-200";
  };

  return (
    <div className="flex items-center justify-between p-3 border rounded-lg">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
          <BookOpen className="w-5 h-5 text-gray-600" />
        </div>
        <div>
          <p className="font-medium text-gray-900">{subject.subject}</p>
          <p className="text-xs text-gray-500">{subject.score}/{subject.maxScore}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Badge className={getGradeColor(subject.percentage)} variant="outline">
          {subject.grade}
        </Badge>
        <span className="text-sm font-medium text-gray-700">{subject.percentage}%</span>
        {subject.trend === "up" && <TrendingUp className="w-4 h-4 text-green-600" />}
        {subject.trend === "down" && <TrendingDown className="w-4 h-4 text-red-600" />}
      </div>
    </div>
  );
}

export default function ParentProgressPage() {
  const [selectedChildId, setSelectedChildId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState<Array<{ id: string; name: string; classGrade: number }>>([]);
  const [progressData, setProgressData] = useState<ProgressData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchChildren();
  }, []);

  useEffect(() => {
    if (selectedChildId) {
      fetchProgressData(selectedChildId);
    }
  }, [selectedChildId]);

  async function fetchChildren() {
    try {
      const response = await fetch("/api/parent/children");
      const data = await response.json();

      if (data.success && data.data?.children) {
        setChildren(data.data.children);
        if (data.data.children.length > 0) {
          setSelectedChildId(data.data.children[0].id);
        }
      }
    } catch (err) {
      setError("Failed to load children");
    } finally {
      setLoading(false);
    }
  }

  async function fetchProgressData(childId: string) {
    try {
      const response = await fetch(`/api/parent/progress?studentId=${childId}`);
      const data = await response.json();

      if (data.success) {
        setProgressData(data.data);
      } else {
        setError("Failed to load progress data");
      }
    } catch (err) {
      setError("Failed to load progress data");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500">{error}</p>
          <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Academic Progress</h1>
          <p className="text-gray-500">Track your child&apos;s academic performance and growth</p>
        </div>
      </div>

      {/* Child Selector */}
      {children.length > 1 && (
        <div className="flex gap-2">
          {children.map((child) => (
            <Button
              key={child.id}
              variant={selectedChildId === child.id ? "default" : "outline"}
              onClick={() => setSelectedChildId(child.id)}
            >
              {child.name} (Grade {child.classGrade})
            </Button>
          ))}
        </div>
      )}

      {progressData && (
        <>
          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <GraduationCap className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{progressData.overallPercentage}%</p>
                    <p className="text-sm text-gray-500">Overall Score</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Award className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{progressData.overallGrade}</p>
                    <p className="text-sm text-gray-500">Overall Grade</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{progressData.attendanceRate}%</p>
                    <p className="text-sm text-gray-500">Attendance</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {progressData.classRank && progressData.totalStudents
                        ? `${progressData.classRank}/${progressData.totalStudents}`
                        : "-"}
                    </p>
                    <p className="text-sm text-gray-500">Class Rank</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Subject-wise Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Subject Performance</CardTitle>
              <CardDescription>Grade-wise breakdown for {progressData.term} term</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {progressData.subjects.map((subject) => (
                  <SubjectGradeCard key={subject.subject} subject={subject} />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Assessments */}
          <Card>
            <CardHeader>
              <CardTitle>Assessment Results</CardTitle>
              <CardDescription>Recent assessment and test results</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {progressData.assessments.length > 0 ? (
                  progressData.assessments.map((assessment) => (
                    <div key={assessment.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{assessment.title}</p>
                        <p className="text-xs text-gray-500">{assessment.type}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {assessment.status === "completed" ? (
                          <>
                            <span className="text-sm font-medium">{assessment.score}%</span>
                            <Badge className="bg-green-100 text-green-700 border-green-200">Completed</Badge>
                          </>
                        ) : assessment.status === "in_progress" ? (
                          <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">In Progress</Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-700 border-gray-200">Pending</Badge>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-8">No assessments yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
