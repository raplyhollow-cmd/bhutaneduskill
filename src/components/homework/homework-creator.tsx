/**
 * HOMEWORK CREATOR COMPONENT
 * Teacher interface for creating homework with multiple question types
 */
"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
  Upload,
  FileText,
  X,
  Link2,
  Paperclip,
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

export interface HomeworkAttachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
}

export interface ExternalLink {
  id: string;
  title: string;
  url: string;
  provider: "google_drive" | "onedrive" | "dropbox" | "other";
}

export interface ClassOption {
  id: string;
  name: string;
  grade: number;
  section?: string;
  studentCount?: number;
  subject?: string;
}

export interface HomeworkData {
  title: string;
  description: string;
  subject: string;
  classIds: string[]; // Changed to support multiple classes
  dueDate: string;
  totalPoints: number;
  allowLateSubmission: boolean;
  lateSubmissionDeadline?: string;
  showResults: "immediate" | "after_due" | "manual";
  shuffleQuestions: boolean;
  timeLimit?: number; // minutes
  questions: Question[];
  attachments?: HomeworkAttachment[];
  externalLinks?: ExternalLink[];
  type?: "assignment" | "quiz" | "project" | "reading";
  maxPoints?: number;
  passingPoints?: number;
}

interface HomeworkCreatorProps {
  onSave: (homework: HomeworkData) => void | Promise<void>;
  onCancel?: () => void;
  initialData?: Partial<HomeworkData>;
  availableClasses?: ClassOption[]; // Added for class selection
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

export function HomeworkCreator({ onSave, onCancel, initialData, availableClasses = [] }: HomeworkCreatorProps) {
  const [homework, setHomework] = useState<HomeworkData>({
    title: initialData?.title || "",
    description: initialData?.description || "",
    subject: initialData?.subject || "",
    classIds: initialData?.classIds || [],
    dueDate: initialData?.dueDate || "",
    totalPoints: 0,
    allowLateSubmission: true,
    showResults: "after_due",
    shuffleQuestions: false,
    questions: initialData?.questions || [],
    attachments: initialData?.attachments || [],
    externalLinks: initialData?.externalLinks || [],
    type: initialData?.type || "assignment",
  });

  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());
  const [selectedClasses, setSelectedClasses] = useState<Set<string>>(
    new Set(initialData?.classIds || [])
  );
  const [isSaving, setIsSaving] = useState(false);

  // Toggle class selection
  const toggleClass = useCallback((classId: string) => {
    setSelectedClasses((prev) => {
      const next = new Set(prev);
      if (next.has(classId)) {
        next.delete(classId);
      } else {
        next.add(classId);
      }
      setHomework((prev) => ({ ...prev, classIds: Array.from(next) }));
      return next;
    });
  }, []);

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

  const handleSave = async () => {
    if (!homework.title || !homework.dueDate || homework.classIds.length === 0) {
      alert("Please fill in all required fields (title, due date, and at least one class)");
      return;
    }
    setIsSaving(true);
    try {
      await onSave(homework);
    } finally {
      setIsSaving(false);
    }
  };

  // Add file attachment
  const addAttachment = (file: File) => {
    // In production, this would upload to a storage service
    const newAttachment: HomeworkAttachment = {
      id: `att_${Date.now()}`,
      name: file.name,
      url: URL.createObjectURL(file), // Temporary local URL
      type: file.type,
      size: file.size,
    };
    setHomework((prev) => ({
      ...prev,
      attachments: [...(prev.attachments || []), newAttachment],
    }));
  };

  // Remove attachment
  const removeAttachment = (attachmentId: string) => {
    setHomework((prev) => ({
      ...prev,
      attachments: prev.attachments?.filter((a) => a.id !== attachmentId),
    }));
  };

  // Add external link
  const addExternalLink = () => {
    const newLink: ExternalLink = {
      id: `link_${Date.now()}`,
      title: "",
      url: "",
      provider: "other",
    };
    setHomework((prev) => ({
      ...prev,
      externalLinks: [...(prev.externalLinks || []), newLink],
    }));
  };

  // Update external link
  const updateExternalLink = (linkId: string, updates: Partial<ExternalLink>) => {
    setHomework((prev) => ({
      ...prev,
      externalLinks: prev.externalLinks?.map((l) =>
        l.id === linkId ? { ...l, ...updates } : l
      ),
    }));
  };

  // Remove external link
  const removeExternalLink = (linkId: string) => {
    setHomework((prev) => ({
      ...prev,
      externalLinks: prev.externalLinks?.filter((l) => l.id !== linkId),
    }));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
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

          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium">Subject *</label>
              <Input
                value={homework.subject}
                onChange={(e) => setHomework({ ...homework, subject: e.target.value })}
                placeholder="e.g., Mathematics"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Type</label>
              <select
                className="w-full border rounded-md px-3 py-2"
                value={homework.type}
                onChange={(e) =>
                  setHomework({ ...homework, type: e.target.value as HomeworkData["type"] })
                }
              >
                <option value="assignment">Assignment</option>
                <option value="quiz">Quiz</option>
                <option value="project">Project</option>
                <option value="reading">Reading</option>
              </select>
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

          {/* Class Selection */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Assign to Classes * ({selectedClasses.size} selected)
            </label>
            {availableClasses.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                {availableClasses.map((cls) => (
                  <button
                    key={cls.id}
                    type="button"
                    onClick={() => toggleClass(cls.id)}
                    className={`
                      p-3 border rounded-lg text-left transition-all
                      ${selectedClasses.has(cls.id)
                        ? "border-blue-500 bg-blue-50 ring-2 ring-blue-500/20"
                        : "border-gray-200 hover:border-gray-300"
                      }
                    `}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-sm">{cls.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Grade {cls.grade}{cls.section ? ` - ${cls.section}` : ""}
                        </p>
                        {cls.studentCount !== undefined && (
                          <p className="text-xs text-muted-foreground mt-1">
                            <Users className="w-3 h-3 inline mr-1" />
                            {cls.studentCount} students
                          </p>
                        )}
                      </div>
                      <div className={`
                        w-5 h-5 rounded-full border-2 flex items-center justify-center
                        ${selectedClasses.has(cls.id)
                          ? "border-blue-500 bg-blue-500"
                          : "border-gray-300"
                        }
                      `}>
                        {selectedClasses.has(cls.id) && (
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground p-4 bg-muted rounded-lg">
                No classes available. Classes will be loaded from your profile.
              </div>
            )}
          </div>

          {/* Grading Settings */}
          <div className="grid md:grid-cols-2 gap-4">
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
                <option value="manual">After manual grading</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium">Passing Score (optional)</label>
              <Input
                type="number"
                min="0"
                max="100"
                value={homework.passingPoints || ""}
                onChange={(e) =>
                  setHomework({
                    ...homework,
                    passingPoints: e.target.value ? parseInt(e.target.value) : undefined,
                  })
                }
                placeholder="Minimum points to pass"
              />
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Allow Late Submission</p>
                <p className="text-xs text-muted-foreground">Students can submit after the due date</p>
              </div>
              <Switch
                checked={homework.allowLateSubmission}
                onCheckedChange={(checked) =>
                  setHomework({ ...homework, allowLateSubmission: checked })
                }
              />
            </div>

            {homework.allowLateSubmission && (
              <div className="pl-4">
                <label className="text-xs font-medium">Late Submission Deadline</label>
                <Input
                  type="datetime-local"
                  value={homework.lateSubmissionDeadline || ""}
                  onChange={(e) =>
                    setHomework({ ...homework, lateSubmissionDeadline: e.target.value })
                  }
                  className="mt-1"
                />
              </div>
            )}

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Shuffle Questions</p>
                <p className="text-xs text-muted-foreground">Each student sees questions in different order</p>
              </div>
              <Switch
                checked={homework.shuffleQuestions}
                onCheckedChange={(checked) =>
                  setHomework({ ...homework, shuffleQuestions: checked })
                }
              />
            </div>
          </div>

          {/* Stats */}
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

      {/* Attachments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Paperclip className="w-5 h-5" />
            Attachments & Resources
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* File Upload */}
          <div>
            <label className="text-sm font-medium mb-2 block">Upload Files</label>
            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              <input
                type="file"
                id="file-upload"
                className="hidden"
                multiple
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  files.forEach(addAttachment);
                }}
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  PDF, images, documents (max 10MB each)
                </p>
              </label>
            </div>
          </div>

          {/* Uploaded Files List */}
          {homework.attachments && homework.attachments.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Uploaded Files</p>
              {homework.attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="flex items-center gap-3 p-3 bg-muted rounded-lg"
                >
                  <FileText className="w-5 h-5 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{attachment.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(attachment.size)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => removeAttachment(attachment.id)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* External Links */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">External Links</label>
              <Button variant="outline" size="sm" onClick={addExternalLink}>
                <Link2 className="w-4 h-4 mr-1" />
                Add Link
              </Button>
            </div>

            {homework.externalLinks && homework.externalLinks.length > 0 ? (
              <div className="space-y-3">
                {homework.externalLinks.map((link) => (
                  <div key={link.id} className="flex gap-2">
                    <Input
                      value={link.title}
                      onChange={(e) =>
                        updateExternalLink(link.id, { title: e.target.value })
                      }
                      placeholder="Link title"
                      className="flex-1"
                    />
                    <Input
                      value={link.url}
                      onChange={(e) =>
                        updateExternalLink(link.id, { url: e.target.value })
                      }
                      placeholder="https://..."
                      className="flex-[2]"
                    />
                    <select
                      value={link.provider}
                      onChange={(e) =>
                        updateExternalLink(link.id, {
                          provider: e.target.value as ExternalLink["provider"],
                        })
                      }
                      className="border rounded-md px-3 py-2"
                    >
                      <option value="other">Other</option>
                      <option value="google_drive">Google Drive</option>
                      <option value="onedrive">OneDrive</option>
                      <option value="dropbox">Dropbox</option>
                    </select>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => removeExternalLink(link.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground p-3 bg-muted rounded-lg">
                Add links to Google Drive, OneDrive, or other external resources
              </p>
            )}
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
                Math
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => addQuestion("match_following")}
              >
                <Plus className="w-4 h-4 mr-1" />
                Match
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        {onCancel && (
          <Button variant="outline" onClick={onCancel} disabled={isSaving}>
            Cancel
          </Button>
        )}
        <Button
          onClick={handleSave}
          disabled={isSaving || selectedClasses.size === 0}
          style={{
            background: "linear-gradient(135deg, rgb(59 130 246) 0%, rgb(37 99 235) 100%)",
          }}
          className="text-white hover:opacity-90"
        >
          {isSaving ? (
            <>
              <span className="w-4 h-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Homework
            </>
          )}
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
