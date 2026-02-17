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
} from "lucide-react";
import { PortalHeader } from "@/components/shared/portal-sidebar";

// Types
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

// Mock graded homework data
const mockGradedHomework: GradedHomework = {
  id: "hw1",
  title: "Quadratic Equations Practice",
  description: "Solve the following quadratic equations using the quadratic formula",
  subject: "Mathematics",
  dueDate: "2025-02-15T23:59",
  submittedDate: "2025-02-14T18:30",
  gradedDate: "2025-02-15T10:00",
  totalPoints: 50,
  earnedPoints: 42,
  percentage: 84,
  grade: "B+",
  teacherName: "Mrs. Wangmo",
  overallFeedback: "Good effort overall! You demonstrated a solid understanding of the quadratic formula. Pay more attention to sign errors when identifying a, b, and c values. Review the discriminant concept for better accuracy on equation classification.",
  timeSpent: 1845, // seconds
  questions: [
    {
      id: "q1",
      type: "multiple_choice",
      question: "What is the quadratic formula?",
      points: 5,
      earnedPoints: 5,
      studentAnswer: "x = (-b ± sqrt(b^2 - 4ac)) / 2a",
      correctAnswer: "x = (-b ± sqrt(b^2 - 4ac)) / 2a",
      explanation: "The quadratic formula is the most reliable method for solving any quadratic equation.",
      options: [
        "x = (-b ± sqrt(b^2 - 4ac)) / 2a",
        "x = -b/a",
        "x^2 + bx + c = 0",
      ],
    },
    {
      id: "q2",
      type: "true_false",
      question: "A quadratic equation always has two real solutions.",
      points: 5,
      earnedPoints: 5,
      studentAnswer: "false",
      correctAnswer: "false",
      explanation: "A quadratic equation can have 0, 1, or 2 real solutions depending on the discriminant.",
    },
    {
      id: "q3",
      type: "fill_blank",
      question: "The discriminant is given by _____",
      points: 5,
      earnedPoints: 5,
      studentAnswer: "b^2 - 4ac",
      correctAnswer: "b^2 - 4ac",
      explanation: "The discriminant determines the nature and number of solutions.",
      teacherFeedback: "Perfect!",
    },
    {
      id: "q4",
      type: "short_answer",
      question: "Explain when a quadratic equation has no real solutions.",
      points: 10,
      earnedPoints: 8,
      studentAnswer: "When the discriminant is negative, there are no real solutions because you can't take the square root of a negative number in the real number system.",
      correctAnswer: "When the discriminant (b^2 - 4ac) is negative, the quadratic equation has no real solutions, only complex solutions.",
      explanation: "A negative discriminant means the graph does not intersect the x-axis.",
      teacherFeedback: "Good explanation! Minor points off for not using the term 'complex solutions' and for not explicitly stating the discriminant formula.",
    },
    {
      id: "q5",
      type: "numeric",
      question: "Solve: x^2 - 5x + 6 = 0. What is the SUM of the solutions?",
      points: 10,
      earnedPoints: 10,
      studentAnswer: "5",
      correctAnswer: "5",
      explanation: "By Vieta's formulas, the sum of solutions equals -b/a = -(-5)/1 = 5. Alternatively, factor to (x-2)(x-3)=0, so solutions are 2 and 3, sum is 5.",
      teacherFeedback: "Excellent use of Vieta's formulas!",
    },
    {
      id: "q6",
      type: "multiple_choice",
      question: "Which equation represents a quadratic that opens upward?",
      points: 5,
      earnedPoints: 0,
      studentAnswer: "y = -2x^2 + 3x - 1",
      correctAnswer: "y = 3x^2 - 2x + 1",
      explanation: "When the coefficient of x^2 is positive, the parabola opens upward.",
      teacherFeedback: "Remember: positive leading coefficient = opens upward. Negative = opens downward.",
      options: [
        "y = -2x^2 + 3x - 1",
        "y = 3x^2 - 2x + 1",
        "y = -x^2 + 4",
      ],
    },
    {
      id: "q7",
      type: "short_answer",
      question: "Find the vertex of the parabola: y = x^2 - 4x + 3",
      points: 10,
      earnedPoints: 9,
      studentAnswer: "The vertex is at (2, -1). Using vertex formula x = -b/2a = 4/2 = 2, then y = 4 - 8 + 3 = -1.",
      correctAnswer: "Vertex at (2, -1). Using x = -b/(2a) = 4/2 = 2, y = 2^2 - 4(2) + 3 = 4 - 8 + 3 = -1",
      explanation: "The vertex form gives the minimum point of a parabola that opens upward.",
      teacherFeedback: "Perfect method and answer! Very clear work shown.",
    },
  ],
};

export default function StudentHomeworkFeedbackPage() {
  const params = useParams();
  const router = useRouter();
  const [homework, setHomework] = useState<GradedHomework | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCorrectAnswers, setShowCorrectAnswers] = useState(false);

  useEffect(() => {
    // In production, fetch from API
    // fetch(`/api/student/homework/${params.id}/feedback`)
    //   .then(res => res.json())
    //   .then(data => setHomework(data));

    // Simulate API call
    setTimeout(() => {
      setHomework(mockGradedHomework);
      setLoading(false);
    }, 500);
  }, [params.id]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getGradeColor = (grade: string) => {
    if (grade.startsWith("A") || grade.startsWith("B")) return "text-green-600";
    if (grade.startsWith("C")) return "text-yellow-600";
    return "text-red-600";
  };

  const getGradeBgColor = (grade: string) => {
    if (grade.startsWith("A") || grade.startsWith("B")) return "bg-green-100 text-green-700";
    if (grade.startsWith("C")) return "bg-yellow-100 text-yellow-700";
    return "bg-red-100 text-red-700";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PortalHeader userType="student" userName="Student" title="Homework Feedback" />
        <div className="lg:ml-64 p-6">
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  if (!homework) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PortalHeader userType="student" userName="Student" title="Homework Feedback" />
        <div className="lg:ml-64 p-6">
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">Feedback Not Available</h2>
              <p className="text-muted-foreground mb-4">
                The homework feedback could not be found or hasn't been graded yet.
              </p>
              <Button onClick={() => router.back()}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PortalHeader userType="student" userName="Student" title="Homework Feedback" />
      <div className="lg:ml-64 p-6">
        {/* Back Button */}
        <Button variant="outline" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Homework
        </Button>

        {/* Summary Card */}
        <Card className="mb-6">
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
              <Button variant="outline">
                <BookOpen className="w-4 h-4 mr-2" />
                View Original
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
