"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { WizardLayout, WizardStep, useWizardData } from "@/components/shared/wizard-layout";
import { VictoryScreen } from "@/components/shared/victory-screen";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BookOpen,
  Building2,
  Users,
  CheckCircle2,
  GraduationCap,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SubjectTeacherMappingWizardProps {
  onCancel?: () => void;
  onComplete?: () => void;
}

const DEPARTMENTS = [
  { id: "science", name: "Science", icon: "🔬", color: "bg-blue-50 border-blue-200" },
  { id: "mathematics", name: "Mathematics", icon: "📐", color: "bg-purple-50 border-purple-200" },
  { id: "english", name: "English", icon: "📚", color: "bg-green-50 border-green-200" },
  { id: "dzongkha", name: "Dzongkha", icon: "🇧🇹", color: "bg-red-50 border-red-200" },
  { id: "social_studies", name: "Social Studies", icon: "🌍", color: "bg-amber-50 border-amber-200" },
  { id: "it", name: "Information Technology", icon: "💻", color: "bg-cyan-50 border-cyan-200" },
  { id: "arts", name: "Arts", icon: "🎨", color: "bg-pink-50 border-pink-200" },
];

const GRADES = ["6", "7", "8", "9", "10", "11", "12"];
const SECTIONS = ["A", "B", "C", "D", "E"];

// REC Curriculum subjects per grade
const CURRICULUM_SUBJECTS: Record<string, string[]> = {
  "6": ["English", "Dzongkha", "Mathematics", "Science", "Social Studies", "IT", "Arts"],
  "7": ["English", "Dzongkha", "Mathematics", "Science", "Social Studies", "IT", "Arts"],
  "8": ["English", "Dzongkha", "Mathematics", "Physics", "Chemistry", "Biology", "Social Studies", "IT"],
  "9": ["English", "Dzongkha", "Mathematics", "Physics", "Chemistry", "Biology", "History", "Geography", "Economics", "IT"],
  "10": ["English", "Dzongkha", "Mathematics", "Physics", "Chemistry", "Biology", "History", "Geography", "Economics", "IT"],
  "11": ["English", "Dzongkha", "Mathematics", "Physics", "Chemistry", "Biology", "History", "Geography", "Economics", "IT"],
  "12": ["English", "Dzongkha", "Mathematics", "Physics", "Chemistry", "Biology", "History", "Geography", "Economics", "IT"],
};

interface Teacher {
  id: string;
  name: string;
  subjects: string[];
  assignedClasses: number;
  maxClasses: number;
}

interface Assignment {
  subject: string;
  grade: string;
  section: string;
  teacherId: string;
}

export function SubjectTeacherMappingWizard({
  onCancel,
  onComplete,
}: SubjectTeacherMappingWizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [assignmentsCreated, setAssignmentsCreated] = useState(false);
  const [assignmentSummary, setAssignmentSummary] = useState<Record<string, number>>({});

  const wizardData = useWizardData({
    department: "",
    grades: [] as string[],
    sections: [] as string[],
    academicYear: new Date().getFullYear().toString(),
    assignments: [] as Assignment[],
  });

  // Fetch teachers on mount
  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      const response = await fetch("/api/school-admin/teachers?available=true");
      const data = await response.json();
      if (response.ok) {
        setTeachers(data.teachers || []);
      }
    } catch (err) {
      console.error("Failed to fetch teachers:", err);
    }
  };

  const toggleGrade = (grade: string) => {
    const grades = wizardData.data.grades;
    if (grades.includes(grade)) {
      wizardData.updateField("grades", grades.filter((g) => g !== grade));
    } else {
      wizardData.updateField("grades", [...grades, grade]);
    }
  };

  const toggleSection = (section: string) => {
    const sections = wizardData.data.sections;
    if (sections.includes(section)) {
      wizardData.updateField("sections", sections.filter((s) => s !== section));
    } else {
      wizardData.updateField("sections", [...sections, section]);
    }
  };

  const assignTeacher = (subject: string, grade: string, section: string, teacherId: string) => {
    const assignments = wizardData.data.assignments;
    const existingIndex = assignments.findIndex(
      (a) => a.subject === subject && a.grade === grade && a.section === section
    );

    if (existingIndex >= 0) {
      const updated = [...assignments];
      updated[existingIndex] = { subject, grade, section, teacherId };
      wizardData.updateField("assignments", updated);
    } else {
      wizardData.updateField("assignments", [...assignments, { subject, grade, section, teacherId }]);
    }
  };

  const getAssignedTeacher = (subject: string, grade: string, section: string) => {
    return wizardData.data.assignments.find(
      (a) => a.subject === subject && a.grade === grade && a.section === section
    )?.teacherId;
  };

  const getTeacherWorkload = (teacherId: string) => {
    return wizardData.data.assignments.filter((a) => a.teacherId === teacherId).length;
  };

  const applyToAllSections = (subject: string, grade: string, teacherId: string) => {
    const sections = wizardData.data.sections.length > 0 ? wizardData.data.sections : SECTIONS;
    const newAssignments = [...wizardData.data.assignments];

    sections.forEach((section) => {
      const existingIndex = newAssignments.findIndex(
        (a) => a.subject === subject && a.grade === grade && a.section === section
      );
      if (existingIndex >= 0) {
        newAssignments[existingIndex] = { subject, grade, section, teacherId };
      } else {
        newAssignments.push({ subject, grade, section, teacherId });
      }
    });

    wizardData.updateField("assignments", newAssignments);
  };

  // Step 3: Save assignments
  const saveAssignments = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/school-admin/curriculum-assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          department: wizardData.data.department,
          grades: wizardData.data.grades,
          sections: wizardData.data.sections,
          academicYear: wizardData.data.academicYear,
          assignments: wizardData.data.assignments,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save assignments");
      }

      setAssignmentSummary(data.summary || {});
      setAssignmentsCreated(true);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save assignments");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Step definitions
  const steps: WizardStep[] = [
    {
      id: "department",
      title: "Select Department",
      canProceed: !!wizardData.data.department,
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <p className="text-slate-600">Choose the department you want to assign teachers for</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {DEPARTMENTS.map((dept) => {
              const isSelected = wizardData.data.department === dept.id;
              return (
                <button
                  key={dept.id}
                  type="button"
                  onClick={() => wizardData.updateField("department", dept.id)}
                  className={cn(
                    "p-6 rounded-xl border-2 transition-all text-center",
                    dept.color,
                    isSelected ? "border-current shadow-lg scale-105" : "border-current/30 hover:shadow-md"
                  )}
                >
                  <div className="text-4xl mb-2">{dept.icon}</div>
                  <p className="font-semibold text-slate-800">{dept.name}</p>
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="mt-2"
                    >
                      <CheckCircle2 className="w-5 h-5 text-green-600 mx-auto" />
                    </motion.div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ),
    },
    {
      id: "classes",
      title: "Select Classes",
      canProceed: wizardData.data.grades.length > 0 && wizardData.data.sections.length > 0,
      content: (
        <div className="space-y-6">
          {/* Grade Selection */}
          <div>
            <Label className="text-base font-semibold">Select Grades</Label>
            <div className="flex flex-wrap gap-2 mt-3">
              {GRADES.map((grade) => {
                const isSelected = wizardData.data.grades.includes(grade);
                return (
                  <button
                    key={grade}
                    type="button"
                    onClick={() => toggleGrade(grade)}
                    className={cn(
                      "w-14 h-14 rounded-xl border-2 flex items-center justify-center font-bold transition-all",
                      isSelected
                        ? "border-purple-500 bg-purple-50 text-purple-700"
                        : "border-slate-200 hover:border-slate-300"
                    )}
                  >
                    {grade}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section Selection */}
          <div>
            <Label className="text-base font-semibold">Select Sections</Label>
            <div className="flex flex-wrap gap-2 mt-3">
              {SECTIONS.map((section) => {
                const isSelected = wizardData.data.sections.includes(section);
                return (
                  <button
                    key={section}
                    type="button"
                    onClick={() => toggleSection(section)}
                    className={cn(
                      "w-14 h-14 rounded-xl border-2 flex items-center justify-center font-bold transition-all",
                      isSelected
                        ? "border-purple-500 bg-purple-50 text-purple-700"
                        : "border-slate-200 hover:border-slate-300"
                    )}
                  >
                    {section}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Academic Year */}
          <div>
            <Label htmlFor="academicYear">Academic Year</Label>
            <Select
              value={wizardData.data.academicYear}
              onValueChange={(v) => wizardData.updateField("academicYear", v)}
            >
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select academic year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2025">2025</SelectItem>
                <SelectItem value="2026">2026</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Summary */}
          {(wizardData.data.grades.length > 0 || wizardData.data.sections.length > 0) && (
            <Card className="p-4 bg-purple-50 border-purple-200">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-purple-600" />
                <p className="text-sm text-purple-900">
                  <strong>{wizardData.data.grades.length * wizardData.data.sections.length}</strong> class-sections
                  selected
                </p>
              </div>
            </Card>
          )}
        </div>
      ),
    },
    {
      id: "assign",
      title: "Assign Teachers",
      canProceed: wizardData.data.assignments.length > 0,
      onSubmit: saveAssignments,
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <p className="text-slate-600">
              Assign teachers to subjects for{" "}
              <strong>
                {DEPARTMENTS.find((d) => d.id === wizardData.data.department)?.name}
              </strong>
            </p>
          </div>

          {wizardData.data.grades.length === 0 && (
            <div className="text-center py-8">
              <p className="text-slate-500">Please select at least one grade in the previous step</p>
              <Button variant="outline" onClick={() => setCurrentStep(1)} className="mt-4">
                Go Back
              </Button>
            </div>
          )}

          {wizardData.data.grades.map((grade) => (
            <div key={grade} className="space-y-4">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <GraduationCap className="w-5 h-5" />
                Class {grade}
              </h3>

              {CURRICULUM_SUBJECTS[grade]
                ?.filter((subject) => {
                  // Filter by department
                  const dept = wizardData.data.department;
                  if (dept === "science") return ["Physics", "Chemistry", "Biology", "Science", "Mathematics", "IT"].includes(subject);
                  if (dept === "mathematics") return subject === "Mathematics";
                  if (dept === "english") return subject === "English";
                  if (dept === "dzongkha") return subject === "Dzongkha";
                  if (dept === "social_studies") return ["Social Studies", "History", "Geography", "Economics"].includes(subject);
                  if (dept === "it") return subject === "IT";
                  if (dept === "arts") return subject === "Arts";
                  return true;
                })
                .map((subject) => (
                  <Card key={subject} className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-slate-900">{subject}</h4>
                      <span className="text-xs text-slate-500">
                        {getTeacherWorkload("")}/{teachers.length} teachers assigned
                      </span>
                    </div>

                    <div className="space-y-2">
                      {wizardData.data.sections.map((section) => {
                        const assignedTeacherId = getAssignedTeacher(subject, grade, section);
                        return (
                          <div key={section} className="flex items-center gap-2">
                            <span className="w-8 text-sm font-medium text-slate-500">{section}</span>
                            <Select
                              value={assignedTeacherId}
                              onValueChange={(v) => assignTeacher(subject, grade, section, v)}
                            >
                              <SelectTrigger className="flex-1">
                                <SelectValue placeholder="Select teacher" />
                              </SelectTrigger>
                              <SelectContent>
                                {teachers.map((teacher) => {
                                  const workload = getTeacherWorkload(teacher.id);
                                  const isAtCapacity = workload >= teacher.maxClasses;
                                  return (
                                    <SelectItem key={teacher.id} value={teacher.id} disabled={isAtCapacity}>
                                      <div className="flex items-center gap-2">
                                        <span>{teacher.name}</span>
                                        <span className="text-xs text-slate-500">
                                          ({workload}/{teacher.maxClasses} classes)
                                        </span>
                                        {isAtCapacity && <span className="text-xs text-red-500">(Full)</span>}
                                      </div>
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>

                            {assignedTeacherId && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs"
                                onClick={() => applyToAllSections(subject, grade, assignedTeacherId)}
                              >
                                Apply to all
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                ))}
            </div>
          ))}

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
              {error}
            </div>
          )}
        </div>
      ),
    },
  ];

  // Victory state
  if (assignmentsCreated) {
    const totalAssignments = wizardData.data.assignments.length;
    const grades = wizardData.data.grades.join(", ");
    const sections = wizardData.data.sections.join(", ");

    return (
      <VictoryScreen
        title="Class Assignments Complete"
        message={`${totalAssignments} teacher assignments have been created and synced with the national curriculum.`}
        highlights={[
          `${totalAssignments} teachers assigned to ${wizardData.data.grades.length} grades`,
          `${wizardData.data.sections.length} sections per grade`,
          `Academic Year: ${wizardData.data.academicYear}`,
          `Department: ${DEPARTMENTS.find((d) => d.id === wizardData.data.department)?.name}`,
          "Lesson plans synced to 2026 National Curriculum",
        ]}
        actionLabel="View Timetable"
        actionHref="/school-admin/timetable"
        portalType="school-admin"
      />
    );
  }

  return (
    <WizardLayout
      steps={steps}
      portalType="school-admin"
      title="Subject-Teacher Mapping"
      subtitle="Assign teachers to subjects following the REC curriculum"
      onCancel={onCancel}
      autoSaveKey="subject-teacher-mapping"
      onComplete={onComplete}
    />
  );
}
