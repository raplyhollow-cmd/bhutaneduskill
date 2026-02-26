"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/toaster";
import { X, Loader2, Mail, Phone, GraduationCap, BookOpen, Building2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { portal } from "@/styles/design-tokens";

interface AddTeacherModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const departments = [
  "Mathematics",
  "Science",
  "English",
  "Social Studies",
  "Physical Education",
  "Arts",
  "Music",
  "Computer Science",
  "Languages",
  "Special Education",
  "Administration",
];

export function AddTeacherModal({ open, onClose, onSuccess }: AddTeacherModalProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    employeeId: "",
    department: "",
    subjects: [] as string[],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/school-admin/teachers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          subjects: JSON.stringify(formData.subjects),
        }),
      });

      if (response.ok) {
        toast({
          title: "Teacher created",
          description: `${formData.firstName} ${formData.lastName} has been added successfully.`,
          variant: "success",
        });
        onSuccess();
        handleClose();
      } else {
        const data = await response.json();
        toast({
          title: "Failed to create teacher",
          description: data.error || "Please check your inputs and try again.",
          variant: "error",
        });
      }
    } catch (error) {
      toast({
        title: "Network error",
        description: "Please check your connection and try again.",
        variant: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      employeeId: "",
      department: "",
      subjects: [],
    });
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-violet-50 to-indigo-50 rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: portal.schoolAdmin.gradient }}>
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Add New Teacher</h2>
              <p className="text-sm text-gray-500">Create a new teacher account</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Personal Information */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <GraduationCap className="w-4 h-4" style={{ color: portal.schoolAdmin.primary }} />
              Personal Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName" className="text-gray-700">First Name *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="John"
                  required
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="lastName" className="text-gray-700">Last Name *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Doe"
                  required
                  className="mt-1.5"
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Mail className="w-4 h-4" style={{ color: portal.schoolAdmin.primary }} />
              Contact Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email" className="text-gray-700">Email</Label>
                <div className="relative mt-1.5">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john.doe@school.edu"
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="phone" className="text-gray-700">Phone</Label>
                <div className="relative mt-1.5">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+975 17 00 00 00"
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Professional Information */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4" style={{ color: portal.schoolAdmin.primary }} />
              Professional Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="employeeId" className="text-gray-700">Employee ID</Label>
                <Input
                  id="employeeId"
                  value={formData.employeeId}
                  onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                  placeholder="TCH2024001"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="department" className="text-gray-700">Department</Label>
                <div className="relative mt-1.5">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
                  <Select value={formData.department} onValueChange={(value) => setFormData({ ...formData, department: value })}>
                    <SelectTrigger className="pl-10">
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          {/* Subjects */}
          <div>
            <Label htmlFor="subjects" className="text-gray-700">Subjects (comma-separated)</Label>
            <div className="relative mt-1.5">
              <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="subjects"
                value={formData.subjects.join(", ")}
                onChange={(e) => setFormData({
                  ...formData,
                  subjects: e.target.value.split(",").map(s => s.trim()).filter(Boolean)
                })}
                placeholder="Mathematics, Physics, Chemistry"
                className="pl-10"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Enter multiple subjects separated by commas</p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !formData.firstName || !formData.lastName}
              className="flex-1 shadow-md hover:shadow-lg transition-shadow"
              style={{ background: "linear-gradient(135deg, rgb(139 92 246) 0%, rgb(124 58 237) 100%)" }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <GraduationCap className="w-4 h-4 mr-2" />
                  Create Teacher
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
