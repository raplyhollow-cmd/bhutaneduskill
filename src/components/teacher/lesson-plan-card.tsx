/**
 * LESSON PLAN CARD
 *
 * Displays a lesson plan with status, progress, and actions
 * Integrates with syllabus progress tracking
 */

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  BookOpen,
  Calendar,
  Clock,
  CheckCircle,
  Circle,
  XCircle,
  MoreVertical,
  Edit,
  Trash2,
  Play,
} from "lucide-react";

interface LessonPlanCardProps {
  lesson: {
    id: string;
    title: string;
    chapter: string;
    chapterNumber?: number;
    scheduledDate?: string;
    duration?: number;
    status: "planned" | "completed" | "skipped" | "cancelled";
    coveragePercentage?: number;
    className?: string;
    objectives?: string[];
  };
  onEdit?: (lessonId: string) => void;
  onDelete?: (lessonId: string) => void;
  onComplete?: (lessonId: string) => void;
  onStart?: (lessonId: string) => void;
}

const STATUS_CONFIG = {
  planned: {
    icon: Circle,
    label: "Planned",
    variant: "ceramic-default" as const,
    color: "text-gray-500",
  },
  completed: {
    icon: CheckCircle,
    label: "Completed",
    variant: "ceramic-success" as const,
    color: "text-green-600",
  },
  skipped: {
    icon: XCircle,
    label: "Skipped",
    variant: "ceramic-warning" as const,
    color: "text-yellow-600",
  },
  cancelled: {
    icon: XCircle,
    label: "Cancelled",
    variant: "ceramic-error" as const,
    color: "text-red-600",
  },
};

export function LessonPlanCard({
  lesson,
  onEdit,
  onDelete,
  onComplete,
  onStart,
}: LessonPlanCardProps) {
  const statusConfig = STATUS_CONFIG[lesson.status];
  const StatusIcon = statusConfig.icon;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "Not scheduled";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <Card
      variant="ceramic"
      className="hover:shadow-md transition-shadow duration-200"
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant={statusConfig.variant} className="gap-1">
                <StatusIcon className="w-3 h-3" />
                {statusConfig.label}
              </Badge>
              {lesson.className && (
                <Badge variant="ceramic-info">{lesson.className}</Badge>
              )}
            </div>
            <CardTitle className="text-lg">{lesson.title}</CardTitle>
            <p className="text-sm text-ceramic-secondary mt-1">
              Chapter {lesson.chapterNumber || ""}: {lesson.chapter}
            </p>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {lesson.status === "planned" && onStart && (
                <DropdownMenuItem onClick={() => onStart(lesson.id)}>
                  <Play className="w-4 h-4 mr-2" />
                  Start Lesson
                </DropdownMenuItem>
              )}
              {lesson.status === "planned" && onComplete && (
                <DropdownMenuItem onClick={() => onComplete(lesson.id)}>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Mark Complete
                </DropdownMenuItem>
              )}
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(lesson.id)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem
                  onClick={() => onDelete(lesson.id)}
                  className="text-red-600"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Date and Duration */}
        <div className="flex items-center gap-4 text-sm text-ceramic-secondary">
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>{formatDate(lesson.scheduledDate)}</span>
          </div>
          {lesson.duration && (
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{lesson.duration} min</span>
            </div>
          )}
        </div>

        {/* Objectives Preview */}
        {lesson.objectives && lesson.objectives.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-ceramic-secondary">Objectives:</p>
            <ul className="text-sm text-ceramic-primary space-y-1">
              {lesson.objectives.slice(0, 2).map((objective, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <BookOpen className="w-3 h-3 mt-0.5 flex-shrink-0 text-ceramic-blue-500" />
                  <span className="line-clamp-1">{objective}</span>
                </li>
              ))}
              {lesson.objectives.length > 2 && (
                <li className="text-xs text-ceramic-dimmed pl-5">
                  +{lesson.objectives.length - 2} more objectives
                </li>
              )}
            </ul>
          </div>
        )}

        {/* Coverage Progress (for completed lessons) */}
        {lesson.status === "completed" && lesson.coveragePercentage !== undefined && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-ceramic-secondary">Coverage</span>
              <span className="font-medium">{lesson.coveragePercentage}%</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all duration-300"
                style={{ width: `${lesson.coveragePercentage}%` }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
