/**
 * STUDENT HOMEWORK PAGE
 * View and submit homework assignments
 */
"use client";

import { useState } from "react";
import { PortalHeader } from "@/components/shared/portal-sidebar";
import { HomeworkSubmission } from "@/components/homework";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { FileText, Clock, CheckCircle, AlertCircle } from "lucide-react";

// Mock homework data
const mockHomework = [
  {
    id: "hw1",
    title: "Quadratic Equations Practice",
    description: "Solve the following quadratic equations using the quadratic formula",
    subject: "Mathematics",
    dueDate: "2025-02-15T23:59",
    timeLimit: 30,
    totalPoints: 50,
    shuffleQuestions: false,
    showResults: "after_grading" as const,
    questions: [
      { id: "q1", type: "multiple_choice" as const, question: "What is the quadratic formula?", points: 5, options: ["x = (-b ± √(b²-4ac)) / 2a", "x = -b/a", "x² + bx + c = 0"] },
      { id: "q2", type: "true_false" as const, question: "A quadratic equation always has two real solutions.", points: 5 },
      { id: "q3", type: "fill_blank" as const, question: "The discriminant is given by _____", points: 5 },
      { id: "q4", type: "short_answer" as const, question: "Explain when a quadratic equation has no real solutions.", points: 10, keywords: ["discriminant", "negative", "imaginary"] },
      { id: "q5", type: "numeric" as const, question: "Solve: x² - 5x + 6 = 0. What is the sum of the solutions?", points: 10, correctAnswer: 5 },
    ],
  },
  {
    id: "hw2",
    title: "Essay: Environmental Conservation in Bhutan",
    description: "Write an essay about Bhutan's environmental conservation efforts",
    subject: "English",
    dueDate: "2025-02-20T23:59",
    totalPoints: 100,
    shuffleQuestions: false,
    showResults: "after_grading" as const,
    questions: [
      { id: "q1", type: "essay" as const, question: "Discuss Bhutan's carbon neutral status and its significance globally.", points: 50 },
    ],
  },
];

export default function StudentHomeworkPage() {
  const [selectedHomework, setSelectedHomework] = useState<any>(null);

  const handleSubmit = async (answers: any, metadata: any) => {
    console.log("Submitting homework:", answers, metadata);
    // In production: await fetch('/api/student/homework/[id]', { method: 'POST', body: JSON.stringify({ answers, metadata }) })
    setSelectedHomework(null);
  };

  const handleSaveDraft = async (answers: any) => {
    console.log("Saving draft:", answers);
    // In production: await fetch('/api/student/homework/[id]/draft', { method: 'POST', body: JSON.stringify({ answers }) })
  };

  if (selectedHomework) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PortalHeader userType="student" userName="Student" title={selectedHomework.title} />
        <div className="lg:ml-64 p-6">
          <div className="mb-4">
            <Button variant="outline" onClick={() => setSelectedHomework(null)}>
              ← Back to Homework
            </Button>
          </div>
          <HomeworkSubmission
            homework={selectedHomework}
            onSaveDraft={handleSaveDraft}
            onSubmit={handleSubmit}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PortalHeader userType="student" userName="Student" title="My Homework" />
      <div className="lg:ml-64 p-6">
        <div className="grid md:grid-cols-2 gap-4">
          {mockHomework.map((hw) => {
            const dueDate = new Date(hw.dueDate);
            const isOverdue = dueDate < new Date();
            const daysLeft = Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

            return (
              <Card key={hw.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setSelectedHomework(hw)}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{hw.title}</h3>
                        {isOverdue && (
                          <Badge className="bg-red-100 text-red-700">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Overdue
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{hw.description}</p>
                      <p className="text-sm mt-2 font-medium">{hw.subject}</p>

                      <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {isOverdue
                            ? `Overdue by ${Math.abs(daysLeft)} days`
                            : daysLeft === 0
                            ? "Due today"
                            : daysLeft === 1
                            ? "Due tomorrow"
                            : `Due in ${daysLeft} days`}
                        </span>
                        <span>{hw.totalPoints} points</span>
                      </div>
                    </div>
                  </div>

                  <Button className="w-full mt-4">
                    {isOverdue ? "View Details" : "Start Homework"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
