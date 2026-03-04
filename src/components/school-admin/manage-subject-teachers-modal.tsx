/**
 * MANAGE SUBJECT TEACHERS MODAL (PREMIUM)
 *
 * Modern grid-based interface for assigning teachers to subjects
 * Features:
 * - Inline editable teacher assignment
 * - Schedule/timing editing per subject
 * - Role selection (Primary/Subject Teacher/Substitute)
 * - Batch operations
 */

"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { InlineEdit } from "@/components/ui/inline-edit";
import {
  X,
  Loader2,
  Check,
  AlertCircle,
  UserPlus,
  Trash2,
  BookOpen,
  Clock,
  Users,
  RefreshCw,
  MoreVertical,
  Star,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface Subject {
  id: string;
  name: string;
  code: string;
  type: string;
  grade: number | null;
}

interface Teacher {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  employeeId: string | null;
}

interface SubjectSchedule {
  id: string;
  subjectId: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  roomNumber: string | null;
}

interface SubjectTeacherAssignment {
  id: string;
  teacherId: string;
  subjectId: string;
  classId: string;
  role: string;
  isPrimary: boolean;
  academicYear: string;
  teacher: Teacher;
  subject: Subject;
}

interface SubjectWithTeachers {
  id: string;
  name: string;
  code: string;
  type: string;
  grade: number | null;
  schoolId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  assignedTeachers: SubjectTeacherAssignment[];
  schedule?: SubjectSchedule[];
}

interface ClassInfo {
  id: string;
  name: string | null;
  grade: number;
  section: string;
  academicYear: string | null;
}

interface ManageSubjectTeachersModalProps {
  classId: string;
  classInfo: ClassInfo;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const DAYS_OF_WEEK = [
  { value: "monday", label: "Mon" },
  { value: "tuesday", label: "Tue" },
  { value: "wednesday", label: "Wed" },
  { value: "thursday", label: "Thu" },
  { value: "friday", label: "Fri" },
  { value: "saturday", label: "Sat" },
];

const TIME_SLOTS = [
  "08:00", "08:45", "09:30", "10:15", "11:00", "11:45",
  "12:30", "13:15", "14:00", "14:45", "15:30", "16:15"
];

export function ManageSubjectTeachersModal({
  classId,
  classInfo,
  isOpen,
  onClose,
  onSuccess,
}: ManageSubjectTeachersModalProps) {
  const [subjectsWithTeachers, setSubjectsWithTeachers] = useState<SubjectWithTeachers[]>([]);
  const [allTeachers, setAllTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
  const [pendingTeacherId, setPendingTeacherId] = useState<string>("");

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, classId]);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/school-admin/classes/${classId}/subject-teachers`);
      const result = await res.json();

      if (!res.ok || !result.data) {
        throw new Error(result.error || "Failed to load data");
      }

      setSubjectsWithTeachers(result.data.subjectsWithTeachers);
      setAllTeachers(result.data.allTeachers);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignTeacher = async (subjectId: string) => {
    if (!pendingTeacherId) {
      setError("Please select a teacher");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/school-admin/classes/${classId}/subject-teachers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teacherId: pendingTeacherId,
          subjectId,
          role: "subject_teacher",
          isPrimary: false,
        }),
      });

      const result = await res.json();

      if (!res.ok || !result.data) {
        throw new Error(result.error || "Failed to assign teacher");
      }

      setSuccess("Teacher assigned successfully");
      setPendingTeacherId("");
      setEditingSubjectId(null);
      await loadData();

      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to assign teacher");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveTeacher = async (subjectId: string, teacherId: string) => {
    setIsSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/school-admin/classes/${classId}/subject-teachers`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subjectId, teacherId }),
      });

      const result = await res.json();

      if (!res.ok || !result.data) {
        throw new Error(result.error || "Failed to remove teacher");
      }

      setSuccess("Teacher removed successfully");
      await loadData();

      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove teacher");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateSchedule = async (subjectId: string, field: string, value: string) => {
    setIsSaving(true);
    try {
      // TODO: Implement schedule update API
      console.log("Update schedule:", subjectId, field, value);
      setIsSaving(false);
    } catch (err) {
      setIsSaving(false);
    }
  };

  const getTeacherDisplayName = (teacher: Teacher) => {
    if (teacher.firstName && teacher.lastName) {
      return `${teacher.firstName} ${teacher.lastName}`;
    }
    return teacher.email || "Unknown";
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Premium Header */}
        <div className="bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Subject Teachers</h2>
                <p className="text-violet-100 text-sm">
                  Grade {classInfo.grade} • Section {classInfo.section}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={loadData}
                disabled={isLoading || isSaving}
                className="text-white/80 hover:text-white hover:bg-white/10"
              >
                <RefreshCw className={cn("w-5 h-5", isLoading && "animate-spin")} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                disabled={isSaving}
                className="text-white/80 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <Loader2 className="w-10 h-10 animate-spin text-violet-600 mx-auto mb-4" />
                <p className="text-gray-500">Loading subject data...</p>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-10">
              <AlertCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
              <p className="text-red-600 font-medium">{error}</p>
              <Button variant="outline" className="mt-4" onClick={loadData}>
                Retry
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Success Message */}
              {success && (
                <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
                  <Check className="w-5 h-5 text-green-600" />
                  <p className="text-green-700 font-medium">{success}</p>
                </div>
              )}

              {subjectsWithTeachers.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 rounded-2xl">
                  <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">No subjects configured</h3>
                  <p className="text-gray-500 mb-6">
                    Add subjects for Grade {classInfo.grade} to manage teacher assignments
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      window.location.href = "/school-admin/subjects";
                    }}
                  >
                    <BookOpen className="w-4 h-4 mr-2" />
                    Go to Subjects
                  </Button>
                </div>
              ) : (
                /* Premium Grid Table */
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                  {/* Table Header */}
                  <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <div className="col-span-3">Subject</div>
                    <div className="col-span-3">Teacher</div>
                    <div className="col-span-2">Role</div>
                    <div className="col-span-2">Schedule</div>
                    <div className="col-span-2 text-right">Actions</div>
                  </div>

                  {/* Table Rows */}
                  {subjectsWithTeachers.map((subject, index) => (
                    <div
                      key={subject.id}
                      className={cn(
                        "grid grid-cols-12 gap-4 px-6 py-4 items-center border-b border-gray-100 transition-colors",
                        index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                      )}
                    >
                      {/* Subject Column */}
                      <div className="col-span-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                            {subject.code.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{subject.name}</p>
                            <p className="text-xs text-gray-500">{subject.code}</p>
                          </div>
                        </div>
                      </div>

                      {/* Teacher Column */}
                      <div className="col-span-3">
                        {subject.assignedTeachers.length > 0 ? (
                          <div className="flex items-center gap-2">
                            {subject.assignedTeachers.slice(0, 2).map((assignment) => (
                              <div
                                key={assignment.id}
                                className="flex items-center gap-2 px-2 py-1.5 bg-violet-50 rounded-lg group relative"
                              >
                                <div className="w-7 h-7 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 text-xs font-medium">
                                  {assignment.teacher.firstName?.[0] || assignment.teacher.email?.[0]}
                                </div>
                                <span className="text-sm font-medium text-gray-700">
                                  {assignment.teacher.firstName} {assignment.teacher.lastName?.[0]}.
                                </span>
                                {assignment.isPrimary && (
                                  <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                                )}
                                <button
                                  onClick={() => handleRemoveTeacher(subject.id, assignment.teacherId)}
                                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                            {subject.assignedTeachers.length > 2 && (
                              <span className="text-xs text-gray-500">
                                +{subject.assignedTeachers.length - 2} more
                              </span>
                            )}
                          </div>
                        ) : editingSubjectId === subject.id ? (
                          <select
                            value={pendingTeacherId}
                            onChange={(e) => setPendingTeacherId(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-violet-500"
                            autoFocus
                          >
                            <option value="">Select teacher...</option>
                            {allTeachers.map((teacher) => (
                              <option key={teacher.id} value={teacher.id}>
                                {getTeacherDisplayName(teacher)}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <button
                            onClick={() => setEditingSubjectId(subject.id)}
                            className="flex items-center gap-2 text-sm text-gray-400 hover:text-violet-600 transition-colors px-2 py-1.5 rounded-lg hover:bg-violet-50"
                          >
                            <UserPlus className="w-4 h-4" />
                            <span>Assign</span>
                          </button>
                        )}
                      </div>

                      {/* Role Column */}
                      <div className="col-span-2">
                        {subject.assignedTeachers.length > 0 && (
                          <Badge
                            variant={subject.assignedTeachers[0].isPrimary ? "default" : "secondary"}
                            className={cn(
                              "text-xs",
                              subject.assignedTeachers[0].isPrimary
                                ? "bg-amber-100 text-amber-700 hover:bg-amber-100"
                                : "bg-gray-100 text-gray-600"
                            )}
                          >
                            {subject.assignedTeachers[0].isPrimary ? (
                              <span className="flex items-center gap-1">
                                <Star className="w-3 h-3 fill-current" />
                                Primary
                              </span>
                            ) : (
                              "Teacher"
                            )}
                          </Badge>
                        )}
                      </div>

                      {/* Schedule Column */}
                      <div className="col-span-2">
                        <button className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-violet-600 transition-colors px-2 py-1.5 rounded-lg hover:bg-violet-50">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Set Time</span>
                        </button>
                      </div>

                      {/* Actions Column */}
                      <div className="col-span-2 text-right">
                        {editingSubjectId === subject.id ? (
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setEditingSubjectId(null);
                                setPendingTeacherId("");
                              }}
                              disabled={isSaving}
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleAssignTeacher(subject.id)}
                              disabled={isSaving || !pendingTeacherId}
                              className="bg-violet-600 hover:bg-violet-700"
                            >
                              {isSaving ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Check className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        ) : (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setEditingSubjectId(subject.id)}>
                                <UserPlus className="w-4 h-4 mr-2" />
                                Add Teacher
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Clock className="w-4 h-4 mr-2" />
                                Set Schedule
                              </DropdownMenuItem>
                              {subject.assignedTeachers.length > 0 && (
                                <DropdownMenuItem
                                  onClick={() => handleRemoveTeacher(subject.id, subject.assignedTeachers[0].teacherId)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Remove Teacher
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Summary Footer */}
              {subjectsWithTeachers.length > 0 && (
                <div className="mt-6 flex items-center justify-between p-4 bg-gradient-to-r from-violet-50 to-purple-50 rounded-xl border border-violet-100">
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-violet-600" />
                      <span className="text-sm text-gray-700">
                        <strong className="text-gray-900">
                          {subjectsWithTeachers.reduce((sum, s) => sum + s.assignedTeachers.length, 0)}
                        </strong>{" "}
                        teacher{subjectsWithTeachers.reduce((sum, s) => sum + s.assignedTeachers.length, 0) !== 1 ? "s" : ""} assigned
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-violet-600" />
                      <span className="text-sm text-gray-700">
                        <strong className="text-gray-900">
                          {subjectsWithTeachers.filter(s => s.assignedTeachers.length > 0).length}
                        </strong>{" "}
                        of {subjectsWithTeachers.length} subjects covered
                      </span>
                    </div>
                  </div>
                  <Button onClick={onClose} disabled={isSaving} className="bg-violet-600 hover:bg-violet-700">
                    Done
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
