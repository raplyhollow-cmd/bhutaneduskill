/**
 * SCHOOL ADMIN - CREATE NEW STUDENT
 *
 * Features:
 * - Comprehensive student registration form
 * - Personal information
 * - Academic information
 * - Parent/Guardian details
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
  Users,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Check,
  X,
  AlertCircle,
  Loader2,
} from "lucide-react";
import Link from "next/link";

const gradeOptions = ["PP", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
const sectionOptions = ["A", "B", "C", "D"];
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

  // Academic Information
  grade: string;
  section: string;
  rollNumber: string;
  admissionDate: string;

  // Parent/Guardian Information
  parentName: string;
  parentRelationship: string;
  parentPhone: string;
  parentEmail: string;

  // Address
  streetAddress: string;
  district: string;
  city: string;
}

interface FormErrors {
  [key: string]: string;
}

export default function CreateStudentPage() {
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
    grade: "",
    section: "",
    rollNumber: "",
    admissionDate: new Date().toISOString().split("T")[0],
    parentName: "",
    parentRelationship: "",
    parentPhone: "",
    parentEmail: "",
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

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Required fields validation
    if (!formData.firstName.trim()) newErrors.firstName = "First name is required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
    if (!formData.phone.trim()) newErrors.phone = "Phone number is required";
    if (!formData.dateOfBirth) newErrors.dateOfBirth = "Date of birth is required";
    if (!formData.gender) newErrors.gender = "Gender is required";
    if (!formData.grade) newErrors.grade = "Grade is required";
    if (!formData.section) newErrors.section = "Section is required";
    if (!formData.admissionDate) newErrors.admissionDate = "Admission date is required";
    if (!formData.parentName.trim()) newErrors.parentName = "Parent name is required";
    if (!formData.parentRelationship) newErrors.parentRelationship = "Relationship is required";
    if (!formData.parentPhone.trim()) newErrors.parentPhone = "Parent phone is required";

    // Email validation if provided
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }
    if (formData.parentEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.parentEmail)) {
      newErrors.parentEmail = "Invalid email format";
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
        router.push("/school-admin/students");
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
          <Link href="/school-admin/students">
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add New Student</h1>
          <p className="text-gray-600 mt-1">Register a new student to your school</p>
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
                <p className="font-semibold text-green-900">Student Added Successfully!</p>
                <p className="text-sm text-green-700">Redirecting to student list...</p>
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
            <CardDescription>Enter the student's personal details</CardDescription>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <Input
                  name="email"
                  type="email"
                  placeholder="student@school.edu.bt"
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date of Birth <span className="text-red-500">*</span>
                </label>
                <Input
                  name="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  max={new Date().toISOString().split("T")[0]}
                  className={getFieldError("dateOfBirth") ? "border-red-300 focus:border-red-500" : ""}
                />
                {getFieldError("dateOfBirth") && (
                  <p className="text-sm text-red-600 mt-1">{getFieldError("dateOfBirth")}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gender <span className="text-red-500">*</span>
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-violet-500 focus:border-violet-500 ${
                    getFieldError("gender") ? "border-red-300" : "border-gray-300"
                  }`}
                >
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                {getFieldError("gender") && (
                  <p className="text-sm text-red-600 mt-1">{getFieldError("gender")}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Academic Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-violet-600" />
              Academic Information
            </CardTitle>
            <CardDescription>Assign grade and class to the student</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Grade <span className="text-red-500">*</span>
                </label>
                <select
                  name="grade"
                  value={formData.grade}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-violet-500 focus:border-violet-500 ${
                    getFieldError("grade") ? "border-red-300" : "border-gray-300"
                  }`}
                >
                  <option value="">Select grade</option>
                  {gradeOptions.map((grade) => (
                    <option key={grade} value={grade}>
                      {grade === "PP" ? "Pre-Primary" : `Grade ${grade}`}
                    </option>
                  ))}
                </select>
                {getFieldError("grade") && (
                  <p className="text-sm text-red-600 mt-1">{getFieldError("grade")}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Section <span className="text-red-500">*</span>
                </label>
                <select
                  name="section"
                  value={formData.section}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-violet-500 focus:border-violet-500 ${
                    getFieldError("section") ? "border-red-300" : "border-gray-300"
                  }`}
                >
                  <option value="">Select section</option>
                  {sectionOptions.map((section) => (
                    <option key={section} value={section}>
                      Section {section}
                    </option>
                  ))}
                </select>
                {getFieldError("section") && (
                  <p className="text-sm text-red-600 mt-1">{getFieldError("section")}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Roll Number</label>
                <Input
                  name="rollNumber"
                  type="number"
                  placeholder="Auto-generated if empty"
                  value={formData.rollNumber}
                  onChange={handleChange}
                />
                <p className="text-xs text-gray-500 mt-1">Leave empty for auto-assignment</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Admission Date <span className="text-red-500">*</span>
                </label>
                <Input
                  name="admissionDate"
                  type="date"
                  value={formData.admissionDate}
                  onChange={handleChange}
                  className={getFieldError("admissionDate") ? "border-red-300 focus:border-red-500" : ""}
                />
                {getFieldError("admissionDate") && (
                  <p className="text-sm text-red-600 mt-1">{getFieldError("admissionDate")}</p>
                )}
              </div>
            </div>

            {/* Class Preview Badge */}
            {formData.grade && formData.section && (
              <div className="flex items-center gap-2 p-3 bg-violet-50 border border-violet-200 rounded-lg">
                <span className="text-sm text-gray-600">Student will be enrolled in:</span>
                <Badge className="bg-violet-100 text-violet-700 border-violet-300">
                  {formData.grade === "PP" ? "Pre-Primary" : `Grade ${formData.grade}`} - Section {formData.section}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Parent/Guardian Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-violet-600" />
              Parent/Guardian Information
            </CardTitle>
            <CardDescription>Enter parent or guardian contact details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Parent/Guardian Name <span className="text-red-500">*</span>
                </label>
                <Input
                  name="parentName"
                  placeholder="Enter parent name"
                  value={formData.parentName}
                  onChange={handleChange}
                  className={getFieldError("parentName") ? "border-red-300 focus:border-red-500" : ""}
                />
                {getFieldError("parentName") && (
                  <p className="text-sm text-red-600 mt-1">{getFieldError("parentName")}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Relationship <span className="text-red-500">*</span>
                </label>
                <select
                  name="parentRelationship"
                  value={formData.parentRelationship}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-violet-500 focus:border-violet-500 ${
                    getFieldError("parentRelationship") ? "border-red-300" : "border-gray-300"
                  }`}
                >
                  <option value="">Select relationship</option>
                  <option value="Father">Father</option>
                  <option value="Mother">Mother</option>
                  <option value="Guardian">Guardian</option>
                  <option value="Grandparent">Grandparent</option>
                  <option value="Other">Other</option>
                </select>
                {getFieldError("parentRelationship") && (
                  <p className="text-sm text-red-600 mt-1">{getFieldError("parentRelationship")}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Parent Phone <span className="text-red-500">*</span>
                </label>
                <Input
                  name="parentPhone"
                  placeholder="+975 17 XX XX XX"
                  value={formData.parentPhone}
                  onChange={handleChange}
                  className={getFieldError("parentPhone") ? "border-red-300 focus:border-red-500" : ""}
                />
                {getFieldError("parentPhone") && (
                  <p className="text-sm text-red-600 mt-1">{getFieldError("parentPhone")}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Parent Email</label>
                <Input
                  name="parentEmail"
                  type="email"
                  placeholder="parent@email.com"
                  value={formData.parentEmail}
                  onChange={handleChange}
                  className={getFieldError("parentEmail") ? "border-red-300 focus:border-red-500" : ""}
                />
                {getFieldError("parentEmail") && (
                  <p className="text-sm text-red-600 mt-1">{getFieldError("parentEmail")}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Address */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-violet-600" />
              Address Information
            </CardTitle>
            <CardDescription>Student's residential address</CardDescription>
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
                <Link href="/school-admin/students">
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
                      grade: "",
                      section: "",
                      rollNumber: "",
                      admissionDate: new Date().toISOString().split("T")[0],
                      parentName: "",
                      parentRelationship: "",
                      parentPhone: "",
                      parentEmail: "",
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
                  className="bg-violet-600 hover:bg-violet-700 text-white"
                  style={{ background: "linear-gradient(135deg, rgb(139 92 246) 0%, rgb(124 58 237) 100%)" }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Adding Student...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Add Student
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
