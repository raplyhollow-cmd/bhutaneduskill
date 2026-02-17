"use client";

import { logger } from "@/lib/logger";
/**
 * SCHOOL CALENDAR PAGE (Public)
 *
 * Displays all school events in a calendar view
 * Students, teachers, parents can all view this page
 */


import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Plus,
  Filter,
  Loader2,
  Users,
  Info,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Event {
  id: string;
  title: string;
  description?: string;
  eventType: string;
  category?: string;
  startDate: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  isAllDay: boolean;
  location?: string;
  venue?: string;
  color?: string;
  organizerName?: string;
  requiresRSVP: boolean;
}

// Category icons and colors
const CATEGORY_CONFIG: Record<string, { icon: string; color: string; bg: string }> = {
  academic: { icon: "📚", color: "text-blue-700", bg: "bg-blue-100" },
  event: { icon: "🎉", color: "text-purple-700", bg: "bg-purple-100" },
  holiday: { icon: "🏖️", color: "text-green-700", bg: "bg-green-100" },
  exam: { icon: "📝", color: "text-red-700", bg: "bg-red-100" },
  sports: { icon: "⚽", color: "text-orange-700", bg: "bg-orange-100" },
  cultural: { icon: "🎭", color: "text-pink-700", bg: "bg-pink-100" },
  meeting: { icon: "🤝", color: "text-cyan-700", bg: "bg-cyan-100" },
  emergency: { icon: "🚨", color: "text-red-700", bg: "bg-red-100" },
  "parent-teacher": { icon: "👨‍👩‍👧‍👦", color: "text-indigo-700", bg: "bg-indigo-100" },
  general: { icon: "📢", color: "text-gray-700", bg: "bg-gray-100" },
};

export default function SchoolCalendarPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"month" | "list">("month");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [canCreate, setCanCreate] = useState(false);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/events");
        const data = await response.json();
        setEvents(data.events || []);
        setCanCreate(data.user?.canCreate || false);
      } catch (error) {
        logger.error("Error fetching events:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  // Filter events by category
  const filteredEvents = events.filter((event) => {
    if (selectedCategory === "all") return true;
    return event.category === selectedCategory;
  });

  // Get events for a specific date
  const getEventsForDate = (date: Date) => {
    return filteredEvents.filter((event) => {
      const eventStart = new Date(event.startDate);
      const eventEnd = event.endDate ? new Date(event.endDate) : eventStart;
      const startOfDay = new Date(eventStart);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(eventEnd);
      endOfDay.setHours(23, 59, 59, 999);
      return (
        date.getTime() >= startOfDay.getTime() &&
        date.getTime() <= endOfDay.getTime()
      );
    });
  };

  // Calendar generation
  const generateCalendar = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday

    const calendar = [];
    let week = [];

    // Add empty cells for days before the first day
    for (let i = 0; i < startingDayOfWeek; i++) {
      week.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      week.push(new Date(year, month, day));

      if (week.length === 7) {
        calendar.push(week);
        week = [];
      }
    }

    // Add remaining days of the last week
    if (week.length > 0) {
      while (week.length < 7) {
        week.push(null);
      }
      calendar.push(week);
    }

    return calendar;
  };

  const calendar = generateCalendar(currentDate);

  // Navigation
  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      if (direction === "prev") {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return new Date(newDate);
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const formatTime = (time: string) => {
    if (!time) return "";
    const [hours, minutes] = time.split(":");
    const h = parseInt(hours);
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    return `${h12}:${minutes} ${ampm}`;
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <CalendarIcon className="w-8 h-8 text-orange-600" />
            School Calendar
          </h1>
          <p className="text-gray-600 mt-1">
            Important dates, holidays, and events
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-40">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              <SelectItem value="academic">Academic</SelectItem>
              <SelectItem value="holiday">Holidays</SelectItem>
              <SelectItem value="exam">Examinations</SelectItem>
              <SelectItem value="sports">Sports</SelectItem>
              <SelectItem value="cultural">Cultural</SelectItem>
              <SelectItem value="meeting">Meetings</SelectItem>
            </SelectContent>
          </Select>
          {canCreate && (
            <Button className="bg-orange-600 hover:bg-orange-700">
              <Plus className="w-4 h-4 mr-2" />
              New Event
            </Button>
          )}
        </div>
      </div>

      {/* Month Navigation */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigateMonth("prev")}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
            </div>
            <button
              onClick={() => navigateMonth("next")}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </CardHeader>
      </Card>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-px bg-gray-200 border border-gray-200 rounded-lg overflow-hidden">
        {/* Day headers */}
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="bg-gray-50 p-2 text-center text-sm font-medium text-gray-600">
            {day}
          </div>
        ))}

        {/* Calendar days */}
        {calendar.map((week, weekIndex) => (
          <div key={weekIndex} className="contents">
            {week.map((day, dayIndex) => {
              const dayEvents = day ? getEventsForDate(day) : [];
              const isTodayDate = day ? isToday(day) : false;

              return (
                <div
                  key={`${weekIndex}-${dayIndex}`}
                  className={`bg-white p-2 min-h-24 ${
                    isTodayDate ? "bg-orange-50" : ""
                  } hover:bg-gray-50 transition-colors cursor-pointer`}
                  onClick={() => day && setSelectedEvent(dayEvents[0] || null)}
                >
                  {day && (
                    <>
                      <div className={`text-sm font-medium mb-1 ${
                        isTodayDate ? "text-orange-600" : "text-gray-900"
                      }`}>
                        {day.getDate()}
                      </div>
                      <div className="space-y-1">
                        {dayEvents.slice(0, 3).map((event) => {
                          const config = CATEGORY_CONFIG[event.category || "general"] || CATEGORY_CONFIG.general;
                          return (
                            <div
                              key={event.id}
                              className={`text-xs p-1 rounded ${config.bg} ${config.color} truncate`}
                              title={event.title}
                            >
                              <span className="mr-1">{config.icon}</span>
                              {event.title}
                            </div>
                          );
                        })}
                        {dayEvents.length > 3 && (
                          <div className="text-xs text-gray-500 pl-1">
                            +{dayEvents.length - 3} more
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Upcoming Events List */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Events</CardTitle>
          <CardDescription>
            Events for {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No events scheduled for this month
            </div>
          ) : (
            <div className="space-y-3">
              {filteredEvents.slice(0, 10).map((event) => {
                const config = CATEGORY_CONFIG[event.category || "general"] || CATEGORY_CONFIG.general;
                const eventDate = new Date(event.startDate);

                return (
                  <div
                    key={event.id}
                    className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => setSelectedEvent(event)}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-16 h-16 rounded-lg ${config.bg} flex items-center justify-center text-2xl flex-shrink-0`}>
                        {config.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900 truncate">{event.title}</h3>
                          <Badge className={config.bg + " " + config.color}>
                            {event.category || "General"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="w-4 h-4" />
                            <span>{formatDate(eventDate)}</span>
                          </div>
                          {!event.isAllDay && event.startTime && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              <span>{formatTime(event.startTime)}</span>
                              {event.endTime && ` - ${formatTime(event.endTime)}`}
                            </div>
                          )}
                          {event.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              <span className="truncate">{event.location}</span>
                            </div>
                          )}
                        </div>
                        {event.description && (
                          <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                            {event.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Event Detail Dialog */}
      {selectedEvent && (
        <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
          <DialogContent className="sm:max-w-[500px]">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {(() => {
                    const config = CATEGORY_CONFIG[selectedEvent.category || "general"] || CATEGORY_CONFIG.general;
                    return (
                      <div className={`w-12 h-12 rounded-lg ${config.bg} flex items-center justify-center text-2xl`}>
                        {config.icon}
                      </div>
                    );
                  })()}
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{selectedEvent.title}</h3>
                    <Badge className="mt-1">
                      {selectedEvent.category || "General"}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <CalendarIcon className="w-4 h-4" />
                  <span>
                    {formatDate(new Date(selectedEvent.startDate))}
                    {selectedEvent.endDate && ` - ${formatDate(new Date(selectedEvent.endDate!))}`}
                  </span>
                </div>
                {!selectedEvent.isAllDay && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>
                      {selectedEvent.startTime ? formatTime(selectedEvent.startTime) : "All Day"}
                      {selectedEvent.endTime && ` - ${formatTime(selectedEvent.endTime)}`}
                    </span>
                  </div>
                )}
                {selectedEvent.location && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span>{selectedEvent.location}</span>
                  </div>
                )}
                {selectedEvent.venue && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Info className="w-4 h-4" />
                    <span>Venue: {selectedEvent.venue}</span>
                  </div>
                )}
                {selectedEvent.organizerName && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Users className="w-4 h-4" />
                    <span>Organized by {selectedEvent.organizerName}</span>
                  </div>
                )}
              </div>

              {selectedEvent.description && (
                <div className="pt-3 border-t">
                  <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                  <p className="text-gray-600">{selectedEvent.description}</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
