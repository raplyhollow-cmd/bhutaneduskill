/**
 * SCHOOL ADMIN - SUBJECTS MANAGEMENT
 *
 * - Starts blank (only shows school's own subjects)
 * - Add Subject button opens dropdown with global templates
 * - "Add Custom Subject" option at end for manual entry
 * - NEW: Hierarchical view grouped by grade with inline editing
 * - NEW: Teacher assignment and management per subject
 */

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Plus,
  Search,
  Edit,
  Trash2,
  Loader2,
  Check,
  AlertCircle,
  ChevronDown,
  Users,
  UserPlus,
  X,
  GraduationCap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  fetchSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
  type SubjectFormData,
} from "../_actions";
import { SubjectsGrid } from "./components/subjects-grid";
import type { Subject } from "@/lib/grouping";

// Extend Subject with additional properties for this page
interface SubjectWithTeachers extends Subject {
  assignedTeachers?: TeacherAssignment[];
}

interface GlobalSubject {
  id: string;
  code: string;
  name: string;
  type: string;
  grade: number | null;
  description: string | null;
}

interface Teacher {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  employeeId: string | null;
}

interface TeacherAssignment {
  id: string;
  teacherId: string;
  role: string;
  isPrimary: boolean;
  classId: string | null;
  academicYear: string;
  teacher: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    employeeId: string | null;
  };
  class?: {
    id: string;
    name: string;
    grade: number;
    section: string;
  } | null;
}

const gradeOptions = [6, 7, 8, 9, 10, 11, 12];
const subjectTypes = [
  { value: "core", label: "Core Subject" },
  { value: "elective", label: "Elective" },
  { value: "optional", label: "Optional" },
];

export default function SchoolAdminSubjectsPage() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<SubjectWithTeachers[]>([]);
  const [globalSubjects, setGlobalSubjects] = useState<GlobalSubject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Dropdown state
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  // Track selected subject-grade combinations for multi-select
  const [selectedSubjectGrades, setSelectedSubjectGrades] = useState<Set<string>>(new Set());

  // Edit states
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState<Subject | null>(null);

  // Teacher assignment states
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [teacherAssignments, setTeacherAssignments] = useState<Record<string, TeacherAssignment[]>>({});
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [selectedSubjectForTeacher, setSelectedSubjectForTeacher] = useState<Subject | null>(null);
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [selectedRole, setSelectedRole] = useState<"subject_expert" | "substitute" | "homeroom">("subject_expert");
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [isPrimary, setIsPrimary] = useState(false);
  const [classes, setClasses] = useState<{ id: string; name: string; grade: number; section: string }[]>([]);

  // Form state for custom subject
  const [formData, setFormData] = useState<SubjectFormData>({
    name: "",
    code: "",
    type: "core",
    grade: 6,
    description: "",
  });

  // Fetch school subjects and global templates on mount
  useEffect(() => {
    loadSchoolSubjects();
    loadGlobalSubjects();
    loadTeachers();
    loadClasses();
  }, []);

  const loadSchoolSubjects = async () => {
    setIsLoading(true);
    const result = await fetchSubjects({ limit: 100 });
    const loadedSubjects = result.subjects as SubjectWithTeachers[];
    setSubjects(loadedSubjects);
    // Load teachers for each subject
    await loadTeachersForSubjects(loadedSubjects);
    setIsLoading(false);
  };

  const loadGlobalSubjects = async () => {
    try {
      const res = await fetch("/api/subjects/global");
      const json = await res.json();
      // API returns { data: { subjects: [...] } }
      setGlobalSubjects(json.data?.subjects || []);
    } catch (err) {
      console.error("Failed to load global subjects:", err);
    }
  };

  const loadTeachers = async () => {
    try {
      const res = await fetch("/api/school-admin/teachers");
      const json = await res.json();
      if (json.data) {
        setTeachers(json.data?.teachers || []);
      }
    } catch (err) {
      console.error("Failed to load teachers:", err);
    }
  };

  const loadClasses = async () => {
    try {
      const res = await fetch("/api/school-admin/classes");
      const json = await res.json();
      if (json.data) {
        setClasses(json.data?.classes || []);
      }
    } catch (err) {
      console.error("Failed to load classes:", err);
    }
  };

  const loadTeachersForSubjects = async (subjectList: SubjectWithTeachers[]) => {
    if (subjectList.length === 0) {
      setTeacherAssignments({});
      return;
    }

    try {
      // Use batch endpoint - single API call for all subjects
      const subjectIds = subjectList.map((s) => s.id).join(",");
      const res = await fetch(`/api/school-admin/subjects/teachers-batch?subjectIds=${subjectIds}`);
      const json = await res.json();
      if (json.data) {
        setTeacherAssignments(json.data?.assignments || {});
      }
    } catch (err) {
      console.error("Failed to load teachers for subjects:", err);
      setTeacherAssignments({});
    }
  };

  const refreshSubjectTeachers = async (subjectId: string) => {
    try {
      const res = await fetch(`/api/school-admin/subjects/${subjectId}/teachers`);
      const json = await res.json();
      if (json.data) {
        setTeacherAssignments(prev => ({
          ...prev,
          [subjectId]: json.data?.assignments || []
        }));
      }
    } catch (err) {
      console.error(`Failed to refresh teachers for subject ${subjectId}:`, err);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: "",
      code: "",
      type: "core",
      grade: 6,
      description: "",
    });
    setError(null);
    setSuccess(null);
  };

  // Toggle subject-grade selection
  const toggleSubjectGrade = (global: GlobalSubject) => {
    const key = `${global.id}-${global.grade}`;
    const newSelected = new Set(selectedSubjectGrades);
    if (newSelected.has(key)) {
      newSelected.delete(key);
    } else {
      newSelected.add(key);
    }
    setSelectedSubjectGrades(newSelected);
  };

  // Add all selected subjects
  const addSelectedSubjects = async () => {
    if (selectedSubjectGrades.size === 0) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Find the selected global subjects
      const selectedGlobals = globalSubjects.filter(g =>
        selectedSubjectGrades.has(`${g.id}-${g.grade}`)
      );

      let successCount = 0;
      let failCount = 0;

      for (const global of selectedGlobals) {
        const result = await createSubject({
          name: global.name,
          code: `${global.code}-${global.grade}`,
          type: global.type as "core" | "elective" | "optional",
          grade: global.grade || undefined,
          description: global.description || undefined,
        });

        if (result.success) {
          successCount++;
        } else {
          failCount++;
        }
      }

      // Clear selection and close dropdown
      setSelectedSubjectGrades(new Set());
      setIsDropdownOpen(false);

      await loadSchoolSubjects();

      if (failCount === 0) {
        setSuccess(`Added ${successCount} subject(s) successfully!`);
      } else {
        setSuccess(`Added ${successCount} subject(s). ${failCount} failed.`);
      }
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle custom subject submission
  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      const result = await createSubject({
        name: formData.name,
        code: formData.code,
        type: formData.type,
        grade: formData.grade,
        description: formData.description,
      });

      if (result.success) {
        setSuccess("Custom subject created successfully!");
        setIsCustomModalOpen(false);
        resetForm();
        await loadSchoolSubjects();
        setTimeout(() => setSuccess(null), 2000);
      } else {
        setError(result.error || "Failed to create subject");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle update
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      if (!editingSubject) return;

      const result = await updateSubject(editingSubject.id, {
        name: formData.name,
        code: formData.code,
        type: formData.type,
        grade: formData.grade,
        description: formData.description,
      });

      if (result.success) {
        setSuccess("Subject updated successfully!");
        setEditingSubject(null);
        resetForm();
        await loadSchoolSubjects();
        setTimeout(() => setSuccess(null), 2000);
      } else {
        setError(result.error || "Failed to update subject");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open edit modal
  const openEditModal = (subject: Subject) => {
    setEditingSubject(subject);
    setFormData({
      name: subject.name,
      code: subject.code,
      type: subject.type as "core" | "elective" | "optional",
      grade: subject.grade || undefined,
      description: subject.description || undefined,
    });
    setError(null);
    setSuccess(null);
  };

  // View subject details
  const handleViewSubject = (subject: Subject) => {
    // For now, reuse the edit modal to view details
    // Could be expanded to a read-only view
    openEditModal(subject);
  };

  // Handle delete
  const handleDelete = async () => {
    if (!showDeleteDialog) return;

    setIsSubmitting(true);
    try {
      const result = await deleteSubject(showDeleteDialog.id);
      if (result.success) {
        setSuccess("Subject removed successfully!");
        setShowDeleteDialog(null);
        await loadSchoolSubjects();
        setTimeout(() => setSuccess(null), 2000);
      } else {
        setError(result.error || "Failed to remove subject");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle inline update from SubjectsGrid
  const handleInlineUpdate = async (id: string, field: string, value: string) => {
    const subject = subjects.find(s => s.id === id);
    if (!subject) return;

    setIsSubmitting(true);
    try {
      const updateData: Partial<SubjectFormData> = {};
      if (field === "code") updateData.code = value;
      if (field === "name") updateData.name = value;
      if (field === "teacher") updateData.description = subject.description; // Placeholder for teacher
      if (field === "room") updateData.description = subject.description; // Placeholder for room

      const result = await updateSubject(id, {
        name: field === "name" ? value : subject.name,
        code: field === "code" ? value : subject.code,
        type: subject.type as "core" | "elective" | "optional",
        grade: subject.grade || undefined,
        description: subject.description || undefined,
      });

      if (result.success) {
        await loadSchoolSubjects();
      } else {
        setError(result.error || "Failed to update subject");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================================================
  // TEACHER ASSIGNMENT HANDLERS
  // ============================================================================

  const openTeacherModal = (subject: Subject) => {
    setSelectedSubjectForTeacher(subject);
    setSelectedTeacherId("");
    setSelectedRole("subject_expert");
    setSelectedClassId(null);
    setIsPrimary(false);
    setIsTeacherModalOpen(true);
    setError(null);
  };

  const handleAssignTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubjectForTeacher || !selectedTeacherId) {
      setError("Please select a teacher");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/school-admin/subjects/${selectedSubjectForTeacher.id}/teachers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teacherId: selectedTeacherId,
          role: selectedRole,
          isPrimary,
          classId: selectedClassId,
        }),
      });

      const json = await res.json();
      if (res.ok && json.data) {
        setSuccess(`Teacher assigned to ${selectedSubjectForTeacher.name} successfully!`);
        await refreshSubjectTeachers(selectedSubjectForTeacher.id);
        setIsTeacherModalOpen(false);
        // Reset form
        setSelectedTeacherId("");
        setSelectedRole("subject_expert");
        setSelectedClassId(null);
        setIsPrimary(false);
        setError(null);
        setTimeout(() => setSuccess(null), 2000);
      } else {
        setError(json.error || json.data?.error || "Failed to assign teacher");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to assign teacher");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveTeacher = async (subjectId: string, teacherId: string, classId?: string | null) => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/school-admin/subjects/${subjectId}/teachers`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacherId, classId }),
      });

      const json = await res.json();
      if (res.ok && json.data) {
        setSuccess("Teacher unassigned successfully!");
        await refreshSubjectTeachers(subjectId);
        setTimeout(() => setSuccess(null), 2000);
      } else {
        setError(json.error || json.data?.error || "Failed to unassign teacher");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to unassign teacher");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTeacherName = (teacher: TeacherAssignment["teacher"]) => {
    if (teacher.firstName && teacher.lastName) {
      return `${teacher.firstName} ${teacher.lastName}`;
    }
    return teacher.email;
  };

  // Filter subjects
  const filteredSubjects = subjects.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group global subjects by name for dropdown
  const groupedGlobalSubjects = globalSubjects.reduce((acc, subj) => {
    if (!acc[subj.name]) {
      acc[subj.name] = [];
    }
    acc[subj.name].push(subj);
    return acc;
  }, {} as Record<string, GlobalSubject[]>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Subjects</h1>
          <p className="text-gray-500">{subjects.length} subjects added</p>
        </div>

        {/* Add Subject Dropdown */}
        <div className="relative">
          <Button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="bg-violet-600 hover:bg-violet-700 text-white"
            disabled={isSubmitting}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Subject
            <ChevronDown className="w-4 h-4 ml-2" />
          </Button>

          {isDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
                onClick={() => {
                  setIsDropdownOpen(false);
                  setSelectedSubjectGrades(new Set());
                }}
              />
              <div className="absolute right-0 mt-2 w-[700px] max-h-[520px] z-50 shadow-2xl rounded-xl overflow-hidden">
                {/* Header with Buttons */}
                <div className="bg-white border-b border-gray-200 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">Add Subjects</h3>
                      <p className="text-xs text-gray-500">
                        {selectedSubjectGrades.size > 0
                          ? `${selectedSubjectGrades.size} grade(s) selected`
                          : "Select subjects and grades to add"}
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      {/* Add Selected Button */}
                      <button
                        onClick={addSelectedSubjects}
                        disabled={selectedSubjectGrades.size === 0 || isSubmitting}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          selectedSubjectGrades.size > 0
                            ? "bg-violet-600 text-white hover:bg-violet-700 shadow-md"
                            : "bg-gray-100 text-gray-400 cursor-not-allowed"
                        }`}
                      >
                        {isSubmitting ? (
                          <span className="flex items-center justify-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Adding...
                          </span>
                        ) : (
                          `Add ${selectedSubjectGrades.size > 0 ? `(${selectedSubjectGrades.size}) ` : ""}Selected`
                        )}
                      </button>

                      {/* Add Custom Subject Button */}
                      <button
                        onClick={() => {
                          setIsDropdownOpen(false);
                          setIsCustomModalOpen(true);
                        }}
                        className="px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-violet-400 hover:text-violet-600 hover:bg-violet-50 transition-all font-medium"
                      >
                        + Custom
                      </button>

                      {/* Close Button */}
                      <button
                        onClick={() => {
                          setIsDropdownOpen(false);
                          setSelectedSubjectGrades(new Set());
                        }}
                        className="ml-2 text-gray-400 hover:text-gray-600 transition-colors text-xl"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                </div>

                {/* Scrollable Content */}
                <div className="bg-white overflow-y-auto max-h-[400px] p-4">
                  <div className="grid grid-cols-5 gap-3">
                    {Object.entries(groupedGlobalSubjects).map(([name, grades]) => (
                      <div
                        key={name}
                        className="border border-gray-200 rounded-lg overflow-hidden hover:border-violet-300 hover:shadow-md transition-all"
                      >
                        {/* Subject Header */}
                        <div className="bg-gradient-to-r from-violet-50 to-purple-50 px-3 py-2 border-b border-violet-100">
                          <p className="text-xs font-semibold text-violet-900 truncate" title={name}>{name}</p>
                          <p className="text-xs text-violet-600">{grades.length} grades</p>
                        </div>

                        {/* Grades Grid */}
                        <div className="p-2 bg-white">
                          <div className="grid grid-cols-2 gap-1">
                            {grades.map((g) => {
                              const isSelected = selectedSubjectGrades.has(`${g.id}-${g.grade}`);
                              return (
                                <button
                                  key={g.id}
                                  onClick={() => toggleSubjectGrade(g)}
                                  className={`aspect-square flex items-center justify-center text-xs font-medium rounded transition-all ${
                                    isSelected
                                      ? "bg-violet-600 text-white shadow-md"
                                      : "bg-gray-50 text-gray-700 hover:bg-violet-100 hover:text-violet-700"
                                  }`}
                                >
                                  {g.grade}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
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

      {/* Subjects List - NEW Hierarchical View */}
      {isLoading ? (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-violet-600" />
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Search Bar */}
          {filteredSubjects.length > 0 && (
            <div className="flex items-center gap-4 mb-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search subjects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          )}

          {/* Hierarchical Subjects Grid */}
          <SubjectsGrid
            subjects={filteredSubjects}
            onUpdate={handleInlineUpdate}
            onEdit={openEditModal}
            onDelete={(subject) => setShowDeleteDialog(subject)}
            onView={handleViewSubject}
            teacherAssignments={teacherAssignments}
            onAssignTeacher={openTeacherModal}
            onRemoveTeacher={handleRemoveTeacher}
          />
        </>
      )}

      {/* Custom Subject Modal */}
      {isCustomModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Add Custom Subject</CardTitle>
              <CardDescription>Create a custom subject for your school</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCustomSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="custom-name">Subject Name *</Label>
                  <Input
                    id="custom-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Advanced Mathematics"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="custom-code">Subject Code *</Label>
                  <Input
                    id="custom-code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="e.g., ADV-MATH"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="custom-type">Type *</Label>
                  <select
                    id="custom-type"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as "core" | "elective" | "optional" })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                    required
                  >
                    {subjectTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="custom-grade">Grade Level</Label>
                  <select
                    id="custom-grade"
                    value={formData.grade || ""}
                    onChange={(e) => setFormData({ ...formData, grade: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                  >
                    {gradeOptions.map((grade) => (
                      <option key={grade} value={grade}>
                        Grade {grade}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="custom-description">Description</Label>
                  <textarea
                    id="custom-description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                  />
                </div>

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
                      setIsCustomModalOpen(false);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-violet-600 hover:bg-violet-700"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Subject
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Subject Modal */}
      {editingSubject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Edit Subject</CardTitle>
              <CardDescription>Update subject details</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdate} className="space-y-4">
                <div>
                  <Label htmlFor="edit-name">Subject Name *</Label>
                  <Input
                    id="edit-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="edit-code">Subject Code *</Label>
                  <Input
                    id="edit-code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="edit-type">Type *</Label>
                  <select
                    id="edit-type"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as "core" | "elective" | "optional" })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                    required
                  >
                    {subjectTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="edit-grade">Grade Level</Label>
                  <select
                    id="edit-grade"
                    value={formData.grade || ""}
                    onChange={(e) => setFormData({ ...formData, grade: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                  >
                    <option value="">All Grades</option>
                    {gradeOptions.map((grade) => (
                      <option key={grade} value={grade}>
                        Grade {grade}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="edit-description">Description</Label>
                  <textarea
                    id="edit-description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                  />
                </div>

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
                      setEditingSubject(null);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-violet-600 hover:bg-violet-700"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-sm">
            <CardHeader>
              <CardTitle>Remove Subject</CardTitle>
              <CardDescription>
                Are you sure you want to remove "{showDeleteDialog.name}"?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                This will remove the subject from your school. You can add it back anytime from the standard subjects list.
              </p>
              {error && (
                <div className="text-sm text-red-600 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowDeleteDialog(null);
                    setError(null);
                  }}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={handleDelete}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Removing...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Remove
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Teacher Assignment Modal - Modern */}
      {isTeacherModalOpen && selectedSubjectForTeacher && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setIsTeacherModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header - Clean, Edgeless */}
            <div className="px-8 pt-8 pb-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <h2 className="text-2xl font-semibold tracking-tight text-gray-900">
                    Assign Teacher
                  </h2>
                  <p className="text-sm text-gray-500">
                    for <span className="font-medium text-violet-600">{selectedSubjectForTeacher.name}</span>
                  </p>
                </div>
                <button
                  onClick={() => setIsTeacherModalOpen(false)}
                  className="rounded-full p-2 hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>

            <form onSubmit={handleAssignTeacher} className="px-8 pb-8 space-y-6">
              {/* Teacher Selection - Clean Cards, Edgeless */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">Select Teacher</h3>
                {teachers.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-400 text-sm">No teachers available</p>
                    <button
                      type="button"
                      onClick={() => {
                        setIsTeacherModalOpen(false);
                        router.push('/school-admin/teachers');
                      }}
                      className="text-violet-600 text-sm font-medium hover:underline mt-2"
                    >
                      Add your first teacher →
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {teachers.map((teacher, idx) => {
                      // Defensive name generation - ensure we always have a non-empty string
                      const firstName = teacher.firstName || "";
                      const lastName = teacher.lastName || "";
                      const email = teacher.email || "";

                      let name = "Unknown";
                      if (firstName && lastName) {
                        name = `${firstName} ${lastName}`;
                      } else if (firstName) {
                        name = firstName;
                      } else if (lastName) {
                        name = lastName;
                      } else if (email) {
                        name = email;
                      }

                      const isSelected = selectedTeacherId === teacher.id;
                      return (
                        <button
                          key={teacher.id}
                          type="button"
                          onClick={() => setSelectedTeacherId(teacher.id)}
                          className={`w-full text-left p-4 rounded-xl transition-all duration-200 ${
                            isSelected
                              ? "bg-violet-600 text-white shadow-xl shadow-violet-200 scale-[1.02]"
                              : "bg-gray-50 hover:bg-gray-100 hover:scale-[1.01]"
                          }`}
                          style={{
                            animationDelay: `${idx * 50}ms`
                          }}
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-base font-semibold ${
                              isSelected ? "bg-white/20 text-white" : "bg-violet-100 text-violet-700"
                            }`}>
                              {firstName?.[0] || lastName?.[0] || email?.[0] || name?.[0] || "?"}
                            </div>
                            <div className="flex-1">
                              <p className={`font-semibold ${
                                isSelected ? "text-white" : "text-gray-900"
                              }`}>{name}</p>
                              {teacher.employeeId && (
                                <p className={`text-xs ${
                                  isSelected ? "text-violet-100" : "text-gray-500"
                                }`}>{teacher.employeeId}</p>
                              )}
                            </div>
                            {isSelected && (
                              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                                <Check className="w-4 h-4 text-white" />
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Role Selection - Minimal Pills */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">Role</h3>
                <div className="flex gap-2">
                  {[
                    { value: "subject_expert", label: "Subject" },
                    { value: "substitute", label: "Substitute" },
                    { value: "homeroom", label: "Homeroom" },
                  ].map((role) => (
                    <button
                      key={role.value}
                      type="button"
                      onClick={() => setSelectedRole(role.value as any)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                        selectedRole === role.value
                          ? "bg-gray-900 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {role.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Class Selection - Minimal */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">Class (Optional)</h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedClassId(null)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-all duration-200 ${
                      !selectedClassId
                        ? "bg-gray-900 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    All Classes
                  </button>
                  {classes.map((cls) => (
                    <button
                      key={cls.id}
                      type="button"
                      onClick={() => setSelectedClassId(cls.id)}
                      className={`px-3 py-1.5 rounded-full text-sm transition-all duration-200 ${
                        selectedClassId === cls.id
                          ? "bg-gray-900 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {cls.grade}-{cls.section}
                    </button>
                  ))}
                </div>
              </div>

              {/* Primary Toggle - Minimal Switch */}
              {selectedRole === "subject_expert" && (
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Primary Teacher</p>
                    <p className="text-xs text-gray-500">Main instructor for this subject</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsPrimary(!isPrimary)}
                    className={`w-11 h-6 rounded-full transition-all duration-300 ${
                      isPrimary ? "bg-violet-600" : "bg-gray-300"
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 ${
                      isPrimary ? "translate-x-5" : "translate-x-0.5"
                    }`} />
                  </button>
                </div>
              )}

              {/* Currently Assigned - Minimal List */}
              {teacherAssignments[selectedSubjectForTeacher.id]?.length > 0 && (
                <div className="pt-4 border-t border-gray-100">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    Currently Assigned ({teacherAssignments[selectedSubjectForTeacher.id].length})
                  </h3>
                  <div className="space-y-2">
                    {teacherAssignments[selectedSubjectForTeacher.id].map((assignment) => (
                      <div
                        key={assignment.id}
                        className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center">
                            {assignment.teacher.firstName?.[0] || assignment.teacher.email[0]}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{getTeacherName(assignment.teacher)}</p>
                            <p className="text-xs text-gray-500">{assignment.role}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveTeacher(selectedSubjectForTeacher.id, assignment.teacherId, assignment.classId)}
                          className="text-gray-400 hover:text-red-500 transition-colors p-1"
                          disabled={isSubmitting}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Error - Clean Alert */}
              {error && (
                <div className="p-3 bg-red-50 rounded-lg">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Actions - Edgeless Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsTeacherModalOpen(false)}
                  className="flex-1 py-3 px-4 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100 transition-all duration-200"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !selectedTeacherId}
                  className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium text-white transition-all duration-200 ${
                    !selectedTeacherId
                      ? "bg-gray-300 cursor-not-allowed"
                      : "bg-violet-600 hover:bg-violet-700 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
                  }`}
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Assigning...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      Assign Teacher
                    </span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
