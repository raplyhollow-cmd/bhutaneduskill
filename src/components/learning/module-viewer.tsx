/**
 * MODULE VIEWER
 * Student interface for viewing learning modules and tracking progress
 */
"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Play,
  CheckCircle,
  Circle,
  Lock,
  BookOpen,
  Video,
  FileText,
  Link as LinkIcon,
  ChevronLeft,
  ChevronRight,
  Award,
  Clock,
  Star,
} from "lucide-react";
import type { ModuleContent, ModuleLesson } from "./module-creator";

export interface StudentProgress {
  moduleId: string;
  lessonId: string;
  contentId: string;
  completed: boolean;
  timeSpent: number;
}

export interface LearningModule {
  id: string;
  title: string;
  description: string;
  subject: string;
  category?: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  thumbnailUrl?: string;
  estimatedHours: number;
  lessons: ModuleLesson[];
}

interface ModuleViewerProps {
  module: LearningModule;
  progress: StudentProgress[];
  onUpdateProgress: (contentId: string, completed: boolean) => void | Promise<void>;
  onComplete?: () => void | Promise<void>;
}

export function ModuleViewer({
  module,
  progress,
  onUpdateProgress,
  onComplete,
}: ModuleViewerProps) {
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [currentContentIndex, setCurrentContentIndex] = useState(0);

  const currentLesson = module.lessons[currentLessonIndex];
  const currentContent = currentLesson?.contents[currentContentIndex];

  // Calculate progress
  const moduleProgress = useMemo(() => {
    const totalContent = module.lessons.reduce(
      (sum, lesson) => sum + lesson.contents.length,
      0
    );
    const completedContent = progress.filter((p) => p.completed).length;
    return totalContent > 0 ? (completedContent / totalContent) * 100 : 0;
  }, [module.lessons, progress]);

  const isContentCompleted = (contentId: string) => {
    return progress.some((p) => p.contentId === contentId && p.completed);
  };

  const isLessonLocked = (lessonIndex: number) => {
    if (lessonIndex === 0) return false;
    const prevLesson = module.lessons[lessonIndex - 1];
    if (!prevLesson) return true;
    return prevLesson.contents.some(
      (c) => !isContentCompleted(c.id)
    );
  };

  const handleNext = () => {
    if (currentContentIndex < currentLesson.contents.length - 1) {
      setCurrentContentIndex(currentContentIndex + 1);
    } else if (currentLessonIndex < module.lessons.length - 1) {
      setCurrentLessonIndex(currentLessonIndex + 1);
      setCurrentContentIndex(0);
    }
  };

  const handlePrevious = () => {
    if (currentContentIndex > 0) {
      setCurrentContentIndex(currentContentIndex - 1);
    } else if (currentLessonIndex > 0) {
      setCurrentLessonIndex(currentLessonIndex - 1);
      setCurrentContentIndex(module.lessons[currentLessonIndex - 1].contents.length - 1);
    }
  };

  const handleMarkComplete = async () => {
    if (currentContent) {
      await onUpdateProgress(currentContent.id, true);
    }
  };

  const getContentTypeIcon = (type: ModuleContent["type"]) => {
    const icons = {
      text: FileText,
      video: Video,
      image: FileText,
      document: FileText,
      quiz: FileText,
      assignment: FileText,
      link: LinkIcon,
    };
    return icons[type] || FileText;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-6">
            {module.thumbnailUrl && (
              <img
                src={module.thumbnailUrl}
                alt={module.title}
                className="w-32 h-32 object-cover rounded-lg"
              />
            )}

            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <Badge variant="outline" className="mb-2">
                    {module.subject}
                  </Badge>
                  <h1 className="text-2xl font-bold">{module.title}</h1>
                  <p className="text-muted-foreground mt-2">{module.description}</p>
                </div>

                {moduleProgress === 100 && (
                  <Badge className="bg-green-100 text-green-700">
                    <Award className="w-3 h-3 mr-1" />
                    Completed
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-4 mt-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  {module.estimatedHours} hours
                </div>

                <Badge
                  variant={
                    module.difficulty === "beginner"
                      ? "secondary"
                      : module.difficulty === "intermediate"
                      ? "default"
                      : "destructive"
                  }
                  className="capitalize"
                >
                  {module.difficulty}
                </Badge>
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span>Progress</span>
                  <span>{Math.round(moduleProgress)}%</span>
                </div>
                <Progress value={moduleProgress} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Sidebar - Lesson Navigation */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Lessons</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {module.lessons.map((lesson, lessonIndex) => {
                const isCurrent = lessonIndex === currentLessonIndex;
                const isLocked = isLessonLocked(lessonIndex);
                const lessonCompletedCount = lesson.contents.filter((c) =>
                  isContentCompleted(c.id)
                ).length;

                return (
                  <button
                    key={lesson.id}
                    onClick={() => {
                      if (!isLocked) {
                        setCurrentLessonIndex(lessonIndex);
                        setCurrentContentIndex(0);
                      }
                    }}
                    disabled={isLocked}
                    className={`
                      w-full text-left p-3 rounded-lg transition-colors
                      ${isCurrent ? "bg-primary text-primary-foreground" : isLocked ? "bg-muted opacity-50 cursor-not-allowed" : "hover:bg-muted"}
                    `}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {isLocked ? (
                          <Lock className="w-4 h-4" />
                        ) : lessonCompletedCount === lesson.contents.length ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <Circle className="w-4 h-4" />
                        )}
                        <span className="font-medium text-sm">{lesson.title}</span>
                      </div>

                      <span className="text-xs opacity-70">
                        {lessonCompletedCount}/{lesson.contents.length}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{currentLesson?.title}</CardTitle>
              <Badge variant="outline">
                {currentContentIndex + 1} / {currentLesson?.contents.length || 0}
              </Badge>
            </div>
          </CardHeader>

          <CardContent>
            {!currentContent ? (
              <div className="text-center py-12 text-muted-foreground">
                No content in this lesson
              </div>
            ) : (
              <>
                <ContentRenderer content={currentContent} />

                {/* Actions */}
                <div className="flex items-center justify-between mt-8 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={currentLessonIndex === 0 && currentContentIndex === 0}
                  >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Previous
                  </Button>

                  <div className="flex items-center gap-2">
                    {!isContentCompleted(currentContent.id) && (
                      <Button
                        variant="outline"
                        onClick={handleMarkComplete}
                        className="text-green-600 hover:bg-green-50"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Mark Complete
                      </Button>
                    )}

                    {currentContentIndex < currentLesson.contents.length - 1 ||
                    currentLessonIndex < module.lessons.length - 1 ? (
                      <Button onClick={handleNext}>
                        Next
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </Button>
                    ) : (
                      moduleProgress === 100 &&
                      onComplete && (
                        <Button onClick={onComplete} className="bg-green-600 hover:bg-green-700">
                          <Award className="w-4 h-4 mr-2" />
                          Complete Module
                        </Button>
                      )
                    )}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface ContentRendererProps {
  content: ModuleContent;
}

function ContentRenderer({ content }: ContentRendererProps) {
  switch (content.type) {
    case "text":
      return (
        <div className="prose max-w-none">
          <p className="whitespace-pre-wrap">{content.content || ""}</p>
        </div>
      );

    case "video":
      return (
        <div className="aspect-video bg-black rounded-lg overflow-hidden">
          {content.url ? (
            <iframe
              src={content.url}
              className="w-full h-full"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white">
              Video URL not provided
            </div>
          )}
        </div>
      );

    case "image":
      return (
        <div className="rounded-lg overflow-hidden">
          {content.fileUrl ? (
            <img src={content.fileUrl} alt={content.title} className="w-full" />
          ) : (
            <div className="w-full h-64 bg-muted flex items-center justify-center">
              Image not available
            </div>
          )}
        </div>
      );

    case "document":
      return (
        <div className="border rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="w-8 h-8 text-blue-500" />
            <div>
              <p className="font-medium">{content.title}</p>
              {content.duration && (
                <p className="text-sm text-muted-foreground">
                  Reading time: ~{content.duration} min
                </p>
              )}
            </div>
          </div>

          {content.fileUrl ? (
            <Button variant="outline" asChild>
              <a href={content.fileUrl} target="_blank" rel="noopener noreferrer">
                <FileText className="w-4 h-4 mr-2" />
                Open Document
              </a>
            </Button>
          ) : (
            <p className="text-muted-foreground">Document URL not provided</p>
          )}
        </div>
      );

    case "link":
      return (
        <div className="border rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <LinkIcon className="w-8 h-8 text-indigo-500" />
            <div>
              <p className="font-medium">{content.title}</p>
              <p className="text-sm text-muted-foreground">External Resource</p>
            </div>
          </div>

          {content.url ? (
            <Button variant="outline" asChild>
              <a
                href={content.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                <LinkIcon className="w-4 h-4 mr-2" />
                Open Link
              </a>
            </Button>
          ) : (
            <p className="text-muted-foreground">Link URL not provided</p>
          )}
        </div>
      );

    case "quiz":
      return (
        <div className="border rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <BookOpen className="w-8 h-8 text-yellow-500" />
            <div>
              <p className="font-medium">{content.title}</p>
              <p className="text-sm text-muted-foreground">Knowledge Check</p>
            </div>
          </div>
          <p className="text-muted-foreground">
            Quiz functionality coming soon. Quiz ID: {content.url}
          </p>
        </div>
      );

    case "assignment":
      return (
        <div className="border rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="w-8 h-8 text-red-500" />
            <div>
              <p className="font-medium">{content.title}</p>
              <p className="text-sm text-muted-foreground">Assignment</p>
            </div>
          </div>
          <p className="text-muted-foreground">
            Assignment details coming soon.
          </p>
        </div>
      );

    default:
      return <p>Unknown content type</p>;
  }
}
