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

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  Plus,
  Edit,
  Trash2,
  Printer,
  Download,
  Eye,
  ChevronLeft,
  ChevronRight,
  Filter,
  Grid3x3,
  List,
  BookOpen,
  GraduationCap,
} from "lucide-react";

// Mock data
const classes = [
  { id: "1", name: "Class 10 A", section: "A", grade: "10", students: 32 },
  { id: "2", name: "Class 10 B", section: "B", grade: "10", students: 30 },
  { id: "3", name: "Class 11 A", section: "A", grade: "11", students: 28 },
  { id: "4", name: "Class 11 B", section: "B", grade: "11", students: 25 },
  { id: "5", name: "Class 12 A", section: "A", grade: "12", students: 22 },
];

const subjects = [
  { id: "1", name: "Mathematics", code: "MATH", color: "bg-blue-100 text-blue-700 border-blue-300" },
  { id: "2", name: "English", code: "ENG", color: "bg-green-100 text-green-700 border-green-300" },
  { id: "3", name: "Dzongkha", code: "DZO", color: "bg-red-100 text-red-700 border-red-300" },
  { id: "4", name: "Physics", code: "PHY", color: "bg-purple-100 text-purple-700 border-purple-300" },
  { id: "5", name: "Chemistry", code: "CHEM", color: "bg-orange-100 text-orange-700 border-orange-300" },
  { id: "6", name: "Biology", code: "BIO", color: "bg-lime-100 text-lime-700 border-lime-300" },
  { id: "7", name: "History", code: "HIST", color: "bg-yellow-100 text-yellow-700 border-yellow-300" },
  { id: "8", name: "Geography", code: "GEOG", color: "bg-teal-100 text-teal-700 border-teal-300" },
  { id: "9", name: "Computer Science", code: "CS", color: "bg-pink-100 text-pink-700 border-pink-300" },
  { id: "10", name: "Economics", code: "ECON", color: "bg-indigo-100 text-indigo-700 border-indigo-300" },
];

const teachers = [
  { id: "TCH001", name: "Tashi Dorji", subjects: ["Mathematics", "Physics"] },
  { id: "TCH002", name: "Karma Wangmo", subjects: ["English", "Literature"] },
  { id: "TCH003", name: "Pema Lhamo", subjects: ["Chemistry", "Biology"] },
  { id: "TCH004", name: "Dorji Wangchuk", subjects: ["Dzongkha", "History"] },
  { id: "TCH005", name: "Sonam Yangdon", subjects: ["Computer Science"] },
];

const timeSlots = [
  { id: "1", period: "1", startTime: "8:00", endTime: "8:45" },
  { id: "2", period: "2", startTime: "8:45", endTime: "9:30" },
  { id: "3", period: "3", startTime: "9:45", endTime: "10:30" },
  { id: "4", period: "4", startTime: "10:30", endTime: "11:15" },
  { id: "5", period: "5", startTime: "11:30", endTime: "12:15" },
  { id: "6", period: "6", startTime: "12:15", endTime: "1:00" },
  { id: "7", period: "7", startTime: "2:00", endTime: "2:45" },
  { id: "8", period: "8", startTime: "2:45", endTime: "3:30" },
];

const weekDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

// Mock timetable data for Class 10 A
const mockTimetable: Record<string, Record<string, { subjectId: string; teacherId: string } | null>> = {
  "1": { Monday: { subjectId: "1", teacherId: "TCH001" }, Tuesday: { subjectId: "2", teacherId: "TCH002" }, Wednesday: { subjectId: "1", teacherId: "TCH001" }, Thursday: { subjectId: "3", teacherId: "TCH004" }, Friday: { subjectId: "4", teacherId: "TCH001" } },
  "2": { Monday: { subjectId: "2", teacherId: "TCH002" }, Tuesday: { subjectId: "1", teacherId: "TCH001" }, Wednesday: { subjectId: "4", teacherId: "TCH001" }, Thursday: { subjectId: "1", teacherId: "TCH001" }, Friday: { subjectId: "2", teacherId: "TCH002" } },
  "3": { Monday: { subjectId: "3", teacherId: "TCH004" }, Tuesday: { subjectId: "4", teacherId: "TCH001" }, Wednesday: { subjectId: "2", teacherId: "TCH002" }, Thursday: { subjectId: "5", teacherId: "TCH003" }, Friday: { subjectId: "3", teacherId: "TCH004" } },
  "4": { Monday: { subjectId: "5", teacherId: "TCH003" }, Tuesday: { subjectId: "3", teacherId: "TCH004" }, Wednesday: { subjectId: "5", teacherId: "TCH003" }, Thursday: { subjectId: "2", teacherId: "TCH002" }, Friday: { subjectId: "4", teacherId: "TCH001" } },
  "5": { Monday: { subjectId: "6", teacherId: "TCH003" }, Tuesday: { subjectId: "5", teacherId: "TCH003" }, Wednesday: { subjectId: "6", teacherId: "TCH003" }, Thursday: { subjectId: "7", teacherId: "TCH004" }, Friday: { subjectId: "9", teacherId: "TCH005" } },
  "6": { Monday: null, Tuesday: null, Wednesday: null, Thursday: null, Friday: null }, // Lunch break
  "7": { Monday: { subjectId: "8", teacherId: "TCH004" }, Tuesday: { subjectId: "9", teacherId: "TCH005" }, Wednesday: { subjectId: "7", teacherId: "TCH004" }, Thursday: { subjectId: "6", teacherId: "TCH003" }, Friday: { subjectId: "10", teacherId: "TCH004" } },
  "8": { Monday: { subjectId: "9", teacherId: "TCH005" }, Tuesday: { subjectId: "10", teacherId: "TCH004" }, Wednesday: { subjectId: "9", teacherId: "TCH005" }, Thursday: { subjectId: "3", teacherId: "TCH004" }, Friday: { subjectId: "1", teacherId: "TCH001" } },
};

export default function TimetablePage() {
  const [selectedClass, setSelectedClass] = useState(classes[0]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCell, setEditingCell] = useState<{ periodId: string; day: string } | null>(null);

  const getSubjectById = (id: string) => subjects.find((s) => s.id === id);
  const getTeacherById = (id: string) => teachers.find((t) => t.id === id);

  const handleCellClick = (periodId: string, day: string) => {
    setEditingCell({ periodId, day });
    setShowCreateModal(true);
  };

  const getCellContent = (periodId: string, day: string) => {
    const cell = mockTimetable[periodId]?.[day];
    if (!cell) return null;

    const subject = getSubjectById(cell.subjectId);
    const teacher = getTeacherById(cell.teacherId);

    return { subject, teacher };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Timetable Management</h1>
          <p className="text-gray-600 mt-1">Create and manage class timetables</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
          <Button variant="outline">
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
                    selectedClass.id === cls.id
                      ? "text-white shadow-md"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                  style={
                    selectedClass.id === cls.id
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
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-violet-600" />
                Weekly Timetable - {selectedClass.name}
              </CardTitle>
              <CardDescription>Academic Year 2025</CardDescription>
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
            {subjects.map((subject) => (
              <Badge key={subject.id} className={subject.color} variant="outline">
                {subject.code}
              </Badge>
            ))}
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
                {timeSlots.map((slot) => (
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
                      const cell = getCellContent(slot.id, day);
                      const isBreak = slot.period === "6";

                      return (
                        <td key={day} className="py-2 px-2">
                          {isBreak ? (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 text-center">
                              <p className="text-sm font-medium text-yellow-700">Lunch Break</p>
                            </div>
                          ) : cell ? (
                            <button
                              onClick={() => handleCellClick(slot.id, day)}
                              className={`w-full text-left rounded-lg p-2 border transition-all hover:shadow-md ${
                                cell.subject?.color || "border-gray-200"
                              }`}
                            >
                              <p className="font-medium text-sm">{cell.subject?.name}</p>
                              <p className="text-xs opacity-75">{cell.teacher?.name}</p>
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
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

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
                      {subject.name} ({subject.code})
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
                      {teacher.name} ({teacher.subjects.join(", ")})
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
