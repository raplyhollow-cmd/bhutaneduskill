/**
 * TEACHER HOMEWORK CREATE PAGE
 * Page for teachers to create new homework assignments
 */
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2 } from "lucide-react";
import { HomeworkCreator, type HomeworkData } from "@/components/homework";

// Mock classes data - will be replaced with API call
const mockClasses = [
  { id: "class1", name: "Class 10 A", grade: "10", section: "A" },
  { id: "class2", name: "Class 10 B", grade: "10", section: "B" },
  { id: "class3", name: "Class 9 A", grade: "9", section: "A" },
];

// Mock subjects data
const mockSubjects = [
  { id: "sub1", name: "Mathematics" },
  { id: "sub2", name: "English" },
  { id: "sub3", name: "Science" },
  { id: "sub4", name: "History" },
];

export default function CreateHomeworkPage() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [classes, setClasses] = useState<typeof mockClasses>([]);
  const [subjects, setSubjects] = useState<typeof mockSubjects>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch classes and subjects
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
        setClasses(data.classes || mockClasses);
      } else {
        setClasses(mockClasses);
      }
    } catch {
      setClasses(mockClasses);
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await fetch("/api/school-admin/subjects");
      if (response.ok) {
        const data = await response.json();
        setSubjects(data.subjects || mockSubjects);
      } else {
        setSubjects(mockSubjects);
      }
    } catch {
      setSubjects(mockSubjects);
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
        router.push(`/teacher/homework`);
      } else {
        const error = await response.json();
        alert(`Failed to create homework: ${error.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error creating homework:", error);
      alert("Failed to create homework. Please try again.");
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
              classIds: classes[0]?.id ? [classes[0].id] : [],
              subject: subjects[0]?.name || "",
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
