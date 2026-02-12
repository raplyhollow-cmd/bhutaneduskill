/**
 * SCHOOL ADMIN - TIMETABLE MANAGEMENT
 *
 * Features:
 * - View class timetables
 * - Create new timetables
 * - Assign teachers to periods
 * - Manage time slots
 * - Week/day view
 * - Print/export timetables
 */

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  Plus,
  Edit,
  Printer,
  Download,
  Filter,
  Grid3x3,
  List,
  BookOpen,
  GraduationCap,
  Check,
  Loader2,
} from "lucide-react";

// Local types instead of importing from server API
interface ClassData {
  id: string;
  name: string;
  grade: number;
  section: string;
}

interface SubjectData {
  id: string;
  name: string;
  code: string;
  color: string;
}

interface TeacherData {
  id: string;
  name: string;
  subject: string;
}

interface TimeSlotData {
  id: string;
  label: string;
  startTime: string;
  endTime: string;
}

interface TimetableData {
  classId: string;
  className: string;
  timetable: Record<string, Record<string, string>>;
}

// Week days for timetable
const weekDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

export default function TimetablePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data state
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [subjects, setSubjects] = useState<SubjectData[]>([]);
  const [teachers, setTeachers] = useState<TeacherData[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlotData[]>([]);
  const [timetable, setTimetable] = useState<TimetableData | null>(null);

  // UI state
  const [selectedClass, setSelectedClass] = useState<ClassData | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCell, setEditingCell] = useState<{ periodId: string; day: string } | null>(null);

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // For now, use school ID from localStorage or default
        // In production, this would come from auth context
        const schoolId = localStorage.getItem("schoolId") || null;

        // Fetch from API instead of importing server-side code
        const response = await fetch(`/api/school-admin/timetable?schoolId=${schoolId}`);
        if (!response.ok) throw new Error("Failed to fetch timetable");

        const data = await response.json();

        setClasses(data.classes);
        setSubjects(data.subjects);
        setTeachers(data.teachers);
        setTimeSlots(data.timeSlots);

        if (data.timetable) {
          setTimetable(data.timetable);
          setSelectedClass(data.classes.find((c) => c.id === data.timetable?.classId) || data.classes[0] || null);
        } else if (data.classes.length > 0) {
          setSelectedClass(data.classes[0]);
        }
      } catch (err) {
        console.error("Error fetching timetable data:", err);
        setError("Failed to load timetable data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getSubjectById = (id: string) => subjects.find((s) => s.id === id);
  const getTeacherById = (id: string) => teachers.find((t) => t.id === id);

  const handleCellClick = (periodId: string, day: string) => {
    setEditingCell({ periodId, day });
    setShowCreateModal(true);
  };

  const getCellContent = (periodId: string, day: string) => {
    if (!timetable) return null;

    const entry = timetable.entries.find(
      (e) => e.periodId === periodId && e.day === day
    );

    if (!entry) return null;

    const subject = getSubjectById(entry.subjectId || "");
    const teacher = getTeacherById(entry.teacherId || "");

    return { subject, teacher, entry };
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    // Export functionality would be implemented here
    alert("Export functionality would be implemented with a backend service");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-violet-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading timetable data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to Load Timetable</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (classes.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <GraduationCap className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Classes Found</h3>
          <p className="text-gray-500 mb-4">
            Create classes first before setting up timetables.
          </p>
          <Button
            className="text-white"
            style={{ background: "linear-gradient(135deg, rgb(139 92 246) 0%, rgb(124 58 237) 100%)" }}
            onClick={() => (window.location.href = "/school-admin/classes")}
          >
            Manage Classes
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Timetable Management</h1>
          <p className="text-gray-600 mt-1">Create and manage class timetables</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button
            className="text-white"
            style={{ background: "linear-gradient(135deg, rgb(139 92 246) 0%, rgb(124 58 237) 100%)" }}
            onClick={() => setShowCreateModal(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Timetable
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-violet-100 rounded-lg flex items-center justify-center">
                <Grid3x3 className="w-6 h-6 text-violet-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{classes.length}</p>
                <p className="text-sm text-gray-500">Total Classes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{subjects.length}</p>
                <p className="text-sm text-gray-500">Subjects</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{teachers.length}</p>
                <p className="text-sm text-gray-500">Teachers</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{timeSlots.length}</p>
                <p className="text-sm text-gray-500">Periods/Day</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Class Selection */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Select Class:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {classes.map((cls) => (
                <button
                  key={cls.id}
                  onClick={() => setSelectedClass(cls)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedClass?.id === cls.id
                      ? "text-white shadow-md"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                  style={
                    selectedClass?.id === cls.id
                      ? { background: "linear-gradient(135deg, rgb(139 92 246) 0%, rgb(124 58 237) 100%)" }
                      : {}
                  }
                >
                  {cls.name}
                </button>
              ))}
            </div>
            <div className="ml-auto flex items-center gap-2">
              <span className="text-sm text-gray-500">View:</span>
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("grid")}
              >
                <Grid3x3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("list")}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timetable Grid */}
      {selectedClass && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-violet-600" />
                  Weekly Timetable - {selectedClass.name}
                </CardTitle>
                <CardDescription>
                  {selectedClass.grade} {selectedClass.section ? `- ${selectedClass.section}` : ""} • Academic Year 2025
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Legend */}
            <div className="flex flex-wrap gap-2 mb-4 pb-4 border-b">
              {subjects.slice(0, 8).map((subject) => (
                <Badge
                  key={subject.id}
                  className="bg-gray-100 text-gray-700 border-gray-300"
                  variant="outline"
                >
                  {subject.code || subject.name}
                </Badge>
              ))}
              {subjects.length > 8 && (
                <Badge className="bg-gray-100 text-gray-700 border-gray-300" variant="outline">
                  +{subjects.length - 8} more
                </Badge>
              )}
            </div>

            {/* Timetable Grid */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-600 bg-gray-50 min-w-[100px]">
                      Time
                    </th>
                    {weekDays.map((day) => (
                      <th key={day} className="text-center py-3 px-4 font-medium text-gray-600 bg-gray-50 min-w-[140px]">
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {timeSlots.map((slot) => {
                    const cell = timetable?.entries.find((e) => e.periodId === slot.id);

                    return (
                      <tr key={slot.id} className="border-b border-gray-100">
                        <td className="py-2 px-4 bg-gray-50">
                          <div className="text-center">
                            <p className="font-medium text-gray-900">Period {slot.period}</p>
                            <p className="text-xs text-gray-500">
                              {slot.startTime} - {slot.endTime}
                            </p>
                          </div>
                        </td>
                        {weekDays.map((day) => {
                          const cellContent = getCellContent(slot.id, day);
                          const isBreak = slot.isBreak;

                          return (
                            <td key={day} className="py-2 px-2">
                              {isBreak ? (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 text-center">
                                  <p className="text-sm font-medium text-yellow-700">Lunch Break</p>
                                </div>
                              ) : cellContent ? (
                                <button
                                  onClick={() => handleCellClick(slot.id, day)}
                                  className="w-full text-left rounded-lg p-2 border border-gray-200 bg-white transition-all hover:shadow-md hover:border-violet-300"
                                >
                                  <p className="font-medium text-sm text-gray-900">
                                    {cellContent.subject?.name || "Free Period"}
                                  </p>
                                  {cellContent.teacher && (
                                    <p className="text-xs text-gray-500">{cellContent.teacher.name}</p>
                                  )}
                                  {cellContent.entry?.room && (
                                    <p className="text-xs text-gray-400">{cellContent.entry.room}</p>
                                  )}
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleCellClick(slot.id, day)}
                                  className="w-full h-full min-h-[60px] rounded-lg border-2 border-dashed border-gray-300 hover:border-violet-400 hover:bg-violet-50 transition-all flex items-center justify-center"
                                >
                                  <Plus className="w-5 h-5 text-gray-400" />
                                </button>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common timetable management tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2">
              <GraduationCap className="w-5 h-5" />
              <span>Assign Teacher</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2">
              <BookOpen className="w-5 h-5" />
              <span>Add Subject</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2">
              <Clock className="w-5 h-5" />
              <span>Edit Time Slots</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2">
              <Download className="w-5 h-5" />
              <span>Batch Generate</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full">
            <div className="border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">
                {editingCell ? "Edit Period" : "Create New Timetable"}
              </h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingCell(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              {editingCell && (
                <div className="bg-violet-50 border border-violet-200 rounded-lg p-3">
                  <p className="text-sm text-violet-900">
                    Editing: Period {editingCell.periodId} - {editingCell.day}
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Subject</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500">
                  <option value="">Select a subject</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name} ({subject.code || "N/A"})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assign Teacher</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500">
                  <option value="">Select a teacher</option>
                  {teachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.name} ({teacher.subjects.join(", ") || "No subjects"})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Room (Optional)</label>
                <Input placeholder="e.g., Room 101" />
              </div>
            </div>
            <div className="border-t px-6 py-4 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingCell(null);
                }}
              >
                Cancel
              </Button>
              <Button
                className="text-white"
                style={{ background: "linear-gradient(135deg, rgb(139 92 246) 0%, rgb(124 58 237) 100%)" }}
              >
                <Check className="w-4 h-4 mr-2" />
                Save
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
