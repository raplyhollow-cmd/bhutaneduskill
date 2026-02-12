/**
 * Homework Submission Component
 *
 * Allows students to view and submit homework assignments.
 */

"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Save, Send } from "lucide-react";

interface Question {
  id: string;
  type: string;
  question: string;
  points: number;
  options?: string[];
}

interface Homework {
  id: string;
  title: string;
  description: string;
  subject: string;
  dueDate: string;
  totalPoints: number;
  questions: Question[];
}

interface HomeworkSubmissionProps {
  homework: Homework;
  onSaveDraft?: (answers: Record<string, any>) => void;
  onSubmit?: (answers: Record<string, any>) => void;
}

export function HomeworkSubmission({ homework, onSaveDraft, onSubmit }: HomeworkSubmissionProps) {
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);

  const handleAnswerChange = (questionId: string, answer: any) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    await onSaveDraft?.(answers);
    setSaving(false);
  };

  const handleSubmit = async () => {
    await onSubmit?.(answers);
  };

  const isAllAnswered = homework.questions.every((q) => answers[q.id]);

  return (
    <div className="space-y-6">
      {/* Homework Info */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>{homework.title}</CardTitle>
              <p className="text-gray-500 mt-1">{homework.description}</p>
            </div>
            <Badge variant="outline">{homework.subject}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>Due: {new Date(homework.dueDate).toLocaleString()}</span>
            <span>Total Points: {homework.totalPoints}</span>
          </div>
        </CardContent>
      </Card>

      {/* Questions */}
      {homework.questions.map((question, index) => (
        <Card key={question.id}>
          <CardHeader>
            <CardTitle className="text-base">
              Q{index + 1}: {question.question}
              <span className="ml-2 text-sm font-normal text-gray-500">({question.points} pts)</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {question.type === "multiple_choice" && question.options ? (
              <div className="space-y-2">
                {question.options.map((option, i) => (
                  <label key={i} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name={question.id}
                      value={option}
                      checked={answers[question.id] === option}
                      onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                      className="w-4 h-4"
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            ) : (
              <Textarea
                placeholder="Type your answer here..."
                value={answers[question.id] || ""}
                onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                rows={4}
              />
            )}
          </CardContent>
        </Card>
      ))}

      {/* Actions */}
      <div className="flex gap-4">
        <Button variant="outline" onClick={handleSaveDraft} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Saving..." : "Save Draft"}
        </Button>
        <Button onClick={handleSubmit} disabled={!isAllAnswered}>
          <Send className="h-4 w-4 mr-2" />
          Submit Homework
        </Button>
      </div>
    </div>
  );
}
