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
  Save,
  Eye,
  Loader2,
  User,
  Calendar,
  Clock,
} from "lucide-react";
import { type QuestionType } from "./homework-creator";
import { gradeHomework } from "@/lib/auto-grading";
import { cn } from "@/lib/utils";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type QuestionTypeExtended = QuestionType | "handwriting";

export interface HomeworkQuestion {
  id: string;
  type: QuestionTypeExtended;
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
  status: "draft" | "submitted" | "graded";
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
  isSaving?: boolean;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function GradingPanel({
  homeworkId,
  homeworkTitle,
  questions,
  submissions,
  onGrade,
  onReleaseGrades,
  isSaving = false,
}: GradingPanelProps) {
  const [currentStudentIndex, setCurrentStudentIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [gradingResults, setGradingResults] = useState<Record<string, GradingResult[]>>({});
  const [teacherFeedback, setTeacherFeedback] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<"all" | "pending" | "review" | "graded">("all");
  const [autoGradingInProgress, setAutoGradingInProgress] = useState(false);
  const [savingGrade, setSavingGrade] = useState(false);

  // Teacher portal colors - blue gradient
  const teacherGradient = "linear-gradient(135deg, rgb(59 130 246) 0%, rgb(37 99 235) 100%)";

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

    try {
      const results = gradeHomework(
        questions.map((q) => ({
          ...q,
          correctAnswer: q.correctAnswer,
        })),
        submission.answers,
        submission.metadata
      );

      const newGradingResults: GradingResult[] = results.results.map((r) => ({
        ...r,
        teacherOverride: false,
      }));

      setGradingResults((prev) => ({
        ...prev,
        [submission.id]: newGradingResults,
      }));
    } catch (error) {
      console.error("Auto-grading error:", error);
    } finally {
      setAutoGradingInProgress(false);
    }
  };

  // Override a question score
  const overrideScore = (submissionId: string, questionId: string, newScore: number) => {
    setGradingResults((prev) => ({
      ...prev,
      [submissionId]: prev[submissionId]?.map((r) =>
        r.questionId === questionId
          ? {
              ...r,
              score: Math.max(0, Math.min(newScore, r.maxScore)),
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
  const submitGrades = async () => {
    const results = gradingResults[currentSubmission.id];
    if (!results) {
      alert("Please grade the submission first");
      return;
    }

    setSavingGrade(true);

    // Merge teacher feedback
    const resultsWithFeedback = results.map((r) => ({
      ...r,
      feedback: teacherFeedback[r.questionId] || r.feedback,
    }));

    try {
      await onGrade(currentSubmission.id, resultsWithFeedback);
    } finally {
      setSavingGrade(false);
    }
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

  // Get grade badge color
  const getGradeBadgeColor = (percent: number) => {
    if (percent >= 70) return "bg-green-100 text-green-700 border-green-200";
    if (percent >= 40) return "bg-yellow-100 text-yellow-700 border-yellow-200";
    return "bg-red-100 text-red-700 border-red-200";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">{homeworkTitle}</h1>
              <p className="text-muted-foreground">
                Grading {filteredSubmissions.length} of {submissions.length} submissions
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={autoGradeAll}
                disabled={autoGradingInProgress}
              >
                {autoGradingInProgress ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
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

          {/* Filter tabs */}
          <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-1">
            <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
            <div className="flex gap-2">
              <Button
                variant={filter === "all" ? "default" : "ghost"}
                size="sm"
                onClick={() => setFilter("all")}
                className="shrink-0"
              >
                All ({submissions.length})
              </Button>
              <Button
                variant={filter === "pending" ? "default" : "ghost"}
                size="sm"
                onClick={() => setFilter("pending")}
                className="shrink-0"
              >
                Pending ({submissions.length - Object.keys(gradingResults).length})
              </Button>
              <Button
                variant={filter === "review" ? "default" : "ghost"}
                size="sm"
                onClick={() => setFilter("review")}
                className="shrink-0"
              >
                Needs Review
              </Button>
              <Button
                variant={filter === "graded" ? "default" : "ghost"}
                size="sm"
                onClick={() => setFilter("graded")}
                className="shrink-0"
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
                  Previous
                </Button>

                <div className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium" style={{ background: teacherGradient }}>
                      {currentSubmission.studentName.charAt(0)}
                    </div>
                    <p className="font-medium">{currentSubmission.studentName}</p>
                  </div>
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
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>

              {/* Grading Summary */}
              {currentResults.length > 0 && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-6">
                      <div>
                        <p className="text-sm text-muted-foreground">Score</p>
                        <p className="text-2xl font-bold">
                          {totalScore} / {maxScore}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Percentage</p>
                        <Badge className={cn("text-lg px-3 py-1", getGradeBadgeColor(percentage))}>
                          {percentage}%
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {currentSubmission.metadata && (
                        <div className="text-sm">
                          <p className="text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Time: {Math.floor(currentSubmission.metadata.timeSpent / 60)}m
                          </p>
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

                      <Button
                        size="sm"
                        onClick={submitGrades}
                        disabled={savingGrade || isSaving}
                        style={{ background: teacherGradient }}
                        className="text-white hover:opacity-90"
                      >
                        {savingGrade || isSaving ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4 mr-2" />
                        )}
                        Submit Grades
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Auto-grade button for this student */}
              {currentResults.length === 0 && (
                <div className="mt-4 text-center">
                  <Button
                    onClick={() => autoGradeSubmission(currentSubmission)}
                    disabled={autoGradingInProgress}
                    style={{ background: teacherGradient }}
                    className="text-white hover:opacity-90"
                  >
                    {autoGradingInProgress ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : null}
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
              {/* Question Navigator */}
              <div className="flex gap-2 overflow-x-auto pb-2">
                {questions.map((q, index) => {
                  const result = currentResults.find((r) => r.questionId === q.id);
                  const isActive = currentQuestionIndex === index;
                  const isCorrect = result?.isCorrect;
                  const isGraded = !!result;

                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentQuestionIndex(index)}
                      className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center text-sm font-medium transition-colors shrink-0",
                        isActive && "text-white",
                        !isActive && isGraded && isCorrect && "bg-green-100 text-green-700",
                        !isActive && isGraded && !isCorrect && "bg-red-100 text-red-700",
                        !isActive && !isGraded && "bg-muted"
                      )}
                      style={isActive ? { background: teacherGradient } : undefined}
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
                    <div className="flex items-start gap-2 mb-2">
                      <Badge variant="outline">{getQuestionTypeLabel(currentQuestion.type)}</Badge>
                      <Badge>{currentQuestion.points} points</Badge>
                    </div>
                    <p className="font-medium text-lg">{currentQuestion.question}</p>

                    {currentQuestion.options && (
                      <div className="mt-3 space-y-2">
                        {currentQuestion.options.map((option, idx) => (
                          <div
                            key={idx}
                            className={cn(
                              "p-3 rounded-lg border text-sm",
                              option === currentQuestion.correctAnswer
                                ? "bg-green-50 border-green-200 text-green-800"
                                : "bg-muted"
                            )}
                          >
                            {String.fromCharCode(65 + idx)}. {option}
                            {option === currentQuestion.correctAnswer && (
                              <span className="ml-2 text-green-600">(Correct Answer)</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="mt-3 p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm font-medium text-muted-foreground mb-1">Student Answer:</p>
                      <p className="text-base">
                        {currentSubmission.answers.find((a) => a.questionId === currentQuestion.id)
                          ?.answer ?? (
                          <span className="text-muted-foreground italic">(No answer provided)</span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Grading */}
                  {currentResult && (
                    <div className="border-t pt-4">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          {currentResult.isCorrect ? (
                            <div className="flex items-center gap-2 text-green-600">
                              <CheckCircle className="w-6 h-6" />
                              <span className="font-medium">Correct</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-red-600">
                              <XCircle className="w-6 h-6" />
                              <span className="font-medium">Incorrect</span>
                            </div>
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

                          <Badge
                            variant={currentResult.confidence > 80 ? "default" : "secondary"}
                          >
                            {currentResult.confidence}% confidence
                          </Badge>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-sm">Score:</span>
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
                            className="w-20"
                          />
                          <span className="text-sm">/ {currentQuestion.points}</span>
                        </div>
                      </div>

                      {currentResult.reasoning && (
                        <p className="text-sm text-muted-foreground mt-2 bg-muted/50 p-2 rounded">
                          {currentResult.reasoning}
                        </p>
                      )}

                      {currentQuestion.explanation && (
                        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-sm font-medium text-blue-800">Explanation:</p>
                          <p className="text-sm text-blue-700">{currentQuestion.explanation}</p>
                        </div>
                      )}

                      <div className="mt-4">
                        <label className="text-sm font-medium block mb-2">Teacher Feedback</label>
                        <Textarea
                          value={teacherFeedback[currentQuestion.id] || currentResult.feedback || ""}
                          onChange={(e) => updateFeedback(currentQuestion.id, e.target.value)}
                          placeholder="Add feedback for the student..."
                          rows={3}
                          className="max-w-lg"
                        />
                      </div>
                    </div>
                  )}

                  {!currentResult && (
                    <div className="border-t pt-4 text-center text-muted-foreground">
                      <p>Not graded yet. Click "Auto-Grade This Submission" above to begin.</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Overall Feedback Card */}
          {currentResults.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Overall Feedback</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={teacherFeedback["overall"] || ""}
                  onChange={(e) => updateFeedback("overall", e.target.value)}
                  placeholder="Add overall feedback for this student's submission..."
                  rows={4}
                  className="w-full"
                />
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getQuestionTypeLabel(type: QuestionTypeExtended): string {
  const labels: Record<QuestionTypeExtended, string> = {
    multiple_choice: "Multiple Choice",
    true_false: "True / False",
    fill_blank: "Fill in the Blank",
    short_answer: "Short Answer",
    essay: "Essay",
    numeric: "Numeric",
    math_expression: "Math Expression",
    match_following: "Match the Following",
    handwriting: "Handwriting",
  };
  return labels[type] || type;
}

// ============================================================================
// SUB-COMPONENT: Student List View
// ============================================================================

interface StudentListProps {
  submissions: StudentSubmission[];
  gradingResults: Record<string, GradingResult[]>;
  onSelectStudent: (index: number) => void;
  selectedIndex: number;
}

export function StudentList({
  submissions,
  gradingResults,
  onSelectStudent,
  selectedIndex,
}: StudentListProps) {
  const getSubmissionStatus = (submission: StudentSubmission) => {
    const results = gradingResults[submission.id];
    if (!results) return { label: "Pending", color: "bg-gray-100 text-gray-700" };

    const totalScore = results.reduce((sum, r) => sum + r.score, 0);
    const maxScore = results.reduce((sum, r) => sum + r.maxScore, 0);
    const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

    if (percentage >= 70) return { label: "Passed", color: "bg-green-100 text-green-700" };
    if (percentage >= 40) return { label: "Average", color: "bg-yellow-100 text-yellow-700" };
    return { label: "Failed", color: "bg-red-100 text-red-700" };
  };

  return (
    <div className="space-y-2">
      {submissions.map((submission, index) => {
        const status = getSubmissionStatus(submission);
        const isSelected = selectedIndex === index;

        return (
          <button
            key={submission.id}
            onClick={() => onSelectStudent(index)}
            className={cn(
              "w-full flex items-center justify-between p-3 rounded-lg border text-left transition-colors",
              isSelected && "border-blue-500 bg-blue-50",
              !isSelected && "hover:bg-muted"
            )}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-medium">
                {submission.studentName.charAt(0)}
              </div>
              <div>
                <p className="font-medium text-sm">{submission.studentName}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(submission.submittedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <Badge className={status.color}>{status.label}</Badge>
          </button>
        );
      })}
    </div>
  );
}

// ============================================================================
// SUB-COMPONENT: Question Answer Display
// ============================================================================

interface QuestionAnswerDisplayProps {
  question: HomeworkQuestion;
  answer: string | number | Array<any>;
  showCorrectAnswer?: boolean;
}

export function QuestionAnswerDisplay({
  question,
  answer,
  showCorrectAnswer = false,
}: QuestionAnswerDisplayProps) {
  const renderAnswer = () => {
    switch (question.type) {
      case "multiple_choice":
        return (
          <div className="space-y-2">
            {question.options?.map((option, idx) => {
              const isSelected = answer === option;
              const isCorrect = option === question.correctAnswer;

              return (
                <div
                  key={idx}
                  className={cn(
                    "p-3 rounded-lg border text-sm",
                    isSelected && isCorrect && "bg-green-100 border-green-500",
                    isSelected && !isCorrect && "bg-red-100 border-red-500",
                    !isSelected && isCorrect && showCorrectAnswer && "bg-green-50 border-green-300",
                    !isSelected && "bg-muted"
                  )}
                >
                  <span className="font-medium">{String.fromCharCode(65 + idx)}.</span> {option}
                  {isCorrect && showCorrectAnswer && (
                    <span className="ml-2 text-green-600 text-xs"> (Correct)</span>
                  )}
                  {isSelected && !isCorrect && (
                    <span className="ml-2 text-red-600 text-xs"> (Selected)</span>
                  )}
                </div>
              );
            })}
          </div>
        );

      case "true_false":
        return (
          <div className="space-y-2">
            {["true", "false"].map((option) => {
              const isSelected = answer === option;
              const isCorrect = option === question.correctAnswer;

              return (
                <div
                  key={option}
                  className={cn(
                    "p-3 rounded-lg border text-sm capitalize",
                    isSelected && isCorrect && "bg-green-100 border-green-500",
                    isSelected && !isCorrect && "bg-red-100 border-red-500",
                    !isSelected && isCorrect && showCorrectAnswer && "bg-green-50 border-green-300",
                    !isSelected && "bg-muted"
                  )}
                >
                  {option}
                  {isCorrect && showCorrectAnswer && (
                    <span className="ml-2 text-green-600 text-xs"> (Correct)</span>
                  )}
                  {isSelected && !isCorrect && (
                    <span className="ml-2 text-red-600 text-xs"> (Selected)</span>
                  )}
                </div>
              );
            })}
          </div>
        );

      case "essay":
      case "short_answer":
        return (
          <div className="p-4 bg-muted rounded-lg">
            <p className="whitespace-pre-wrap text-sm">{String(answer || "(No answer)")}</p>
          </div>
        );

      default:
        return (
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm font-medium">Answer:</p>
            <p className="text-lg">{String(answer || "(No answer)")}</p>
            {showCorrectAnswer && (
              <p className="text-sm text-green-600 mt-2">
                Correct: {String(question.correctAnswer)}
              </p>
            )}
          </div>
        );
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <Badge variant="outline">{getQuestionTypeLabel(question.type)}</Badge>
        <span className="ml-2 text-sm text-muted-foreground">{question.points} points</span>
      </div>
      <p className="font-medium">{question.question}</p>
      {renderAnswer()}
    </div>
  );
}
