"use client";

import { logger } from "@/lib/logger";
import { useToast } from "@/components/ui/toast";
/**
 * TEACHER HOMEWORK GRADING PAGE
 * Page for viewing homework submissions and grading student work
 */

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import {
  GradingPanel,
  type HomeworkQuestion,
  type StudentSubmission,
  type GradingResult,
} from "@/components/homework";

interface HomeworkDetails {
  id: string;
  title: string;
  description?: string;
  type: string;
  questions: HomeworkQuestion[];
  dueDate: string;
  maxPoints: number;
  classId: string;
  class?: {
    id: string;
    name: string;
  };
  subject?: {
    id: string;
    name: string;
  };
}

export default function GradeHomeworkPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const homeworkId = params.id as string;

  const [homework, setHomework] = useState<HomeworkDetails | null>(null);
  const [submissions, setSubmissions] = useState<StudentSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isReleasing, setIsReleasing] = useState(false);

  useEffect(() => {
    Promise.all([
      fetchHomeworkDetails(),
      fetchSubmissions(),
    ]).finally(() => setIsLoading(false));
  }, [homeworkId]);

  const fetchHomeworkDetails = async () => {
    try {
      const response = await fetch(`/api/teacher/homework/${homeworkId}`);
      if (response.ok) {
        const data = await response.json();
        setHomework(data.homework);
      } else {
        throw new Error("Failed to fetch homework details");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      logger.error("Error fetching homework:", err);
    }
  };

  const fetchSubmissions = async () => {
    try {
      const response = await fetch(`/api/teacher/homework/${homeworkId}/submissions`);
      if (response.ok) {
        const data = await response.json();
        setSubmissions(data.submissions || []);
      }
    } catch (err) {
      logger.error("Error fetching submissions:", err);
    }
  };

  const handleGrade = async (submissionId: string, results: GradingResult[]) => {
    try {
      const response = await fetch(
        `/api/teacher/homework/${homeworkId}/submissions/${submissionId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ gradingResults: results }),
        }
      );

      if (response.ok) {
        // Refresh submissions to get updated data
        await fetchSubmissions();
        toast({
          title: "Grades saved",
          description: "Student grades have been saved successfully.",
          variant: "success",
        });
      } else {
        toast({
          title: "Failed to save grades",
          description: "Please try again.",
          variant: "destructive",
        });
      }
    } catch (err) {
      logger.error("Error saving grades:", err);
      toast({
        title: "Failed to save grades",
        description: "Please check your connection and try again.",
        variant: "destructive",
      });
    }
  };

  const handleReleaseGrades = async (submissionIds: string[]) => {
    setIsReleasing(true);
    try {
      // In production, this would call an API to release grades to students
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast({
        title: "Grades released",
        description: `Grades have been released to ${submissionIds.length} student(s).`,
        variant: "success",
      });
      await fetchSubmissions();
    } catch (err) {
      logger.error("Error releasing grades:", err);
      toast({
        title: "Failed to release grades",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsReleasing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !homework) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <div className="text-center">
          <h2 className="text-lg font-semibold">Error Loading Homework</h2>
          <p className="text-sm text-gray-600">{error || "Homework not found"}</p>
        </div>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  // Convert homework questions to the format expected by GradingPanel
  const questions: HomeworkQuestion[] = (homework.questions || []).map((q: HomeworkQuestion) => ({
    id: q.id,
    type: q.type,
    question: q.question,
    options: q.options,
    correctAnswer: q.correctAnswer,
    points: q.points,
    tolerance: q.tolerance,
    keywords: q.keywords,
    explanation: q.explanation,
  }));

  // Convert submissions to the format expected by GradingPanel
  const formattedSubmissions: StudentSubmission[] = submissions.map((s: StudentSubmission) => ({
    id: s.id,
    studentId: s.studentId,
    studentName: s.studentName,
    studentEmail: s.studentEmail,
    answers: s.answers || [],
    submittedAt: s.submittedAt,
    metadata: s.metadata,
    status: "draft",
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.back()}
            className="shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{homework.title}</h1>
            <p className="text-sm text-gray-600">
              {homework.class?.name && `Class: ${homework.class.name} `}
              {homework.subject?.name && `| ${homework.subject.name}`}
              {` • Due: ${new Date(homework.dueDate).toLocaleDateString()}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {formattedSubmissions.length} Submission{formattedSubmissions.length !== 1 ? "s" : ""}
          </Badge>
          <Badge
            style={{
              background: "linear-gradient(135deg, rgb(59 130 246) 0%, rgb(37 99 235) 100%)",
              color: "white",
            }}
          >
            Teacher Portal
          </Badge>
        </div>
      </div>

      {/* Grading Panel */}
      {formattedSubmissions.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold">No Submissions Yet</h3>
              <p className="text-sm text-gray-600 max-w-md">
                Students have not submitted this homework yet. Once submissions are received,
                you can grade them here.
              </p>
              <Button variant="outline" onClick={() => router.back()}>
                Back to Homework
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <GradingPanel
          homeworkId={homeworkId}
          homeworkTitle={homework.title}
          questions={questions}
          submissions={formattedSubmissions}
          onGrade={handleGrade}
          onReleaseGrades={handleReleaseGrades}
        />
      )}

      {/* Loading Overlay */}
      {isReleasing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="p-8 flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-sm font-medium">Releasing grades...</p>
          </Card>
        </div>
      )}
    </div>
  );
}
