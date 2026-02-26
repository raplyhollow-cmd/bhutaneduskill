/**
 * TEACHER TIMETABLE PAGE
 *
 * Shows the teacher's weekly schedule
 * - All classes and subjects
 * - Period-by-period view
 * - Day-by-day breakdown
 */

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Calendar,
  Clock,
  BookOpen,
  Users,
  GraduationCap,
  Loader2,
  AlertCircle,
  Printer,
  Download,
} from "lucide-react";
import Link from "next/link";

interface TimetableEntry {
  id: string;
  classId: string;
  className: string;
  classGrade: number;
  classSection: string;
  subjectId: string;
  subjectName: string;
  periodName: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  isDoublePeriod: boolean;
}

interface AssignedClass {
  id: string;
  classId: string;
  className: string;
  classGrade: number;
  classSection: string;
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  isPrimary: boolean;
  role: string;
}

interface TeacherTimetableData {
  teacherId: string;
  teacherName: string;
  timetableEntries: TimetableEntry[];
  timetableByDay: {
    Monday: TimetableEntry[];
    Tuesday: TimetableEntry[];
    Wednesday: TimetableEntry[];
    Thursday: TimetableEntry[];
    Friday: TimetableEntry[];
  };
  assignedClasses: AssignedClass[];
  totalClasses: number;
  totalPeriodsPerWeek: number;
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const PERIODS = ["Period 1", "Period 2", "Period 3", "Period 4", "Period 5", "Period 6", "Period 7", "Period 8"];

export default function TeacherTimetablePage() {
  const [data, setData] = useState<TeacherTimetableData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/teacher/timetable");
      const result = await res.json();

      if (!res.ok || !result.data) {
        throw new Error(result.error || "Failed to load timetable");
      }

      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load timetable");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <AlertCircle className="w-16 h-16 mx-auto text-red-400 mb-4" />
        <h2 className="text-xl font-semibold mb-2 text-red-600">Error Loading Timetable</h2>
        <p className="text-gray-600 mb-4">{error}</p>
        <Button onClick={loadData} variant="outline">
          Retry
        </Button>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  // Create a grid: rows = periods, columns = days
  const getEntryForCell = (day: string, period: string) => {
    return data.timetableByDay[day as keyof typeof data.timetableByDay]?.find(
      (e) => e.periodName === period
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/teacher/dashboard">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Timetable</h1>
            <p className="text-gray-500">Weekly Schedule • {data.totalPeriodsPerWeek} periods/week</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{data.totalClasses}</p>
                <p className="text-sm text-gray-500">Classes Teaching</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{data.assignedClasses.length}</p>
                <p className="text-sm text-gray-500">Subjects Assigned</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{data.totalPeriodsPerWeek}</p>
                <p className="text-sm text-gray-500">Periods Per Week</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assigned Classes Summary */}
      {data.assignedClasses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              My Classes & Subjects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.assignedClasses.map((assignment) => (
                <div
                  key={assignment.id}
                  className="p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">
                      Grade {assignment.classGrade} - {assignment.classSection}
                    </span>
                    {assignment.isPrimary && (
                      <Badge className="bg-purple-100 text-purple-700 text-xs">Primary</Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{assignment.subjectName}</p>
                  <p className="text-xs text-gray-400">{assignment.subjectCode}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Weekly Timetable Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Weekly Schedule
          </CardTitle>
          <CardDescription>
            All your classes scheduled for the week
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.totalPeriodsPerWeek === 0 ? (
            <div className="text-center py-10 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="mb-4">No timetable entries found yet.</p>
              <p className="text-sm">Your school administrator will generate the timetable soon.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-200 p-3 text-left font-medium text-gray-700 w-24">
                      Period
                    </th>
                    {DAYS.map((day) => (
                      <th key={day} className="border border-gray-200 p-3 text-center font-medium text-gray-700 min-w-[140px]">
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PERIODS.map((period) => (
                    <tr key={period}>
                      <td className="border border-gray-200 p-3 bg-gray-50 font-medium text-gray-700 text-sm">
                        {period}
                      </td>
                      {DAYS.map((day) => {
                        const entry = getEntryForCell(day, period);
                        return (
                          <td
                            key={`${day}-${period}`}
                            className="border border-gray-200 p-2 text-center"
                          >
                            {entry ? (
                              <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                                <p className="font-medium text-sm text-blue-900">
                                  {entry.subjectName}
                                </p>
                                <p className="text-xs text-blue-700 mb-1">
                                  Grade {entry.classGrade} - {entry.classSection}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {entry.startTime} - {entry.endTime}
                                </p>
                                {entry.isDoublePeriod && (
                                  <Badge className="mt-1 text-xs bg-purple-100 text-purple-700">
                                    Double
                                  </Badge>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-300 text-sm">—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
