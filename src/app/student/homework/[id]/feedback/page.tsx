"use client";

/**
 * STUDENT HOMEWORK FEEDBACK PAGE
 * View graded homework with teacher feedback and correct answers
 */

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowLeft,
  Download,
  Clock,
  Award,
  BookOpen,
  MessageSquare,
  Loader2,
} from "lucide-react";

// API Response Type
interface HomeworkFeedbackResponse {
  success: true;
  data: {
    id: string;
    title: string;
    description: string;
    subject: string;
    dueDate: string;
    totalPoints: number;
    submittedDate: string;
    gradedDate: string;
    earnedPoints: number;
    percentage: number;
    grade: string;
    teacherName: string;
    overallFeedback: string;
    timeSpent: number;
    isLate: boolean;
    status: string;
    questions: Array<{
      id: string;
      type: string;
      question: string;
      points: number;
      earnedPoints: number;
      studentAnswer?: string;
      correctAnswer?: string;
      explanation?: string;
      teacherFeedback?: string;
      options?: string[];
    }>;
  };
}

interface GradedQuestion {
  id: string;
  type: string;
  question: string;
  points: number;
  earnedPoints: number;
  studentAnswer?: string;
  correctAnswer?: string;
  explanation?: string;
  teacherFeedback?: string;
  options?: string[];
}

interface GradedHomework {
  id: string;
  title: string;
  description: string;
  subject: string;
  dueDate: string;
  submittedDate: string;
  gradedDate: string;
  totalPoints: number;
  earnedPoints: number;
  percentage: number;
  grade: string;
  teacherName: string;
  overallFeedback: string;
  questions: GradedQuestion[];
  timeSpent: number;
}

export default function StudentHomeworkFeedbackPage() {
  const params = useParams();
  const router = useRouter();
  const [homework, setHomework] = useState<GradedHomework | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCorrectAnswers, setShowCorrectAnswers] = useState(false);

  useEffect(() => {
    fetchHomeworkFeedback();
  }, [params.id]);

  const fetchHomeworkFeedback = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/student/homework/${params.id}/feedback`);

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType?.includes("application/json")) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to load homework feedback");
        }
        throw new Error(`Failed to load homework feedback (${response.status})`);
      }

      const result: HomeworkFeedbackResponse = await response.json();
      setHomework(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load homework feedback");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getGradeBgColor = (grade: string) => {
    if (grade.startsWith("A") || grade.startsWith("B")) return "bg-green-100 text-green-700";
    if (grade.startsWith("C")) return "bg-yellow-100 text-yellow-700";
    return "bg-red-100 text-red-700";
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  // Error state
  if (error || !homework) {
    return (
      <Card>
        <CardContent className="pt-6 text-center py-12">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Feedback Not Available</h2>
          <p className="text-muted-foreground mb-4">
            {error || "The homework feedback could not be found or hasn't been graded yet."}
          </p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="outline" onClick={() => router.back()}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Homework
      </Button>

      {/* Summary Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold">{homework.title}</h1>
                <Badge className={getGradeBgColor(homework.grade)}>{homework.grade}</Badge>
              </div>
              <p className="text-muted-foreground">{homework.description}</p>
              <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                <Badge variant="outline">{homework.subject}</Badge>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  Time: {formatTime(homework.timeSpent)}
                </span>
                <span>Graded by {homework.teacherName}</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Score Display */}
          <div
            className="rounded-xl p-6 mb-4"
            style={{ background: 'linear-gradient(135deg, rgb(249 115 22) 0%, rgb(194 65 12) 100%)' }}
          >
            <div className="flex items-center justify-between text-white">
              <div>
                <p className="text-orange-100 text-sm">Your Score</p>
                <p className="text-4xl font-bold">
                  {homework.earnedPoints} / {homework.totalPoints}
                </p>
                <p className="text-orange-100 mt-1">{homework.percentage}%</p>
              </div>
              <div className="text-right">
                <Award className="w-16 h-16 text-orange-200" />
              </div>
            </div>
            <Progress value={homework.percentage} className="h-3 mt-4 bg-orange-900/30" />
          </div>

          {/* Overall Feedback */}
          {homework.overallFeedback && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <MessageSquare className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-blue-900">Teacher's Feedback</p>
                  <p className="text-sm text-blue-700 mt-1">{homework.overallFeedback}</p>
                </div>
              </div>
            </div>
          )}

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
            <div>
              <p className="text-muted-foreground">Submitted</p>
              <p className="font-medium">{new Date(homework.submittedDate).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Graded</p>
              <p className="font-medium">{new Date(homework.gradedDate).toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Question Review</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCorrectAnswers(!showCorrectAnswers)}
          >
            {showCorrectAnswers ? "Hide" : "Show"} Correct Answers
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-4">
        {homework.questions.map((question, index) => {
          const isCorrect = question.earnedPoints === question.points;
          const isPartial = question.earnedPoints > 0 && question.earnedPoints < question.points;

          return (
            <Card key={question.id} className={isCorrect ? "border-green-200" : isPartial ? "border-yellow-200" : "border-red-200"}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-muted-foreground">
                        Question {index + 1}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {question.type.replace("_", " ")}
                      </Badge>
                      <Badge className="text-xs">
                        {question.points} points
                      </Badge>
                    </div>
                    <p className="font-medium">{question.question}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {isCorrect ? (
                      <CheckCircle2 className="w-6 h-6 text-green-500" />
                    ) : isPartial ? (
                      <AlertCircle className="w-6 h-6 text-yellow-500" />
                    ) : (
                      <XCircle className="w-6 h-6 text-red-500" />
                    )}
                    <span
                      className={`text-lg font-bold ${
                        isCorrect ? "text-green-600" : isPartial ? "text-yellow-600" : "text-red-600"
                      }`}
                    >
                      {question.earnedPoints}/{question.points}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Student Answer */}
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Your Answer</p>
                  <div
                    className={`p-3 rounded-lg ${
                      isCorrect
                        ? "bg-green-50 border border-green-200"
                        : isPartial
                        ? "bg-yellow-50 border border-yellow-200"
                        : "bg-red-50 border border-red-200"
                    }`}
                  >
                    {question.studentAnswer || (
                      <span className="text-muted-foreground italic">No answer provided</span>
                    )}
                  </div>
                </div>

                {/* Correct Answer */}
                {showCorrectAnswers && !isCorrect && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">
                      <BookOpen className="w-4 h-4 inline mr-1" />
                      Correct Answer
                    </p>
                    <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                      {question.correctAnswer}
                    </div>
                  </div>
                )}

                {/* Explanation */}
                {question.explanation && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Explanation</p>
                    <p className="text-sm bg-gray-50 p-3 rounded-lg">{question.explanation}</p>
                  </div>
                )}

                {/* Teacher Feedback */}
                {question.teacherFeedback && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">
                      <MessageSquare className="w-4 h-4 inline mr-1" />
                      Teacher Feedback
                    </p>
                    <p className="text-sm bg-blue-50 p-3 rounded-lg border border-blue-200">
                      {question.teacherFeedback}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Original Homework Link */}
      <Card className="mt-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Want to review the original homework?</p>
              <p className="text-sm text-muted-foreground">
                View the assignment details and questions as they were presented
              </p>
            </div>
            <Button variant="outline" onClick={() => router.push(`/student/homework/${homework.id}`)}>
              <BookOpen className="w-4 h-4 mr-2" />
              View Original
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
