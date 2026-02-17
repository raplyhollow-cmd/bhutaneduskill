/**
 * MODULE CREATOR
 * Teacher interface for creating learning modules with content and lessons
 */
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { RichTextEditor, VideoEmbedder } from "@/components/learning/rich-text-editor";
import {
  Plus,
  Trash2,
  GripVertical,
  Save,
  Eye,
  BookOpen,
  Video,
  FileText,
  Image,
  Link as LinkIcon,
  ChevronDown,
  ChevronUp,
  Upload,
  HelpCircle,
  Code,
  FileQuestion,
} from "lucide-react";

export interface ModuleContent {
  id: string;
  type: "text" | "video" | "image" | "document" | "quiz" | "assignment" | "link";
  title: string;
  content?: string;
  url?: string;
  fileUrl?: string;
  duration?: number; // in minutes
  order: number;
  // Quiz-specific properties
  quizData?: QuizData;
}

export interface QuizData {
  questions: QuizQuestion[];
  passingScore: number;
  timeLimit?: number; // in minutes
  shuffleQuestions: boolean;
  showResults: "immediate" | "after_completion" | "never";
}

export interface QuizQuestion {
  id: string;
  type: "multiple_choice" | "true_false" | "short_answer";
  question: string;
  options?: string[];
  correctAnswer: string | number;
  points: number;
  explanation?: string;
}

export interface ModuleLesson {
  id: string;
  title: string;
  description?: string;
  contents: ModuleContent[];
  order: number;
}

export interface LearningModule {
  id?: string;
  title: string;
  description: string;
  subject: string;
  classId: string;
  category?: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  isPublished: boolean;
  thumbnailUrl?: string;
  estimatedHours: number;
  lessons: ModuleLesson[];
}

interface ModuleCreatorProps {
  initialData?: Partial<LearningModule>;
  onSave: (module: LearningModule) => void | Promise<void>;
  onCancel?: () => void;
}

const contentTypeConfig = {
  text: { label: "Text", icon: FileText, color: "text-gray-600" },
  video: { label: "Video", icon: Video, color: "text-purple-600" },
  image: { label: "Image", icon: Image, color: "text-blue-600" },
  document: { label: "Document", icon: FileText, color: "text-green-600" },
  quiz: { label: "Quiz", icon: HelpCircle, color: "text-yellow-600" },
  assignment: { label: "Assignment", icon: FileQuestion, color: "text-red-600" },
  link: { label: "External Link", icon: LinkIcon, color: "text-indigo-600" },
};

export function ModuleCreator({ initialData, onSave, onCancel }: ModuleCreatorProps) {
  const [module, setModule] = useState<LearningModule>({
    title: initialData?.title || "",
    description: initialData?.description || "",
    subject: initialData?.subject || "",
    classId: initialData?.classId || "",
    category: initialData?.category || "",
    difficulty: initialData?.difficulty || "beginner",
    isPublished: initialData?.isPublished || false,
    thumbnailUrl: initialData?.thumbnailUrl || "",
    estimatedHours: initialData?.estimatedHours || 1,
    lessons: initialData?.lessons || [],
  });

  const [activeLesson, setActiveLesson] = useState<string | null>(null);
  const [expandedLessons, setExpandedLessons] = useState<Set<string>>(new Set());

  const updateModule = (updates: Partial<LearningModule>) => {
    setModule((prev) => ({ ...prev, ...updates }));
  };

  const addLesson = () => {
    const newLesson: ModuleLesson = {
      id: `lesson_${Date.now()}`,
      title: `Lesson ${module.lessons.length + 1}`,
      contents: [],
      order: module.lessons.length,
    };
    updateModule({ lessons: [...module.lessons, newLesson] });
    setExpandedLessons((prev) => new Set(prev).add(newLesson.id));
    setActiveLesson(newLesson.id);
  };

  const updateLesson = (lessonId: string, updates: Partial<ModuleLesson>) => {
    updateModule({
      lessons: module.lessons.map((l) => (l.id === lessonId ? { ...l, ...updates } : l)),
    });
  };

  const deleteLesson = (lessonId: string) => {
    updateModule({
      lessons: module.lessons.filter((l) => l.id !== lessonId),
    });
    if (activeLesson === lessonId) setActiveLesson(null);
  };

  const addContent = (lessonId: string, type: ModuleContent["type"]) => {
    const lesson = module.lessons.find((l) => l.id === lessonId);
    if (!lesson) return;

    const newContent: ModuleContent = {
      id: `content_${Date.now()}`,
      type,
      title: `New ${contentTypeConfig[type].label}`,
      order: lesson.contents.length,
    };

    updateLesson(lessonId, {
      contents: [...lesson.contents, newContent],
    });
  };

  const updateContent = (
    lessonId: string,
    contentId: string,
    updates: Partial<ModuleContent>
  ) => {
    const lesson = module.lessons.find((l) => l.id === lessonId);
    if (!lesson) return;

    updateLesson(lessonId, {
      contents: lesson.contents.map((c) =>
        c.id === contentId ? { ...c, ...updates } : c
      ),
    });
  };

  const deleteContent = (lessonId: string, contentId: string) => {
    const lesson = module.lessons.find((l) => l.id === lessonId);
    if (!lesson) return;

    updateLesson(lessonId, {
      contents: lesson.contents.filter((c) => c.id !== contentId),
    });
  };

  const handleSave = () => {
    if (!module.title || !module.subject) {
      alert("Please fill in required fields");
      return;
    }
    onSave(module);
  };

  const toggleLessonExpanded = (lessonId: string) => {
    setExpandedLessons((prev) => {
      const next = new Set(prev);
      if (next.has(lessonId)) {
        next.delete(lessonId);
      } else {
        next.add(lessonId);
      }
      return next;
    });
  };

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>Module Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Title *</label>
            <Input
              value={module.title}
              onChange={(e) => updateModule({ title: e.target.value })}
              placeholder="e.g., Introduction to Algebra"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Description</label>
            <Textarea
              value={module.description}
              onChange={(e) => updateModule({ description: e.target.value })}
              placeholder="What students will learn..."
              rows={3}
            />
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Subject *</label>
              <Input
                value={module.subject}
                onChange={(e) => updateModule({ subject: e.target.value })}
                placeholder="e.g., Mathematics"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Category</label>
              <Input
                value={module.category || ""}
                onChange={(e) => updateModule({ category: e.target.value })}
                placeholder="e.g., Algebra"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Difficulty</label>
              <select
                className="w-full border rounded-md px-3 py-2"
                value={module.difficulty}
                onChange={(e) =>
                  updateModule({ difficulty: e.target.value as LearningModule["difficulty"] })
                }
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Estimated Hours</label>
              <Input
                type="number"
                min="1"
                value={module.estimatedHours}
                onChange={(e) =>
                  updateModule({ estimatedHours: parseInt(e.target.value) || 1 })
                }
              />
            </div>

            <div>
              <label className="text-sm font-medium">Thumbnail URL</label>
              <Input
                value={module.thumbnailUrl || ""}
                onChange={(e) => updateModule({ thumbnailUrl: e.target.value })}
                placeholder="https://..."
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="published"
              checked={module.isPublished}
              onChange={(e) => updateModule({ isPublished: e.target.checked })}
            />
            <label htmlFor="published" className="text-sm">
              Publish immediately (students can see it)
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Lessons */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Lessons</CardTitle>
            <Button onClick={addLesson}>
              <Plus className="w-4 h-4 mr-2" />
              Add Lesson
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {module.lessons.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No lessons yet. Add your first lesson to get started.
            </div>
          ) : (
            module.lessons.map((lesson) => (
              <LessonCard
                key={lesson.id}
                lesson={lesson}
                isExpanded={expandedLessons.has(lesson.id)}
                onToggle={() => toggleLessonExpanded(lesson.id)}
                onUpdate={(updates) => updateLesson(lesson.id, updates)}
                onDelete={() => deleteLesson(lesson.id)}
                onAddContent={(type) => addContent(lesson.id, type)}
                onUpdateContent={(contentId, updates) =>
                  updateContent(lesson.id, contentId, updates)
                }
                onDeleteContent={(contentId) => deleteContent(lesson.id, contentId)}
              />
            ))
          )}
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
          Save Module
        </Button>
      </div>
    </div>
  );
}

interface LessonCardProps {
  lesson: ModuleLesson;
  isExpanded: boolean;
  onToggle: () => void;
  onUpdate: (updates: Partial<ModuleLesson>) => void;
  onDelete: () => void;
  onAddContent: (type: ModuleContent["type"]) => void;
  onUpdateContent: (contentId: string, updates: Partial<ModuleContent>) => void;
  onDeleteContent: (contentId: string) => void;
}

function LessonCard({
  lesson,
  isExpanded,
  onToggle,
  onUpdate,
  onDelete,
  onAddContent,
  onUpdateContent,
  onDeleteContent,
}: LessonCardProps) {
  return (
    <Card className={isExpanded ? "border-primary" : ""}>
      <CardContent className="pt-4">
        <div className="flex items-start gap-3">
          <GripVertical className="w-5 h-5 text-muted-foreground mt-2" />

          <div className="flex-1">
            <div className="flex items-center justify-between">
              <Input
                value={lesson.title}
                onChange={(e) => onUpdate({ title: e.target.value })}
                className="font-medium text-lg border-transparent hover:border-input bg-transparent"
              />

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
                <Textarea
                  value={lesson.description || ""}
                  onChange={(e) => onUpdate({ description: e.target.value })}
                  placeholder="Lesson description..."
                  rows={2}
                />

                {/* Add Content Buttons */}
                <div>
                  <p className="text-sm font-medium mb-2">Add Content</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(contentTypeConfig).map(([type, config]) => {
                      const Icon = config.icon;
                      return (
                        <Button
                          key={type}
                          variant="outline"
                          size="sm"
                          onClick={() => onAddContent(type as ModuleContent["type"])}
                        >
                          <Icon className="w-4 h-4 mr-1" />
                          {config.label}
                        </Button>
                      );
                    })}
                  </div>
                </div>

                {/* Content List */}
                {lesson.contents.length > 0 && (
                  <div className="space-y-2 mt-4">
                    {lesson.contents.map((content) => (
                      <ContentItem
                        key={content.id}
                        content={content}
                        onUpdate={(updates) => onUpdateContent(content.id, updates)}
                        onDelete={() => onDeleteContent(content.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface ContentItemProps {
  content: ModuleContent;
  onUpdate: (updates: Partial<ModuleContent>) => void;
  onDelete: () => void;
}

function ContentItem({ content, onUpdate, onDelete }: ContentItemProps) {
  const config = contentTypeConfig[content.type];
  const Icon = config.icon;
  const [showQuizEditor, setShowQuizEditor] = useState(false);

  return (
    <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${config.color}`}>
        <Icon className="w-5 h-5" />
      </div>

      <div className="flex-1 space-y-2">
        <Input
          value={content.title}
          onChange={(e) => onUpdate({ title: e.target.value })}
          placeholder="Content title"
        />

        {content.type === "text" && (
          <RichTextEditor
            value={content.content || ""}
            onChange={(value) => onUpdate({ content: value })}
            placeholder="Enter text content with formatting..."
            minHeight="120px"
          />
        )}

        {content.type === "video" && (
          <VideoEmbedder
            url={content.url || ""}
            onChange={(embedUrl) => onUpdate({ url: embedUrl })}
          />
        )}

        {content.type === "link" && (
          <Input
            value={content.url || ""}
            onChange={(e) => onUpdate({ url: e.target.value })}
            placeholder="https://..."
          />
        )}

        {["image", "document"].includes(content.type) && (
          <div className="flex gap-2">
            <Input
              value={content.fileUrl || ""}
              onChange={(e) => onUpdate({ fileUrl: e.target.value })}
              placeholder="File URL"
            />
            <Button variant="outline" size="sm">
              <Upload className="w-4 h-4 mr-1" />
              Upload
            </Button>
          </div>
        )}

        {content.type === "quiz" && (
          <div className="space-y-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowQuizEditor(!showQuizEditor)}
            >
              <Code className="w-4 h-4 mr-1" />
              {showQuizEditor ? "Hide" : "Edit"} Quiz Questions
            </Button>
            {showQuizEditor && (
              <QuizEditor
                quizData={content.quizData}
                onChange={(quizData) => onUpdate({ quizData })}
              />
            )}
          </div>
        )}

        {(content.type === "video" || content.type === "document") && (
          <Input
            type="number"
            value={content.duration || ""}
            onChange={(e) => onUpdate({ duration: parseInt(e.target.value) || undefined })}
            placeholder="Duration (minutes)"
            className="w-32"
          />
        )}
      </div>

      <Button variant="ghost" size="icon-xs" onClick={onDelete}>
        <Trash2 className="w-4 h-4 text-destructive" />
      </Button>
    </div>
  );
}

// ============================================================================
// QUIZ EDITOR COMPONENT
// ============================================================================

interface QuizEditorProps {
  quizData?: QuizData;
  onChange: (quizData: QuizData) => void;
}

function QuizEditor({ quizData, onChange }: QuizEditorProps) {
  const [data, setData] = useState<QuizData>(
    quizData || {
      questions: [],
      passingScore: 70,
      shuffleQuestions: false,
      showResults: "immediate",
    }
  );

  const updateData = (updates: Partial<QuizData>) => {
    const updated = { ...data, ...updates };
    setData(updated);
    onChange(updated);
  };

  const addQuestion = () => {
    const newQuestion: QuizQuestion = {
      id: `q_${Date.now()}`,
      type: "multiple_choice",
      question: "",
      options: ["", "", "", ""],
      correctAnswer: 0,
      points: 1,
    };
    updateData({ questions: [...data.questions, newQuestion] });
  };

  const updateQuestion = (index: number, updates: Partial<QuizQuestion>) => {
    const updated = [...data.questions];
    updated[index] = { ...updated[index], ...updates };
    updateData({ questions: updated });
  };

  const deleteQuestion = (index: number) => {
    updateData({ questions: data.questions.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-4 border rounded-lg p-4 bg-background">
      {/* Quiz Settings */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="text-sm font-medium">Passing Score (%)</label>
          <Input
            type="number"
            min="0"
            max="100"
            value={data.passingScore}
            onChange={(e) => updateData({ passingScore: parseInt(e.target.value) || 0 })}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Time Limit (minutes)</label>
          <Input
            type="number"
            min="1"
            value={data.timeLimit || ""}
            onChange={(e) => updateData({ timeLimit: parseInt(e.target.value) || undefined })}
            placeholder="No limit"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Show Results</label>
          <select
            className="w-full border rounded-md px-3 py-2"
            value={data.showResults}
            onChange={(e) => updateData({ showResults: e.target.value as QuizData["showResults"] })}
          >
            <option value="immediate">Immediate</option>
            <option value="after_completion">After Completion</option>
            <option value="never">Never</option>
          </select>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="shuffle"
          checked={data.shuffleQuestions}
          onChange={(e) => updateData({ shuffleQuestions: e.target.checked })}
        />
        <label htmlFor="shuffle" className="text-sm">Shuffle question order</label>
      </div>

      {/* Questions */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-medium">Questions ({data.questions.length})</h4>
          <Button size="sm" onClick={addQuestion}>
            <Plus className="w-4 h-4 mr-1" />
            Add Question
          </Button>
        </div>

        {data.questions.map((q, idx) => (
          <QuestionEditor
            key={q.id}
            question={q}
            index={idx}
            onUpdate={(updates) => updateQuestion(idx, updates)}
            onDelete={() => deleteQuestion(idx)}
          />
        ))}

        {data.questions.length === 0 && (
          <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
            No questions yet. Add your first question to get started.
          </div>
        )}
      </div>
    </div>
  );
}

interface QuestionEditorProps {
  question: QuizQuestion;
  index: number;
  onUpdate: (updates: Partial<QuizQuestion>) => void;
  onDelete: () => void;
}

function QuestionEditor({ question, index, onUpdate, onDelete }: QuestionEditorProps) {
  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between">
        <span className="text-sm font-medium text-muted-foreground">Question {index + 1}</span>
        <div className="flex items-center gap-2">
          <select
            className="text-xs border rounded px-2 py-1"
            value={question.type}
            onChange={(e) => onUpdate({ type: e.target.value as QuizQuestion["type"] })}
          >
            <option value="multiple_choice">Multiple Choice</option>
            <option value="true_false">True / False</option>
            <option value="short_answer">Short Answer</option>
          </select>
          <Button variant="ghost" size="icon-xs" onClick={onDelete}>
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        </div>
      </div>

      <Textarea
        value={question.question}
        onChange={(e) => onUpdate({ question: e.target.value })}
        placeholder="Enter your question..."
        rows={2}
      />

      <div className="flex gap-4">
        <div className="flex-1">
          <label className="text-xs font-medium">Points</label>
          <Input
            type="number"
            min="1"
            value={question.points}
            onChange={(e) => onUpdate({ points: parseInt(e.target.value) || 1 })}
          />
        </div>

        {question.type === "multiple_choice" && (
          <div className="flex-1">
            <label className="text-xs font-medium">Correct Option</label>
            <select
              className="w-full border rounded-md px-3 py-2"
              value={question.correctAnswer as number}
              onChange={(e) => onUpdate({ correctAnswer: parseInt(e.target.value) })}
            >
              {question.options?.map((_, idx) => (
                <option key={idx} value={idx}>Option {idx + 1}</option>
              ))}
            </select>
          </div>
        )}

        {question.type === "true_false" && (
          <div className="flex-1">
            <label className="text-xs font-medium">Correct Answer</label>
            <select
              className="w-full border rounded-md px-3 py-2"
              value={question.correctAnswer as string}
              onChange={(e) => onUpdate({ correctAnswer: e.target.value })}
            >
              <option value="true">True</option>
              <option value="false">False</option>
            </select>
          </div>
        )}
      </div>

      {question.type === "multiple_choice" && question.options && (
        <div className="space-y-2">
          <label className="text-xs font-medium">Options</label>
          {question.options.map((option, idx) => (
            <div key={idx} className="flex gap-2 items-center">
              <span className="text-xs text-muted-foreground w-16">Option {idx + 1}</span>
              <Input
                value={option}
                onChange={(e) => {
                  const newOptions = [...question.options!];
                  newOptions[idx] = e.target.value;
                  onUpdate({ options: newOptions });
                }}
                placeholder={`Option ${idx + 1}`}
                className={question.correctAnswer === idx ? "border-green-500" : ""}
              />
              {question.correctAnswer === idx && (
                <span className="text-xs text-green-600">(Correct)</span>
              )}
            </div>
          ))}
        </div>
      )}

      <Textarea
        value={question.explanation || ""}
        onChange={(e) => onUpdate({ explanation: e.target.value })}
        placeholder="Explanation (shown after answering)..."
        rows={2}
      />
    </div>
  );
}
