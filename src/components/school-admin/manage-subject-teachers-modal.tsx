/**
 * MANAGE SUBJECT TEACHERS MODAL
 *
 * Allows school admin to assign teachers to specific subjects for a class
 * Shows all grade-level subjects and allows selecting a teacher for each
 */

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  X,
  Loader2,
  Check,
  AlertCircle,
  UserPlus,
  UserMinus,
  BookOpen,
  Users,
  RefreshCw,
} from "lucide-react";

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
  const [pendingRemovals, setPendingRemovals] = useState<Set<string>>(new Set());
  const [assigningSubjectId, setAssigningSubjectId] = useState<string | null>(null);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("");

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
    if (!selectedTeacherId) {
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
          teacherId: selectedTeacherId,
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
      setSelectedTeacherId("");
      setAssigningSubjectId(null);
      await loadData();

      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to assign teacher");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveTeacher = async (subjectId: string, teacherId: string) => {
    if (!confirm("Are you sure you want to remove this teacher from this subject?")) {
      return;
    }

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Manage Subject Teachers</CardTitle>
              <CardDescription>
                Grade {classInfo.grade} - Section {classInfo.section}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={loadData}
                disabled={isLoading || isSaving}
                title="Refresh teacher list"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose} disabled={isSaving}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto pt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
            </div>
          ) : error ? (
            <div className="text-center py-10">
              <AlertCircle className="w-12 h-12 mx-auto text-red-500 mb-3" />
              <p className="text-red-600">{error}</p>
              <Button variant="outline" className="mt-4" onClick={loadData}>
                Retry
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {success && (
                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700">
                  <Check className="w-4 h-4" />
                  <p>{success}</p>
                </div>
              )}

              {subjectsWithTeachers.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                  <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="mb-4">No subjects configured for Grade {classInfo.grade}</p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      window.location.href = "/school-admin/subjects";
                    }}
                  >
                    Go to Subjects Management
                  </Button>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {subjectsWithTeachers.map((subject) => (
                    <Card key={subject.id} className="border-gray-200">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-base">{subject.name}</CardTitle>
                            <CardDescription className="text-xs">
                              {subject.code} • {subject.type}
                            </CardDescription>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            Grade {subject.grade}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {/* Assigned Teachers */}
                        {subject.assignedTeachers.length > 0 ? (
                          <div className="space-y-2">
                            <p className="text-xs text-gray-500 font-medium">Assigned Teachers:</p>
                            {subject.assignedTeachers.map((assignment) => (
                              <div
                                key={assignment.id}
                                className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                              >
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 bg-violet-100 rounded-full flex items-center justify-center text-xs font-medium text-violet-600">
                                    {assignment.teacher.firstName?.[0]}
                                    {assignment.teacher.lastName?.[0]}
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium">
                                      {assignment.teacher.firstName} {assignment.teacher.lastName}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {assignment.teacher.employeeId || "No Employee ID"}
                                    </p>
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => handleRemoveTeacher(subject.id, assignment.teacherId)}
                                  disabled={isSaving}
                                >
                                  <UserMinus className="w-4 h-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 text-center py-2">
                            No teachers assigned
                          </p>
                        )}

                        {/* Assign Teacher Form */}
                        {assigningSubjectId === subject.id ? (
                          <div className="space-y-2 pt-2 border-t">
                            <label className="text-xs font-medium text-gray-700">
                              Select Teacher:
                            </label>
                            <select
                              value={selectedTeacherId}
                              onChange={(e) => setSelectedTeacherId(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                              disabled={isSaving}
                            >
                              <option value="">Select a teacher...</option>
                              {allTeachers.map((teacher) => {
                                const displayName = teacher.firstName && teacher.lastName
                                  ? `${teacher.firstName} ${teacher.lastName}`
                                  : teacher.firstName || teacher.email || "Unknown Teacher";
                                return (
                                  <option key={teacher.id} value={teacher.id}>
                                    {displayName}{teacher.employeeId ? ` (${teacher.employeeId})` : ""}
                                  </option>
                                );
                              })}
                            </select>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                className="flex-1 bg-violet-600 hover:bg-violet-700"
                                onClick={() => handleAssignTeacher(subject.id)}
                                disabled={isSaving || !selectedTeacherId}
                              >
                                {isSaving ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <>
                                    <Check className="w-4 h-4 mr-1" />
                                    Assign
                                  </>
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setAssigningSubjectId(null);
                                  setSelectedTeacherId("");
                                }}
                                disabled={isSaving}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => setAssigningSubjectId(subject.id)}
                            disabled={isSaving}
                          >
                            <UserPlus className="w-4 h-4 mr-2" />
                            Assign Teacher
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>

        <div className="border-t p-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {subjectsWithTeachers.reduce((sum, s) => sum + s.assignedTeachers.length, 0)} teacher
              {subjectsWithTeachers.reduce((sum, s) => sum + s.assignedTeachers.length, 0) !== 1 ? "s" : ""} assigned
            </p>
            <Button variant="outline" onClick={onClose} disabled={isSaving}>
              Close
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
