"use client";

import { AnnouncementData } from "@/app/school-admin/_actions";
import type { StudentAnnouncementData } from "@/app/student/_actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Eye, Pin, User } from "lucide-react";

type AnnouncementCardData = AnnouncementData | StudentAnnouncementData;

interface AnnouncementCardProps {
  announcement: AnnouncementCardData;
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onTogglePin?: (id: string) => void;
  showActions?: boolean;
}

const priorityColors = {
  low: "bg-gray-100 text-gray-700 hover:bg-gray-200",
  normal: "bg-blue-50 text-blue-700 hover:bg-blue-100",
  high: "bg-orange-50 text-orange-700 hover:bg-orange-100",
  urgent: "bg-red-100 text-red-700 hover:bg-red-200",
};

const priorityBorders = {
  low: "",
  normal: "",
  high: "border-l-4 border-l-orange-400",
  urgent: "border-l-4 border-l-red-500",
};

const categoryLabels: Record<string, string> = {
  academic: "Academic",
  event: "Event",
  holiday: "Holiday",
  exam: "Exam",
  general: "General",
  emergency: "Emergency",
};

const audienceLabels: Record<string, string> = {
  all: "Everyone",
  students: "Students",
  teachers: "Teachers",
  parents: "Parents",
  staff: "Staff",
  counselor: "Counselors",
};

export function AnnouncementCard({
  announcement,
  onView,
  onEdit,
  onDelete,
  onTogglePin,
  showActions = true,
}: AnnouncementCardProps) {
  const formatDate = (dateStr: string | null | Date) => {
    if (!dateStr) return null;
    const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const isExpired = announcement.expiryDate && new Date(announcement.expiryDate) < new Date();
  const isScheduled = announcement.publishDate && new Date(announcement.publishDate) > new Date();

  return (
    <Card
      className={`transition-all hover:shadow-md ${priorityBorders[announcement.priority as keyof typeof priorityBorders]} ${
        isExpired ? "opacity-60" : ""
      }`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {announcement.isPinned && (
                <Badge variant="secondary" className="text-xs gap-1">
                  <Pin className="h-3 w-3" />
                  Pinned
                </Badge>
              )}
              {announcement.priority === "urgent" && (
                <Badge className="bg-red-500 text-white text-xs">Urgent</Badge>
              )}
              {isScheduled && (
                <Badge variant="outline" className="text-xs">Scheduled</Badge>
              )}
              {isExpired && (
                <Badge variant="secondary" className="text-xs">Expired</Badge>
              )}
              {!announcement.isPublished && (
                <Badge variant="outline" className="text-xs">Draft</Badge>
              )}
            </div>
            <CardTitle className="mt-2 text-lg line-clamp-1">{announcement.title}</CardTitle>
            <CardDescription className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
              <span className="flex items-center gap-1 text-xs">
                <User className="h-3 w-3" />
                {announcement.authorName}
              </span>
              <span className="flex items-center gap-1 text-xs">
                <Calendar className="h-3 w-3" />
                {formatDate(announcement.createdAt)}
              </span>
              <span className="flex items-center gap-1 text-xs">
                <Eye className="h-3 w-3" />
                {announcement.viewCount}
              </span>
            </CardDescription>
          </div>

          {showActions && (
            <div className="flex items-center gap-1">
              {onTogglePin && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onTogglePin(announcement.id)}
                  className={announcement.isPinned ? "text-amber-600" : ""}
                  title={announcement.isPinned ? "Unpin" : "Pin"}
                >
                  <Pin className={`h-4 w-4 ${announcement.isPinned ? "fill-current" : ""}`} />
                </Button>
              )}
              {onEdit && (
                <Button variant="ghost" size="sm" onClick={() => onEdit(announcement.id)}>
                  Edit
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(announcement.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  Delete
                </Button>
              )}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {announcement.excerpt && (
          <p className="text-sm text-gray-600 line-clamp-2">{announcement.excerpt}</p>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <Badge className={priorityColors[announcement.priority as keyof typeof priorityColors]}>
            {announcement.priority?.charAt(0).toUpperCase() + announcement.priority?.slice(1) || "Normal"} Priority
          </Badge>
          {announcement.category && (
            <Badge variant="outline">
              {categoryLabels[announcement.category] || announcement.category}
            </Badge>
          )}
          <Badge variant="secondary">
            {audienceLabels[announcement.targetAudience as string] || announcement.targetAudience}
          </Badge>
          {announcement.targetGradeLevel && (
            <Badge variant="outline">Class {announcement.targetGradeLevel}</Badge>
          )}
        </div>

        {(announcement.publishDate || announcement.expiryDate) && (
          <div className="text-xs text-gray-500 space-y-1">
            {announcement.publishDate && (
              <div>
                Publish: <span className="font-medium">{formatDate(announcement.publishDate)}</span>
              </div>
            )}
            {announcement.expiryDate && (
              <div>
                Expires: <span className="font-medium">{formatDate(announcement.expiryDate)}</span>
              </div>
            )}
          </div>
        )}

        {onView && (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => onView(announcement.id)}
          >
            View Full Announcement
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
