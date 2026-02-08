/**
 * HOMEWORK GRADING PANEL
 * Teacher interface for grading student submissions
 */
"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Filter,
  Download,
  Send,
  Undo,
  Eye,
} from "lucide-react";
import { type QuestionType } from "./homework-creator";
import { gradeHomework } from "@/lib/auto-grading";

export interface HomeworkQuestion {
  id: string;
  type: QuestionType;
  question: string;
  options?: string[];
  correctAnswer: string | string[] | number;
  points: number;
  tolerance?: number;
  keywords?: string[];
  explanation?: string;
}

export interface StudentSubmission {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail?: string;
  answers: Array<{
    questionId: string;
    answer: string | number | Array<any>;
  }>;
  submittedAt: string;
  metadata?: {
    timeSpent: number;
    tabSwitches: number;
    copyPasteEvents: number;
  };
}

export interface GradingResult {
  questionId: string;
  score: number;
  maxScore: number;
  isCorrect: boolean;
  feedback?: string;
  confidence: number;
  needsReview: boolean;
  reasoning?: string;
  teacherOverride?: boolean;
}

interface GradingPanelProps {
  homeworkId: string;
  homeworkTitle: string;
  questions: HomeworkQuestion[];
  submissions: StudentSubmission[];
  onGrade: (submissionId: string, results: GradingResult[]) => void | Promise<void>;
  onReleaseGrades?: (submissionIds: string[]) => void | Promise<void>;
}

export function GradingPanel({
  homeworkId,
  homeworkTitle,
  questions,
  submissions,
  onGrade,
  onReleaseGrades,
}: GradingPanelProps) {
  const [currentStudentIndex, setCurrentStudentIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [gradingResults, setGradingResults] = useState<Record<string, GradingResult[]>>({});
  const [teacherFeedback, setTeacherFeedback] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<"all" | "pending" | "review" | "graded">("all");
  const [autoGradingInProgress, setAutoGradingInProgress] = useState(false);

  const currentSubmission = submissions[currentStudentIndex];
  const currentQuestion = questions[currentQuestionIndex];
  const currentResult = gradingResults[currentSubmission?.id]?.find(
    (r) => r.questionId === currentQuestion?.id
  );

  // Filter submissions
  const filteredSubmissions = useMemo(() => {
    const graded = new Set(Object.keys(gradingResults));
    return submissions.filter((s) => {
      if (filter === "all") return true;
      if (filter === "pending") return !graded.has(s.id);
      if (filter === "review") {
        return gradingResults[s.id]?.some((r) => r.needsReview);
      }
      if (filter === "graded") return graded.has(s.id);
      return true;
    });
  }, [submissions, gradingResults, filter]);

  // Auto-grade a submission
  const autoGradeSubmission = async (submission: StudentSubmission) => {
    setAutoGradingInProgress(true);

    const results = gradeHomework(
      questions.map((q) => ({
        ...q,
        correctAnswer: q.correctAnswer,
      })),
      submission.answers,
      submission.metadata
    );

    const gradingResults: GradingResult[] = results.results.map((r) => ({
      ...r,
      teacherOverride: false,
    }));

    setGradingResults((prev) => ({
      ...prev,
      [submission.id]: gradingResults,
    }));

    setAutoGradingInProgress(false);
  };

  // Override a question score
  const overrideScore = (submissionId: string, questionId: string, newScore: number) => {
    setGradingResults((prev) => ({
      ...prev,
      [submissionId]: prev[submissionId]?.map((r) =>
        r.questionId === questionId
          ? {
              ...r,
              score: newScore,
              isCorrect: newScore === r.maxScore,
              teacherOverride: true,
            }
          : r
      ) || [],
    }));
  };

  // Add feedback for a question
  const updateFeedback = (questionId: string, feedback: string) => {
    setTeacherFeedback((prev) => ({ ...prev, [questionId]: feedback }));
  };

  // Submit grades for current student
  const submitGrades = () => {
    const results = gradingResults[currentSubmission.id];
    if (!results) {
      alert("Please grade the submission first");
      return;
    }

    // Merge teacher feedback
    const resultsWithFeedback = results.map((r) => ({
      ...r,
      feedback: teacherFeedback[r.questionId] || r.feedback,
    }));

    onGrade(currentSubmission.id, resultsWithFeedback);
  };

  // Auto-grade all pending
  const autoGradeAll = async () => {
    for (const submission of filteredSubmissions) {
      if (!gradingResults[submission.id]) {
        await autoGradeSubmission(submission);
      }
    }
  };

  const currentResults = gradingResults[currentSubmission?.id] || [];
  const totalScore = currentResults.reduce((sum, r) => sum + r.score, 0);
  const maxScore = currentResults.reduce((sum, r) => sum + r.maxScore, 0);
  const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
  const needsReviewCount = currentResults.filter((r) => r.needsReview).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{homeworkTitle}</h1>
              <p className="text-muted-foreground">
                Grading {filteredSubmissions.length} of {submissions.length} submissions
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={autoGradeAll}>
                Auto-Grade All
              </Button>
              {onReleaseGrades && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const graded = Object.keys(gradingResults);
                    if (graded.length > 0) {
                      onReleaseGrades(graded);
                    }
                  }}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Release Grades
                </Button>
              )}
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-4">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <div className="flex gap-2">
              <Button
                variant={filter === "all" ? "default" : "ghost"}
                size="sm"
                onClick={() => setFilter("all")}
              >
                All ({submissions.length})
              </Button>
              <Button
                variant={filter === "pending" ? "default" : "ghost"}
                size="sm"
                onClick={() => setFilter("pending")}
              >
                Pending ({submissions.length - Object.keys(gradingResults).length})
              </Button>
              <Button
                variant={filter === "review" ? "default" : "ghost"}
                size="sm"
                onClick={() => setFilter("review")}
              >
                Needs Review
              </Button>
              <Button
                variant={filter === "graded" ? "default" : "ghost"}
                size="sm"
                onClick={() => setFilter("graded")}
              >
                Graded ({Object.keys(gradingResults).length})
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {!currentSubmission ? (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <p className="text-muted-foreground">No submissions to grade</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Student Selector */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentStudentIndex(Math.max(0, currentStudentIndex - 1))}
                  disabled={currentStudentIndex === 0}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>

                <div className="text-center">
                  <p className="font-medium">{currentSubmission.studentName}</p>
                  {currentSubmission.studentEmail && (
                    <p className="text-sm text-muted-foreground">{currentSubmission.studentEmail}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Submitted {new Date(currentSubmission.submittedAt).toLocaleString()}
                  </p>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentStudentIndex(Math.min(filteredSubmissions.length - 1, currentStudentIndex + 1))
                  }
                  disabled={currentStudentIndex >= filteredSubmissions.length - 1}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>

              {/* Grading Summary */}
              {currentResults.length > 0 && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Score</p>
                        <p className="text-2xl font-bold">
                          {totalScore} / {maxScore}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Percentage</p>
                        <p
                          className={`text-2xl font-bold ${
                            percentage >= 70
                              ? "text-green-600"
                              : percentage >= 40
                              ? "text-yellow-600"
                              : "text-red-600"
                          }`}
                        >
                          {percentage}%
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {currentSubmission.metadata && (
                        <div className="text-sm">
                          <p className="text-muted-foreground">Time: {Math.floor(currentSubmission.metadata.timeSpent / 60)}m</p>
                          <p className="text-muted-foreground">
                            Tab switches: {currentSubmission.metadata.tabSwitches}
                          </p>
                        </div>
                      )}

                      {needsReviewCount > 0 && (
                        <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          {needsReviewCount} need review
                        </Badge>
                      )}

                      <Button size="sm" onClick={submitGrades}>
                        Submit Grades
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Auto-grade button for this student */}
              {currentResults.length === 0 && (
                <div className="mt-4 text-center">
                  <Button onClick={() => autoGradeSubmission(currentSubmission)}>
                    Auto-Grade This Submission
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Questions */}
          <Card>
            <CardHeader>
              <CardTitle>Questions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {questions.map((q, index) => {
                  const result = currentResults.find((r) => r.questionId === q.id);
                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentQuestionIndex(index)}
                      className={`
                        w-10 h-10 rounded-lg flex items-center justify-center text-sm font-medium
                        ${currentQuestionIndex === index ? "bg-primary text-primary-foreground" : ""}
                        ${result?.isCorrect && currentQuestionIndex !== index ? "bg-green-100 text-green-700" : ""}
                        ${!result?.isCorrect && result && currentQuestionIndex !== index ? "bg-red-100 text-red-700" : ""}
                        ${!result && currentQuestionIndex !== index ? "bg-muted" : ""}
                      `}
                    >
                      {index + 1}
                    </button>
                  );
                })}
              </div>

              {currentQuestion && (
                <div className="mt-6 space-y-4">
                  {/* Question */}
                  <div>
                    <p className="font-medium mb-2">{currentQuestion.question}</p>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">Student Answer:</p>
                      <p className="mt-1">
                        {currentSubmission.answers.find((a) => a.questionId === currentQuestion.id)
                          ?.answer || "(No answer)"}
                      </p>
                    </div>
                  </div>

                  {/* Grading */}
                  {currentResult && (
                    <div className="border-t pt-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {currentResult.isCorrect ? (
                            <CheckCircle className="w-6 h-6 text-green-500" />
                          ) : (
                            <XCircle className="w-6 h-6 text-red-500" />
                          )}

                          {currentResult.needsReview && (
                            <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Needs Review
                            </Badge>
                          )}

                          {currentResult.teacherOverride && (
                            <Badge variant="secondary">Teacher Override</Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-4">
                          <span className="text-sm">
                            Score:{" "}
                            <Input
                              type="number"
                              min="0"
                              max={currentQuestion.points}
                              value={currentResult.score}
                              onChange={(e) =>
                                overrideScore(
                                  currentSubmission.id,
                                  currentQuestion.id,
                                  parseInt(e.target.value) || 0
                                )
                              }
                              className="w-16 inline-block mx-2"
                            />
                            / {currentQuestion.points}
                          </span>

                          <Badge variant={currentResult.confidence > 80 ? "default" : "secondary"}>
                            {currentResult.confidence}% confidence
                          </Badge>
                        </div>
                      </div>

                      {currentResult.reasoning && (
                        <p className="text-sm text-muted-foreground mt-2">
                          {currentResult.reasoning}
                        </p>
                      )}

                      <div className="mt-4">
                        <label className="text-sm font-medium">Teacher Feedback</label>
                        <Textarea
                          value={teacherFeedback[currentQuestion.id] || currentResult.feedback || ""}
                          onChange={(e) => updateFeedback(currentQuestion.id, e.target.value)}
                          placeholder="Add feedback for the student..."
                          rows={3}
                          className="mt-2"
                        />
                      </div>
                    </div>
                  )}

                  {!currentResult && (
                    <div className="border-t pt-4 text-center text-muted-foreground">
                      Not graded yet. Click "Auto-Grade This Submission" above.
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
