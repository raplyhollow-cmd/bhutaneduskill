"use client";

import { logger } from "@/lib/logger";
/**
 * TEACHER SCHEDULE PAGE
 * Weekly timetable view with class schedule, events, and calendar integration
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Plus,
  ChevronLeft,
  ChevronRight,
  Bell,
  Link as LinkIcon,
  Video,
  Loader2,
} from "lucide-react";

interface ScheduleItem {
  id: string;
  title: string;
  type: "class" | "meeting" | "event" | "office_hours";
  day: "monday" | "tuesday" | "wednesday" | "thursday" | "friday";
  startTime: string; // HH:MM format
  endTime: string;
  location?: string;
  classId?: string;
  className?: string;
  subject?: string;
  isRecurring?: boolean;
  notes?: string;
  meetingLink?: string;
}

const weekDays = ["monday", "tuesday", "wednesday", "thursday", "friday"] as const;
const timeSlots = [
  "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00",
];

const dayNames: Record<typeof weekDays[number], string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
};

export default function TeacherSchedulePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [viewMode, setViewMode] = useState<"week" | "list">("week");

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        setIsLoading(true);

        const response = await fetch("/api/teacher/schedule");
        if (response.ok) {
          const data = await response.json();
          setSchedule(data.schedule || []);
        } else {
          // Mock data
          setSchedule([
            {
              id: "s1",
              title: "Mathematics - Class 10A",
              type: "class",
              day: "monday",
              startTime: "09:00",
              endTime: "10:00",
              location: "Room 101",
              classId: "c1",
              className: "Class 10 A",
              subject: "Mathematics",
              isRecurring: true,
            },
            {
              id: "s2",
              title: "Physics - Class 9A",
              type: "class",
              day: "monday",
              startTime: "11:00",
              endTime: "12:00",
              location: "Lab 3",
              classId: "c3",
              className: "Class 9 A",
              subject: "Physics",
              isRecurring: true,
            },
            {
              id: "s3",
              title: "Staff Meeting",
              type: "meeting",
              day: "monday",
              startTime: "14:00",
              endTime: "15:00",
              location: "Conference Room",
              isRecurring: true,
              notes: "Weekly department meeting",
            },
            {
              id: "s4",
              title: "Mathematics - Class 10B",
              type: "class",
              day: "tuesday",
              startTime: "09:00",
              endTime: "10:00",
              location: "Room 102",
              classId: "c2",
              className: "Class 10 B",
              subject: "Mathematics",
              isRecurring: true,
            },
            {
              id: "s5",
              title: "Office Hours",
              type: "office_hours",
              day: "tuesday",
              startTime: "15:00",
              endTime: "16:00",
              location: "Staff Room",
              isRecurring: true,
              notes: "Student consultation",
            },
            {
              id: "s6",
              title: "Mathematics - Class 10A",
              type: "class",
              day: "wednesday",
              startTime: "09:00",
              endTime: "10:00",
              location: "Room 101",
              classId: "c1",
              className: "Class 10 A",
              subject: "Mathematics",
              isRecurring: true,
            },
            {
              id: "s7",
              title: "Career Guidance Workshop",
              type: "event",
              day: "wednesday",
              startTime: "13:00",
              endTime: "14:30",
              location: "Auditorium",
              notes: "Guest speaker from industry",
            },
            {
              id: "s8",
              title: "Physics - Class 9A",
              type: "class",
              day: "thursday",
              startTime: "09:00",
              endTime: "10:00",
              location: "Lab 3",
              classId: "c3",
              className: "Class 9 A",
              subject: "Physics",
              isRecurring: true,
            },
            {
              id: "s9",
              title: "Mathematics - Class 10B",
              type: "class",
              day: "thursday",
              startTime: "11:00",
              endTime: "12:00",
              location: "Room 102",
              classId: "c2",
              className: "Class 10 B",
              subject: "Mathematics",
              isRecurring: true,
            },
            {
              id: "s10",
              title: "Mathematics - Class 10A",
              type: "class",
              day: "friday",
              startTime: "09:00",
              endTime: "10:00",
              location: "Room 101",
              classId: "c1",
              className: "Class 10 A",
              subject: "Mathematics",
              isRecurring: true,
            },
            {
              id: "s11",
              title: "Physics Lab - Class 9A",
              type: "class",
              day: "friday",
              startTime: "14:00",
              endTime: "16:00",
              location: "Lab 3",
              classId: "c3",
              className: "Class 9 A",
              subject: "Physics",
              isRecurring: true,
            },
          ]);
        }
      } catch (error) {
        logger.error("Error fetching schedule:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSchedule();
  }, []);

  const getWeekRange = () => {
    const start = new Date(currentWeek);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1);
    start.setDate(diff);

    const end = new Date(start);
    end.setDate(start.getDate() + 4);

    return {
      start: start.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      end: end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    };
  };

  const navigateWeek = (direction: "prev" | "next") => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(newWeek.getDate() + (direction === "next" ? 7 : -7));
    setCurrentWeek(newWeek);
  };

  const getItemStyle = (item: ScheduleItem) => {
    const baseStyle = "rounded-lg p-2 text-xs border-l-4";

    switch (item.type) {
      case "class":
        return `${baseStyle} bg-blue-50 border-blue-500`;
      case "meeting":
        return `${baseStyle} bg-purple-50 border-purple-500`;
      case "event":
        return `${baseStyle} bg-green-50 border-green-500`;
      case "office_hours":
        return `${baseStyle} bg-orange-50 border-orange-500`;
      default:
        return `${baseStyle} bg-gray-50 border-gray-400`;
    }
  };

  const getTypeIcon = (type: ScheduleItem["type"]) => {
    switch (type) {
      case "class":
        return <Users className="w-3.5 h-3.5" />;
      case "meeting":
      case "office_hours":
        return <Bell className="w-3.5 h-3.5" />;
      case "event":
        return <Calendar className="w-3.5 h-3.5" />;
    }
  };

  const getScheduleForDayAndTime = (day: typeof weekDays[number], timeSlot: string) => {
    return schedule.find((item) => {
      if (item.day !== day) return false;

      const itemStart = parseInt(item.startTime.split(":")[0]);
      const slotHour = parseInt(timeSlot.split(":")[0]);

      return itemStart === slotHour;
    });
  };

  const getUpcomingClasses = () => {
    const now = new Date();
    const currentDay = now.toLocaleString("en-US", { weekday: "long" }).toLowerCase() as typeof weekDays[number];
    const currentTime = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });

    return schedule
      .filter((item) => item.type === "class")
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
      .slice(0, 5);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6 flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-gray-600">Loading schedule...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Schedule</h1>
          <p className="text-gray-600">Weekly timetable and upcoming events</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => window.open("https://calendar.google.com", "_blank")}
          >
            <LinkIcon className="w-4 h-4 mr-2" />
            Sync with Google Calendar
          </Button>
          <Button
            style={{ background: "linear-gradient(135deg, rgb(59 130 246) 0%, rgb(37 99 235) 100%)" }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Event
          </Button>
        </div>
      </div>

      {/* Week Navigation */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={() => navigateWeek("prev")}>
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous Week
            </Button>

            <div className="text-center">
              <h2 className="text-lg font-semibold text-gray-900">
                Week of {getWeekRange().start} - {getWeekRange().end}
              </h2>
            </div>

            <Button variant="outline" size="sm" onClick={() => navigateWeek("next")}>
              Next Week
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* View Toggle */}
      <div className="flex items-center gap-2">
        <Button
          variant={viewMode === "week" ? "default" : "outline"}
          size="sm"
          onClick={() => setViewMode("week")}
        >
          Weekly View
        </Button>
        <Button
          variant={viewMode === "list" ? "default" : "outline"}
          size="sm"
          onClick={() => setViewMode("list")}
        >
          List View
        </Button>
      </div>

      {/* Weekly Grid View */}
      {viewMode === "week" && (
        <Card>
          <CardContent className="pt-6">
            <div className="overflow-x-auto">
              <div className="min-w-[800px]">
                {/* Header Row */}
                <div className="grid grid-cols-6 gap-2 mb-4">
                  <div className="font-medium text-gray-600 text-sm p-2">Time</div>
                  {weekDays.map((day) => (
                    <div key={day} className="font-medium text-gray-900 text-sm p-2 text-center">
                      {dayNames[day]}
                    </div>
                  ))}
                </div>

                {/* Time Slots */}
                {timeSlots.map((timeSlot) => (
                  <div key={timeSlot} className="grid grid-cols-6 gap-2 mb-2">
                    <div className="text-xs text-gray-600 p-2 text-right font-medium">
                      {timeSlot}
                    </div>
                    {weekDays.map((day) => {
                      const item = getScheduleForDayAndTime(day, timeSlot);
                      return (
                        <div key={day} className="min-h-[60px] bg-gray-50 rounded p-1">
                          {item ? (
                            <div className={getItemStyle(item)}>
                              <div className="flex items-center gap-1 font-medium text-gray-900 mb-1">
                                {getTypeIcon(item.type)}
                                <span className="truncate">{item.title}</span>
                              </div>
                              <div className="flex items-center gap-1 text-gray-600">
                                <Clock className="w-3 h-3" />
                                <span>
                                  {item.startTime} - {item.endTime}
                                </span>
                              </div>
                              {item.location && (
                                <div className="flex items-center gap-1 text-gray-600 mt-0.5">
                                  <MapPin className="w-3 h-3" />
                                  <span className="truncate">{item.location}</span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="h-full flex items-center justify-center text-gray-300 text-xs">
                              -
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* List View */}
      {viewMode === "list" && (
        <div className="grid md:grid-cols-2 gap-4">
          {weekDays.map((day) => {
            const daySchedule = schedule.filter((item) => item.day === day);
            return (
              <Card key={day}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{dayNames[day]}</CardTitle>
                </CardHeader>
                <CardContent>
                  {daySchedule.length === 0 ? (
                    <p className="text-sm text-gray-500">No classes scheduled</p>
                  ) : (
                    <div className="space-y-3">
                      {daySchedule.map((item) => (
                        <div
                          key={item.id}
                          className={`p-3 rounded-lg border-l-4 ${getItemStyle(item)}`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {getTypeIcon(item.type)}
                              <h4 className="font-medium text-gray-900">{item.title}</h4>
                            </div>
                            <Badge
                              variant="outline"
                              className="text-xs capitalize"
                            >
                              {item.type.replace("_", " ")}
                            </Badge>
                          </div>

                          <div className="space-y-1 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <Clock className="w-3.5 h-3.5" />
                              <span>
                                {item.startTime} - {item.endTime}
                              </span>
                            </div>
                            {item.location && (
                              <div className="flex items-center gap-2">
                                <MapPin className="w-3.5 h-3.5" />
                                <span>{item.location}</span>
                              </div>
                            )}
                            {item.meetingLink && (
                              <div className="flex items-center gap-2">
                                <Video className="w-3.5 h-3.5" />
                                <a
                                  href={item.meetingLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline"
                                >
                                  Join Meeting
                                </a>
                              </div>
                            )}
                          </div>

                          {item.notes && (
                            <p className="text-xs text-gray-500 mt-2 italic">{item.notes}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Quick Stats & Upcoming */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Today's Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              Today&apos;s Classes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {schedule
                .filter((s) => s.day === "monday" && s.type === "class")
                .slice(0, 4)
                .map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="text-xs text-gray-600 w-16">{item.startTime}</div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="text-xs text-gray-500">{item.location}</p>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="w-4 h-4 text-orange-600" />
              Upcoming Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {schedule
                .filter((s) => s.type === "event" || s.type === "meeting")
                .slice(0, 4)
                .map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        item.type === "event" ? "bg-green-500" : "bg-purple-500"
                      }`}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="text-xs text-gray-500">
                        {dayNames[item.day]} at {item.startTime}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Office Hours */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4 text-green-600" />
              Office Hours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {schedule
                .filter((s) => s.type === "office_hours")
                .map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="text-xs text-gray-600 w-20">{dayNames[item.day]}</div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {item.startTime} - {item.endTime}
                      </p>
                      <p className="text-xs text-gray-500">{item.location}</p>
                    </div>
                  </div>
                ))}
              {schedule.filter((s) => s.type === "office_hours").length === 0 && (
                <p className="text-sm text-gray-500">No office hours set</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
