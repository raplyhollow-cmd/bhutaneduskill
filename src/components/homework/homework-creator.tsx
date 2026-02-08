/**
 * HOMEWORK CREATOR COMPONENT
 * Teacher interface for creating homework with multiple question types
 */
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Trash2,
  GripVertical,
  Save,
  Eye,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Calendar,
  Users,
  Clock,
} from "lucide-react";

export type QuestionType =
  | "multiple_choice"
  | "true_false"
  | "fill_blank"
  | "short_answer"
  | "essay"
  | "numeric"
  | "math_expression"
  | "match_following";

export interface Question {
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

export interface HomeworkData {
  title: string;
  description: string;
  subject: string;
  classId: string;
  dueDate: string;
  totalPoints: number;
  allowLateSubmission: boolean;
  showResults: "immediate" | "after_due" | "after_grading";
  shuffleQuestions: boolean;
  timeLimit?: number; // minutes
  questions: Question[];
}

interface HomeworkCreatorProps {
  onSave: (homework: HomeworkData) => void | Promise<void>;
  onCancel?: () => void;
  initialData?: Partial<HomeworkData>;
}

const questionTypeLabels: Record<QuestionType, string> = {
  multiple_choice: "Multiple Choice",
  true_false: "True / False",
  fill_blank: "Fill in the Blank",
  short_answer: "Short Answer",
  essay: "Essay",
  numeric: "Numeric Answer",
  math_expression: "Math Expression",
  match_following: "Match the Following",
};

export function HomeworkCreator({ onSave, onCancel, initialData }: HomeworkCreatorProps) {
  const [homework, setHomework] = useState<HomeworkData>({
    title: initialData?.title || "",
    description: initialData?.description || "",
    subject: initialData?.subject || "",
    classId: initialData?.classId || "",
    dueDate: initialData?.dueDate || "",
    totalPoints: 0,
    allowLateSubmission: true,
    showResults: "after_grading",
    shuffleQuestions: false,
    questions: initialData?.questions || [],
  });

  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());

  const toggleQuestionExpanded = (questionId: string) => {
    setExpandedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) {
        next.delete(questionId);
      } else {
        next.add(questionId);
      }
      return next;
    });
  };

  const addQuestion = (type: QuestionType) => {
    const newQuestion: Question = {
      id: `q_${Date.now()}`,
      type,
      question: "",
      points: 1,
      correctAnswer: type === "true_false" ? "true" : "",
      options: type === "multiple_choice" ? ["", "", "", ""] : undefined,
    };

    setHomework((prev) => {
      const updated = {
        ...prev,
        questions: [...prev.questions, newQuestion],
      };
      updated.totalPoints = updated.questions.reduce((sum, q) => sum + q.points, 0);
      return updated;
    });

    setExpandedQuestions((prev) => new Set(prev).add(newQuestion.id));
  };

  const updateQuestion = (questionId: string, updates: Partial<Question>) => {
    setHomework((prev) => {
      const updated = {
        ...prev,
        questions: prev.questions.map((q) =>
          q.id === questionId ? { ...q, ...updates } : q
        ),
      };
      updated.totalPoints = updated.questions.reduce((sum, q) => sum + q.points, 0);
      return updated;
    });
  };

  const deleteQuestion = (questionId: string) => {
    setHomework((prev) => {
      const updated = {
        ...prev,
        questions: prev.questions.filter((q) => q.id !== questionId),
      };
      updated.totalPoints = updated.questions.reduce((sum, q) => sum + q.points, 0);
      return updated;
    });
  };

  const handleSave = () => {
    if (!homework.title || !homework.dueDate || homework.questions.length === 0) {
      alert("Please fill in all required fields");
      return;
    }
    onSave(homework);
  };

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>Homework Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Title *</label>
            <Input
              value={homework.title}
              onChange={(e) => setHomework({ ...homework, title: e.target.value })}
              placeholder="e.g., Quadratic Equations Practice"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Description</label>
            <Textarea
              value={homework.description}
              onChange={(e) => setHomework({ ...homework, description: e.target.value })}
              placeholder="Instructions for students..."
              rows={3}
            />
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Subject *</label>
              <Input
                value={homework.subject}
                onChange={(e) => setHomework({ ...homework, subject: e.target.value })}
                placeholder="e.g., Mathematics"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Due Date *</label>
              <Input
                type="datetime-local"
                value={homework.dueDate}
                onChange={(e) => setHomework({ ...homework, dueDate: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Time Limit (minutes)</label>
              <Input
                type="number"
                value={homework.timeLimit || ""}
                onChange={(e) =>
                  setHomework({
                    ...homework,
                    timeLimit: e.target.value ? parseInt(e.target.value) : undefined,
                  })
                }
                placeholder="Optional"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Show Results</label>
              <select
                className="w-full border rounded-md px-3 py-2"
                value={homework.showResults}
                onChange={(e) =>
                  setHomework({ ...homework, showResults: e.target.value as any })
                }
              >
                <option value="immediate">Immediately after submission</option>
                <option value="after_due">After due date</option>
                <option value="after_grading">After grading</option>
              </select>
            </div>

            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="allowLate"
                checked={homework.allowLateSubmission}
                onChange={(e) =>
                  setHomework({ ...homework, allowLateSubmission: e.target.checked })
                }
              />
              <label htmlFor="allowLate" className="text-sm">
                Allow late submission
              </label>
            </div>

            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="shuffle"
                checked={homework.shuffleQuestions}
                onChange={(e) =>
                  setHomework({ ...homework, shuffleQuestions: e.target.checked })
                }
              />
              <label htmlFor="shuffle" className="text-sm">
                Shuffle questions
              </label>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-4">
              <BookOpen className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm">Total Questions</span>
              <Badge variant="secondary">{homework.questions.length}</Badge>
            </div>
            <div className="flex items-center gap-4">
              <Clock className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm">Total Points</span>
              <Badge className="bg-primary text-primary-foreground">
                {homework.totalPoints}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Questions */}
      <Card>
        <CardHeader>
          <CardTitle>Questions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {homework.questions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No questions yet. Add your first question below.
            </div>
          ) : (
            homework.questions.map((question, index) => (
              <QuestionCard
                key={question.id}
                question={question}
                index={index}
                isExpanded={expandedQuestions.has(question.id)}
                onToggle={() => toggleQuestionExpanded(question.id)}
                onUpdate={(updates) => updateQuestion(question.id, updates)}
                onDelete={() => deleteQuestion(question.id)}
              />
            ))
          )}

          {/* Add Question Buttons */}
          <div className="border-t pt-4">
            <p className="text-sm font-medium mb-3">Add Question</p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => addQuestion("multiple_choice")}
              >
                <Plus className="w-4 h-4 mr-1" />
                Multiple Choice
              </Button>
              <Button variant="outline" size="sm" onClick={() => addQuestion("true_false")}>
                <Plus className="w-4 h-4 mr-1" />
                True/False
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => addQuestion("fill_blank")}
              >
                <Plus className="w-4 h-4 mr-1" />
                Fill Blank
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => addQuestion("short_answer")}
              >
                <Plus className="w-4 h-4 mr-1" />
                Short Answer
              </Button>
              <Button variant="outline" size="sm" onClick={() => addQuestion("essay")}>
                <Plus className="w-4 h-4 mr-1" />
                Essay
              </Button>
              <Button variant="outline" size="sm" onClick={() => addQuestion("numeric")}>
                <Plus className="w-4 h-4 mr-1" />
                Numeric
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => addQuestion("math_expression")}
              >
                <Plus className="w-4 h-4 mr-1" />
                Math Expression
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => addQuestion("match_following")}
              >
                <Plus className="w-4 h-4 mr-1" />
                Match Following
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button onClick={handleSave}>
          <Save className="w-4 h-4 mr-2" />
          Save Homework
        </Button>
      </div>
    </div>
  );
}

interface QuestionCardProps {
  question: Question;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  onUpdate: (updates: Partial<Question>) => void;
  onDelete: () => void;
}

function QuestionCard({
  question,
  index,
  isExpanded,
  onToggle,
  onUpdate,
  onDelete,
}: QuestionCardProps) {
  return (
    <Card className={isExpanded ? "border-primary" : ""}>
      <CardContent className="pt-4">
        <div className="flex items-start gap-3">
          <GripVertical className="w-5 h-5 text-muted-foreground mt-2 cursor-move" />

          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Q{index + 1}</span>
                <Badge variant="outline">{questionTypeLabels[question.type]}</Badge>
                <span className="text-sm text-muted-foreground">
                  {question.points} pt{question.points !== 1 ? "s" : ""}
                </span>
              </div>

              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon-xs" onClick={onToggle}>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </Button>
                <Button variant="ghost" size="icon-xs" onClick={onDelete}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </div>

            {isExpanded && (
              <div className="mt-4 space-y-4">
                <div>
                  <label className="text-xs font-medium">Question</label>
                  <Textarea
                    value={question.question}
                    onChange={(e) => onUpdate({ question: e.target.value })}
                    placeholder="Enter your question..."
                    rows={2}
                  />
                </div>

                {question.type === "multiple_choice" && (
                  <MultipleChoiceEditor
                    options={question.options || ["", "", "", ""]}
                    correctAnswer={question.correctAnswer as string}
                    onUpdate={(options, correctAnswer) =>
                      onUpdate({ options, correctAnswer })
                    }
                  />
                )}

                {question.type === "true_false" && (
                  <div>
                    <label className="text-xs font-medium">Correct Answer</label>
                    <div className="flex gap-4 mt-2">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`tf-${question.id}`}
                          checked={question.correctAnswer === "true"}
                          onChange={() => onUpdate({ correctAnswer: "true" })}
                        />
                        True
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`tf-${question.id}`}
                          checked={question.correctAnswer === "false"}
                          onChange={() => onUpdate({ correctAnswer: "false" })}
                        />
                        False
                      </label>
                    </div>
                  </div>
                )}

                {question.type === "fill_blank" && (
                  <div>
                    <label className="text-xs font-medium">Correct Answer</label>
                    <Input
                      value={question.correctAnswer as string}
                      onChange={(e) => onUpdate({ correctAnswer: e.target.value })}
                      placeholder="The correct answer"
                    />
                  </div>
                )}

                {question.type === "short_answer" && (
                  <div>
                    <label className="text-xs font-medium">
                      Keywords (comma-separated)
                    </label>
                    <Input
                      value={question.keywords?.join(", ") || ""}
                      onChange={(e) =>
                        onUpdate({
                          keywords: e.target.value
                            .split(",")
                            .map((s) => s.trim())
                            .filter(Boolean),
                        })
                      }
                      placeholder="e.g., photosynthesis, chlorophyll, sunlight"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Student answers containing these keywords will receive partial
                      credit.
                    </p>
                  </div>
                )}

                {question.type === "numeric" && (
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium">Correct Answer</label>
                      <Input
                        type="number"
                        value={question.correctAnswer as string}
                        onChange={(e) => onUpdate({ correctAnswer: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium">Tolerance (±)</label>
                      <Input
                        type="number"
                        value={question.tolerance || 0}
                        onChange={(e) =>
                          onUpdate({ tolerance: parseFloat(e.target.value) || 0 })
                        }
                        placeholder="0 for exact match"
                      />
                    </div>
                  </div>
                )}

                {question.type === "math_expression" && (
                  <div>
                    <label className="text-xs font-medium">Correct Expression</label>
                    <Input
                      value={question.correctAnswer as string}
                      onChange={(e) => onUpdate({ correctAnswer: e.target.value })}
                      placeholder="e.g., x^2 + 2x + 1 or (x+1)^2"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Expressions that evaluate to the same value will be marked
                      correct.
                    </p>
                  </div>
                )}

                <div>
                  <label className="text-xs font-medium">Explanation (optional)</label>
                  <Textarea
                    value={question.explanation || ""}
                    onChange={(e) => onUpdate({ explanation: e.target.value })}
                    placeholder="Shown to students after grading..."
                    rows={2}
                  />
                </div>

                <div>
                  <label className="text-xs font-medium">Points</label>
                  <Input
                    type="number"
                    min="1"
                    value={question.points}
                    onChange={(e) =>
                      onUpdate({ points: parseInt(e.target.value) || 1 })
                    }
                    className="w-20"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface MultipleChoiceEditorProps {
  options: string[];
  correctAnswer: string;
  onUpdate: (options: string[], correctAnswer: string) => void;
}

function MultipleChoiceEditor({
  options,
  correctAnswer,
  onUpdate,
}: MultipleChoiceEditorProps) {
  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    onUpdate(newOptions, correctAnswer);
  };

  const setCorrect = (index: number) => {
    onUpdate(options, options[index]);
  };

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium">Options</label>
      {options.map((option, index) => (
        <div key={index} className="flex items-center gap-2">
          <input
            type="radio"
            name={`mc-${correctAnswer}-${options.length}`}
            checked={correctAnswer === option}
            onChange={() => setCorrect(index)}
          />
          <Input
            value={option}
            onChange={(e) => updateOption(index, e.target.value)}
            placeholder={`Option ${String.fromCharCode(65 + index)}`}
          />
          {correctAnswer === option && (
            <Badge className="bg-green-100 text-green-700">Correct</Badge>
          )}
        </div>
      ))}
    </div>
  );
}
