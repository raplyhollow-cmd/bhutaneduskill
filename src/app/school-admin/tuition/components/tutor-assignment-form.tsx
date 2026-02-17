/**
 * TUTOR ASSIGNMENT FORM COMPONENT
 *
 * Modal form for adding teachers as tutors in the tuition system.
 * Collects tutor qualifications, subjects, availability, and rates.
 */

"use client";

import { useState, useEffect } from "react";
import { X, GraduationCap, DollarSign, Clock, Calendar, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface TutorAssignmentFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  subjects?: string[];
  employeeId?: string;
}

export function TutorAssignmentForm({ onClose, onSuccess }: TutorAssignmentFormProps) {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    bio: "",
    subjects: [] as string[],
    gradeLevels: [] as number[],
    experience: 0,
    hourlyRateOnline: 500,
    hourlyRatePhysical: 600,
    availableDays: [] as string[],
    availableSlots: [] as Array<{
      day: string;
      startTime: string;
      endTime: string;
    }>,
  });

  // Fetch school teachers
  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const response = await fetch("/api/school-admin/teachers");
        if (response.ok) {
          const data = await response.json();
          setTeachers(data.teachers || []);
        }
      } catch (error) {
        console.error("Failed to fetch teachers:", error);
      }
    };
    fetchTeachers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!selectedTeacherId) {
      setError("Please select a teacher");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/tuition/tutors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teacherId: selectedTeacherId,
          ...formData,
          location: {
            district: "Thimphu",
            city: "Thimphu",
          },
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to add tutor");
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleSubject = (subject: string) => {
    setFormData((prev) => ({
      ...prev,
      subjects: prev.subjects.includes(subject)
        ? prev.subjects.filter((s) => s !== subject)
        : [...prev.subjects, subject],
    }));
  };

  const toggleGradeLevel = (grade: number) => {
    setFormData((prev) => ({
      ...prev,
      gradeLevels: prev.gradeLevels.includes(grade)
        ? prev.gradeLevels.filter((g) => g !== grade)
        : [...prev.gradeLevels, grade],
    }));
  };

  const toggleAvailableDay = (day: string) => {
    setFormData((prev) => ({
      ...prev,
      availableDays: prev.availableDays.includes(day)
        ? prev.availableDays.filter((d) => d !== day)
        : [...prev.availableDays, day],
    }));
  };

  const addTimeSlot = () => {
    if (formData.availableDays.length > 0) {
      const day = formData.availableDays[0];
      setFormData((prev) => ({
        ...prev,
        availableSlots: [
          ...prev.availableSlots,
          { day, startTime: "16:00", endTime: "17:00" },
        ],
      }));
    }
  };

  const removeTimeSlot = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      availableSlots: prev.availableSlots.filter((_, i) => i !== index),
    }));
  };

  const updateTimeSlot = (index: number, field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      availableSlots: prev.availableSlots.map((slot, i) =>
        i === index ? { ...slot, [field]: value } : slot
      ),
    }));
  };

  const allSubjects = [
    "Mathematics",
    "English",
    "Dzongkha",
    "Physics",
    "Chemistry",
    "Biology",
    "Economics",
    "History",
    "Geography",
    "Computer Science",
    "Information Technology",
  ];

  const selectedTeacher = teachers.find((t) => t.id === selectedTeacherId);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Add Teacher as Tutor</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Select Teacher */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Select Teacher</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Choose Teacher *
              </label>
              <select
                value={selectedTeacherId}
                onChange={(e) => setSelectedTeacherId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                required
              >
                <option value="">Select a teacher...</option>
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.firstName} {teacher.lastName}
                    {teacher.employeeId && ` (${teacher.employeeId})`}
                  </option>
                ))}
              </select>
              {teachers.length === 0 && (
                <p className="text-sm text-gray-500 mt-1">
                  No teachers found. Add teachers to your school first.
                </p>
              )}
            </div>

            {selectedTeacher && (
              <div className="p-3 bg-purple-50 rounded-lg">
                <p className="text-sm font-medium text-purple-900">
                  {selectedTeacher.firstName} {selectedTeacher.lastName}
                </p>
                <p className="text-xs text-purple-700">{selectedTeacher.email}</p>
                {selectedTeacher.subjects && selectedTeacher.subjects.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {selectedTeacher.subjects.map((subject) => (
                      <Badge key={subject} variant="secondary" className="text-xs">
                        {subject}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bio */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Tutor Profile</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bio / Introduction
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) => handleChange("bio", e.target.value)}
                placeholder="Brief introduction about teaching experience and approach..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teaching Experience (years)
              </label>
              <Input
                type="number"
                value={formData.experience}
                onChange={(e) => handleChange("experience", parseInt(e.target.value) || 0)}
                min={0}
                max={50}
              />
            </div>
          </div>

          {/* Subjects */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Teaching Subjects</h3>

            <div className="flex flex-wrap gap-2">
              {allSubjects.map((subject) => (
                <Button
                  key={subject}
                  type="button"
                  variant={formData.subjects.includes(subject) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleSubject(subject)}
                >
                  {subject}
                </Button>
              ))}
            </div>

            {formData.subjects.length > 0 && (
              <p className="text-sm text-gray-600">
                Selected: {formData.subjects.join(", ")}
              </p>
            )}
          </div>

          {/* Grade Levels */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Grade Levels</h3>

            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 7 }, (_, i) => i + 6).map((grade) => (
                <Button
                  key={grade}
                  type="button"
                  variant={formData.gradeLevels.includes(grade) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleGradeLevel(grade)}
                >
                  Class {grade}
                </Button>
              ))}
            </div>

            {formData.gradeLevels.length > 0 && (
              <p className="text-sm text-gray-600">
                Teaching: Class {formData.gradeLevels.sort((a, b) => a - b).join(", ")}
              </p>
            )}
          </div>

          {/* Pricing */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Hourly Rates</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Online Rate (Nu./hour)
                </label>
                <Input
                  type="number"
                  value={formData.hourlyRateOnline}
                  onChange={(e) => handleChange("hourlyRateOnline", parseInt(e.target.value) || 0)}
                  min={0}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  In-Person Rate (Nu./hour)
                </label>
                <Input
                  type="number"
                  value={formData.hourlyRatePhysical}
                  onChange={(e) => handleChange("hourlyRatePhysical", parseInt(e.target.value) || 0)}
                  min={0}
                />
              </div>
            </div>
          </div>

          {/* Availability */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Availability</h3>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Available Days
              </label>
              <div className="flex flex-wrap gap-2">
                {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(
                  (day) => (
                    <Button
                      key={day}
                      type="button"
                      variant={formData.availableDays.includes(day) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleAvailableDay(day)}
                    >
                      {day.slice(0, 3)}
                    </Button>
                  )
                )}
              </div>
            </div>

            {/* Time Slots */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Time Slots
                </label>
                <Button type="button" variant="outline" size="sm" onClick={addTimeSlot}>
                  <Clock className="w-4 h-4 mr-2" />
                  Add Slot
                </Button>
              </div>

              {formData.availableSlots.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  No time slots added yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {formData.availableSlots.map((slot, index) => (
                    <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium w-24">{slot.day}</span>
                      <Input
                        type="time"
                        value={slot.startTime}
                        onChange={(e) => updateTimeSlot(index, "startTime", e.target.value)}
                        className="w-32"
                      />
                      <span className="text-gray-500">to</span>
                      <Input
                        type="time"
                        value={slot.endTime}
                        onChange={(e) => updateTimeSlot(index, "endTime", e.target.value)}
                        className="w-32"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeTimeSlot(index)}
                      >
                        <X className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !selectedTeacherId}
              style={{
                background: "linear-gradient(135deg, rgb(139 92 246) 0%, rgb(124 58 237) 100%)",
                color: "white",
              }}
            >
              {loading ? (
                "Saving..."
              ) : (
                <>
                  <GraduationCap className="w-4 h-4 mr-2" />
                  Add as Tutor
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
