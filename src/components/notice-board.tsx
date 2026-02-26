"use client";

/**
 * Notice Board Component
 *
 * Displays school-wide announcements and notices with:
 * - Pinned notices at top
 * - Priority indicators
 * - Read receipts tracking
 * - Category filtering
 * - Event calendar integration
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Bell, Calendar, Pin, AlertCircle, Info, CheckCircle2, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

interface Notice {
  id: string;
  title: string;
  content: string;
  category: string;
  priority: "low" | "normal" | "high" | "urgent";
  targetAudience: string;
  isPinned: boolean;
  createdAt: Date | string;
  expiryDate?: Date | string | null;
  viewCount?: number;
  readAt?: Date | string | null;
}

interface Event {
  id: string;
  title: string;
  description: string;
  eventType: string;
  startDate: string | Date;
  endDate: string | Date;
  location?: string;
  status: string;
}

interface NoticeBoardProps {
  userType?: "student" | "teacher" | "parent" | "school-admin" | "admin";
  initialNotices?: Notice[];
  initialEvents?: Event[];
}

export function NoticeBoard({
  userType = "student",
  initialNotices = [],
  initialEvents = [],
}: NoticeBoardProps) {
  const [notices, setNotices] = useState<Notice[]>(initialNotices);
  const [events, setEvents] = useState<Event[]>(initialEvents);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    if (initialNotices.length === 0) {
      fetchNotices();
    }
    if (initialEvents.length === 0) {
      fetchEvents();
    }
  }, []);

  const fetchNotices = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/notices?userType=${userType}`);
      const data = await response.json();
      if (data.success) {
        setNotices(data.notices || []);
      }
    } catch (error) {
      console.error("Failed to fetch notices:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      const response = await fetch("/api/events?status=upcoming&limit=5");
      const data = await response.json();
      if (data.success) {
        setEvents(data.events || []);
      }
    } catch (error) {
      console.error("Failed to fetch events:", error);
    }
  };

  const markAsRead = async (noticeId: string) => {
    try {
      await fetch(`/api/notices/${noticeId}/read`, { method: "POST" });
      setNotices((prev) =>
        prev.map((n) =>
          n.id === noticeId
            ? { ...n, readAt: new Date(), viewCount: (n.viewCount || 0) + 1 }
            : n
        )
      );
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800 border-red-200";
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "normal":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "low":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "urgent":
      case "high":
        return <AlertCircle className="h-4 w-4" />;
      case "normal":
        return <Info className="h-4 w-4" />;
      case "low":
        return <CheckCircle2 className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const pinnedNotices = notices.filter((n) => n.isPinned);
  const regularNotices = notices.filter((n) => !n.isPinned);
  const upcomingEvents = events.slice(0, 5);

  if (loading && notices.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">
            All Notices
            {notices.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {notices.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="events">
            Events
            {upcomingEvents.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {upcomingEvents.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="pinned">
            Pinned
            {pinnedNotices.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {pinnedNotices.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4 mt-4">
          {pinnedNotices.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                Pinned Notices
              </h3>
              {pinnedNotices.map((notice) => (
                <NoticeCard
                  key={notice.id}
                  notice={notice}
                  onRead={markAsRead}
                  getPriorityColor={getPriorityColor}
                  getPriorityIcon={getPriorityIcon}
                />
              ))}
            </div>
          )}

          {regularNotices.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                Recent Notices
              </h3>
              {regularNotices.map((notice) => (
                <NoticeCard
                  key={notice.id}
                  notice={notice}
                  onRead={markAsRead}
                  getPriorityColor={getPriorityColor}
                  getPriorityIcon={getPriorityIcon}
                />
              ))}
            </div>
          )}

          {notices.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Bell className="h-12 w-12 text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No notices</h3>
                <p className="text-gray-500">Check back later for new announcements</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="events" className="space-y-4 mt-4">
          {upcomingEvents.length > 0 ? (
            upcomingEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Calendar className="h-12 w-12 text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No upcoming events</h3>
                <p className="text-gray-500">Check back later for new events</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="pinned" className="space-y-4 mt-4">
          {pinnedNotices.length > 0 ? (
            pinnedNotices.map((notice) => (
              <NoticeCard
                key={notice.id}
                notice={notice}
                onRead={markAsRead}
                getPriorityColor={getPriorityColor}
                getPriorityIcon={getPriorityIcon}
              />
            ))
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Pin className="h-12 w-12 text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No pinned notices</h3>
                <p className="text-gray-500">Pinned notices will appear here</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface NoticeCardProps {
  notice: Notice;
  onRead: (id: string) => void;
  getPriorityColor: (priority: string) => string;
  getPriorityIcon: (priority: string) => React.ReactNode;
}

function NoticeCard({ notice, onRead, getPriorityColor, getPriorityIcon }: NoticeCardProps) {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!notice.readAt) {
      onRead(notice.id);
    }
  }, []);

  const isUnread = !notice.readAt;

  return (
    <Card
      className={cn(
        "transition-all hover:shadow-md cursor-pointer",
        isUnread && "border-l-4 border-l-blue-500 bg-blue-50/30"
      )}
      onClick={() => setExpanded(!expanded)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              {notice.isPinned && (
                <Badge variant="outline" className="gap-1">
                  <Pin className="h-3 w-3" />
                  Pinned
                </Badge>
              )}
              <Badge className={getPriorityColor(notice.priority)}>
                <span className="mr-1">{getPriorityIcon(notice.priority)}</span>
                {notice.priority}
              </Badge>
              <Badge variant="outline">{notice.category}</Badge>
              {isUnread && (
                <Badge variant="default" className="bg-blue-500">
                  New
                </Badge>
              )}
            </div>
            <CardTitle className="text-base">{notice.title}</CardTitle>
          </div>
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <Eye className="h-4 w-4" />
            <span>{notice.viewCount || 0}</span>
          </div>
        </div>
      </CardHeader>
      {expanded && (
        <CardContent>
          <div className="text-gray-700 whitespace-pre-wrap">{notice.content}</div>
          <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
            <span>
              Posted: {new Date(notice.createdAt).toLocaleDateString()}
            </span>
            {notice.expiryDate && (
              <span>
                Expires: {new Date(notice.expiryDate).toLocaleDateString()}
              </span>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

interface EventCardProps {
  event: Event;
}

function EventCard({ event }: EventCardProps) {
  const startDate = new Date(event.startDate);
  const endDate = new Date(event.endDate);

  return (
    <Card className="transition-all hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-14 h-14 bg-purple-100 rounded-lg flex flex-col items-center justify-center">
            <span className="text-xs font-semibold text-purple-700 uppercase">
              {startDate.toLocaleDateString("en-US", { month: "short" })}
            </span>
            <span className="text-2xl font-bold text-purple-700">
              {startDate.getDate()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-base mb-1 truncate">{event.title}</h4>
            <p className="text-sm text-gray-600 line-clamp-2">{event.description}</p>
            <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
              <span className="capitalize">{event.eventType}</span>
              {event.location && <span>• {event.location}</span>}
              {startDate.toDateString() !== endDate.toDateString() && (
                <span>• Until {endDate.toLocaleDateString()}</span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
