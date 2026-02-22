"use client";

/**
 * Marks Overview Card
 *
 * Displays student's academic performance with:
 * - Subject-wise performance cards
 * - Trend indicators (up/down/stable)
 * - Progress bars for percentages
 * - Grade badges with ceramic variants
 * - Term selector for switching between exams
 */

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  BookOpen,
  Award,
  ChevronRight,
} from "lucide-react";
import type { MarksSummary, SubjectPerformance, ExamTerm } from "@/types/student";

const GRADE_COLORS: Record<string, "ceramic-success" | "ceramic-info" | "ceramic-warning" | "ceramic-error"> = {
  "A+": "ceramic-success",
  A: "ceramic-info",
  B: "ceramic-warning",
  C: "ceramic-error",
  D: "ceramic-error",
  F: "ceramic-error",
};

const TERM_LABELS: Record<ExamTerm, string> = {
  midterm: "Midterm",
  final: "Final Exam",
  unit_test: "Unit Test",
  board_exam: "Board Exam",
};

interface MarksOverviewCardProps {
  className?: string;
}

export function MarksOverviewCard({ className = "" }: MarksOverviewCardProps) {
  const [marks, setMarks] = useState<MarksSummary | null>(null);
  const [selectedTerm, setSelectedTerm] = useState<ExamTerm>("final");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchMarks();
  }, []);

  const fetchMarks = async () => {
    try {
      const response = await fetch(`/api/student/marks-summary?term=${selectedTerm}`);
      if (response.ok) {
        const data = await response.json();
        setMarks(data);
      } else {
        setMarks({ currentExam: null, previousExam: null, availableTerms: [], selectedTerm, hasData: false });
      }
    } catch {
      setMarks({ currentExam: null, previousExam: null, availableTerms: [], selectedTerm, hasData: false });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTermChange = (term: ExamTerm) => {
    setSelectedTerm(term);
    setIsLoading(true);
    fetch(`/api/student/marks-summary?term=${term}`)
      .then((res) => res.json())
      .then((data) => {
        setMarks({ ...data, selectedTerm: term });
        setIsLoading(false);
      })
      .catch(() => {
        setMarks({ currentExam: null, previousExam: null, availableTerms: [], selectedTerm: term, hasData: false });
        setIsLoading(false);
      });
  };

  if (isLoading) {
    return (
      <Card variant="ceramic" className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-36 mb-2" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const exam = marks?.currentExam;
  const hasData = marks?.hasData || false;

  return (
    <Card variant="ceramic" className={className}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-orange-600" />
              Academic Performance
            </CardTitle>
            <CardDescription>
              {hasData && exam ? `${exam.examName} - ${TERM_LABELS[exam.examType]}` : "Your exam results"}
            </CardDescription>
          </div>

          {/* Term Selector */}
          {hasData && marks?.availableTerms && marks.availableTerms.length > 1 && (
            <div className="flex gap-1">
              {marks.availableTerms.map((term) => (
                <Button
                  key={term}
                  variant={selectedTerm === term ? "ceramic" : "ghost"}
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => handleTermChange(term)}
                >
                  {TERM_LABELS[term]}
                </Button>
              ))}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {!hasData ? (
          <EmptyState />
        ) : (
          <>
            {/* Overall Performance Badge */}
            {exam && (
              <div className="flex items-center justify-between mb-4 p-3 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg border border-orange-100">
                <div>
                  <p className="text-xs text-gray-600">Overall Performance</p>
                  <p className="text-2xl font-bold text-gray-900">{exam.overallGrade}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-600">Percentage</p>
                  <p className="text-2xl font-bold text-orange-600">{exam.overallPercentage}%</p>
                </div>
                {exam.classRank && (
                  <div className="text-center pl-4 border-l border-orange-200">
                    <Award className="w-5 h-5 text-orange-500 mx-auto mb-1" />
                    <p className="text-xs text-gray-600">Rank</p>
                    <p className="text-lg font-bold text-gray-900">
                      {exam.classRank}
                      {exam.totalStudents && `/${exam.totalStudents}`}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Subject-wise Performance */}
            <div className="space-y-2">
              {exam?.subjects.map((subject) => (
                <SubjectCard key={subject.subject} subject={subject} />
              ))}
            </div>

            {/* View Details Link */}
            <Button
              variant="ghost"
              className="w-full mt-4 text-orange-600 hover:text-orange-700"
              asChild
            >
              <a href="/student/results">
                View Detailed Report
                <ChevronRight className="w-4 h-4 ml-1" />
              </a>
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// SUBJECT CARD COMPONENT
// ============================================================================

interface SubjectCardProps {
  subject: SubjectPerformance;
}

function SubjectCard({ subject }: SubjectCardProps) {
  const gradeVariant = GRADE_COLORS[subject.grade] || "ceramic-default";

  const TrendIcon =
    subject.trend === "up" ? TrendingUp : subject.trend === "down" ? TrendingDown : Minus;

  const trendColor =
    subject.trend === "up"
      ? "text-green-600"
      : subject.trend === "down"
      ? "text-red-600"
      : "text-gray-400";

  const progressColor =
    subject.percentage >= 80
      ? "bg-green-500"
      : subject.percentage >= 60
      ? "bg-blue-500"
      : subject.percentage >= 40
      ? "bg-orange-500"
      : "bg-red-500";

  return (
    <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100 hover:border-orange-200 transition-colors">
      {/* Subject Icon/Initial */}
      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center shrink-0">
        <span className="text-sm font-semibold text-orange-700">
          {subject.subject.charAt(0)}
        </span>
      </div>

      {/* Subject Name & Marks */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-sm font-medium text-gray-900 truncate">{subject.subject}</p>
          <Badge variant={gradeVariant} className="text-[10px] px-1.5 py-0">
            {subject.grade}
          </Badge>
        </div>
        <p className="text-xs text-gray-500">
          {subject.marksObtained}/{subject.maxMarks}
        </p>
      </div>

      {/* Trend Indicator */}
      {subject.previousPercentage !== undefined && (
        <div className={`flex items-center gap-1 ${trendColor}`}>
          <TrendIcon className="w-4 h-4" />
          <span className="text-xs font-medium">
            {subject.trend === "up"
              ? `+${(subject.percentage - subject.previousPercentage).toFixed(0)}%`
              : subject.trend === "down"
              ? `${(subject.percentage - subject.previousPercentage).toFixed(0)}%`
              : "0%"}
          </span>
        </div>
      )}

      {/* Progress Bar */}
      <div className="w-20 shrink-0">
        <Progress value={subject.percentage} className="h-2" />
      </div>

      {/* Percentage */}
      <div className="w-12 text-right shrink-0">
        <p className="text-sm font-bold text-gray-900">{subject.percentage}%</p>
      </div>
    </div>
  );
}

// ============================================================================
// EMPTY STATE COMPONENT
// ============================================================================

function EmptyState() {
  return (
    <div className="text-center py-8 px-4">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-orange-100 to-amber-100 flex items-center justify-center">
        <BookOpen className="w-8 h-8 text-orange-500" />
      </div>
      <h4 className="font-semibold text-gray-900 mb-2">No Exam Results Yet</h4>
      <p className="text-sm text-gray-600 mb-4 max-w-xs mx-auto">
        Your exam results will appear here once teachers publish them.
      </p>
      <div className="flex justify-center gap-2">
        <Button variant="outline" size="sm" asChild>
          <a href="/student/homework">View Homework</a>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <a href="/student/assessment">Take Assessment</a>
        </Button>
      </div>
    </div>
  );
}
