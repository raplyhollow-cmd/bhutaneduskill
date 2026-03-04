"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle2,
  Circle,
  ChevronRight,
  GraduationCap,
  Calendar,
  Users,
  Building2,
  Sparkles,
  ArrowLeft,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface SchoolAdminSetupClientProps {
  schoolId: string;
  schoolName: string;
  schoolCode: string;
  departmentCount: number;
}

interface SetupData {
  // Step 1: Academic Calendar (was Academic Year)
  academicYear: string;
  terms: string;
  holidays: string;
  // Step 2: Departments
  departments: Array<{ name: string; code: string; description: string }>;
  // Step 3: Classes
  classes: Array<{ grade: string; sections: string }>;
}

const STEPS = [
  { id: 1, name: "Academic Calendar", icon: Calendar, description: "Set your school year" },
  { id: 2, name: "Departments", icon: GraduationCap, description: "Create departments" },
  { id: 3, name: "Classes", icon: Users, description: "Add your classes" },
  { id: 4, name: "Review", icon: CheckCircle2, description: "Review & finish" },
];

const RECOMMENDED_DEPARTMENTS = [
  { name: "Mathematics", code: "MATH" },
  { name: "Science", code: "SCI" },
  { name: "Dzongkha", code: "DZO" },
  { name: "English", code: "ENG" },
  { name: "Social Studies", code: "SOC" },
  { name: "IT/Computer Science", code: "ICT" },
  { name: "Arts & Music", code: "ART" },
  { name: "Physical Education", code: "PE" },
];

const GRADES = ["PP", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];

export function SchoolAdminSetupClient({
  schoolId,
  schoolName,
  schoolCode,
  departmentCount,
}: SchoolAdminSetupClientProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [data, setData] = useState<SetupData>({
    academicYear: `${new Date().getFullYear()}-${(new Date().getFullYear() + 1).toString().slice(-2)}`,
    terms: "2",
    holidays: "",
    departments: [],
    classes: [],
  });

  const [newDepartment, setNewDepartment] = useState({ name: "", code: "", description: "" });
  const [newClass, setNewClass] = useState({ grade: "", sections: "A" });
  const [selectedDepartments, setSelectedDepartments] = useState<Set<number>>(new Set());

  const updateData = <K extends keyof SetupData>(field: K, value: SetupData[K]) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const validateStep = (step: number): boolean => {
    setError("");
    switch (step) {
      case 1:
        if (!data.academicYear.trim()) {
          setError("Please enter academic year");
          return false;
        }
        return true;
      case 2:
        if (data.departments.length === 0) {
          setError("Please add at least one department");
          return false;
        }
        return true;
      case 3:
        if (data.classes.length === 0) {
          setError("Please add at least one class");
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleNextStep = () => {
    if (!validateStep(currentStep)) return;
    setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
  };

  const handlePrevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const toggleRecommendedDepartment = (index: number) => {
    setSelectedDepartments((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const addRecommendedDepartments = () => {
    const toAdd = RECOMMENDED_DEPARTMENTS.filter((_, i) => selectedDepartments.has(i));
    setData((prev) => ({
      ...prev,
      departments: [...prev.departments, ...toAdd.map((d) => ({ ...d, description: "" }))],
    }));
    setSelectedDepartments(new Set());
  };

  const handleAddDepartment = () => {
    if (!newDepartment.name || !newDepartment.code) {
      setError("Please enter department name and code");
      return;
    }
    setData((prev) => ({
      ...prev,
      departments: [...prev.departments, { ...newDepartment }],
    }));
    setNewDepartment({ name: "", code: "", description: "" });
    setError("");
  };

  const handleRemoveDepartment = (index: number) => {
    setData((prev) => ({
      ...prev,
      departments: prev.departments.filter((_, i) => i !== index),
    }));
  };

  const handleAddClass = () => {
    if (!newClass.grade) {
      setError("Please select a grade");
      return;
    }
    setData((prev) => ({
      ...prev,
      classes: [...prev.classes, { ...newClass }],
    }));
    setNewClass({ grade: "", sections: "A" });
    setError("");
  };

  const handleRemoveClass = (index: number) => {
    setData((prev) => ({
      ...prev,
      classes: prev.classes.filter((_, i) => i !== index),
    }));
  };

  const handleCompleteSetup = async () => {
    setLoading(true);
    setError("");
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
        router.push("/school-admin?welcome=true");
      } else {
        const result = await response.json();
        setError(result.error || "Failed to complete setup");
      }
    } catch (error) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <motion.div
            key="step1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* School Info Card - Read Only */}
            <div className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-2xl p-5 border border-violet-100">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-violet-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-violet-500/30">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-violet-900">{schoolName}</h3>
                  <p className="text-sm text-violet-600 mt-1">Code: <span className="font-mono font-medium">{schoolCode}</span></p>
                  <p className="text-xs text-violet-500 mt-2 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Verified by platform
                  </p>
                </div>
              </div>
            </div>

            {/* Academic Calendar Form */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-1">Academic Calendar</h2>
              <p className="text-sm text-gray-500 mb-6">Configure your school year and terms</p>

              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <Label htmlFor="academicYear" className="text-sm font-medium">Academic Year *</Label>
                  <Input
                    id="academicYear"
                    value={data.academicYear}
                    onChange={(e) => updateData("academicYear", e.target.value)}
                    placeholder="e.g., 2024-2025"
                    className="mt-2 h-11"
                  />
                </div>
                <div>
                  <Label htmlFor="terms" className="text-sm font-medium">Number of Terms</Label>
                  <select
                    id="terms"
                    value={data.terms}
                    onChange={(e) => updateData("terms", e.target.value)}
                    className="w-full mt-2 h-11 px-3 rounded-xl border border-gray-200 bg-white focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none transition-all"
                  >
                    <option value="1">1 Term (Semester)</option>
                    <option value="2">2 Terms</option>
                    <option value="3">3 Terms (Trimester)</option>
                    <option value="4">4 Terms (Quarterly)</option>
                  </select>
                </div>
              </div>

              <div className="mt-5">
                <Label htmlFor="holidays" className="text-sm font-medium">Holidays & Breaks</Label>
                <Textarea
                  id="holidays"
                  value={data.holidays}
                  onChange={(e) => updateData("holidays", e.target.value)}
                  placeholder="e.g., Winter Break: Dec 20 - Jan 5, Summer Break: July 1 - July 31"
                  rows={3}
                  className="mt-2 resize-none rounded-xl"
                />
              </div>
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            key="step2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-1">Academic Departments</h2>
              <p className="text-sm text-gray-500 mb-6">Create departments for subject organization</p>
            </div>

            {/* Quick Add Recommended Departments */}
            {data.departments.length === 0 && (
              <div className="bg-amber-50 rounded-2xl p-5 border border-amber-100">
                <div className="flex items-start gap-3 mb-4">
                  <Sparkles className="w-5 h-5 text-amber-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-amber-900">Quick Start</h3>
                    <p className="text-sm text-amber-700 mt-1">Select recommended departments to add quickly</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {RECOMMENDED_DEPARTMENTS.map((dept, i) => (
                    <button
                      key={i}
                      onClick={() => toggleRecommendedDepartment(i)}
                      className={cn(
                        "px-3 py-2 rounded-lg text-sm font-medium transition-all",
                        selectedDepartments.has(i)
                          ? "bg-amber-600 text-white shadow-md"
                          : "bg-white text-amber-800 border border-amber-200 hover:bg-amber-100"
                      )}
                    >
                      {dept.name}
                    </button>
                  ))}
                </div>
                {selectedDepartments.size > 0 && (
                  <Button
                    onClick={addRecommendedDepartments}
                    className="bg-amber-600 hover:bg-amber-700 h-9"
                  >
                    Add {selectedDepartments.size} Selected
                  </Button>
                )}
              </div>
            )}

            {/* Add Custom Department */}
            <div className="bg-gray-50 rounded-2xl p-5">
              <h3 className="font-medium text-gray-900 mb-4">Add Custom Department</h3>
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  placeholder="Department Name"
                  value={newDepartment.name}
                  onChange={(e) => setNewDepartment({ ...newDepartment, name: e.target.value })}
                  className="flex-1 h-11"
                />
                <Input
                  placeholder="Code (e.g., MATH)"
                  value={newDepartment.code}
                  onChange={(e) => setNewDepartment({ ...newDepartment, code: e.target.value.toUpperCase() })}
                  className="w-32 h-11 uppercase"
                />
                <Button
                  onClick={handleAddDepartment}
                  className="bg-violet-600 hover:bg-violet-700 h-11 px-6"
                >
                  Add
                </Button>
              </div>
            </div>

            {/* Department List */}
            {data.departments.length > 0 && (
              <div className="grid md:grid-cols-2 gap-3">
                <AnimatePresence>
                  {data.departments.map((dept, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between group hover:border-violet-200 hover:shadow-sm transition-all"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{dept.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5 font-mono">{dept.code}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-600 transition-all"
                        onClick={() => handleRemoveDepartment(index)}
                      >
                        ×
                      </Button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            key="step3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-1">Classes Setup</h2>
              <p className="text-sm text-gray-500 mb-6">Add classes for each grade level</p>
            </div>

            {/* Add Class */}
            <div className="bg-gray-50 rounded-2xl p-5">
              <h3 className="font-medium text-gray-900 mb-4">Add New Class</h3>
              <div className="flex flex-col sm:flex-row gap-3">
                <select
                  value={newClass.grade}
                  onChange={(e) => setNewClass({ ...newClass, grade: e.target.value })}
                  className="flex-1 h-11 px-3 rounded-xl border border-gray-200 bg-white focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none"
                >
                  <option value="">Select Grade</option>
                  {GRADES.map((grade) => (
                    <option key={grade} value={grade}>Class {grade}</option>
                  ))}
                </select>
                <Input
                  placeholder="Sections (e.g., A,B,C)"
                  value={newClass.sections}
                  onChange={(e) => setNewClass({ ...newClass, sections: e.target.value.toUpperCase() })}
                  className="w-48 h-11 uppercase"
                />
                <Button
                  onClick={handleAddClass}
                  className="bg-violet-600 hover:bg-violet-700 h-11 px-6"
                >
                  Add Class
                </Button>
              </div>
            </div>

            {/* Quick Add All Grades */}
            {data.classes.length === 0 && (
              <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100">
                <div className="flex items-start gap-3 mb-4">
                  <Sparkles className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-blue-900">Quick Start</h3>
                    <p className="text-sm text-blue-700 mt-1">Add all grades at once with default sections</p>
                  </div>
                </div>
                <Button
                  onClick={() => {
                    setData((prev) => ({
                      ...prev,
                      classes: GRADES.map((grade) => ({ grade, sections: "A" })),
                    }));
                  }}
                  variant="outline"
                  className="bg-white border-blue-200 text-blue-700 hover:bg-blue-100"
                >
                  Add All Grades (Section A)
                </Button>
              </div>
            )}

            {/* Class List */}
            {data.classes.length > 0 && (
              <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-3">
                <AnimatePresence>
                  {data.classes.map((cls, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between group hover:border-violet-200 hover:shadow-sm transition-all"
                    >
                      <div>
                        <p className="font-medium text-gray-900">Class {cls.grade}</p>
                        <p className="text-xs text-gray-500 mt-0.5">Sec: {cls.sections}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-600 transition-all"
                        onClick={() => handleRemoveClass(index)}
                      >
                        ×
                      </Button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        );

      case 4:
        return (
          <motion.div
            key="step4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-1">Review & Complete</h2>
              <p className="text-sm text-gray-500 mb-6">Review your setup before completing</p>
            </div>

            {/* School Summary */}
            <div className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-2xl p-5 border border-violet-100">
              <h3 className="font-semibold text-violet-900 mb-3">School Information</h3>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-violet-600">School Name</p>
                  <p className="font-medium text-violet-900">{schoolName}</p>
                </div>
                <div>
                  <p className="text-violet-600">School Code</p>
                  <p className="font-mono font-medium text-violet-900">{schoolCode}</p>
                </div>
              </div>
            </div>

            {/* Academic Calendar Summary */}
            <Card className="border-gray-200">
              <CardContent className="p-5">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-violet-600" />
                  Academic Calendar
                </h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Academic Year</p>
                    <p className="font-medium text-gray-900">{data.academicYear}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Terms</p>
                    <p className="font-medium text-gray-900">{data.terms} term(s)</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Departments Summary */}
            <Card className="border-gray-200">
              <CardContent className="p-5">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-violet-600" />
                  Departments ({data.departments.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {data.departments.map((dept, i) => (
                    <span key={i} className="px-3 py-1.5 bg-gray-100 rounded-lg text-sm font-medium">
                      {dept.name} <span className="text-gray-400 font-mono text-xs ml-1">({dept.code})</span>
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Classes Summary */}
            <Card className="border-gray-200">
              <CardContent className="p-5">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4 text-violet-600" />
                  Classes ({data.classes.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {data.classes.map((cls, i) => (
                    <span key={i} className="px-3 py-1.5 bg-gray-100 rounded-lg text-sm font-medium">
                      Class {cls.grade} <span className="text-gray-400 text-xs ml-1">Sec: {cls.sections}</span>
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Success Message */}
            <div className="bg-green-50 rounded-2xl p-5 border border-green-100">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-green-900">Ready to Start!</p>
                  <p className="text-sm text-green-700 mt-1">
                    Your school setup is complete. You can add students, teachers, and more from your dashboard.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-600 text-white mb-4 shadow-lg shadow-violet-500/30">
            <Building2 className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Complete Your School Setup</h1>
          <p className="text-sm text-gray-600">Just a few more steps to get started</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => {
              const StepIcon = step.icon;
              const isCompleted = currentStep > step.id;
              const isCurrent = currentStep === step.id;

              return (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300",
                        isCompleted
                          ? "bg-green-500 text-white shadow-md shadow-green-500/30"
                          : isCurrent
                          ? "bg-gradient-to-br from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-500/30"
                          : "bg-gray-100 text-gray-400"
                      )}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <StepIcon className="w-5 h-5" />
                      )}
                    </div>
                    <p
                      className={cn(
                        "text-xs mt-2 text-center transition-colors",
                        isCurrent ? "font-semibold text-violet-700" : isCompleted ? "font-medium text-green-600" : "text-gray-400"
                      )}
                    >
                      {step.name}
                    </p>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div
                      className={cn(
                        "h-0.5 flex-1 mx-2 rounded-full transition-all duration-300",
                        isCompleted ? "bg-green-400" : "bg-gray-200"
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content Card */}
        <Card className="shadow-xl border-0">
          <CardContent className="p-6 md:p-8">
            {/* Error Display */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 flex items-center gap-3 p-4 bg-red-50 text-red-700 rounded-xl"
              >
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </motion.div>
            )}

            {/* Step Content with Animation */}
            <AnimatePresence mode="wait">
              {renderStep()}
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
              <Button
                variant="outline"
                onClick={handlePrevStep}
                disabled={currentStep === 1 || loading}
                className="h-11 px-6"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>

              {currentStep === STEPS.length ? (
                <Button
                  onClick={handleCompleteSetup}
                  disabled={loading}
                  className="h-11 px-8 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg shadow-green-500/30"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Completing...
                    </>
                  ) : (
                    <>
                      Complete Setup
                      <CheckCircle2 className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={handleNextStep}
                  className="h-11 px-8 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-lg shadow-violet-500/30"
                >
                  {currentStep === STEPS.length - 1 ? "Review" : "Continue"}
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Step Description Footer */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Step {currentStep} of {STEPS.length}: {STEPS[currentStep - 1]?.description}
          </p>
        </div>
      </div>
    </div>
  );
}
