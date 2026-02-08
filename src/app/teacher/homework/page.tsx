/**
 * TEACHER HOMEWORK PAGE
 * Create and manage homework assignments
 */
"use client";

import { useState, useEffect } from "react";
import { PortalHeader } from "@/components/shared/portal-sidebar";
import { HomeworkCreator } from "@/components/homework";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Eye, Edit, Trash2, FileText } from "lucide-react";

// Mock homework data
const mockHomework = [
  {
    id: "hw1",
    title: "Quadratic Equations Practice",
    subject: "Mathematics",
    classId: "class10a",
    dueDate: "2025-02-15T23:59",
    totalPoints: 50,
    questions: [
      { id: "q1", type: "multiple_choice" as const, question: "What is the quadratic formula?", points: 5, options: ["x = (-b ± √(b²-4ac)) / 2a", "x = -b/a", "x² + bx + c = 0"], correctAnswer: "x = (-b ± √(b²-4ac)) / 2a" },
    ],
  },
];

export default function TeacherHomeworkPage() {
  const [view, setView] = useState<"list" | "create" | "edit">("list");
  const [homeworkList, setHomeworkList] = useState(mockHomework);
  const [selectedHomework, setSelectedHomework] = useState<any>(null);

  const handleSave = async (homework: any) => {
    console.log("Saving homework:", homework);
    // In production: await fetch('/api/teacher/homework', { method: 'POST', body: JSON.stringify(homework) })
    setHomeworkList([...homeworkList, { ...homework, id: `hw${Date.now()}` }]);
    setView("list");
  };

  if (view === "create") {
    return (
      <div className="min-h-screen bg-gray-50">
        <PortalHeader userType="teacher" userName="Teacher" title="Create Homework" />
        <div className="lg:ml-64 p-6">
          <div className="mb-4">
            <Button variant="outline" onClick={() => setView("list")}>
              ← Back to Homework List
            </Button>
          </div>
          <HomeworkCreator onSave={handleSave} onCancel={() => setView("list")} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PortalHeader userType="teacher" userName="Teacher" title="Homework Management" />
      <div className="lg:ml-64 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-muted-foreground">Create and manage homework assignments</p>
          </div>
          <Button onClick={() => setView("create")}>
            <Plus className="w-4 h-4 mr-2" />
            Create Homework
          </Button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {homeworkList.map((hw) => (
            <Card key={hw.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{hw.title}</h3>
                    <p className="text-sm text-muted-foreground">{hw.subject}</p>
                    <p className="text-sm mt-2">Due: {new Date(hw.dueDate).toLocaleDateString()}</p>
                    <p className="text-sm">{hw.totalPoints} points • {hw.questions.length} questions</p>
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </Button>
                  <Button variant="outline" size="sm">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
