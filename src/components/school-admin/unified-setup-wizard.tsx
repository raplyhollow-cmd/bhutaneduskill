/**
 * UNIFIED SETUP WIZARD
 *
 * Combines the best features of both InitialSetupWizard and SchoolAdminSetupClient.
 * This is the single comprehensive setup wizard for first-time school admin login.
 *
 * Steps:
 * 1. Welcome & Overview
 * 2. School Profile (contact info)
 * 3. Academic Calendar
 * 4. Departments (with quick-add recommended)
 * 5. Classes (with quick-add all grades)
 * 6. Schedule Configuration (bell schedules)
 * 7. Grading System
 * 8. Review & Complete
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  GraduationCap,
  Calendar,
  Clock,
  Award,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Loader2,
  AlertCircle,
  Plus,
  Trash2,
  School,
  Sparkles,
  Users,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface UnifiedSetupWizardProps {
  schoolId: string;
  schoolName?: string;
  schoolCode?: string;
  grades?: string[];
  onComplete?: () => void;
}

interface WizardData {
  // Step 2: School Profile
  email: string;
  phone: string;
  address: string;
  city: string;
  website: string;

  // Step 3: Academic Calendar
  academicYearStart: string;
  academicYearEnd: string;
  currentTerm: string;
  terms: Array<{ name: string; startDate: string; endDate: string }>;
  workingDays: string[];

  // Step 4: Departments
  departments: Array<{ name: string; code: string; description: string }>;

  // Step 5: Classes
  classes: Array<{ grade: string; sections: string }>;

  // Step 6: Schedule Configuration
  bellScheduleName: string;
  regularSchedule: Array<{
    periodNumber: number;
    name: string;
    startTime: string;
    endTime: string;
    type: "class" | "break" | "lunch";
  }>;
  ppSchedule: Array<{
    periodNumber: number;
    name: string;
    startTime: string;
    endTime: string;
    type: "class" | "break" | "lunch";
  }>;
  ppDifferentSchedule: boolean;

  // Step 7: Grading System
  gradingSystem: string;
  passMark: string;
  grades: Array<{ grade: string; minScore: number; maxScore: number; label: string }>;
}

const STEPS = [
  { id: 1, name: "Welcome", icon: School, description: "Get started" },
  { id: 2, name: "Profile", icon: Building2, description: "School contact info" },
  { id: 3, name: "Calendar", icon: Calendar, description: "Academic year setup" },
  { id: 4, name: "Departments", icon: GraduationCap, description: "Add departments" },
  { id: 5, name: "Classes", icon: Users, description: "Add your classes" },
  { id: 6, name: "Schedule", icon: Clock, description: "Bell schedule" },
  { id: 7, name: "Grading", icon: Award, description: "Grading system" },
  { id: 8, name: "Review", icon: CheckCircle2, description: "Complete setup" },
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

const WORKING_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const GRADING_PRESETS: Record<string, Array<{ grade: string; minScore: number; maxScore: number; label: string }>> = {
  bhutan: [
    { grade: "A+", minScore: 90, maxScore: 100, label: "Excellent" },
    { grade: "A", minScore: 80, maxScore: 89, label: "Very Good" },
    { grade: "B", minScore: 70, maxScore: 79, label: "Good" },
    { grade: "C", minScore: 60, maxScore: 69, label: "Satisfactory" },
    { grade: "D", minScore: 50, maxScore: 59, label: "Needs Improvement" },
    { grade: "E", minScore: 0, maxScore: 49, label: "Needs Improvement" },
  ],
  gpa: [
    { grade: "4.0", minScore: 93, maxScore: 100, label: "A" },
    { grade: "3.7", minScore: 90, maxScore: 92, label: "A-" },
    { grade: "3.3", minScore: 87, maxScore: 89, label: "B+" },
    { grade: "3.0", minScore: 83, maxScore: 86, label: "B" },
    { grade: "2.7", minScore: 80, maxScore: 82, label: "B-" },
    { grade: "2.3", minScore: 77, maxScore: 79, label: "C+" },
    { grade: "2.0", minScore: 73, maxScore: 76, label: "C" },
    { grade: "1.7", minScore: 70, maxScore: 72, label: "C-" },
    { grade: "1.0", minScore: 67, maxScore: 69, label: "D+" },
    { grade: "0.0", minScore: 0, maxScore: 66, label: "F" },
  ],
};

export function UnifiedSetupWizard({
  schoolId,
  schoolName = "",
  schoolCode = "",
  grades = [],
  onComplete,
}: UnifiedSetupWizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [data, setData] = useState<WizardData>({
    email: "",
    phone: "",
    address: "",
    city: "",
    website: "",
    academicYearStart: String(new Date().getFullYear()),
    academicYearEnd: String(new Date().getFullYear() + 1),
    currentTerm: "Term 1",
    terms: [
      { name: "Term 1", startDate: "2024-03-01", endDate: "2024-06-30" },
      { name: "Term 2", startDate: "2024-07-01", endDate: "2024-12-31" },
    ],
    workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    departments: [],
    classes: [],
    bellScheduleName: "Regular Schedule",
    regularSchedule: [
      { periodNumber: 1, name: "Period 1", startTime: "08:00", endTime: "08:45", type: "class" as const },
      { periodNumber: 2, name: "Period 2", startTime: "08:50", endTime: "09:35", type: "class" as const },
      { periodNumber: 3, name: "Break", startTime: "09:35", endTime: "09:45", type: "break" as const },
      { periodNumber: 4, name: "Period 3", startTime: "09:45", endTime: "10:30", type: "class" as const },
      { periodNumber: 5, name: "Period 4", startTime: "10:35", endTime: "11:20", type: "class" as const },
      { periodNumber: 6, name: "Lunch", startTime: "11:20", endTime: "12:05", type: "lunch" as const },
      { periodNumber: 7, name: "Period 5", startTime: "12:05", endTime: "12:50", type: "class" as const },
      { periodNumber: 8, name: "Period 6", startTime: "12:55", endTime: "13:30", type: "class" as const },
    ],
    ppSchedule: [
      { periodNumber: 1, name: "Period 1", startTime: "08:00", endTime: "08:40", type: "class" as const },
      { periodNumber: 2, name: "Break", startTime: "08:40", endTime: "08:50", type: "break" as const },
      { periodNumber: 3, name: "Period 2", startTime: "08:50", endTime: "09:30", type: "class" as const },
      { periodNumber: 4, name: "Lunch", startTime: "09:30", endTime: "10:00", type: "lunch" as const },
      { periodNumber: 5, name: "Period 3", startTime: "10:00", endTime: "10:40", type: "class" as const },
      { periodNumber: 6, name: "Break", startTime: "10:40", endTime: "10:50", type: "break" as const },
      { periodNumber: 7, name: "Period 4", startTime: "10:50", endTime: "11:30", type: "class" as const },
    ],
    ppDifferentSchedule: grades.includes("PP"),
    gradingSystem: "bhutan",
    passMark: "40",
    grades: GRADING_PRESETS.bhutan,
  });

  const [newDepartment, setNewDepartment] = useState({ name: "", code: "", description: "" });
  const [newClass, setNewClass] = useState({ grade: "", sections: "A" });
  const [selectedDepartments, setSelectedDepartments] = useState<Set<number>>(new Set());
  const [scheduleConfig, setScheduleConfig] = useState({
    schoolStartTime: "08:00",
    numberOfPeriods: 8,
    periodMinutes: 45,
    breakMinutes: 5,
    lunchBreakMinutes: 45,
  });

  const updateData = <K extends keyof WizardData>(field: K, value: WizardData[K]) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const validateStep = (step: number): boolean => {
    setError("");
    switch (step) {
      case 1:
        return true;
      case 2:
        if (!data.email || !data.phone || !data.city) {
          setError("Please fill in all required fields");
          return false;
        }
        return true;
      case 3:
        if (!data.academicYearStart || !data.academicYearEnd) {
          setError("Please set academic year dates");
          return false;
        }
        if (data.workingDays.length === 0) {
          setError("Please select at least one working day");
          return false;
        }
        return true;
      case 4:
        return true; // Departments are optional
      case 5:
        return true; // Classes are optional
      case 6:
        if (data.regularSchedule.length === 0) {
          setError("Please create a bell schedule");
          return false;
        }
        return true;
      case 7:
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

  const toggleWorkingDay = (day: string) => {
    setData((prev) => ({
      ...prev,
      workingDays: prev.workingDays.includes(day)
        ? prev.workingDays.filter((d) => d !== day)
        : [...prev.workingDays, day],
    }));
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
      const response = await fetch("/api/school-admin/settings/complete-setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schoolName,
          schoolCode,
          ...data,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to complete setup");
      }

      setSuccess(true);
      setTimeout(() => {
        onComplete?.();
        router.push("/school-admin?welcome=true");
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to complete setup");
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
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-600 text-white mb-4 shadow-lg">
                <School className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to Bhutan EduSkill!</h2>
              <p className="text-gray-600 max-w-md mx-auto">
                Your school has been created. Let's complete your school profile in just a few steps.
              </p>
            </div>

            <div className="bg-violet-50 border border-violet-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="w-5 h-5 text-violet-600" />
                <h3 className="font-semibold text-violet-900">School Information (Verified)</h3>
              </div>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-violet-600">School Name:</span>
                  <span className="ml-2 font-medium text-violet-900">{schoolName}</span>
                </div>
                <div>
                  <span className="text-violet-600">School Code:</span>
                  <span className="ml-2 font-mono font-medium text-violet-900">{schoolCode}</span>
                </div>
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
              <h2 className="text-xl font-semibold text-gray-900 mb-1">School Profile</h2>
              <p className="text-sm text-gray-500">Add your school's contact information</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">School Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={data.email}
                  onChange={(e) => updateData("email", e.target.value)}
                  placeholder="school@bhutan.edu.bt"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  value={data.phone}
                  onChange={(e) => updateData("phone", e.target.value)}
                  placeholder="+975 2 123456"
                />
              </div>
              <div>
                <Label htmlFor="city">City/Town *</Label>
                <Input
                  id="city"
                  value={data.city}
                  onChange={(e) => updateData("city", e.target.value)}
                  placeholder="Thimphu"
                />
              </div>
              <div>
                <Label htmlFor="website">Website (optional)</Label>
                <Input
                  id="website"
                  value={data.website}
                  onChange={(e) => updateData("website", e.target.value)}
                  placeholder="https://"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={data.address}
                  onChange={(e) => updateData("address", e.target.value)}
                  placeholder="Full school address"
                  rows={2}
                />
              </div>
            </div>
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
              <h2 className="text-xl font-semibold text-gray-900 mb-1">Academic Calendar</h2>
              <p className="text-sm text-gray-500">Configure your school year and terms</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Academic Year Start *</Label>
                <Input
                  type="number"
                  value={data.academicYearStart}
                  onChange={(e) => updateData("academicYearStart", e.target.value)}
                  placeholder="2024"
                />
              </div>
              <div>
                <Label>Academic Year End *</Label>
                <Input
                  type="number"
                  value={data.academicYearEnd}
                  onChange={(e) => updateData("academicYearEnd", e.target.value)}
                  placeholder="2025"
                />
              </div>
            </div>

            <div>
              <Label>Working Days</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {WORKING_DAYS.map((day) => (
                  <button
                    key={day}
                    onClick={() => toggleWorkingDay(day)}
                    className={cn(
                      "px-3 py-2 rounded-lg text-sm font-medium transition-all",
                      data.workingDays.includes(day)
                        ? "bg-violet-600 text-white shadow-md"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    )}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label>Terms</Label>
              <div className="space-y-2 mt-2">
                {data.terms.map((term, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <Input
                      value={term.name}
                      onChange={(e) => {
                        const newTerms = [...data.terms];
                        newTerms[index].name = e.target.value;
                        updateData("terms", newTerms);
                      }}
                      placeholder="Term 1"
                      className="flex-1"
                    />
                    <Input
                      type="date"
                      value={term.startDate}
                      onChange={(e) => {
                        const newTerms = [...data.terms];
                        newTerms[index].startDate = e.target.value;
                        updateData("terms", newTerms);
                      }}
                      className="w-36"
                    />
                    <span className="text-gray-400">to</span>
                    <Input
                      type="date"
                      value={term.endDate}
                      onChange={(e) => {
                        const newTerms = [...data.terms];
                        newTerms[index].endDate = e.target.value;
                        updateData("terms", newTerms);
                      }}
                      className="w-36"
                    />
                  </div>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  updateData("terms", [
                    ...data.terms,
                    { name: `Term ${data.terms.length + 1}`, startDate: "", endDate: "" },
                  ])
                }
                className="mt-2"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Term
              </Button>
            </div>
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
              <h2 className="text-xl font-semibold text-gray-900 mb-1">Academic Departments</h2>
              <p className="text-sm text-gray-500">Create departments for subject organization</p>
            </div>

            {data.departments.length === 0 && (
              <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                <div className="flex items-start gap-3 mb-4">
                  <Sparkles className="w-5 h-5 text-amber-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-amber-900">Quick Start</h3>
                    <p className="text-sm text-amber-700">Select recommended departments to add quickly</p>
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
                  <Button onClick={addRecommendedDepartments} className="bg-amber-600 hover:bg-amber-700">
                    Add {selectedDepartments.size} Selected
                  </Button>
                )}
              </div>
            )}

            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="font-medium text-gray-900 mb-3">Add Custom Department</h3>
              <div className="flex flex-col sm:flex-row gap-3">
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
                  className="w-32 uppercase"
                />
                <Button onClick={handleAddDepartment} className="bg-violet-600 hover:bg-violet-700">
                  Add
                </Button>
              </div>
            </div>

            {data.departments.length > 0 && (
              <div className="grid md:grid-cols-2 gap-3">
                <AnimatePresence>
                  {data.departments.map((dept, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="bg-white border border-gray-200 rounded-lg p-3 flex items-center justify-between group hover:border-violet-200"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{dept.name}</p>
                        <p className="text-xs text-gray-500 font-mono">{dept.code}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-600"
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

      case 5:
        return (
          <motion.div
            key="step5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-1">Classes Setup</h2>
              <p className="text-sm text-gray-500">Add classes for each grade level</p>
            </div>

            {data.classes.length === 0 && (
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                <div className="flex items-start gap-3 mb-4">
                  <Sparkles className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-blue-900">Quick Start</h3>
                    <p className="text-sm text-blue-700">Add all grades at once with default sections</p>
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

            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="font-medium text-gray-900 mb-3">Add New Class</h3>
              <div className="flex flex-col sm:flex-row gap-3">
                <select
                  value={newClass.grade}
                  onChange={(e) => setNewClass({ ...newClass, grade: e.target.value })}
                  className="flex-1 px-3 py-2 rounded-lg border border-gray-200 bg-white"
                >
                  <option value="">Select Grade</option>
                  {GRADES.map((grade) => (
                    <option key={grade} value={grade}>
                      Class {grade}
                    </option>
                  ))}
                </select>
                <Input
                  placeholder="Sections (e.g., A,B,C)"
                  value={newClass.sections}
                  onChange={(e) => setNewClass({ ...newClass, sections: e.target.value.toUpperCase() })}
                  className="w-48 uppercase"
                />
                <Button onClick={handleAddClass} className="bg-violet-600 hover:bg-violet-700">
                  Add Class
                </Button>
              </div>
            </div>

            {data.classes.length > 0 && (
              <div className="grid md:grid-cols-4 gap-3">
                <AnimatePresence>
                  {data.classes.map((cls, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="bg-white border border-gray-200 rounded-lg p-3 flex items-center justify-between group hover:border-violet-200"
                    >
                      <div>
                        <p className="font-medium text-gray-900">Class {cls.grade}</p>
                        <p className="text-xs text-gray-500">Sec: {cls.sections}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-600"
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

      case 6:
        return (
          <motion.div
            key="step6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-1">Bell Schedule</h2>
              <p className="text-sm text-gray-500">Configure your daily class periods</p>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="font-medium text-gray-900 mb-3">Current Schedule</h3>
              <div className="space-y-2">
                {data.regularSchedule.map((period, index) => (
                  <div key={index} className="flex items-center gap-3 text-sm">
                    <Badge variant={period.type === "class" ? "default" : "secondary"}>
                      {period.type}
                    </Badge>
                    <span className="w-20 font-medium">{period.name}</span>
                    <span className="text-gray-500">
                      {period.startTime} - {period.endTime}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {grades.includes("PP") && (
              <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg">
                <input
                  type="checkbox"
                  id="ppDifferent"
                  checked={data.ppDifferentSchedule}
                  onChange={(e) => updateData("ppDifferentSchedule", e.target.checked)}
                  className="w-4 h-4"
                />
                <Label htmlFor="ppDifferent" className="cursor-pointer">
                  PP (Pre-Primary) has a different schedule
                </Label>
              </div>
            )}
          </motion.div>
        );

      case 7:
        return (
          <motion.div
            key="step7"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-1">Grading System</h2>
              <p className="text-sm text-gray-500">Choose a grading scale for your school</p>
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              <button
                onClick={() => {
                  updateData("gradingSystem", "bhutan");
                  updateData("grades", GRADING_PRESETS.bhutan);
                }}
                className={cn(
                  "p-4 rounded-xl border-2 text-left transition-all",
                  data.gradingSystem === "bhutan"
                    ? "border-violet-600 bg-violet-50"
                    : "border-gray-200 hover:border-violet-300"
                )}
              >
                <h3 className="font-semibold text-gray-900">Bhutan National</h3>
                <p className="text-sm text-gray-500">A+, A, B, C, D, E scale</p>
              </button>
              <button
                onClick={() => {
                  updateData("gradingSystem", "gpa");
                  updateData("grades", GRADING_PRESETS.gpa);
                }}
                className={cn(
                  "p-4 rounded-xl border-2 text-left transition-all",
                  data.gradingSystem === "gpa"
                    ? "border-violet-600 bg-violet-50"
                    : "border-gray-200 hover:border-violet-300"
                )}
              >
                <h3 className="font-semibold text-gray-900">GPA Scale (4.0)</h3>
                <p className="text-sm text-gray-500">4.0, 3.7, 3.3, etc.</p>
              </button>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="font-medium text-gray-900 mb-3">Grade Scale</h3>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                {data.grades.map((grade, index) => (
                  <div key={index} className="bg-white p-2 rounded-lg text-center">
                    <p className="font-bold text-violet-600">{grade.grade}</p>
                    <p className="text-xs text-gray-500">{grade.minScore}%+</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        );

      case 8:
        return (
          <motion.div
            key="step8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-1">Review & Complete</h2>
              <p className="text-sm text-gray-500">Review your setup before completing</p>
            </div>

            <div className="bg-violet-50 rounded-xl p-4 border border-violet-100">
              <h3 className="font-semibold text-violet-900 mb-2">School</h3>
              <p className="text-sm text-violet-700">{schoolName} ({schoolCode})</p>
              <p className="text-sm text-violet-600">{data.city}</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white border rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-violet-600" />
                  Academic Year
                </h3>
                <p className="text-sm text-gray-600">
                  {data.academicYearStart} - {data.academicYearEnd}
                </p>
                <p className="text-xs text-gray-400">{data.terms.length} terms</p>
              </div>

              <div className="bg-white border rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-violet-600" />
                  Departments
                </h3>
                <p className="text-2xl font-bold text-violet-600">{data.departments.length}</p>
                <p className="text-xs text-gray-400">departments created</p>
              </div>

              <div className="bg-white border rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <Users className="w-4 h-4 text-violet-600" />
                  Classes
                </h3>
                <p className="text-2xl font-bold text-violet-600">{data.classes.length}</p>
                <p className="text-xs text-gray-400">classes created</p>
              </div>

              <div className="bg-white border rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-violet-600" />
                  Schedule
                </h3>
                <p className="text-sm text-gray-600">{data.regularSchedule.length} periods</p>
                {data.ppDifferentSchedule && (
                  <p className="text-xs text-gray-400">+ PP schedule</p>
                )}
              </div>
            </div>

            <div className="bg-green-50 rounded-xl p-4 border border-green-100">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-green-900">Ready to Start!</p>
                  <p className="text-sm text-green-700">
                    Your school setup is complete. Click the button below to finish.
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

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-50">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Setup Complete!</h2>
            <p className="text-gray-600">Redirecting to your dashboard...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Progress Steps */}
        <div className="mb-6">
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
                        "w-8 h-8 rounded-full flex items-center justify-center transition-all text-xs",
                        isCompleted
                          ? "bg-green-500 text-white"
                          : isCurrent
                          ? "bg-gradient-to-br from-violet-600 to-purple-600 text-white"
                          : "bg-gray-100 text-gray-400"
                      )}
                    >
                      {isCompleted ? <Check className="w-4 h-4" /> : <StepIcon className="w-4 h-4" />}
                    </div>
                    <p
                      className={cn(
                        "text-[10px] mt-1 text-center hidden sm:block",
                        isCurrent ? "font-semibold text-violet-700" : isCompleted ? "font-medium text-green-600" : "text-gray-400"
                      )}
                    >
                      {step.name}
                    </p>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div
                      className={cn(
                        "h-0.5 flex-1 mx-1 rounded-full transition-all",
                        isCompleted ? "bg-green-400" : "bg-gray-200"
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Main Card */}
        <Card className="shadow-xl border-0">
          <CardContent className="p-6">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 flex items-center gap-3 p-3 bg-red-50 text-red-700 rounded-lg"
              >
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </motion.div>
            )}

            <AnimatePresence mode="wait">{renderStep()}</AnimatePresence>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
              <Button
                variant="outline"
                onClick={handlePrevStep}
                disabled={currentStep === 1 || loading}
                className="h-10 px-4"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>

              {currentStep === STEPS.length ? (
                <Button
                  onClick={handleCompleteSetup}
                  disabled={loading}
                  className="h-10 px-6 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
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
                <Button onClick={handleNextStep} className="h-10 px-6 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white">
                  Continue
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-gray-500 mt-4">
          Step {currentStep} of {STEPS.length}
        </p>
      </div>
    </div>
  );
}
