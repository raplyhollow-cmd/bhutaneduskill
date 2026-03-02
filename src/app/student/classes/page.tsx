"use client";

import { logger } from "@/lib/logger";
/**
 * STUDENT CLASSES PAGE
 * View all classes student is enrolled in with quick access to classmates, homework, etc.
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorMessage } from "@/components/ui/error-message";
import { CardSkeleton } from "@/components/ui/skeleton";
import {
  BookOpen,
  Users,
  Clock,
  MapPin,
  ClipboardList,
  User,
  Search,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { TableQuickActions, ActionIcons } from "@/components/shared/table-quick-actions";

interface ClassData {
  id: string;
  name: string;
  grade: number;
  section: string;
  academicYear: string;
  teacher: {
    id: string;
    name: string;
    email: string;
  } | null;
  subject: {
    id: string;
    name: string;
    code: string;
  } | null;
  students: number;
  pendingHomework: number;
  attendanceSummary: {
    present: number;
    absent: number;
    late: number;
    percentage: number;
  };
  schedule?: {
    days: string[];
    time: string;
    room: string;
  };
  enrolledAt: string | null;
  status: string;
}

interface ClassesResponse {
  classes: ClassData[];
  error?: string;
}

export default function StudentClassesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClass, setSelectedClass] = useState<ClassData | null>(null);
  const [filterSubject, setFilterSubject] = useState<string>("all");
  const [classesData, setClassesData] = useState<ClassData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch classes on mount
  useEffect(() => {
    fetch("/api/student/classes")
      .then((res) => res.json())
      .then((response) => {
        // successResponse wraps data in a "data" property
        const data = response.data || response;
        if (data.error) {
          setError(data.error);
        } else if (data.classes) {
          setClassesData(data.classes);
        }
        setIsLoading(false);
      })
      .catch((err) => {
        logger.error("Failed to fetch classes:", err);
        setError("Failed to load classes. Please try again.");
        setIsLoading(false);
      });
  }, []);

  // Filter classes based on search and subject filter
  const filteredClasses = classesData.filter((cls) => {
    const matchesSearch =
      cls.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cls.teacher?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cls.teacher?.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = filterSubject === "all" || cls.name.toLowerCase().includes(filterSubject.toLowerCase());
    return matchesSearch && matchesSubject;
  });

  // Get unique subjects for filter
  const subjects = ["all", ...Array.from(new Set(classesData.map((c) => c.name)))];

  // Get next class today
  const today = new Date().toISOString().split("T")[0];
  const nextClassToday = filteredClasses.filter((c) => {
    const schedule = c.schedule;
    if (!schedule || typeof schedule !== "object") return false;
    const classTime = schedule.time || "--:--";
    const classDate = new Date(schedule.days?.[0] || today);
    const classTimeDate = new Date(`${classDate.toISOString().split("T")[0]}T${classTime}`);
    return classTimeDate.getTime() - new Date(today).getTime() > 0;
  })[0];

  if (selectedClass) {
    return (
      <div className="space-y-6">
        <Button variant="outline" onClick={() => setSelectedClass(null)}>
          ← Back to My Classes
        </Button>

        <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Class Header Card */}
              <Card>
                <CardHeader>
                  <div style={{ background: 'linear-gradient(135deg, rgb(249 115 22) 0%, rgb(194 65 12) 100%)' }} className="rounded-lg p-6 text-white -m-6 mb-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <h2 className="text-2xl font-bold">{selectedClass.name}</h2>
                        <p className="text-orange-100 mt-1">{selectedClass.name}</p>
                        <p className="text-orange-200 text-sm mt-2">Grade {selectedClass.grade} - Section {selectedClass.section}</p>
                      </div>
                      <Badge className="bg-white/20 text-white border-0 text-sm">
                        {selectedClass.students} Students
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Teacher Info */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <User className="w-5 h-5 text-orange-500" />
                      Class Teacher
                    </h3>
                    {selectedClass.teacher ? (
                      <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                        <p className="font-medium text-gray-900">{selectedClass.teacher.name}</p>
                        <p className="text-sm text-gray-600">{selectedClass.teacher.email}</p>
                        <Button size="sm" variant="outline" className="mt-3">
                          Contact Teacher
                        </Button>
                      </div>
                    ) : (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-gray-500">No teacher assigned</p>
                      </div>
                    )}
                  </div>

                  {/* Schedule */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Clock className="w-5 h-5 text-orange-500" />
                      Schedule
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-4 border">
                      {selectedClass.schedule ? (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-600">Days</p>
                            <p className="font-medium">{selectedClass.schedule.days.join(", ")}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Time</p>
                            <p className="font-medium">{selectedClass.schedule.time}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Room</p>
                            <p className="font-medium">{selectedClass.schedule.room}</p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-500">Schedule not available</p>
                      )}
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Quick Actions</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <Link href="/student/homework" className="col-span-1">
                        <Button variant="outline" className="w-full justify-start min-h-[44px]">
                          <ClipboardList className="w-4 h-4 mr-2" />
                          View Homework
                          {selectedClass.pendingHomework > 0 && (
                            <Badge className="ml-auto bg-orange-100 text-orange-700">
                              {selectedClass.pendingHomework}
                            </Badge>
                          )}
                        </Button>
                      </Link>
                      <Button variant="outline" className="w-full justify-start min-h-[44px]">
                        <BookOpen className="w-4 h-4 mr-2" />
                        View Resources
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar - Classmates */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="w-5 h-5 text-orange-500" />
                    Classmates
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-semibold">
                          {`ST${i}`}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">Student {i}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </div>
                    ))}
                    <Button variant="outline" size="sm" className="w-full mt-2">
                      View All {selectedClass.students} Classmates
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Attendance Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Attendance Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">This Month</span>
                      <span className="font-semibold text-green-600">{selectedClass.attendanceSummary?.percentage || 0}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Present</span>
                      <span className="font-medium">{selectedClass.attendanceSummary?.present || 0} days</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Absent</span>
                      <span className="font-medium text-red-600">{selectedClass.attendanceSummary?.absent || 0} days</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Late</span>
                      <span className="font-medium text-yellow-600">{selectedClass.attendanceSummary?.late || 0} days</span>
                    </div>
                  </div>
                  <Link href="/student/attendance">
                    <Button variant="outline" size="sm" className="w-full mt-4">
                      View Full Attendance
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Classes</h1>
        <p className="text-gray-600 mt-1">View all your enrolled classes</p>
      </div>

      {/* Error State */}
        {error && (
          <ErrorMessage
            title="Couldn't load classes"
            message={error}
            variant="error"
            retryAction={{ label: "Retry", onClick: () => window.location.reload() }}
          />
        )}

        {/* Loading State */}
        {isLoading && !error && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && filteredClasses.length === 0 && (
          <Card>
            <CardContent className="py-12">
              <EmptyState
                icon={<BookOpen className="w-16 h-16" />}
                title="No classes found"
                description="You are not enrolled in any classes yet. Please contact your school administrator to get enrolled."
                size="default"
              />
            </CardContent>
          </Card>
        )}

        {/* Classes Grid */}
        {!isLoading && !error && filteredClasses.length > 0 && (
          <>
            {/* Next Class Today Banner */}
            {nextClassToday && (
              <Card className="mb-6" style={{ background: 'linear-gradient(135deg, rgb(249 115 22) 0%, rgb(194 65 12) 100%)' }}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between text-white">
                    <div>
                      <p className="text-orange-100 text-sm mb-1">Next Class Today</p>
                      <h3 className="text-xl font-bold">{nextClassToday.name}</h3>
                      <p className="text-orange-100 text-sm mt-1">
                        {nextClassToday.name} - Grade {nextClassToday.grade}
                      </p>
                    </div>
                    <div className="text-right">
                      <Clock className="w-8 h-8 text-orange-200" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Search classes, teachers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 min-h-[44px]"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                {subjects.slice(0, 6).map((subject) => (
                  <Button
                    key={subject}
                    variant={filterSubject === subject ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilterSubject(subject)}
                    className="min-h-[44px]"
                    style={filterSubject === subject ? { background: 'linear-gradient(135deg, rgb(249 115 22) 0%, rgb(194 65 12) 100%)' } : {}}
                  >
                    {subject === "all" ? "All Subjects" : subject}
                  </Button>
                ))}
              </div>
            </div>

            {/* Classes Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredClasses.map((cls) => (
                <Card
                  key={cls.id}
                  className="hover:shadow-lg transition-all duration-200 cursor-pointer group"
                  onClick={() => setSelectedClass(cls)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <CardTitle className="group-hover:text-orange-600 transition-colors">
                            {cls.name}
                          </CardTitle>
                          <p className="text-sm text-gray-500">{cls.subject?.code || cls.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="shrink-0">
                          Grade {cls.grade}-{cls.section}
                        </Badge>
                        <div onClick={(e) => e.stopPropagation()}>
                          <TableQuickActions
                            actions={[
                              { label: "View Details", icon: ActionIcons.view, onClick: () => setSelectedClass(cls) },
                              { label: "View Homework", icon: ActionIcons.classes, onClick: () => window.location.assign("/student/homework") },
                            ]}
                          />
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Teacher */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                        <User className="w-5 h-5 text-orange-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{cls.teacher?.name || "No teacher assigned"}</p>
                        <p className="text-xs text-gray-500 truncate">{cls.teacher?.email || ""}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-orange-500 group-hover:translate-x-1 transition-all" />
                    </div>

                    {/* Schedule */}
                    <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-600">Scheduled classes</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-600">{cls.grade}-{cls.section}</span>
                      </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="flex items-center justify-between pt-3 border-t">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <ClipboardList className="w-4 h-4" />
                        <span>{cls.pendingHomework} pending</span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-orange-500 group-hover:translate-x-1 transition-all" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
    </div>
  );
}
