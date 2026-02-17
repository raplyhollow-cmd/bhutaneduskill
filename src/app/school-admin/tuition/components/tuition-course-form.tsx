"use client";

import { logger } from "@/lib/logger";
/**
 * TUITION COURSE FORM COMPONENT
 *
 * Modal form for creating and editing tuition courses.
 * Handles course details, pricing, schedule, and tutor assignment.
 */


import { useState, useEffect } from "react";
import { X, Calendar, Clock, MapPin, Video, Users, DollarSign, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface Tutor {
  id: string;
  userId: string;
  name: string;
  subjects?: string[];
  hourlyRate?: number;
  hourlyRateOnline?: number;
}

interface Course {
  id: string;
  title: string;
  description?: string;
  type: string;
  tutorId?: string;
  tutorName?: string;
  gradeLevel?: number;
  category?: string;
  price?: number;
  discountPrice?: number;
  maxStudents?: number;
  status: string;
}

interface TuitionCourseFormProps {
  course?: Course | null;
  tutors?: Tutor[];
  onClose: () => void;
  onSuccess: () => void;
}

export function TuitionCourseForm({ course, tutors: initialTutors = [], onClose, onSuccess }: TuitionCourseFormProps) {
  const isEditing = !!course;
  const [tutors, setTutors] = useState<Tutor[]>(initialTutors);
  const [loadingTutors, setLoadingTutors] = useState(false);

  const [formData, setFormData] = useState({
    title: course?.title || "",
    description: course?.description || "",
    type: course?.type || "online_live",
    tutorId: course?.tutorId || "",
    gradeLevel: course?.gradeLevel || 10,
    category: course?.category || "subject",
    price: course?.price || 500,
    discountPrice: course?.discountPrice || 0,
    maxStudents: course?.maxStudents || 30,
    status: course?.status || "draft",
    location: {
      district: "",
      area: "",
      fullAddress: "",
    },
    schedule: [] as Array<{
      day: string;
      startTime: string;
      endTime: string;
    }>,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch tutors if not provided
  useEffect(() => {
    if (initialTutors.length === 0) {
      const fetchTutors = async () => {
        setLoadingTutors(true);
        try {
          const response = await fetch("/api/tuition/tutors");
          if (response.ok) {
            const data = await response.json();
            setTutors(data.tutors || []);
          }
        } catch (err) {
          logger.error("Failed to fetch tutors:", err);
        } finally {
          setLoadingTutors(false);
        }
      };
      fetchTutors();
    }
  }, [initialTutors.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const url = isEditing ? `/api/tuition/courses/${course.id}` : "/api/tuition/courses";
      const method = isEditing ? "PATCH" : "POST";

      const payload = {
        ...formData,
        price: Number(formData.price),
        discountPrice: formData.discountPrice > 0 ? Number(formData.discountPrice) : undefined,
        maxStudents: Number(formData.maxStudents),
        gradeLevel: Number(formData.gradeLevel),
        location: formData.type === "physical" ? formData.location : undefined,
      };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save course");
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

  const handleLocationChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      location: { ...prev.location, [field]: value },
    }));
  };

  const addScheduleSlot = () => {
    setFormData((prev) => ({
      ...prev,
      schedule: [
        ...prev.schedule,
        { day: "Monday", startTime: "16:00", endTime: "17:00" },
      ],
    }));
  };

  const removeScheduleSlot = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      schedule: prev.schedule.filter((_, i) => i !== index),
    }));
  };

  const updateScheduleSlot = (index: number, field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      schedule: prev.schedule.map((slot, i) =>
        i === index ? { ...slot, [field]: value } : slot
      ),
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">
            {isEditing ? "Edit Course" : "Create New Course"}
          </h2>
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

          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Basic Information</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Course Title *
              </label>
              <Input
                value={formData.title}
                onChange={(e) => handleChange("title", e.target.value)}
                placeholder="e.g., Mathematics for Class 10"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="Describe what students will learn..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleChange("category", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="subject">Subject Tutoring</option>
                  <option value="exam_prep">Exam Preparation</option>
                  <option value="skill">Skill Development</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Grade Level
                </label>
                <select
                  value={formData.gradeLevel}
                  onChange={(e) => handleChange("gradeLevel", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  {Array.from({ length: 7 }, (_, i) => i + 6).map((grade) => (
                    <option key={grade} value={grade}>
                      Class {grade}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Course Type */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Course Type & Delivery</h3>

            <div className="flex gap-2">
              <Button
                type="button"
                variant={formData.type === "online_live" ? "default" : "outline"}
                onClick={() => handleChange("type", "online_live")}
                className="flex-1"
              >
                <Video className="w-4 h-4 mr-2" />
                Online Live
              </Button>
              <Button
                type="button"
                variant={formData.type === "online_recorded" ? "default" : "outline"}
                onClick={() => handleChange("type", "online_recorded")}
                className="flex-1"
              >
                <Video className="w-4 h-4 mr-2" />
                Online Recorded
              </Button>
              <Button
                type="button"
                variant={formData.type === "physical" ? "default" : "outline"}
                onClick={() => handleChange("type", "physical")}
                className="flex-1"
              >
                <MapPin className="w-4 h-4 mr-2" />
                In-Person
              </Button>
            </div>

            {formData.type === "physical" && (
              <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    District
                  </label>
                  <Input
                    value={formData.location.district}
                    onChange={(e) => handleLocationChange("district", e.target.value)}
                    placeholder="e.g., Thimphu"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Area
                  </label>
                  <Input
                    value={formData.location.area}
                    onChange={(e) => handleLocationChange("area", e.target.value)}
                    placeholder="e.g., Motithang"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Address
                  </label>
                  <Input
                    value={formData.location.fullAddress}
                    onChange={(e) => handleLocationChange("fullAddress", e.target.value)}
                    placeholder="Complete address..."
                  />
                </div>
              </div>
            )}
          </div>

          {/* Tutor Assignment */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Tutor Assignment</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Assign Tutor
              </label>
              <select
                value={formData.tutorId}
                onChange={(e) => handleChange("tutorId", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="">Select a tutor...</option>
                {tutors.map((tutor) => (
                  <option key={tutor.id} value={tutor.id}>
                    {tutor.name} - Nu. {tutor.hourlyRateOnline || tutor.hourlyRate || 0}/hr
                  </option>
                ))}
              </select>
              {tutors.length === 0 && (
                <p className="text-sm text-gray-500 mt-1">
                  No tutors available. Add tutors first.
                </p>
              )}
            </div>
          </div>

          {/* Pricing */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Pricing</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price (Nu.) *
                </label>
                <Input
                  type="number"
                  value={formData.price}
                  onChange={(e) => handleChange("price", e.target.value)}
                  min={0}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Discount Price (Optional)
                </label>
                <Input
                  type="number"
                  value={formData.discountPrice}
                  onChange={(e) => handleChange("discountPrice", e.target.value)}
                  min={0}
                  placeholder="No discount"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Maximum Students
              </label>
              <Input
                type="number"
                value={formData.maxStudents}
                onChange={(e) => handleChange("maxStudents", e.target.value)}
                min={1}
                max={100}
              />
            </div>
          </div>

          {/* Schedule */}
          {formData.type === "online_live" || formData.type === "physical" ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Schedule</h3>
                <Button type="button" variant="outline" size="sm" onClick={addScheduleSlot}>
                  <Calendar className="w-4 h-4 mr-2" />
                  Add Slot
                </Button>
              </div>

              {formData.schedule.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  No schedule slots added yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {formData.schedule.map((slot, index) => (
                    <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                      <select
                        value={slot.day}
                        onChange={(e) => updateScheduleSlot(index, "day", e.target.value)}
                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                      >
                        {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(
                          (day) => (
                            <option key={day} value={day}>
                              {day}
                            </option>
                          )
                        )}
                      </select>
                      <Input
                        type="time"
                        value={slot.startTime}
                        onChange={(e) => updateScheduleSlot(index, "startTime", e.target.value)}
                        className="w-32"
                      />
                      <span className="text-gray-500">to</span>
                      <Input
                        type="time"
                        value={slot.endTime}
                        onChange={(e) => updateScheduleSlot(index, "endTime", e.target.value)}
                        className="w-32"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeScheduleSlot(index)}
                      >
                        <X className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={formData.status === "draft" ? "default" : "outline"}
                onClick={() => handleChange("status", "draft")}
                size="sm"
              >
                Draft
              </Button>
              <Button
                type="button"
                variant={formData.status === "published" ? "default" : "outline"}
                onClick={() => handleChange("status", "published")}
                size="sm"
              >
                Published
              </Button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              style={{
                background: "linear-gradient(135deg, rgb(139 92 246) 0%, rgb(124 58 237) 100%)",
                color: "white",
              }}
            >
              {loading ? (
                "Saving..."
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {isEditing ? "Update Course" : "Create Course"}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
