"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pin, Calendar, Eye, ChevronRight } from "lucide-react";
import { AnnouncementData } from "@/app/school-admin/_actions";

interface AnnouncementCardProps {
  announcement: AnnouncementData;
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onTogglePin?: (id: string) => void;
}

export function AnnouncementCard({
  announcement,
  onView,
  onEdit,
  onDelete,
  onTogglePin,
}: AnnouncementCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <CardTitle className="text-lg">{announcement.title}</CardTitle>
              {announcement.isPinned && (
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                  <Pin className="w-3 h-3 mr-1" />
                  Pinned
                </Badge>
              )}
              {announcement.priority === "urgent" && (
                <Badge className="bg-red-100 text-red-700">Urgent</Badge>
              )}
              {announcement.priority === "high" && (
                <Badge className="bg-orange-100 text-orange-700">High</Badge>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              {announcement.publishDate && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(announcement.publishDate).toLocaleDateString()}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {announcement.viewCount} views
              </span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-gray-700 line-clamp-2 mb-4">
          {announcement.excerpt || announcement.content?.substring(0, 150)}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">
            By {announcement.authorName}
          </span>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onView?.(announcement.id)}
          >
            View Details <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
