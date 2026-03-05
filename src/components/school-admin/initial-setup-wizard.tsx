/**
 * SCHOOL ADMIN - INITIAL SETUP WIZARD
 *
 * Multi-step wizard for first-time school admin setup.
 * Shows automatically on first login when school.setupComplete = false.
 *
 * Steps:
 * 1. Welcome & Overview
 * 2. School Profile (basic info)
 * 3. Academic Calendar (year, terms, working days)
 * 4. Schedule Configuration (bell schedules, including PP special schedule)
 * 5. Grading System
 * 6. Review & Complete
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  GraduationCap,
  Calendar,
  Clock,
  Award,
  Check,
  ChevronRight,
  ChevronLeft,
  Loader2,
  AlertCircle,
  Plus,
  Trash2,
  School,
} from "lucide-react";

interface SetupWizardProps {
  schoolId: string;
  schoolName?: string; // Pre-populated from platform admin
  schoolCode?: string; // Pre-populated from platform admin
  hasPPClasses?: boolean; // Whether school has pre-primary classes
  grades?: string[]; // Available grades (to determine if PP exists)
  onComplete?: () => void;
}

interface WizardData {
  // Step 1: School Profile (read-only name/code from platform admin, editable contact info)
  schoolName: string; // Read-only, pre-populated
  schoolCode: string; // Read-only, pre-populated
  email: string;
  phone: string;
  address: string;
  city: string;
  website: string;

  // Step 2: Academic Calendar
  academicYearStart: string;
  academicYearEnd: string;
  currentTerm: string;
  terms: Array<{ name: string; startDate: string; endDate: string }>;
  workingDays: string[];

  // Step 3: Schedule Configuration
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

  // Step 4: Grading System
  gradingSystem: "percentage" | "gpa" | "cwa" | "grade";
  passMark: string;
  grades: Array<{ grade: string; minScore: number; maxScore: number; label: string }>;
}

const gradingPresets: Record<string, Array<{ grade: string; minScore: number; maxScore: number; label: string }>> = {
  percentage: [
    { grade: "A+", minScore: 90, maxScore: 100, label: "Excellent" },
    { grade: "A", minScore: 80, maxScore: 89, label: "Very Good" },
    { grade: "B", minScore: 70, maxScore: 79, label: "Good" },
    { grade: "C", minScore: 60, maxScore: 69, label: "Satisfactory" },
    { grade: "D", minScore: 50, maxScore: 59, label: "Needs Improvement" },
    { grade: "F", minScore: 0, maxScore: 49, label: "Fail" },
  ],
  gpa: [
    { grade: "4.0", minScore: 90, maxScore: 100, label: "Excellent" },
    { grade: "3.7", minScore: 85, maxScore: 89, label: "Very Good" },
    { grade: "3.3", minScore: 80, maxScore: 84, label: "Good" },
    { grade: "3.0", minScore: 75, maxScore: 79, label: "Good" },
    { grade: "2.7", minScore: 70, maxScore: 74, label: "Satisfactory" },
    { grade: "2.3", minScore: 65, maxScore: 69, label: "Satisfactory" },
    { grade: "2.0", minScore: 60, maxScore: 64, label: "Satisfactory" },
    { grade: "1.7", minScore: 55, maxScore: 59, label: "Pass" },
    { grade: "1.0", minScore: 50, maxScore: 54, label: "Pass" },
    { grade: "0.0", minScore: 0, maxScore: 49, label: "Fail" },
  ],
};

export function InitialSetupWizard({ schoolId, schoolName: prePopulatedName, schoolCode: prePopulatedCode, hasPPClasses = false, grades = [], onComplete }: SetupWizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Check if school has PP classes based on grades
  const hasPrePrimary = hasPPClasses || grades.some(g => g.toLowerCase().includes('pp') || g.toLowerCase().includes('pre-primary'));

  // Wizard data state - initialize with pre-populated values from platform admin
  const [data, setData] = useState<WizardData>({
    // Step 1 - Pre-populated from platform admin
    schoolName: prePopulatedName || "",
    schoolCode: prePopulatedCode || "",
    email: "",
    phone: "",
    address: "",
    city: "Thimphu",
    website: "",

    // Step 2
    academicYearStart: new Date().getFullYear().toString(),
    academicYearEnd: (new Date().getFullYear() + 1).toString(),
    currentTerm: "Term 1",
    terms: [
      { name: "Term 1", startDate: "2025-03-01", endDate: "2025-06-30" },
      { name: "Term 2", startDate: "2025-07-01", endDate: "2025-12-31" },
      { name: "Term 3", startDate: "2026-01-01", endDate: "2026-03-31" },
    ],
    workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],

    // Step 3
    bellScheduleName: "Regular Schedule",
    regularSchedule: [
      { periodNumber: 1, name: "Period 1", startTime: "08:00", endTime: "08:45", type: "class" },
      { periodNumber: 2, name: "Period 2", startTime: "08:45", endTime: "09:30", type: "class" },
      { periodNumber: 3, name: "Morning Break", startTime: "09:30", endTime: "09:45", type: "break" },
      { periodNumber: 4, name: "Period 3", startTime: "09:45", endTime: "10:30", type: "class" },
      { periodNumber: 5, name: "Period 4", startTime: "10:30", endTime: "11:15", type: "class" },
      { periodNumber: 6, name: "Lunch Break", startTime: "11:15", endTime: "12:00", type: "lunch" },
      { periodNumber: 7, name: "Period 5", startTime: "12:00", endTime: "12:45", type: "class" },
      { periodNumber: 8, name: "Period 6", startTime: "12:45", endTime: "13:30", type: "class" },
    ],
    ppSchedule: [
      { periodNumber: 1, name: "Morning Activity", startTime: "09:00", endTime: "09:30", type: "class" },
      { periodNumber: 2, name: "Snack Break", startTime: "09:30", endTime: "09:45", type: "break" },
      { periodNumber: 3, name: "Learning Time", startTime: "09:45", endTime: "10:30", type: "class" },
      { periodNumber: 4, name: "Nap Time", startTime: "10:30", endTime: "11:00", type: "break" },
      { periodNumber: 5, name: "Activity Time", startTime: "11:00", endTime: "11:45", type: "class" },
      { periodNumber: 6, name: "Lunch", startTime: "11:45", endTime: "12:30", type: "lunch" },
      { periodNumber: 7, name: "Story Time", startTime: "12:30", endTime: "13:00", type: "class" },
    ],
    ppDifferentSchedule: true,

    // Step 4
    gradingSystem: "percentage",
    passMark: "50",
    grades: gradingPresets.percentage,
  });

  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Save all settings via API
      const res = await fetch("/api/school-admin/settings/complete-setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Failed to save settings");
      }

      setSuccess(true);

      // Redirect after a short delay
      setTimeout(() => {
        onComplete?.();
        router.push("/school-admin/dashboard");
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleWorkingDay = (day: string) => {
    setData((prev) => ({
      ...prev,
      workingDays: prev.workingDays.includes(day)
        ? prev.workingDays.filter((d) => d !== day)
        : [...prev.workingDays, day],
    }));
  };

  const updateGradingPreset = (system: string) => {
    setData((prev) => ({
      ...prev,
      gradingSystem: system as any,
      grades: gradingPresets[system] || prev.grades,
    }));
  };

  // Auto-update term end date when start date changes (maintain ~4 month duration)
  const updateTermStartDate = (index: number, newStartDate: string) => {
    const startDate = new Date(newStartDate);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 4); // Add 4 months

    const newTerms = [...data.terms];
    newTerms[index].startDate = newStartDate;
    newTerms[index].endDate = endDate.toISOString().split('T')[0];
    setData({ ...data, terms: newTerms });
  };

  // Auto-update period times when start time changes (maintain 45min duration, 5min breaks)
  const updatePeriodStartTime = (index: number, newStartTime: string, schedule: "regular" | "pp") => {
    const targetSchedule = schedule === "regular" ? data.regularSchedule : data.ppSchedule;
    const period = targetSchedule[index];

    if (!period) return;

    // Calculate duration from original
    const [startH, startM] = period.startTime.split(':').map(Number);
    const [endH, endM] = period.endTime.split(':').map(Number);
    const durationMinutes = (endH * 60 + endM) - (startH * 60 + startM);

    // Calculate new end time
    const [newStartH, newStartM] = newStartTime.split(':').map(Number);
    const newEndMinutes = (newStartH * 60 + newStartM) + durationMinutes;
    const newEndH = Math.floor(newEndMinutes / 60);
    const newEndM = newEndMinutes % 60;
    const newEndTime = `${String(newEndH).padStart(2, '0')}:${String(newEndM).padStart(2, '0')}`;

    // Update all subsequent periods to maintain gaps
    const updatedSchedule = [...targetSchedule];
    updatedSchedule[index] = { ...period, startTime: newStartTime, endTime: newEndTime };

    // Shift all later periods
    const timeDiff = (newStartH * 60 + newStartM) - (startH * 60 + startM);
    for (let i = index + 1; i < updatedSchedule.length; i++) {
      const p = updatedSchedule[i];
      const [pH, pM] = p.startTime.split(':').map(Number);
      const [peH, peM] = p.endTime.split(':').map(Number);
      const pStartMinutes = (pH * 60 + pM) + timeDiff;
      const pEndMinutes = (peH * 60 + peM) + timeDiff;
      updatedSchedule[i] = {
        ...p,
        startTime: `${String(Math.floor(pStartMinutes / 60)).padStart(2, '0')}:${String(pStartMinutes % 60).padStart(2, '0')}`,
        endTime: `${String(Math.floor(pEndMinutes / 60)).padStart(2, '0')}:${String(pEndMinutes % 60).padStart(2, '0')}`
      };
    }

    if (schedule === "regular") {
      setData({ ...data, regularSchedule: updatedSchedule });
    } else {
      setData({ ...data, ppSchedule: updatedSchedule });
    }
  };

  // Step components
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Welcome to Bhutan EduSkill!</h2>
              <p className="text-gray-600">
                Your school has been created by the platform administrator. Let's complete your school profile.
              </p>
            </div>

            {/* School Info - Read Only (from Platform Admin) */}
            <div className="bg-violet-50 border border-violet-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <School className="w-5 h-5 text-violet-600" />
                <h3 className="font-semibold text-violet-900">School Information (Verified)</h3>
              </div>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-violet-600">School Name:</span>
                  <span className="ml-2 font-medium text-violet-900">{data.schoolName || "Loading..."}</span>
                </div>
                <div>
                  <span className="text-violet-600">School Code:</span>
                  <span className="ml-2 font-mono font-medium text-violet-900">{data.schoolCode || "Loading..."}</span>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">School Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={data.email}
                  onChange={(e) => setData({ ...data, email: e.target.value })}
                  placeholder="school@example.com"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  value={data.phone}
                  onChange={(e) => setData({ ...data, phone: e.target.value })}
                  placeholder="+975 2 123456"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="address">Address *</Label>
                <Input
                  id="address"
                  value={data.address}
                  onChange={(e) => setData({ ...data, address: e.target.value })}
                  placeholder="School address"
                />
              </div>
              <div>
                <Label htmlFor="city">City/District *</Label>
                <Input
                  id="city"
                  value={data.city}
                  onChange={(e) => setData({ ...data, city: e.target.value })}
                  placeholder="e.g., Thimphu"
                />
              </div>
              <div>
                <Label htmlFor="website">Website (Optional)</Label>
                <Input
                  id="website"
                  value={data.website}
                  onChange={(e) => setData({ ...data, website: e.target.value })}
                  placeholder="https://schoolwebsite.bt"
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                <Calendar className="w-6 h-6" />
                Academic Calendar
              </h2>
              <p className="text-gray-600">
                Set up your academic year and term dates. This affects attendance, exams, and reports.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="yearStart">Academic Year Start *</Label>
                <Input
                  id="yearStart"
                  type="number"
                  value={data.academicYearStart}
                  onChange={(e) => setData({ ...data, academicYearStart: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="yearEnd">Academic Year End *</Label>
                <Input
                  id="yearEnd"
                  type="number"
                  value={data.academicYearEnd}
                  onChange={(e) => setData({ ...data, academicYearEnd: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label>Academic Terms</Label>
              <p className="text-xs text-gray-500 mb-2">Changing start date auto-updates end date (~4 months)</p>
              <div className="mt-2 space-y-2">
                {data.terms.map((term, index) => (
                  <div key={index} className="grid grid-cols-3 gap-2 items-center">
                    <Input
                      value={term.name}
                      onChange={(e) => {
                        const newTerms = [...data.terms];
                        newTerms[index].name = e.target.value;
                        setData({ ...data, terms: newTerms });
                      }}
                      placeholder="Term name"
                    />
                    <Input
                      type="date"
                      value={term.startDate}
                      onChange={(e) => updateTermStartDate(index, e.target.value)}
                    />
                    <div className="flex gap-2">
                      <Input
                        type="date"
                        value={term.endDate}
                        onChange={(e) => {
                          const newTerms = [...data.terms];
                          newTerms[index].endDate = e.target.value;
                          setData({ ...data, terms: newTerms });
                        }}
                      />
                      {data.terms.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setData({
                              ...data,
                              terms: data.terms.filter((_, i) => i !== index),
                            });
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setData({
                      ...data,
                      terms: [...data.terms, { name: "", startDate: "", endDate: "" }],
                    })
                  }
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Term
                </Button>
              </div>
            </div>

            <div>
              <Label>Working Days</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {daysOfWeek.map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleWorkingDay(day)}
                    className={`px-4 py-2 rounded-lg border-2 transition-all ${
                      data.workingDays.includes(day)
                        ? "border-violet-500 bg-violet-50 text-violet-700"
                        : "border-gray-200 hover:border-violet-300"
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                <Clock className="w-6 h-6" />
                Bell Schedule
              </h2>
              <p className="text-gray-600">
                Configure your daily bell schedule{hasPrePrimary ? ". PP (Pre-primary) classes can have different schedules." : "."}
              </p>
            </div>

            {/* Only show PP checkbox if school has PP classes */}
            {hasPrePrimary && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="ppDifferent"
                  checked={data.ppDifferentSchedule}
                  onChange={(e) => setData({ ...data, ppDifferentSchedule: e.target.checked })}
                  className="w-4 h-4"
                />
                <Label htmlFor="ppDifferent" className="cursor-pointer">
                  PP classes have different schedule (shorter hours, more breaks)
                </Label>
              </div>
            )}

            <div>
              <Label>Regular Class Schedule</Label>
              <p className="text-xs text-gray-500 mb-2">Changing start time auto-shifts all later periods</p>
              <div className="mt-2 space-y-2">
                {data.regularSchedule.map((period, index) => (
                  <div key={index} className="grid grid-cols-5 gap-2 items-center">
                    <Input
                      value={period.name}
                      onChange={(e) => {
                        const newSchedule = [...data.regularSchedule];
                        newSchedule[index].name = e.target.value;
                        setData({ ...data, regularSchedule: newSchedule });
                      }}
                      placeholder="Period name"
                    />
                    <Input
                      type="time"
                      value={period.startTime}
                      onChange={(e) => updatePeriodStartTime(index, e.target.value, "regular")}
                    />
                    <Input
                      type="time"
                      value={period.endTime}
                      onChange={(e) => {
                        const newSchedule = [...data.regularSchedule];
                        newSchedule[index].endTime = e.target.value;
                        setData({ ...data, regularSchedule: newSchedule });
                      }}
                    />
                    <select
                      value={period.type}
                      onChange={(e) => {
                        const newSchedule = [...data.regularSchedule];
                        newSchedule[index].type = e.target.value as any;
                        setData({ ...data, regularSchedule: newSchedule });
                      }}
                      className="px-3 py-2 border rounded-lg"
                    >
                      <option value="class">Class</option>
                      <option value="break">Break</option>
                      <option value="lunch">Lunch</option>
                    </select>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setData({
                          ...data,
                          regularSchedule: data.regularSchedule.filter((_, i) => i !== index),
                        });
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setData({
                      ...data,
                      regularSchedule: [
                        ...data.regularSchedule,
                        {
                          periodNumber: data.regularSchedule.length + 1,
                          name: "",
                          startTime: "",
                          endTime: "",
                          type: "class",
                        },
                      ],
                    })
                  }
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Period
                </Button>
              </div>
            </div>

            {/* Only show PP schedule if school has PP classes AND option is enabled */}
            {hasPrePrimary && data.ppDifferentSchedule && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <Label className="text-blue-900">PP Class Schedule (Pre-Primary)</Label>
                <p className="text-xs text-blue-700 mb-3">
                  PP students have shorter days with more breaks and nap time.
                </p>
                <div className="space-y-2">
                  {data.ppSchedule.map((period, index) => (
                    <div key={index} className="grid grid-cols-5 gap-2 items-center">
                      <Input
                        value={period.name}
                        onChange={(e) => {
                          const newSchedule = [...data.ppSchedule];
                          newSchedule[index].name = e.target.value;
                          setData({ ...data, ppSchedule: newSchedule });
                        }}
                        placeholder="Period name"
                      />
                      <Input
                        type="time"
                        value={period.startTime}
                        onChange={(e) => updatePeriodStartTime(index, e.target.value, "pp")}
                      />
                      <Input
                        type="time"
                        value={period.endTime}
                        onChange={(e) => {
                          const newSchedule = [...data.ppSchedule];
                          newSchedule[index].endTime = e.target.value;
                          setData({ ...data, ppSchedule: newSchedule });
                        }}
                      />
                      <select
                        value={period.type}
                        onChange={(e) => {
                          const newSchedule = [...data.ppSchedule];
                          newSchedule[index].type = e.target.value as any;
                          setData({ ...data, ppSchedule: newSchedule });
                        }}
                        className="px-3 py-2 border rounded-lg"
                      >
                        <option value="class">Activity</option>
                        <option value="break">Break</option>
                        <option value="lunch">Lunch/Nap</option>
                      </select>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setData({
                            ...data,
                            ppSchedule: data.ppSchedule.filter((_, i) => i !== index),
                          });
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                <Award className="w-6 h-6" />
                Grading System
              </h2>
              <p className="text-gray-600">
                Choose your grading system and pass mark. This affects student report cards.
              </p>
            </div>

            <div>
              <Label>Grading System</Label>
              <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2">
                {(["percentage", "gpa", "cwa", "grade"] as const).map((system) => (
                  <button
                    key={system}
                    type="button"
                    onClick={() => updateGradingPreset(system)}
                    className={`px-4 py-3 rounded-lg border-2 transition-all ${
                      data.gradingSystem === system
                        ? "border-violet-500 bg-violet-50 text-violet-700"
                        : "border-gray-200 hover:border-violet-300"
                    }`}
                  >
                    <div className="font-medium capitalize">{system}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {system === "percentage" && "0-100 scale"}
                      {system === "gpa" && "4.0 scale"}
                      {system === "cwa" && "Cumulative Weighted Average"}
                      {system === "grade" && "Letter grades only"}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="passMark">Pass Mark (%) *</Label>
              <Input
                id="passMark"
                type="number"
                value={data.passMark}
                onChange={(e) => setData({ ...data, passMark: e.target.value })}
                min="0"
                max="100"
              />
              <p className="text-xs text-gray-500 mt-1">
                Students scoring below this will be considered failing.
              </p>
            </div>

            <div>
              <Label>Grade Scale Preview</Label>
              <div className="mt-2 border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left">Grade</th>
                      <th className="px-4 py-2 text-left">Score Range</th>
                      <th className="px-4 py-2 text-left">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.grades.map((grade, index) => (
                      <tr key={index} className="border-t">
                        <td className="px-4 py-2 font-medium">{grade.grade}</td>
                        <td className="px-4 py-2">
                          {grade.minScore}% - {grade.maxScore}%
                        </td>
                        <td className="px-4 py-2 text-gray-600">{grade.label}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Review & Complete</h2>
              <p className="text-gray-600">
                Please review your settings before completing the setup.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    School Profile
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-1">
                  <p><strong>Name:</strong> {data.schoolName || "Not set"}</p>
                  <p><strong>Code:</strong> {data.schoolCode || "Not set"}</p>
                  <p><strong>Email:</strong> {data.email || "Not set"}</p>
                  <p><strong>Location:</strong> {data.city || "Not set"}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Academic Year
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-1">
                  <p><strong>Year:</strong> {data.academicYearStart} - {data.academicYearEnd}</p>
                  <p><strong>Terms:</strong> {data.terms.length} terms configured</p>
                  <p><strong>Working Days:</strong> {data.workingDays.length} days/week</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Schedule
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-1">
                  <p><strong>Regular:</strong> {data.regularSchedule.length} periods</p>
                  {data.ppDifferentSchedule && (
                    <p><strong>PP Schedule:</strong> {data.ppSchedule.length} periods</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Award className="w-4 h-4" />
                    Grading
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-1">
                  <p><strong>System:</strong> {data.gradingSystem}</p>
                  <p><strong>Pass Mark:</strong> {data.passMark}%</p>
                  <p><strong>Grade Scale:</strong> {data.grades.length} levels</p>
                </CardContent>
              </Card>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-lg flex items-center gap-2">
                <Check className="w-4 h-4" />
                Setup completed successfully! Redirecting to dashboard...
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        // schoolName and schoolCode are pre-populated, only require contact info
        return data.email && data.phone && data.address && data.city;
      case 2:
        return data.academicYearStart && data.academicYearEnd && data.terms.length > 0 && data.workingDays.length > 0;
      case 3:
        return data.regularSchedule.length > 0;
      case 4:
        return data.gradingSystem && data.passMark;
      case 5:
        return true;
      default:
        return true;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl">
        {/* Progress Steps */}
        <div className="px-6 pt-6">
          <div className="flex items-center justify-between mb-6">
            {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-medium transition-all ${
                    step === currentStep
                      ? "bg-violet-600 text-white"
                      : step < currentStep
                        ? "bg-green-500 text-white"
                        : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {step < currentStep ? <Check className="w-5 h-5" /> : step}
                </div>
                {step < totalSteps && (
                  <div
                    className={`w-full h-1 mx-2 ${
                      step < currentStep ? "bg-green-500" : "bg-gray-200"
                    }`}
                    style={{ maxWidth: "60px" }}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Step Labels */}
          <div className="flex justify-between text-xs text-gray-500 mb-4 px-1">
            <span>Profile</span>
            <span>Calendar</span>
            <span>Schedule</span>
            <span>Grading</span>
            <span>Review</span>
          </div>
        </div>

        <CardContent className="px-6 py-6">
          {renderStep()}
        </CardContent>

        {/* Navigation */}
        <div className="px-6 pb-6 flex justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1 || isLoading}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          {currentStep < totalSteps ? (
            <Button onClick={handleNext} disabled={!canProceed()}>
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleComplete} disabled={isLoading || !canProceed()} className="bg-violet-600 hover:bg-violet-700">
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Complete Setup
                </>
              )}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
