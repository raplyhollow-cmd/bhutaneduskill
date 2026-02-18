/**
 * SCHOOL ADMIN - CREATE CLASS PAGE
 *
 * Form to create a new class with:
 * - Class name
 * - Grade (6-12)
 * - Section (A, B, C, etc.)
 * - Room number
 * - Capacity
 * - Homeroom teacher selection
 * - Subject teachers selection
 * - Academic year
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Save,
  X,
  Plus,
  Users,
  GraduationCap,
  MapPin,
  Calendar,
  Check,
  AlertCircle,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { createClass, fetchTeachersForSelection } from "../../_actions";

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

const gradeOptions = [6, 7, 8, 9, 10, 11, 12];
const sectionOptions = ["A", "B", "C", "D", "E", "F"];

// Generate academic year options (current year and next 2 years)
const generateAcademicYears = () => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const years: string[] = [];

  // If we're past August, start with current year, otherwise start with previous year
  const startYear = now.getMonth() >= 8 ? currentYear : currentYear - 1;

  for (let i = 0; i < 3; i++) {
    years.push(`${startYear + i}-${startYear + i + 1}`);
  }

  return years;
};

const academicYearOptions = generateAcademicYears();

export default function CreateClassPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    grade: 6,
    section: "A",
    roomNumber: "",
    capacity: 40,
    homeroomTeacherId: "",
    academicYear: academicYearOptions[0],
  });

  // Subject teachers state
  const [subjectTeachers, setSubjectTeachers] = useState<SubjectTeacher[]>([]);
  const [selectedSubjectTeacherId, setSelectedSubjectTeacherId] = useState("");
  const [showSubjectTeacherInput, setShowSubjectTeacherInput] = useState(false);

  // Fetch teachers on mount
  useEffect(() => {
    const fetchTeachers = async () => {
      setIsLoading(true);
      const result = await fetchTeachersForSelection();
      setTeachers(result.teachers);
      setIsLoading(false);
    };

    fetchTeachers();
  }, []);

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

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const result = await createClass({
        name: formData.name || `Class ${formData.grade} - ${formData.section}`,
        grade: formData.grade,
        section: formData.section,
        roomNumber: formData.roomNumber || undefined,
        capacity: formData.capacity,
        homeroomTeacherId: formData.homeroomTeacherId || undefined,
        subjectTeacherIds: subjectTeachers.map((st) => st.teacherId),
        academicYear: formData.academicYear,
      });

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push("/school-admin/classes");
        }, 1500);
      } else {
        setError(result.error || "Failed to create class");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get teacher name by ID
  const getTeacherName = (teacherId: string) => {
    const teacher = teachers.find((t) => t.id === teacherId);
    return teacher
      ? `${teacher.firstName || ""} ${teacher.lastName || ""}`.trim() || teacher.email || "Unknown"
      : "Unknown";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/school-admin/classes">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Classes
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create New Class</h1>
            <p className="text-gray-500">Set up a new class for the academic year</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl">
        <form onSubmit={handleSubmit}>
          {/* Basic Information */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5" />
                Basic Information
              </CardTitle>
              <CardDescription>Enter the basic details for the new class</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Class Name */}
              <div>
                <Label htmlFor="name">Class Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Class 10-A (Science)"
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Optional. If left blank, will be auto-generated as &quot;Class &#123;Grade&#125; - &#123;Section&#125;&quot;
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Grade */}
                <div>
                  <Label htmlFor="grade">Grade *</Label>
                  <select
                    id="grade"
                    name="grade"
                    value={formData.grade}
                    onChange={handleInputChange}
                    required
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
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
                  <Label htmlFor="section">Section *</Label>
                  <select
                    id="section"
                    name="section"
                    value={formData.section}
                    onChange={handleInputChange}
                    required
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                  >
                    {sectionOptions.map((section) => (
                      <option key={section} value={section}>
                        Section {section}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Room Number */}
                <div>
                  <Label htmlFor="roomNumber">Room Number</Label>
                  <Input
                    id="roomNumber"
                    name="roomNumber"
                    value={formData.roomNumber}
                    onChange={handleInputChange}
                    placeholder="e.g., Room 101"
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Optional. Will be auto-generated if left blank.
                  </p>
                </div>

                {/* Capacity */}
                <div>
                  <Label htmlFor="capacity">Capacity *</Label>
                  <Input
                    id="capacity"
                    name="capacity"
                    type="number"
                    min="1"
                    max="100"
                    value={formData.capacity}
                    onChange={handleInputChange}
                    required
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Maximum number of students in this class
                  </p>
                </div>
              </div>

              {/* Academic Year */}
              <div>
                <Label htmlFor="academicYear" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Academic Year *
                </Label>
                <select
                  id="academicYear"
                  name="academicYear"
                  value={formData.academicYear}
                  onChange={handleInputChange}
                  required
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                >
                  {academicYearOptions.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Homeroom Teacher */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Homeroom Teacher
              </CardTitle>
              <CardDescription>Assign a primary teacher for this class</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-violet-600" />
                </div>
              ) : teachers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No teachers available</p>
                  <p className="text-sm mt-1">Please add teachers to your school first</p>
                  <Button variant="outline" className="mt-4" asChild>
                    <Link href="/school-admin/teachers">Manage Teachers</Link>
                  </Button>
                </div>
              ) : (
                <div>
                  <Label htmlFor="homeroomTeacherId">Homeroom Teacher</Label>
                  <select
                    id="homeroomTeacherId"
                    name="homeroomTeacherId"
                    value={formData.homeroomTeacherId}
                    onChange={handleInputChange}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                  >
                    <option value="">-- No Homeroom Teacher --</option>
                    {teachers.map((teacher) => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.firstName || ""} {teacher.lastName || ""}
                        {teacher.employeeId && ` (${teacher.employeeId})`}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    The homeroom teacher will be responsible for attendance and overall student welfare
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Subject Teachers */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5" />
                Subject Teachers
              </CardTitle>
              <CardDescription>Assign additional teachers for specific subjects</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Assigned Subject Teachers */}
              {subjectTeachers.length > 0 && (
                <div className="space-y-2">
                  <Label>Assigned Subject Teachers</Label>
                  <div className="space-y-2">
                    {subjectTeachers.map((st) => (
                      <div
                        key={st.teacherId}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-violet-100 rounded-full flex items-center justify-center">
                            <span className="text-violet-600 text-xs font-medium">
                              {st.teacherName
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </span>
                          </div>
                          <span className="font-medium">{st.teacherName}</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSubjectTeacher(st.teacherId)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add Subject Teacher */}
              {showSubjectTeacherInput ? (
                <div className="flex gap-2">
                  <select
                    value={selectedSubjectTeacherId}
                    onChange={(e) => setSelectedSubjectTeacherId(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                  >
                    <option value="">Select a teacher...</option>
                    {teachers
                      .filter(
                        (t) =>
                          t.id !== formData.homeroomTeacherId &&
                          !subjectTeachers.some((st) => st.teacherId === t.id)
                      )
                      .map((teacher) => (
                        <option key={teacher.id} value={teacher.id}>
                          {teacher.firstName || ""} {teacher.lastName || ""}
                          {teacher.employeeId && ` (${teacher.employeeId})`}
                        </option>
                      ))}
                  </select>
                  <Button type="button" onClick={addSubjectTeacher} disabled={!selectedSubjectTeacherId}>
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowSubjectTeacherInput(false);
                      setSelectedSubjectTeacherId("");
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowSubjectTeacherInput(true)}
                  disabled={teachers.filter(
                    (t) =>
                      t.id !== formData.homeroomTeacherId &&
                      !subjectTeachers.some((st) => st.teacherId === t.id)
                  ).length === 0}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Subject Teacher
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Error Message */}
          {error && (
            <Card className="mb-6 border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 text-red-600">
                  <AlertCircle className="w-5 h-5" />
                  <p>{error}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Success Message */}
          {success && (
            <Card className="mb-6 border-green-200 bg-green-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 text-green-600">
                  <Check className="w-5 h-5" />
                  <p>Class created successfully! Redirecting to classes list...</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3">
            <Button type="button" variant="outline" asChild>
              <Link href="/school-admin/classes">Cancel</Link>
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || success}
              className="bg-violet-600 hover:bg-violet-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Create Class
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
