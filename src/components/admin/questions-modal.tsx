"use client";

import { logger } from "@/lib/logger";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  X,
  Plus,
  Edit,
  Trash2,
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff,
  Save,
  BarChart3,
  TrendingUp,
  Lightbulb,
} from "lucide-react";
import { portal, semantic, semanticGradients } from "@/styles/design-tokens";
import {
  getAssessmentQuestions,
  createAssessmentQuestion,
  updateAssessmentQuestion,
  deleteAssessmentQuestion,
  bulkCreateQuestions,
} from "@/app/admin/assessments/actions";

interface AssessmentType {
  id: string;
  name: string;
  category?: string;
}

interface QuestionsModalProps {
  open: boolean;
  onClose: () => void;
  assessmentType: AssessmentType | null;
  onSuccess: () => void;
}

interface QuestionData {
  type?: string;
  min?: number;
  max?: number;
  dimensions?: string[];
  categories?: string[];
  options?: string[];
  [key: string]: string | number | string[] | undefined;
}

interface DbQuestion {
  id: string;
  questionText: string;
  questionData: QuestionData | Record<string, unknown>;
  options: string[];
  correctAnswer: string;
  points: number;
  order: number;
  isActive: boolean;
}

interface Question {
  id?: string;
  questionText: string;
  questionData?: QuestionData;
  options?: string[];
  correctAnswer?: string;
  points: number;
  order: number;
  isActive: boolean;
}

export function QuestionsModal({ open, onClose, assessmentType, onSuccess }: QuestionsModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showResultPreview, setShowResultPreview] = useState(false);
  const [newQuestion, setNewQuestion] = useState<Question>({
    questionText: "",
    points: 1,
    order: 1,
    isActive: true,
  });

  // Question types
  const questionTypes = [
    { value: "text", label: "Text Input" },
    { value: "textarea", label: "Long Text" },
    { value: "single_choice", label: "Single Choice" },
    { value: "multiple_choice", label: "Multiple Choice" },
    { value: "likert_5", label: "Likert Scale (1-5)" },
    { value: "likert_7", label: "Likert Scale (1-7)" },
    { value: "boolean", label: "Yes/No" },
  ];

  // Fetch questions when modal opens
  useEffect(() => {
    if (open && assessmentType?.id) {
      fetchQuestions();
    }
  }, [open, assessmentType]);

  const fetchQuestions = async () => {
    setIsLoading(true);
    try {
      const data = await getAssessmentQuestions(assessmentType.id);
      // Map database question to component Question type
      setQuestions(data.map((q: DbQuestion) => ({
        id: q.id,
        questionText: q.questionText,
        questionData: typeof q.questionData === 'object' && q.questionData !== null
          ? q.questionData as QuestionData
          : undefined,
        options: q.options || undefined,
        correctAnswer: q.correctAnswer || undefined,
        points: q.points,
        order: q.order,
        isActive: q.isActive,
      })));
    } catch (error) {
      logger.error("Failed to fetch questions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddQuestion = async () => {
    setIsLoading(true);
    try {
      await createAssessmentQuestion({
        assessmentTypeId: assessmentType.id,
        questionText: newQuestion.questionText,
        questionData: {
          type: newQuestion.questionData?.type || "text",
        },
        options: newQuestion.options,
        correctAnswer: newQuestion.correctAnswer,
        points: newQuestion.points,
      });

      await fetchQuestions();
      setShowAddForm(false);
      setNewQuestion({
        questionText: "",
        points: 1,
        order: questions.length + 1,
        isActive: true,
      });
      onSuccess();
    } catch (error) {
      logger.error("Failed to add question:", error);
      alert(error instanceof Error ? error.message : "Failed to add question");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateQuestion = async (index: number) => {
    const question = questions[index];
    if (!question.id) return;

    setIsLoading(true);
    try {
      await updateAssessmentQuestion(question.id, {
        questionText: question.questionText,
        questionData: question.questionData,
        options: question.options,
        correctAnswer: question.correctAnswer,
        points: question.points,
        order: question.order,
        isActive: question.isActive,
      });

      setEditingIndex(null);
      onSuccess();
    } catch (error) {
      logger.error("Failed to update question:", error);
      alert(error instanceof Error ? error.message : "Failed to update question");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteQuestion = async (index: number) => {
    const question = questions[index];
    if (!question.id) return;

    if (!confirm("Are you sure you want to delete this question?")) return;

    setIsLoading(true);
    try {
      await deleteAssessmentQuestion(question.id);
      await fetchQuestions();
      onSuccess();
    } catch (error) {
      logger.error("Failed to delete question:", error);
      alert(error instanceof Error ? error.message : "Failed to delete question");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMoveQuestion = async (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= questions.length) return;

    const updatedQuestions = [...questions];
    const temp = updatedQuestions[index].order;
    updatedQuestions[index].order = updatedQuestions[newIndex].order;
    updatedQuestions[newIndex].order = temp;

    // Swap in array
    [updatedQuestions[index], updatedQuestions[newIndex]] = [updatedQuestions[newIndex], updatedQuestions[index]];

    // Update both in database
    setIsLoading(true);
    try {
      if (updatedQuestions[index].id) {
        await updateAssessmentQuestion(updatedQuestions[index].id, { order: updatedQuestions[index].order });
      }
      if (updatedQuestions[newIndex].id) {
        await updateAssessmentQuestion(updatedQuestions[newIndex].id, { order: updatedQuestions[newIndex].order });
      }
      await fetchQuestions();
    } catch (error) {
      logger.error("Failed to reorder questions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = async (index: number) => {
    const question = questions[index];
    if (!question.id) return;

    setIsLoading(true);
    try {
      await updateAssessmentQuestion(question.id, {
        isActive: !question.isActive,
      });
      await fetchQuestions();
      onSuccess();
    } catch (error) {
      logger.error("Failed to toggle question:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddOption = () => {
    setNewQuestion({
      ...newQuestion,
      options: [...(newQuestion.options || []), ""],
    });
  };

  const handleUpdateOption = (index: number, value: string) => {
    const updated = [...(newQuestion.options || [])];
    updated[index] = value;
    setNewQuestion({ ...newQuestion, options: updated });
  };

  const handleRemoveOption = (index: number) => {
    const updated = (newQuestion.options || []).filter((_, i) => i !== index);
    setNewQuestion({ ...newQuestion, options: updated });
  };

  const updateQuestionField = (index: number, field: keyof Question, value: Question[keyof Question] | QuestionData) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const updateQuestionOption = (qIndex: number, optIndex: number, value: string) => {
    const updated = [...questions];
    const options = updated[qIndex].options || [];
    options[optIndex] = value;
    updated[qIndex] = { ...updated[qIndex], options };
    setQuestions(updated);
  };

  const addQuestionOption = (qIndex: number) => {
    const updated = [...questions];
    const options = updated[qIndex].options || [];
    updated[qIndex] = { ...updated[qIndex], options: [...options, ""] };
    setQuestions(updated);
  };

  const removeQuestionOption = (qIndex: number, optIndex: number) => {
    const updated = [...questions];
    const options = (updated[qIndex].options || []).filter((_, i) => i !== optIndex);
    updated[qIndex] = { ...updated[qIndex], options };
    setQuestions(updated);
  };

  if (!open) return null;

  const currentQuestionType = newQuestion.questionData?.type || "text";
  const hasOptions = ["single_choice", "multiple_choice"].includes(currentQuestionType);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Manage Questions</h2>
            <p className="text-sm text-gray-600 mt-1">{assessmentType?.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowResultPreview(!showResultPreview)}
              className="h-9"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              {showResultPreview ? "Hide" : "Preview"} Result
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={onClose}
              className="h-9 w-9"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Result Preview Section */}
          {showResultPreview && (
            <div className="border border-blue-200 bg-blue-50 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-blue-900">Result Preview - How Evaluation Works</h3>
              </div>
              <div className="space-y-4">
                <div className="bg-white rounded-lg p-4 border border-blue-200">
                  <h4 className="font-medium text-gray-900 mb-2">Assessment Category</h4>
                  <p className="text-sm text-gray-600 capitalize">
                    {assessmentType?.category?.replace("_", " ") || "General"}
                  </p>
                </div>

                {assessmentType?.category === "personality" && (
                  <div className="bg-white rounded-lg p-4 border border-blue-200">
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-blue-600" />
                      How Results Are Calculated
                    </h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Each answer contributes to one of the personality dimensions</li>
                      <li>• Scores are normalized to a -100 to +100 scale</li>
                      <li>• Your 4-letter type (e.g., INTJ) is determined by your position on each dimension</li>
                      <li>• The result includes your traits, strengths, and career suggestions</li>
                    </ul>
                  </div>
                )}

                {assessmentType?.name?.toLowerCase().includes("mbti") && (
                  <div className="bg-white rounded-lg p-4 border border-blue-200">
                    <h4 className="font-medium text-gray-900 mb-2">MBTI Dimensions</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-purple-100 text-purple-700">E vs I</Badge>
                        <span className="text-gray-600">Extraversion vs Introversion</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-blue-100 text-blue-700">S vs N</Badge>
                        <span className="text-gray-600">Sensing vs Intuition</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-green-100 text-green-700">T vs F</Badge>
                        <span className="text-gray-600">Thinking vs Feeling</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-orange-100 text-orange-700">J vs P</Badge>
                        <span className="text-gray-600">Judging vs Perceiving</span>
                      </div>
                    </div>
                  </div>
                )}

                {assessmentType?.name?.toLowerCase().includes("disc") && (
                  <div className="bg-white rounded-lg p-4 border border-blue-200">
                    <h4 className="font-medium text-gray-900 mb-2">DISC Dimensions</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-red-100 text-red-700">D</Badge>
                        <span className="text-gray-600">Dominance</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-yellow-100 text-yellow-700">I</Badge>
                        <span className="text-gray-600">Influence</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-green-100 text-green-700">S</Badge>
                        <span className="text-gray-600">Steadiness</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-blue-100 text-blue-700">C</Badge>
                        <span className="text-gray-600">Conscientiousness</span>
                      </div>
                    </div>
                  </div>
                )}

                {assessmentType?.category === "work_values" && (
                  <div className="bg-white rounded-lg p-4 border border-blue-200">
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-yellow-600" />
                      Work Values Measured
                    </h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• <strong>Achievement:</strong> Using abilities to accomplish goals</li>
                      <li>• <strong>Independence:</strong> Working without close supervision</li>
                      <li>• <strong>Recognition:</strong> Being appreciated for work</li>
                      <li>• <strong>Relationships:</strong> Working with people you enjoy</li>
                      <li>• <strong>Support:</strong> Having supportive management</li>
                      <li>• <strong>Working Conditions:</strong> Good pay, security, comfort</li>
                    </ul>
                  </div>
                )}

                {assessmentType?.category === "learning_style" && (
                  <div className="bg-white rounded-lg p-4 border border-blue-200">
                    <h4 className="font-medium text-gray-900 mb-2">VARK Learning Styles</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-pink-100 text-pink-700">Visual</Badge>
                        <span className="text-gray-600">Charts, diagrams, graphs</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-orange-100 text-orange-700">Auditory</Badge>
                        <span className="text-gray-600">Listening, discussions</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-blue-100 text-blue-700">Read/Write</Badge>
                        <span className="text-gray-600">Reading, notes</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-green-100 text-green-700">Kinesthetic</Badge>
                        <span className="text-gray-600">Hands-on, doing</span>
                      </div>
                    </div>
                  </div>
                )}

                {assessmentType?.category === "aptitude" && (
                  <div className="bg-white rounded-lg p-4 border border-blue-200">
                    <h4 className="font-medium text-gray-900 mb-2">Aptitude Areas Measured</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• <strong>Verbal Reasoning:</strong> Language and vocabulary</li>
                      <li>• <strong>Numerical Ability:</strong> Numbers and calculations</li>
                      <li>• <strong>Spatial Awareness:</strong> Shapes, patterns, visual</li>
                      <li>• Score shows overall aptitude percentage</li>
                    </ul>
                  </div>
                )}

                {assessmentType?.name?.toLowerCase().includes("career interest") && (
                  <div className="bg-white rounded-lg p-4 border border-blue-200">
                    <h4 className="font-medium text-gray-900 mb-2">Career Categories</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-blue-100 text-blue-700">Technology</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-green-100 text-green-700">Helping</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-purple-100 text-purple-700">Arts</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-orange-100 text-orange-700">Leadership</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-indigo-100 text-indigo-700">Analytical</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-teal-100 text-teal-700">Outdoors</Badge>
                      </div>
                    </div>
                  </div>
                )}

                {assessmentType?.name?.toLowerCase().includes("core skills") && (
                  <div className="bg-white rounded-lg p-4 border border-blue-200">
                    <h4 className="font-medium text-gray-900 mb-2">Core Skills Measured</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• <strong>Communication:</strong> Speaking and writing clearly</li>
                      <li>• <strong>Problem Solving:</strong> Finding effective solutions</li>
                      <li>• <strong>Teamwork:</strong> Collaborating with others</li>
                      <li>• <strong>Critical Thinking:</strong> Objective analysis</li>
                      <li>• <strong>Time Management:</strong> Using time effectively</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Add Question Form */}
          {showAddForm ? (
            <div className="border border-gray-200 rounded-lg p-6 space-y-4 bg-gray-50">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Add New Question</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAddForm(false)}
                >
                  <X className="w-4 h-4 mr-1" />
                  Cancel
                </Button>
              </div>

              <div>
                <Label htmlFor="q-type">Question Type *</Label>
                <Select
                  value={currentQuestionType}
                  onValueChange={(value) => setNewQuestion({
                    ...newQuestion,
                    questionData: { type: value },
                    options: ["single_choice", "multiple_choice"].includes(value) ? ["", ""] : undefined,
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {questionTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="q-text">Question Text *</Label>
                <Textarea
                  id="q-text"
                  value={newQuestion.questionText}
                  onChange={(e) => setNewQuestion({ ...newQuestion, questionText: e.target.value })}
                  placeholder="Enter your question..."
                  rows={2}
                  required
                />
              </div>

              {hasOptions && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Answer Options</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddOption}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add Option
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {newQuestion.options?.map((option, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <span className="text-sm text-gray-500 w-6">{idx + 1}.</span>
                        <Input
                          value={option}
                          onChange={(e) => handleUpdateOption(idx, e.target.value)}
                          placeholder={`Option ${idx + 1}`}
                          className="flex-1"
                        />
                        {newQuestion.options && newQuestion.options.length > 2 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveOption(idx)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Minimum 2 options required</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="q-points">Points</Label>
                  <Input
                    id="q-points"
                    type="number"
                    value={newQuestion.points}
                    onChange={(e) => setNewQuestion({ ...newQuestion, points: parseInt(e.target.value) || 1 })}
                    min="1"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setShowAddForm(false)}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddQuestion}
                  disabled={isLoading || !newQuestion.questionText || (hasOptions && (!newQuestion.options || newQuestion.options.length < 2))}
                  style={{ background: portal.admin.gradient }}
                  className="text-white"
                >
                  {isLoading ? "Adding..." : "Add Question"}
                </Button>
              </div>
            </div>
          ) : (
            <Button
              onClick={() => setShowAddForm(true)}
              className="w-full"
              style={{ background: portal.admin.gradient }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New Question
            </Button>
          )}

          {/* Questions List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                Questions ({questions.length})
              </h3>
            </div>

            {isLoading && questions.length === 0 ? (
              <div className="text-center py-8">
                <div className="inline-block w-6 h-6 border-3 border-pink-200 border-t-pink-600 rounded-full animate-spin"></div>
                <p className="text-gray-500 mt-2">Loading questions...</p>
              </div>
            ) : questions.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                <p className="text-gray-500">No questions added yet</p>
                <p className="text-sm text-gray-400 mt-1">Click "Add New Question" to create your first question</p>
              </div>
            ) : (
              <div className="space-y-3">
                {questions.map((q, index) => {
                  const isEditing = editingIndex === index;
                  const qType = q.questionData?.type || "text";
                  const hasOptionsEdit = ["single_choice", "multiple_choice"].includes(qType);

                  return (
                    <div
                      key={q.id || index}
                      className={`border rounded-lg p-4 ${isEditing ? "border-pink-300 bg-pink-50/30" : "border-gray-200"} ${!q.isActive ? "opacity-60" : ""}`}
                    >
                      {isEditing ? (
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <Badge variant="outline" className="bg-white">
                              Q{index + 1}
                            </Badge>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                onClick={() => handleUpdateQuestion(index)}
                                disabled={isLoading}
                                style={{ background: semanticGradients.success.gradient }}
                                className="text-white"
                              >
                                <Save className="w-3 h-3 mr-1" />
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingIndex(null)}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>

                          <div>
                            <Label>Question Type</Label>
                            <Select
                              value={qType}
                              onValueChange={(value) => updateQuestionField(index, "questionData", { type: value })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {questionTypes.map((type) => (
                                  <SelectItem key={type.value} value={type.value}>
                                    {type.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label>Question Text</Label>
                            <Textarea
                              value={q.questionText}
                              onChange={(e) => updateQuestionField(index, "questionText", e.target.value)}
                              rows={2}
                            />
                          </div>

                          {hasOptionsEdit && (
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <Label>Options</Label>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => addQuestionOption(index)}
                                >
                                  <Plus className="w-3 h-3 mr-1" />
                                  Add
                                </Button>
                              </div>
                              <div className="space-y-2">
                                {(q.options || []).map((opt: string, optIdx: number) => (
                                  <div key={optIdx} className="flex gap-2 items-center">
                                    <span className="text-sm text-gray-500 w-6">{optIdx + 1}.</span>
                                    <Input
                                      value={opt}
                                      onChange={(e) => updateQuestionOption(index, optIdx, e.target.value)}
                                      className="flex-1"
                                    />
                                    {(q.options || []).length > 2 && (
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeQuestionOption(index, optIdx)}
                                      >
                                        <X className="w-4 h-4" />
                                      </Button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Points</Label>
                              <Input
                                type="number"
                                value={q.points}
                                onChange={(e) => updateQuestionField(index, "points", parseInt(e.target.value) || 1)}
                                min="1"
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start gap-4">
                          <div className="flex items-center gap-1 pt-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleMoveQuestion(index, "up")}
                              disabled={index === 0 || isLoading}
                            >
                              <ChevronUp className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleMoveQuestion(index, "down")}
                              disabled={index === questions.length - 1 || isLoading}
                            >
                              <ChevronDown className="w-4 h-4" />
                            </Button>
                          </div>

                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="bg-white text-xs">
                                Q{index + 1}
                              </Badge>
                              <Badge variant="outline" className="text-xs bg-gray-100">
                                {questionTypes.find((t) => t.value === qType)?.label || qType}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {q.points} pt{q.points !== 1 ? "s" : ""}
                              </Badge>
                              {!q.isActive && (
                                <Badge variant="outline" className="text-xs bg-gray-100 text-gray-500">
                                  Hidden
                                </Badge>
                              )}
                            </div>
                            <p className="text-gray-900 font-medium">{q.questionText}</p>

                            {hasOptionsEdit && q.options && q.options.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-2">
                                {q.options.map((opt: string, optIdx: number) => (
                                  <Badge key={optIdx} variant="outline" className="bg-gray-50">
                                    {optIdx + 1}. {opt}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleToggleActive(index)}
                              title={q.isActive ? "Hide question" : "Show question"}
                            >
                              {q.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-pink-50 hover:text-pink-600"
                              onClick={() => setEditingIndex(index)}
                              title="Edit question"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-red-50 hover:text-red-600"
                              onClick={() => handleDeleteQuestion(index)}
                              title="Delete question"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex justify-end">
          <Button
            variant="outline"
            onClick={onClose}
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
