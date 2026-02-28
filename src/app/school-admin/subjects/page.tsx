/**
 * SCHOOL ADMIN - SUBJECTS MANAGEMENT
 *
 * - Starts blank (only shows school's own subjects)
 * - Add Subject button opens dropdown with global templates
 * - "Add Custom Subject" option at end for manual entry
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
  ChevronRight,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  fetchSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
  type SubjectFormData,
} from "../_actions";

interface Subject {
  id: string;
  name: string;
  code: string;
  type: string;
  grade: number | null;
  description: string | null;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

interface GlobalSubject {
  id: string;
  code: string;
  name: string;
  type: string;
  grade: number | null;
  description: string | null;
}

const gradeOptions = [6, 7, 8, 9, 10, 11, 12];
const subjectTypes = [
  { value: "core", label: "Core Subject" },
  { value: "elective", label: "Elective" },
  { value: "optional", label: "Optional" },
];

export default function SchoolAdminSubjectsPage() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [globalSubjects, setGlobalSubjects] = useState<GlobalSubject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Dropdown state
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);

  // Edit states
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState<Subject | null>(null);

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
  }, []);

  const loadSchoolSubjects = async () => {
    setIsLoading(true);
    const result = await fetchSubjects({ limit: 100 });
    setSubjects(result.subjects);
    setIsLoading(false);
  };

  const loadGlobalSubjects = async () => {
    try {
      const res = await fetch("/api/subjects/global");
      const data = await res.json();
      setGlobalSubjects(data.subjects || []);
    } catch (err) {
      console.error("Failed to load global subjects:", err);
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

  // Select from global template
  const selectGlobalSubject = async (global: GlobalSubject) => {
    setIsSubmitting(true);
    setError(null);
    setIsDropdownOpen(false);

    try {
      const result = await createSubject({
        name: global.name,
        code: `${global.code}-${global.grade}`, // Unique code for school
        type: global.type as "core" | "elective" | "optional",
        grade: global.grade || undefined,
        description: global.description || undefined,
      });

      if (result.success) {
        setSuccess(`Added "${global.name}" to your subjects!`);
        resetForm();
        await loadSchoolSubjects();
        setTimeout(() => setSuccess(null), 2000);
      } else {
        setError(result.error || "Failed to add subject");
      }
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
                className="fixed inset-0 z-40"
                onClick={() => setIsDropdownOpen(false)}
              />
              <Card className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto z-50 shadow-xl">
                <CardContent className="p-2">
                  <p className="text-xs text-gray-500 px-2 py-1 font-medium">SELECT FROM STANDARD SUBJECTS</p>
                  {Object.entries(groupedGlobalSubjects).map(([name, grades]) => (
                    <div key={name} className="mb-1">
                      <p className="text-sm font-medium text-gray-700 px-2 py-1">{name}</p>
                      {grades.map((g) => (
                        <button
                          key={g.id}
                          onClick={() => selectGlobalSubject(g)}
                          className="w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-violet-50 rounded-md transition-colors"
                        >
                          Grade {g.grade}
                        </button>
                      ))}
                    </div>
                  ))}
                  <div className="border-t border-gray-200 mt-2 pt-2">
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        setIsCustomModalOpen(true);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-violet-600 hover:bg-violet-50 rounded-md transition-colors font-medium"
                    >
                      + Add Custom Subject
                    </button>
                  </div>
                </CardContent>
              </Card>
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

      {/* Subjects List */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search subjects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-violet-600" />
            </div>
          ) : filteredSubjects.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No subjects yet</h3>
              <p className="text-gray-500 mb-4">Add subjects from the standard curriculum or create custom ones</p>
              <Button
                onClick={() => setIsDropdownOpen(true)}
                className="bg-violet-600 hover:bg-violet-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Subject
              </Button>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-4">
              {filteredSubjects.map((s) => (
                <Card
                  key={s.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer group"
                  onClick={() => router.push(`/school-admin/subjects/${s.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-violet-100 rounded-lg flex items-center justify-center">
                          <BookOpen className="w-6 h-6 text-violet-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{s.name}</h3>
                          <p className="text-sm text-gray-500">{s.code}</p>
                        </div>
                      </div>
                      <Badge className={s.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}>
                        {s.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                      <span>Grade {s.grade || "N/A"}</span>
                      <Badge variant="outline" className="capitalize">
                        {s.type}
                      </Badge>
                    </div>
                    {s.description && (
                      <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                        {s.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                      <span className="text-xs text-gray-400 group-hover:text-violet-600 transition-colors">
                        View details
                      </span>
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-violet-600 transition-colors" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

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
    </div>
  );
}
