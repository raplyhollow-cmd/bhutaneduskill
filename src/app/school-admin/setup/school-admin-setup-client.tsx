"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Building2,
  CheckCircle,
  Circle,
  ChevronRight,
  Save,
  ArrowRight,
  ArrowLeft,
  GraduationCap,
  BookOpen,
  Users,
  Settings,
  Calendar,
} from "lucide-react";

interface SchoolAdminSetupClientProps {
  schoolId: string;
  schoolName: string;
  schoolCode: string;
  departmentCount: number;
}

interface SetupData {
  // Step 1: School Profile
  schoolName: string;
  schoolTagline: string;
  schoolLogo: string;
  facilities: string;
  principalName: string;
  principalEmail: string;
  principalPhone: string;
  // Step 2: Academic Year
  academicYear: string;
  terms: string;
  holidays: string;
  // Step 3: Departments
  departments: Array<{ name: string; code: string; description: string }>;
  // Step 4: Classes
  classes: Array<{ grade: string; sections: string; }>;
}

const steps = [
  { id: 1, name: "School Profile", icon: Building2 },
  { id: 2, name: "Academic Year", icon: Calendar },
  { id: 3, name: "Departments", icon: GraduationCap },
  { id: 4, name: "Classes", icon: Users },
  { id: 5, name: "Review & Complete", icon: CheckCircle },
];

export function SchoolAdminSetupClient({
  schoolId,
  schoolName,
  schoolCode,
  departmentCount,
}: SchoolAdminSetupClientProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const [data, setData] = useState<SetupData>({
    schoolName: schoolName,
    schoolTagline: "",
    schoolLogo: "",
    facilities: "",
    principalName: "",
    principalEmail: "",
    principalPhone: "",
    academicYear: new Date().getFullYear().toString(),
    terms: "2",
    holidays: "",
    departments: [],
    classes: [],
  });

  const [newDepartment, setNewDepartment] = useState({ name: "", code: "", description: "" });
  const [newClass, setNewClass] = useState({ grade: "", sections: "A" });

  const updateData = (field: keyof SetupData, value: any) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNextStep = async () => {
    // Validate current step
    if (!validateStep(currentStep)) return;

    // Mark current step as completed
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps((prev) => [...prev, currentStep]);
    }

    if (currentStep < steps.length) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!data.schoolName.trim()) {
          alert("Please enter school name");
          return false;
        }
        return true;
      case 2:
        if (!data.academicYear) {
          alert("Please enter academic year");
          return false;
        }
        return true;
      case 3:
        if (data.departments.length === 0) {
          alert("Please add at least one department");
          return false;
        }
        return true;
      case 4:
        if (data.classes.length === 0) {
          alert("Please add at least one class");
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleAddDepartment = () => {
    if (!newDepartment.name || !newDepartment.code) {
      alert("Please enter department name and code");
      return;
    }
    setData((prev) => ({
      ...prev,
      departments: [...prev.departments, { ...newDepartment }],
    }));
    setNewDepartment({ name: "", code: "", description: "" });
  };

  const handleRemoveDepartment = (index: number) => {
    setData((prev) => ({
      ...prev,
      departments: prev.departments.filter((_, i) => i !== index),
    }));
  };

  const handleAddClass = () => {
    if (!newClass.grade) {
      alert("Please enter grade");
      return;
    }
    setData((prev) => ({
      ...prev,
      classes: [...prev.classes, { ...newClass }],
    }));
    setNewClass({ grade: "", sections: "A" });
  };

  const handleRemoveClass = (index: number) => {
    setData((prev) => ({
      ...prev,
      classes: prev.classes.filter((_, i) => i !== index),
    }));
  };

  const handleCompleteSetup = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/school-admin/setup/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schoolId,
          data,
        }),
      });

      if (response.ok) {
        router.push("/school-admin");
      } else {
        const result = await response.json();
        alert(result.error || "Failed to complete setup");
      }
    } catch (error) {
      alert("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">School Profile</h2>
              <p className="text-gray-600">Tell us about your school</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="schoolName">School Name *</Label>
                <Input
                  id="schoolName"
                  value={data.schoolName}
                  onChange={(e) => updateData("schoolName", e.target.value)}
                  placeholder="e.g., Thimphu High School"
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="schoolTagline">Tagline</Label>
                <Input
                  id="schoolTagline"
                  value={data.schoolTagline}
                  onChange={(e) => updateData("schoolTagline", e.target.value)}
                  placeholder="e.g., Excellence in Education"
                  className="mt-2"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="schoolLogo">Logo URL</Label>
              <Input
                id="schoolLogo"
                value={data.schoolLogo}
                onChange={(e) => updateData("schoolLogo", e.target.value)}
                placeholder="https://example.com/logo.png"
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="facilities">Facilities</Label>
              <Textarea
                id="facilities"
                value={data.facilities}
                onChange={(e) => updateData("facilities", e.target.value)}
                placeholder="e.g., Library, Computer Lab, Science Lab, Sports Ground, Auditorium"
                rows={3}
                className="mt-2"
              />
            </div>

            <div className="border-t pt-6">
              <h3 className="font-semibold text-gray-900 mb-4">Principal Information</h3>
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <Label htmlFor="principalName">Principal Name</Label>
                  <Input
                    id="principalName"
                    value={data.principalName}
                    onChange={(e) => updateData("principalName", e.target.value)}
                    placeholder="Mr./Ms. Name"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="principalEmail">Principal Email</Label>
                  <Input
                    id="principalEmail"
                    type="email"
                    value={data.principalEmail}
                    onChange={(e) => updateData("principalEmail", e.target.value)}
                    placeholder="principal@school.edu"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="principalPhone">Principal Phone</Label>
                  <Input
                    id="principalPhone"
                    value={data.principalPhone}
                    onChange={(e) => updateData("principalPhone", e.target.value)}
                    placeholder="+975 1X XXX XXX"
                    className="mt-2"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Academic Year Setup</h2>
              <p className="text-gray-600">Configure your academic calendar</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <Label htmlFor="academicYear">Academic Year *</Label>
                <Input
                  id="academicYear"
                  value={data.academicYear}
                  onChange={(e) => updateData("academicYear", e.target.value)}
                  placeholder="e.g., 2024-2025"
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="terms">Number of Terms</Label                >
                <select
                  id="terms"
                  value={data.terms}
                  onChange={(e) => updateData("terms", e.target.value)}
                  className="w-full mt-2 px-3 py-2 rounded-lg border border-gray-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none"
                >
                  <option value="1">1 Term (Semester)</option>
                  <option value="2">2 Terms</option>
                  <option value="3">3 Terms (Trimester)</option>
                  <option value="4">4 Terms (Quarterly)</option>
                </select>
              </div>
            </div>

            <div>
              <Label htmlFor="holidays">Holidays & Breaks</Label>
              <Textarea
                id="holidays"
                value={data.holidays}
                onChange={(e) => updateData("holidays", e.target.value)}
                placeholder="e.g., Winter Break: Dec 20 - Jan 5, Summer Break: July 1 - July 31"
                rows={3}
                className="mt-2"
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Departments</h2>
              <p className="text-gray-600">Create academic departments for your school</p>
            </div>

            <div className="flex gap-3 mb-4">
              <Input
                placeholder="Department Name"
                value={newDepartment.name}
                onChange={(e) => setNewDepartment({ ...newDepartment, name: e.target.value })}
                className="flex-1"
              />
              <Input
                placeholder="Code (e.g., MATH)"
                value={newDepartment.code}
                onChange={(e) => setNewDepartment({ ...newDepartment, code: e.target.value.toUpperCase() })}
                className="w-32"
              />
              <Button
                onClick={handleAddDepartment}
                style={{ background: "linear-gradient(135deg, rgb(139 92 246) 0%, rgb(124 58 237) 100%)" }}
                className="text-white"
              >
                Add
              </Button>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {data.departments.map((dept, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{dept.name}</p>
                    <p className="text-sm text-gray-500">Code: {dept.code}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:bg-red-50 hover:text-red-600"
                    onClick={() => handleRemoveDepartment(index)}
                  >
                    ×
                  </Button>
                </div>
              ))}
            </div>

            <div className="bg-violet-50 border border-violet-200 rounded-lg p-4">
              <p className="text-sm text-violet-900">
                <strong>Recommended Departments:</strong> Mathematics, Science, Languages (Dzongkha & English),
                Social Studies, IT/Computer Science, Arts & Music, Physical Education
              </p>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Classes</h2>
              <p className="text-gray-600">Add classes for each grade level</p>
            </div>

            <div className="flex gap-3 mb-4">
              <select
                value={newClass.grade}
                onChange={(e) => setNewClass({ ...newClass, grade: e.target.value })}
                className="flex-1 px-3 py-2 rounded-lg border border-gray-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none"
              >
                <option value="">Select Grade</option>
                {["PP", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"].map((grade) => (
                  <option key={grade} value={grade}>Class {grade}</option>
                ))}
              </select>
              <Input
                placeholder="Sections (e.g., A,B,C)"
                value={newClass.sections}
                onChange={(e) => setNewClass({ ...newClass, sections: e.target.value })}
                className="w-40"
              />
              <Button
                onClick={handleAddClass}
                style={{ background: "linear-gradient(135deg, rgb(139 92 246) 0%, rgb(124 58 237) 100%)" }}
                className="text-white"
              >
                Add
              </Button>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              {data.classes.map((cls, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Class {cls.grade}</p>
                    <p className="text-sm text-gray-500">Sections: {cls.sections}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:bg-red-50 hover:text-red-600"
                    onClick={() => handleRemoveClass(index)}
                  >
                    ×
                  </Button>
                </div>
              ))}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Review & Complete Setup</h2>
              <p className="text-gray-600">Review your information before completing setup</p>
            </div>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">School Profile</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">School Name</p>
                      <p className="font-medium">{data.schoolName}</p>
                    </div>
                    {data.schoolTagline && (
                      <div>
                        <p className="text-sm text-gray-500">Tagline</p>
                        <p className="font-medium">{data.schoolTagline}</p>
                      </div>
                    )}
                    {data.principalName && (
                      <div>
                        <p className="text-sm text-gray-500">Principal</p>
                        <p className="font-medium">{data.principalName}</p>
                      </div>
                    )}
                    {data.principalEmail && (
                      <div>
                        <p className="text-sm text-gray-500">Principal Email</p>
                        <p className="font-medium">{data.principalEmail}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Academic Year</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Academic Year</p>
                      <p className="font-medium">{data.academicYear}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Terms</p>
                      <p className="font-medium">{data.terms}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Departments ({data.departments.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-3">
                    {data.departments.map((dept, index) => (
                      <div key={index} className="bg-gray-50 rounded-md p-3">
                        <p className="font-medium">{dept.name}</p>
                        <p className="text-sm text-gray-500">{dept.code}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Classes ({data.classes.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-4 gap-3">
                    {data.classes.map((cls, index) => (
                      <div key={index} className="bg-gray-50 rounded-md p-3">
                        <p className="font-medium">Class {cls.grade}</p>
                        <p className="text-sm text-gray-500">Sections: {cls.sections}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-green-900">Ready to Complete Setup</p>
                  <p className="text-sm text-green-700">
                    Once you complete setup, your school will be fully activated and you can start adding students and teachers.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-[100dvh] bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <div
            className="w-16 h-16 rounded-xl flex items-center justify-center text-white mx-auto mb-4"
            style={{ background: "linear-gradient(135deg, rgb(139 92 246) 0%, rgb(124 58 237) 100%)" }}
          >
            <Building2 className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">School Setup Wizard</h1>
          <p className="text-gray-600">
            School: <strong>{schoolName}</strong> ({schoolCode})
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isCompleted = completedSteps.includes(step.id);
              const isCurrent = currentStep === step.id;

              return (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isCompleted
                          ? "bg-green-500 text-white"
                          : isCurrent
                          ? "text-white"
                          : "bg-gray-200 text-gray-500"
                      }`}
                      style={
                        !isCompleted && isCurrent
                          ? { background: "linear-gradient(135deg, rgb(139 92 246) 0%, rgb(124 58 237) 100%)" }
                          : {}
                      }
                    >
                      {isCompleted ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <StepIcon className="w-5 h-5" />
                      )}
                    </div>
                    <p className={`text-xs mt-2 text-center ${isCurrent ? "font-medium text-violet-600" : "text-gray-500"}`}>
                      {step.name}
                    </p>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`h-0.5 flex-1 mx-2 ${isCompleted ? "bg-green-500" : "bg-gray-200"}`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <Card>
          <CardContent className="pt-6">
            {renderStep()}

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t">
              <Button
                variant="outline"
                onClick={handlePrevStep}
                disabled={currentStep === 1 || loading}
                className="min-w-[100px]"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>

              {currentStep === steps.length ? (
                <Button
                  onClick={handleCompleteSetup}
                  disabled={loading}
                  style={{ background: "linear-gradient(135deg, rgb(34 197 94) 0%, rgb(22 163 74) 100%)" }}
                  className="min-w-[150px] text-white"
                >
                  {loading ? "Completing..." : "Complete Setup"}
                  <CheckCircle className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleNextStep}
                  disabled={loading}
                  style={{ background: "linear-gradient(135deg, rgb(139 92 246) 0%, rgb(124 58 237) 100%)" }}
                  className="min-w-[100px] text-white"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
