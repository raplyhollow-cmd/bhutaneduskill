/**
 * CLASS EDIT MODAL
 *
 * Modal component for editing an existing class
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Save,
  X,
  Plus,
  Users,
  GraduationCap,
  MapPin,
  Calendar,
  Check,
  AlertCircle,
  Trash2,
} from "lucide-react";
import { updateClass, deleteClass, fetchTeachersForSelection, type ClassFormData } from "@/app/school-admin/_actions";

interface Teacher {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  employeeId: string | null;
}

interface SubjectTeacher {
  teacherId: string;
  teacherName: string;
}

interface ClassEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  classData: {
    id: string;
    name?: string | null;
    grade: number;
    section: string;
    roomNumber?: string | null;
    capacity?: number | null;
    homeroomTeacherId?: string | null;
    academicYear?: string | null;
  } | null;
}

const gradeOptions = [6, 7, 8, 9, 10, 11, 12];
const sectionOptions = ["A", "B", "C", "D", "E", "F"];

// Generate academic year options
const generateAcademicYears = () => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const years: string[] = [];

  const startYear = now.getMonth() >= 8 ? currentYear : currentYear - 1;

  for (let i = -1; i < 3; i++) {
    years.push(`${startYear + i}-${startYear + i + 1}`);
  }

  return years;
};

const academicYearOptions = generateAcademicYears();

export function ClassEditModal({ isOpen, onClose, classData }: ClassEditModalProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    grade: 6,
    section: "A",
    roomNumber: "",
    capacity: 40,
    homeroomTeacherId: "",
    academicYear: academicYearOptions[1], // Default to current year
  });

  // Subject teachers state
  const [subjectTeachers, setSubjectTeachers] = useState<SubjectTeacher[]>([]);
  const [selectedSubjectTeacherId, setSelectedSubjectTeacherId] = useState("");
  const [showSubjectTeacherInput, setShowSubjectTeacherInput] = useState(false);

  // Initialize form data when classData changes
  useEffect(() => {
    if (classData) {
      setFormData({
        name: classData.name || "",
        grade: classData.grade || 6,
        section: classData.section || "A",
        roomNumber: classData.roomNumber || "",
        capacity: classData.capacity || 40,
        homeroomTeacherId: classData.homeroomTeacherId || "",
        academicYear: classData.academicYear || academicYearOptions[1],
      });
    }
  }, [classData]);

  // Fetch teachers when modal opens
  useEffect(() => {
    if (isOpen) {
      const fetchTeachers = async () => {
        setIsLoading(true);
        const result = await fetchTeachersForSelection();
        setTeachers(result.teachers);
        setIsLoading(false);
      };

      fetchTeachers();
    }
  }, [isOpen]);

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "grade" || name === "capacity" ? Number(value) : value,
    }));
  };

  // Add subject teacher
  const addSubjectTeacher = () => {
    if (!selectedSubjectTeacherId) return;

    const teacher = teachers.find((t) => t.id === selectedSubjectTeacherId);
    if (!teacher) return;

    // Check if teacher is already added
    if (subjectTeachers.some((st) => st.teacherId === selectedSubjectTeacherId)) {
      setError("This teacher is already assigned as a subject teacher");
      return;
    }

    // Check if teacher is the homeroom teacher
    if (selectedSubjectTeacherId === formData.homeroomTeacherId) {
      setError("This teacher is already assigned as the homeroom teacher");
      return;
    }

    setSubjectTeachers((prev) => [
      ...prev,
      {
        teacherId: teacher.id,
        teacherName: `${teacher.firstName || ""} ${teacher.lastName || ""}`.trim(),
      },
    ]);

    setSelectedSubjectTeacherId("");
    setShowSubjectTeacherInput(false);
    setError(null);
  };

  // Remove subject teacher
  const removeSubjectTeacher = (teacherId: string) => {
    setSubjectTeachers((prev) => prev.filter((st) => st.teacherId !== teacherId));
  };

  // Handle save
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classData) return;

    setError(null);
    setIsSubmitting(true);

    try {
      const result = await updateClass(classData.id, {
        name: formData.name || undefined,
        grade: formData.grade,
        section: formData.section,
        roomNumber: formData.roomNumber || undefined,
        capacity: formData.capacity,
        homeroomTeacherId: formData.homeroomTeacherId || undefined,
        academicYear: formData.academicYear,
      });

      if (result.success) {
        onClose();
        router.refresh();
      } else {
        setError(result.error || "Failed to update class");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!classData) return;

    setIsDeleting(true);
    setError(null);

    try {
      const result = await deleteClass(classData.id);

      if (result.success) {
        setShowDeleteConfirm(false);
        onClose();
        router.push("/school-admin/classes");
      } else {
        setError(result.error || "Failed to delete class");
        setShowDeleteConfirm(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5" />
            Edit Class
          </DialogTitle>
          <DialogDescription>
            Update class information and assignments
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-6 mt-4">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="font-medium text-sm text-gray-700">Basic Information</h3>

              {/* Class Name */}
              <div>
                <Label htmlFor="name">Class Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Class 10-A (Science)"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Grade */}
                <div>
                  <Label htmlFor="grade">Grade</Label>
                  <select
                    id="grade"
                    name="grade"
                    value={formData.grade}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                  >
                    {gradeOptions.map((grade) => (
                      <option key={grade} value={grade}>
                        Grade {grade}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Section */}
                <div>
                  <Label htmlFor="section">Section</Label>
                  <select
                    id="section"
                    name="section"
                    value={formData.section}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                  >
                    {sectionOptions.map((section) => (
                      <option key={section} value={section}>
                        Section {section}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Room Number */}
                <div>
                  <Label htmlFor="roomNumber">Room Number</Label>
                  <Input
                    id="roomNumber"
                    name="roomNumber"
                    value={formData.roomNumber}
                    onChange={handleInputChange}
                    placeholder="e.g., Room 101"
                  />
                </div>

                {/* Capacity */}
                <div>
                  <Label htmlFor="capacity">Capacity</Label>
                  <Input
                    id="capacity"
                    name="capacity"
                    type="number"
                    min="1"
                    max="100"
                    value={formData.capacity}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              {/* Academic Year */}
              <div>
                <Label htmlFor="academicYear" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Academic Year
                </Label>
                <select
                  id="academicYear"
                  name="academicYear"
                  value={formData.academicYear}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                >
                  {academicYearOptions.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Homeroom Teacher */}
            <div className="space-y-4">
              <h3 className="font-medium text-sm text-gray-700 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Homeroom Teacher
              </h3>

              {teachers.length === 0 ? (
                <div className="text-center py-4 text-gray-500 text-sm">
                  No teachers available
                </div>
              ) : (
                <div>
                  <select
                    id="homeroomTeacherId"
                    name="homeroomTeacherId"
                    value={formData.homeroomTeacherId}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                  >
                    <option value="">-- No Homeroom Teacher --</option>
                    {teachers.map((teacher) => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.firstName || ""} {teacher.lastName || ""}
                        {teacher.employeeId && ` (${teacher.employeeId})`}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                <p>{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t">
              <Button
                type="button"
                variant="ghost"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Class
              </Button>

              <div className="flex items-center gap-3">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-violet-600 hover:bg-violet-700"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        )}

        {/* Delete Confirmation */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
              <div className="flex items-center gap-3 text-red-600 mb-4">
                <AlertCircle className="w-6 h-6" />
                <h3 className="text-lg font-semibold">Delete Class?</h3>
              </div>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this class? This action cannot be undone.
                The class can only be deleted if there are no enrolled students.
              </p>
              <div className="flex items-center justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
