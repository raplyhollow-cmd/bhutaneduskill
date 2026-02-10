/**
 * SCHOOL ADMIN - CREATE NEW TEACHER
 *
 * Features:
 * - Comprehensive teacher registration form
 * - Personal information
 * - Employment details
 * - Qualification and experience
 * - Subject assignment
 * - Address and contact
 * - Form validation
 * - Success/error states
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  User,
  GraduationCap,
  BookOpen,
  Briefcase,
  MapPin,
  Check,
  X,
  AlertCircle,
  Loader2,
} from "lucide-react";
import Link from "next/link";

const subjectOptions = [
  "Mathematics", "Physics", "Chemistry", "Biology", "English", "Dzongkha",
  "History", "Geography", "Economics", "Computer Science", "Physical Education",
  "Art", "Music", "Business Studies", "Accounting"
];

const districts = [
  "Thimphu", "Paro", "Punakha", "Wangdue Phodrang", "Gasa", "Dagana",
  "Tsirang", "Sarpang", "Zhemgang", "Trongsa", "Bumthang", "Mongar",
  "Lhuentse", "Trashigang", "Trashiyangtse", "Samdrup Jongkhar",
  "Pema Gatshel", "Samtse", "Chukha", "Haa"
];

interface FormData {
  // Personal Information
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;

  // Employment Information
  employeeId: string;
  joiningDate: string;
  employmentType: string;
  department: string;

  // Qualification & Experience
  qualification: string;
  experience: string;
  specializations: string;

  // Subject Assignment
  subjects: string[];

  // Address
  streetAddress: string;
  district: string;
  city: string;
}

interface FormErrors {
  [key: string]: string;
}

export default function CreateTeacherPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  const [errors, setErrors] = useState<FormErrors>({});

  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
    employeeId: "",
    joiningDate: new Date().toISOString().split("T")[0],
    employmentType: "Permanent",
    department: "Academic",
    qualification: "",
    experience: "",
    specializations: "",
    subjects: [],
    streetAddress: "",
    district: "",
    city: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubjectToggle = (subject: string) => {
    setFormData((prev) => ({
      ...prev,
      subjects: prev.subjects.includes(subject)
        ? prev.subjects.filter((s) => s !== subject)
        : [...prev.subjects, subject],
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Required fields validation
    if (!formData.firstName.trim()) newErrors.firstName = "First name is required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    if (!formData.phone.trim()) newErrors.phone = "Phone number is required";
    if (!formData.employeeId.trim()) newErrors.employeeId = "Employee ID is required";
    if (!formData.qualification.trim()) newErrors.qualification = "Qualification is required";
    if (!formData.experience) newErrors.experience = "Experience is required";
    if (formData.subjects.length === 0) newErrors.subjects = "Select at least one subject";

    // Email validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    // Phone validation (Bhutan format)
    const phoneRegex = /^\+975\s?\d{2}\s?\d{2}\s?\d{2}\s?\d{2}$/;
    if (formData.phone && !phoneRegex.test(formData.phone)) {
      newErrors.phone = "Invalid phone format (use +975 17 XX XX XX)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      setSubmitStatus("error");
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus("idle");

    // Simulate API call
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Success - in real implementation, this would call an API
      setSubmitStatus("success");

      // Redirect after a short delay
      setTimeout(() => {
        router.push("/school-admin/teachers");
      }, 1500);
    } catch (error) {
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFieldError = (fieldName: string) => errors[fieldName];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/school-admin/teachers">
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add New Teacher</h1>
          <p className="text-gray-600 mt-1">Register a new teacher to your school</p>
        </div>
      </div>

      {/* Success Message */}
      {submitStatus === "success" && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Check className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-green-900">Teacher Added Successfully!</p>
                <p className="text-sm text-green-700">Redirecting to teacher list...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Message */}
      {submitStatus === "error" && Object.keys(errors).length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="font-semibold text-red-900">Please fix the errors below</p>
                <p className="text-sm text-red-700">{Object.keys(errors).length} field(s) need attention</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit}>
        {/* Personal Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-violet-600" />
              Personal Information
            </CardTitle>
            <CardDescription>Enter the teacher's personal details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name <span className="text-red-500">*</span>
                </label>
                <Input
                  name="firstName"
                  placeholder="Enter first name"
                  value={formData.firstName}
                  onChange={handleChange}
                  className={getFieldError("firstName") ? "border-red-300 focus:border-red-500" : ""}
                />
                {getFieldError("firstName") && (
                  <p className="text-sm text-red-600 mt-1">{getFieldError("firstName")}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <Input
                  name="lastName"
                  placeholder="Enter last name"
                  value={formData.lastName}
                  onChange={handleChange}
                  className={getFieldError("lastName") ? "border-red-300 focus:border-red-500" : ""}
                />
                {getFieldError("lastName") && (
                  <p className="text-sm text-red-600 mt-1">{getFieldError("lastName")}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <Input
                  name="email"
                  type="email"
                  placeholder="teacher@school.edu.bt"
                  value={formData.email}
                  onChange={handleChange}
                  className={getFieldError("email") ? "border-red-300 focus:border-red-500" : ""}
                />
                {getFieldError("email") && (
                  <p className="text-sm text-red-600 mt-1">{getFieldError("email")}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone <span className="text-red-500">*</span>
                </label>
                <Input
                  name="phone"
                  placeholder="+975 17 XX XX XX"
                  value={formData.phone}
                  onChange={handleChange}
                  className={getFieldError("phone") ? "border-red-300 focus:border-red-500" : ""}
                />
                {getFieldError("phone") && (
                  <p className="text-sm text-red-600 mt-1">{getFieldError("phone")}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                <Input
                  name="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  max={new Date().toISOString().split("T")[0]}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                >
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Employment Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-violet-600" />
              Employment Information
            </CardTitle>
            <CardDescription>Employment details and department assignment</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Employee ID <span className="text-red-500">*</span>
                </label>
                <Input
                  name="employeeId"
                  placeholder="EMP202XXXX"
                  value={formData.employeeId}
                  onChange={handleChange}
                  className={getFieldError("employeeId") ? "border-red-300 focus:border-red-500" : ""}
                />
                {getFieldError("employeeId") && (
                  <p className="text-sm text-red-600 mt-1">{getFieldError("employeeId")}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Joining Date</label>
                <Input
                  name="joiningDate"
                  type="date"
                  value={formData.joiningDate}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employment Type</label>
                <select
                  name="employmentType"
                  value={formData.employmentType}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                >
                  <option>Permanent</option>
                  <option>Contract</option>
                  <option>Temporary</option>
                  <option>Substitute</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                >
                  <option>Academic</option>
                  <option>Administration</option>
                  <option>Support Staff</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Qualification & Experience */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-violet-600" />
              Qualification & Experience
            </CardTitle>
            <CardDescription>Academic credentials and teaching experience</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Highest Qualification <span className="text-red-500">*</span>
                </label>
                <Input
                  name="qualification"
                  placeholder="e.g., M.Sc. Mathematics"
                  value={formData.qualification}
                  onChange={handleChange}
                  className={getFieldError("qualification") ? "border-red-300 focus:border-red-500" : ""}
                />
                {getFieldError("qualification") && (
                  <p className="text-sm text-red-600 mt-1">{getFieldError("qualification")}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Years of Experience <span className="text-red-500">*</span>
                </label>
                <Input
                  name="experience"
                  type="number"
                  placeholder="0"
                  min="0"
                  value={formData.experience}
                  onChange={handleChange}
                  className={getFieldError("experience") ? "border-red-300 focus:border-red-500" : ""}
                />
                {getFieldError("experience") && (
                  <p className="text-sm text-red-600 mt-1">{getFieldError("experience")}</p>
                )}
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Specializations</label>
                <Input
                  name="specializations"
                  placeholder="e.g., Mathematics, Physics, Chemistry"
                  value={formData.specializations}
                  onChange={handleChange}
                />
                <p className="text-xs text-gray-500 mt-1">Comma-separated areas of expertise</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subject Assignment */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-violet-600" />
              Subject Assignment
            </CardTitle>
            <CardDescription>Select subjects this teacher can teach</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-3">
              {subjectOptions.map((subject) => (
                <label
                  key={subject}
                  className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all ${
                    formData.subjects.includes(subject)
                      ? "border-violet-500 bg-violet-50"
                      : "border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.subjects.includes(subject)}
                    onChange={() => handleSubjectToggle(subject)}
                    className="w-4 h-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                  />
                  <span className="flex-1">{subject}</span>
                </label>
              ))}
            </div>
            {getFieldError("subjects") && (
              <p className="text-sm text-red-600 mt-3">{getFieldError("subjects")}</p>
            )}

            {/* Selected Subjects Summary */}
            {formData.subjects.length > 0 && (
              <div className="mt-4 p-3 bg-violet-50 border border-violet-200 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Selected Subjects:</p>
                <div className="flex flex-wrap gap-2">
                  {formData.subjects.map((subject) => (
                    <Badge key={subject} className="bg-violet-100 text-violet-700 border-violet-300">
                      {subject}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Address */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-violet-600" />
              Address Information
            </CardTitle>
            <CardDescription>Residential address</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
              <textarea
                name="streetAddress"
                rows={2}
                placeholder="Enter street address"
                value={formData.streetAddress}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
              />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
                <select
                  name="district"
                  value={formData.district}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                >
                  <option value="">Select district</option>
                  {districts.map((district) => (
                    <option key={district} value={district}>
                      {district}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City/Town</label>
                <Input
                  name="city"
                  placeholder="Enter city/town"
                  value={formData.city}
                  onChange={handleChange}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Form Actions */}
        <Card className="border-violet-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <Button variant="outline" type="button" asChild>
                <Link href="/school-admin/teachers">
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Link>
              </Button>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => {
                    setFormData({
                      firstName: "",
                      lastName: "",
                      email: "",
                      phone: "",
                      dateOfBirth: "",
                      gender: "",
                      employeeId: "",
                      joiningDate: new Date().toISOString().split("T")[0],
                      employmentType: "Permanent",
                      department: "Academic",
                      qualification: "",
                      experience: "",
                      specializations: "",
                      subjects: [],
                      streetAddress: "",
                      district: "",
                      city: "",
                    });
                    setErrors({});
                    setSubmitStatus("idle");
                  }}
                >
                  Reset Form
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="text-white"
                  style={{ background: "linear-gradient(135deg, rgb(139 92 246) 0%, rgb(124 58 237) 100%)" }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Adding Teacher...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Add Teacher
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
