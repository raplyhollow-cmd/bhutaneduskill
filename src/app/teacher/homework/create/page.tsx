"use client";

import { logger } from "@/lib/logger";
import { useToast } from "@/components/ui/toaster";
/**
 * TEACHER HOMEWORK CREATE PAGE
 * Page for teachers to create new homework assignments
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2 } from "lucide-react";
import { HomeworkCreator, type HomeworkData } from "@/components/homework";

interface ClassData {
  id: string;
  name: string;
  grade: string;
  section: string;
}

interface SubjectData {
  id: string;
  name: string;
}

export default function CreateHomeworkPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [subjects, setSubjects] = useState<SubjectData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch classes and subjects from database
    Promise.all([
      fetchClasses(),
      fetchSubjects(),
    ]).finally(() => setIsLoading(false));
  }, []);

  const fetchClasses = async () => {
    try {
      const response = await fetch("/api/classes");
      if (response.ok) {
        const data = await response.json();
        setClasses(data.classes || []);
      } else {
        logger.error("Failed to fetch classes", { status: response.status });
        setClasses([]);
      }
    } catch (error) {
      logger.error("Error fetching classes:", error);
      setClasses([]);
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await fetch("/api/school-admin/subjects");
      if (response.ok) {
        const data = await response.json();
        setSubjects(data.subjects || []);
      } else {
        logger.error("Failed to fetch subjects", { status: response.status });
        setSubjects([]);
      }
    } catch (error) {
      logger.error("Error fetching subjects:", error);
      setSubjects([]);
    }
  };

  const handleSave = async (homeworkData: HomeworkData) => {
    setIsSaving(true);

    try {
      // Convert HomeworkCreator format to API format
      const apiData = {
        classId: homeworkData.classIds[0], // Take first class for API
        title: homeworkData.title,
        description: homeworkData.description,
        instructions: homeworkData.description,
        type: "assignment" as const,
        questions: homeworkData.questions,
        assignedDate: new Date().toISOString(),
        dueDate: homeworkData.dueDate,
        lateSubmissionDeadline: homeworkData.allowLateSubmission ? homeworkData.dueDate : undefined,
        maxPoints: homeworkData.totalPoints,
        timeLimit: homeworkData.timeLimit,
        showAnswersAfter: homeworkData.showResults,
        attemptsAllowed: 1,
      };

      const response = await fetch("/api/teacher/homework", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(apiData),
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Homework created!",
          description: "Your homework assignment has been created successfully.",
          variant: "success",
        });
        router.push(`/teacher/homework`);
      } else {
        const error = await response.json();
        toast({
          title: "Failed to create homework",
          description: error.error || "Unknown error",
          variant: "error",
        });
      }
    } catch (error) {
      logger.error("Error creating homework:", error);
      toast({
        title: "Failed to create homework",
        description: "Please check your connection and try again.",
        variant: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={handleCancel}
            className="shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create Homework</h1>
            <p className="text-sm text-gray-600">
              Create a new homework assignment for your students
            </p>
          </div>
        </div>
        <Badge
          className="ml-auto"
          style={{
            background: "linear-gradient(135deg, rgb(59 130 246) 0%, rgb(37 99 235) 100%)",
            color: "white",
          }}
        >
          Teacher Portal
        </Badge>
      </div>

      {/* Homework Creator Form */}
      <Card>
        <CardContent className="pt-6">
          <HomeworkCreator
            onSave={handleSave}
            onCancel={handleCancel}
            initialData={{
              classIds: classes.length > 0 ? [classes[0].id] : [],
              subject: subjects.length > 0 ? subjects[0].name : "",
            }}
          />
        </CardContent>
      </Card>

      {/* Loading Overlay */}
      {isSaving && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="p-8 flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-sm font-medium">Creating homework...</p>
          </Card>
        </div>
      )}
    </div>
  );
}
