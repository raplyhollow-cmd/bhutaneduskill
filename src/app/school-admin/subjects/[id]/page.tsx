/**
 * SCHOOL ADMIN - SUBJECT DETAIL PAGE
 *
 * Shows:
 * - Subject information
 * - Assigned teachers for this subject
 * - Classes that have this subject (by grade)
 * - Assign/Remove teachers
 */

"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  BookOpen,
  Users,
  GraduationCap,
  Plus,
  Trash2,
  Check,
  AlertCircle,
  Loader2,
  Edit,
  School,
} from "lucide-react";
import Link from "next/link";
import { SubjectTeacherDropdown } from "@/components/school-admin/subject-teacher-dropdown";

interface Subject {
  id: string;
  name: string;
  code: string;
  type: string;
  grade: number | null;
  description: string | null;
  isActive: boolean;
  schoolId: string;
}

interface Teacher {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  employeeId: string | null;
}

interface AssignedTeacher {
  id: string;
  teacherId: string;
  role: string;
  isPrimary: boolean;
  academicYear: string;
  teacher: Teacher;
  assignedClasses: GradeClass[];
}

interface GradeClass {
  id: string;
  name: string;
  grade: number;
  section: string;
  academicYear: string;
}

interface SubjectDetailData {
  subject: Subject;
  assignedTeachers: AssignedTeacher[];
  gradeClasses: GradeClass[];
  availableTeachers: Teacher[];
}

export default function SubjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id: subjectId } = use(params);

  const [data, setData] = useState<SubjectDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAssigning, setIsAssigning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedTeacherIds, setSelectedTeacherIds] = useState<string[]>([]);

  // Handler for inline teacher assignment
  const handleInlineAssign = async (teacherId: string, classIds: string[], isAllClasses: boolean) => {
    if (isAllClasses) {
      // Assign to all classes - create one assignment without specific class
      const res = await fetch(`/api/school-admin/subjects/${subjectId}/teachers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teacherId,
          role: "subject_expert",
          isPrimary: assignedTeachers.length === 0,
        }),
      });
      const result = await res.json();
      return res.ok && result.success;
    } else {
      // Assign to specific classes - create multiple assignments
      const promises = classIds.map((classId) =>
        fetch(`/api/school-admin/subjects/${subjectId}/teachers`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            teacherId,
            role: "subject_expert",
            classId,
            isPrimary: assignedTeachers.length === 0 && classId === classIds[0],
          }),
        })
      );
      const results = await Promise.all(promises);
      return results.every((res) => res.ok);
    }
  };

  // Handler for inline teacher removal
  const handleInlineRemove = async (teacherId: string) => {
    const res = await fetch(`/api/school-admin/subjects/${subjectId}/teachers`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teacherId }),
    });
    const result = await res.json();
    if (res.ok && result.success) {
      setSuccess("Teacher removed successfully");
      await loadSubjectDetail();
      setTimeout(() => setSuccess(null), 2000);
    }
    return res.ok && result.success;
  };

  useEffect(() => {
    loadSubjectDetail();
  }, [subjectId]);

  const loadSubjectDetail = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/school-admin/subjects/${subjectId}`);
      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.error || "Failed to load subject");
      }

      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignTeachers = async () => {
    if (selectedTeacherIds.length === 0) {
      setError("Please select at least one teacher");
      return;
    }

    setIsAssigning(true);
    setError(null);

    try {
      // Assign each teacher
      const promises = selectedTeacherIds.map((teacherId) =>
        fetch(`/api/school-admin/subjects/${subjectId}/teachers`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            teacherId,
            role: "subject_expert",
            isPrimary: selectedTeacherIds.length === 1, // First teacher is primary
          }),
        })
      );

      const results = await Promise.all(promises);
      const allSuccessful = results.every((res) => res.ok);

      if (!allSuccessful) {
        throw new Error("Failed to assign some teachers");
      }

      setSuccess(`${selectedTeacherIds.length} teacher(s) assigned successfully`);
      setSelectedTeacherIds([]);
      setIsAssignModalOpen(false);
      await loadSubjectDetail();

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to assign teachers");
    } finally {
      setIsAssigning(false);
    }
  };

  const handleRemoveTeacher = async (teacherId: string) => {
    if (!confirm("Are you sure you want to remove this teacher from this subject?")) {
      return;
    }

    try {
      const res = await fetch(`/api/school-admin/subjects/${subjectId}/teachers`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacherId }),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.error || "Failed to remove teacher");
      }

      setSuccess("Teacher removed successfully");
      await loadSubjectDetail();

      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove teacher");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-20">
        <AlertCircle className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Subject Not Found</h2>
        <Button variant="outline" asChild>
          <Link href="/school-admin/subjects">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Subjects
          </Link>
        </Button>
      </div>
    );
  }

  const { subject, assignedTeachers, gradeClasses, availableTeachers } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/school-admin/subjects">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Subjects
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-violet-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-violet-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{subject.name}</h1>
                <p className="text-gray-500">{subject.code}</p>
              </div>
            </div>
          </div>
        </div>
        <Badge className={subject.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}>
          {subject.isActive ? "Active" : "Inactive"}
        </Badge>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-green-600">
              <Check className="w-5 h-5" />
              <p>{success}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-red-600">
              <AlertCircle className="w-5 h-5" />
              <p>{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Subject Details & Teachers */}
        <div className="lg:col-span-2 space-y-6">
          {/* Subject Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Subject Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Subject Name</p>
                  <p className="font-medium text-gray-900">{subject.name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Subject Code</p>
                  <p className="font-medium text-gray-900">{subject.code}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Grade Level</p>
                  <p className="font-medium text-gray-900">Grade {subject.grade || "All"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Type</p>
                  <Badge variant="outline" className="capitalize">
                    {subject.type}
                  </Badge>
                </div>
              </div>
              {subject.description && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Description</p>
                  <p className="text-gray-700">{subject.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Assigned Teachers */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Assigned Teachers
                  </CardTitle>
                  <CardDescription>
                    {assignedTeachers.length} teacher(s) assigned to this subject
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {assignedTeachers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="mb-4">No teachers assigned to this subject yet</p>
                  <SubjectTeacherDropdown
                    subjectId={subjectId}
                    subjectName={subject.name}
                    assignedTeachers={assignedTeachers}
                    allClasses={gradeClasses}
                    availableTeachers={availableTeachers}
                    onAssign={handleInlineAssign}
                    onRemove={handleInlineRemove}
                    onRefresh={loadSubjectDetail}
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">Click on a teacher to manage their class assignments:</p>
                  <SubjectTeacherDropdown
                    subjectId={subjectId}
                    subjectName={subject.name}
                    assignedTeachers={assignedTeachers}
                    allClasses={gradeClasses}
                    availableTeachers={availableTeachers}
                    onAssign={handleInlineAssign}
                    onRemove={handleInlineRemove}
                    onRefresh={loadSubjectDetail}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Classes & Stats */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Assigned Teachers</span>
                <span className="font-semibold text-gray-900">{assignedTeachers.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Grade {subject.grade} Classes</span>
                <span className="font-semibold text-gray-900">{gradeClasses.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Status</span>
                <Badge className={subject.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}>
                  {subject.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Classes for this Grade */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5" />
                Grade {subject.grade} Classes
              </CardTitle>
              <CardDescription>
                Classes that teach this subject
              </CardDescription>
            </CardHeader>
            <CardContent>
              {gradeClasses.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  No classes found for Grade {subject.grade}
                </p>
              ) : (
                <div className="space-y-2">
                  {gradeClasses.map((cls) => (
                    <Link
                      key={cls.id}
                      href={`/school-admin/classes/${cls.id}`}
                      className="block p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{cls.name}</p>
                          <p className="text-xs text-gray-500">Section {cls.section}</p>
                        </div>
                        <School className="w-4 h-4 text-gray-400" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Assign Teachers Modal */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Assign Teachers to {subject.name}</CardTitle>
              <CardDescription>
                Select teachers who can teach this subject
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {availableTeachers.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  All available teachers are already assigned to this subject.
                </p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {availableTeachers.map((teacher) => (
                    <label
                      key={teacher.id}
                      className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedTeacherIds.includes(teacher.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTeacherIds([...selectedTeacherIds, teacher.id]);
                          } else {
                            setSelectedTeacherIds(
                              selectedTeacherIds.filter((id) => id !== teacher.id)
                            );
                          }
                        }}
                        className="w-4 h-4 text-violet-600 rounded focus:ring-violet-500"
                      />
                      <div className="w-8 h-8 bg-violet-100 rounded-full flex items-center justify-center">
                        <span className="text-violet-600 font-medium text-xs">
                          {teacher.firstName?.[0]}
                          {teacher.lastName?.[0]}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {teacher.firstName} {teacher.lastName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {teacher.employeeId || "No Employee ID"}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              )}

              {selectedTeacherIds.length > 0 && (
                <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                  <p className="font-medium">{selectedTeacherIds.length} teacher(s) selected</p>
                </div>
              )}

              {error && (
                <div className="text-sm text-red-600 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setIsAssignModalOpen(false);
                    setSelectedTeacherIds([]);
                    setError(null);
                  }}
                  disabled={isAssigning}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAssignTeachers}
                  disabled={isAssigning || selectedTeacherIds.length === 0}
                  className="flex-1 bg-violet-600 hover:bg-violet-700"
                >
                  {isAssigning ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Assigning...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Assign {selectedTeacherIds.length > 0 && `(${selectedTeacherIds.length})`}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
