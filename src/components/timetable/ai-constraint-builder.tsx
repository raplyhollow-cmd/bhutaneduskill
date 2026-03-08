/**
 * AI CONSTRAINT BUILDER
 *
 * A beautiful, interactive UI for building timetable constraints.
 * Visual rule creation for AI optimization with glassmorphism design.
 *
 * Features:
 * - Teacher availability management
 * - Subject scheduling preferences
 * - Room requirement rules
 * - Class-specific restrictions
 * - Live constraint preview
 */

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Plus,
  User,
  BookOpen,
  DoorOpen,
  GraduationCap,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Clock,
  Sun,
  Moon,
  AlertCircle,
  Check,
  Trash2,
  Sliders,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type {
  TimetableConstraints,
  TeacherConstraint,
  SubjectConstraint,
  RoomConstraint,
  ClassConstraint,
} from "@/lib/types/timetable-constraints";

// ============================================================================
// TYPES
// ============================================================================

interface AIConstraintBuilderProps {
  constraints: TimetableConstraints;
  onChange: (constraints: TimetableConstraints) => void;
  teachers?: Array<{ id: string; name: string }>;
  subjects?: Array<{ id: string; name: string }>;
  rooms?: Array<{ id: string; name: string; type?: string }>;
  classes?: Array<{ id: string; name: string }>;
}

interface ConstraintSectionProps {
  title: string;
  icon: React.ReactNode;
  color: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

// ============================================================================
// CONSTRAINT SECTION (Collapsible)
// ============================================================================

function ConstraintSection({
  title,
  icon,
  color,
  children,
  defaultOpen = true,
}: ConstraintSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl overflow-hidden border-0 bg-white/70 backdrop-blur-xl shadow-lg"
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", color)}>
            {icon}
          </div>
          <span className="font-semibold text-gray-800">{title}</span>
        </div>
        {isOpen ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 pt-2">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ============================================================================
// TEACHER CONSTRAINT BUILDER
// ============================================================================

interface TeacherConstraintCardProps {
  constraint: TeacherConstraint;
  onUpdate: (constraint: TeacherConstraint) => void;
  onRemove: () => void;
  days: string[];
  periods: number[];
}

function TeacherConstraintCard({ constraint, onUpdate, onRemove, days, periods }: TeacherConstraintCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleUnavailablePeriod = (day: string, period: number) => {
    const exists = constraint.unavailablePeriods.some((p) => p.day === day && p.period === period);
    let updated = [...constraint.unavailablePeriods];

    if (exists) {
      updated = updated.filter((p) => !(p.day === day && p.period === period));
    } else {
      updated.push({ day, period });
    }

    onUpdate({ ...constraint, unavailablePeriods: updated });
  };

  const togglePreferredDay = (day: string) => {
    const exists = constraint.preferredDays?.includes(day);
    const updated = exists
      ? (constraint.preferredDays || []).filter((d) => d !== day)
      : [...(constraint.preferredDays || []), day];
    onUpdate({ ...constraint, preferredDays: updated });
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-4 rounded-xl bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-100 space-y-3"
    >
      <div className="flex items-start justify-between">
        <div>
          <h4 className="font-semibold text-violet-900">{constraint.teacherName || constraint.teacherId}</h4>
          <p className="text-xs text-violet-600">
            {constraint.unavailablePeriods.length} unavailable slots
            {constraint.preferredDays?.length ? ` • ${constraint.preferredDays.length} preferred days` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 hover:bg-violet-200 rounded-lg transition-colors"
          >
            <Sliders className="w-4 h-4 text-violet-600" />
          </button>
          <button
            onClick={onRemove}
            className="p-1.5 hover:bg-red-100 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4 text-red-500" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="space-y-4 pt-2"
          >
            {/* Workload Limits */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Max Consecutive</label>
                <input
                  type="number"
                  value={constraint.maxConsecutivePeriods || 5}
                  onChange={(e) => onUpdate({ ...constraint, maxConsecutivePeriods: parseInt(e.target.value) })}
                  className="w-full px-2 py-1 text-sm rounded-lg border border-gray-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Max Daily</label>
                <input
                  type="number"
                  value={constraint.maxDailyPeriods || 6}
                  onChange={(e) => onUpdate({ ...constraint, maxDailyPeriods: parseInt(e.target.value) })}
                  className="w-full px-2 py-1 text-sm rounded-lg border border-gray-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Max Weekly</label>
                <input
                  type="number"
                  value={constraint.maxWeeklyPeriods || 30}
                  onChange={(e) => onUpdate({ ...constraint, maxWeeklyPeriods: parseInt(e.target.value) })}
                  className="w-full px-2 py-1 text-sm rounded-lg border border-gray-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                />
              </div>
            </div>

            {/* Preferred Days */}
            <div>
              <label className="text-xs text-gray-500 mb-2 block">Preferred Days</label>
              <div className="flex flex-wrap gap-1">
                {days.map((day) => (
                  <button
                    key={day}
                    onClick={() => togglePreferredDay(day)}
                    className={cn(
                      "px-3 py-1 text-xs rounded-full transition-all",
                      constraint.preferredDays?.includes(day)
                        ? "bg-green-500 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    )}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

            {/* Unavailable Periods Grid */}
            <div>
              <label className="text-xs text-gray-500 mb-2 block">Unavailable Periods</label>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr>
                      <th className="p-1"></th>
                      {periods.map((p) => (
                        <th key={p} className="p-1 text-gray-500">P{p}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {days.map((day) => (
                      <tr key={day}>
                        <td className="p-1 font-medium text-gray-600">{day}</td>
                        {periods.map((period) => {
                          const isUnavailable = constraint.unavailablePeriods.some(
                            (p) => p.day === day && p.period === period
                          );
                          return (
                            <td key={period} className="p-1">
                              <button
                                onClick={() => toggleUnavailablePeriod(day, period)}
                                className={cn(
                                  "w-8 h-8 rounded-md transition-all",
                                  isUnavailable
                                    ? "bg-red-500 text-white"
                                    : "bg-gray-100 hover:bg-gray-200"
                                )}
                              >
                                {isUnavailable ? <X className="w-3 h-3 mx-auto" /> : ""}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ============================================================================
// SUBJECT CONSTRAINT BUILDER
// ============================================================================

interface SubjectConstraintCardProps {
  constraint: SubjectConstraint;
  onUpdate: (constraint: SubjectConstraint) => void;
  onRemove: () => void;
}

function SubjectConstraintCard({ constraint, onUpdate, onRemove }: SubjectConstraintCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 space-y-3"
    >
      <div className="flex items-start justify-between">
        <div>
          <h4 className="font-semibold text-blue-900">{constraint.subjectName || constraint.subjectId}</h4>
          <Badge variant="secondary" className="mt-1">{constraint.priority || "elective"}</Badge>
        </div>
        <button onClick={onRemove} className="p-1.5 hover:bg-red-100 rounded-lg transition-colors">
          <Trash2 className="w-4 h-4 text-red-500" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => onUpdate({ ...constraint, preferMorningSlots: !constraint.preferMorningSlots })}
          className={cn(
            "p-3 rounded-lg border text-left transition-all",
            constraint.preferMorningSlots
              ? "border-amber-500 bg-amber-50 text-amber-700"
              : "border-gray-200 hover:bg-gray-50"
          )}
        >
          <Sun className="w-4 h-4 mb-1" />
          <p className="text-xs font-medium">Morning Slots</p>
          <p className="text-xs opacity-70">8AM - 11AM</p>
        </button>

        <button
          onClick={() => onUpdate({ ...constraint, avoidLastPeriod: !constraint.avoidLastPeriod })}
          className={cn(
            "p-3 rounded-lg border text-left transition-all",
            constraint.avoidLastPeriod
              ? "border-orange-500 bg-orange-50 text-orange-700"
              : "border-gray-200 hover:bg-gray-50"
          )}
        >
          <Moon className="w-4 h-4 mb-1" />
          <p className="text-xs font-medium">Avoid Last Period</p>
          <p className="text-xs opacity-70">Student fatigue</p>
        </button>

        <button
          onClick={() => onUpdate({ ...constraint, requireDoublePeriod: !constraint.requireDoublePeriod })}
          className={cn(
            "col-span-2 p-3 rounded-lg border text-left transition-all",
            constraint.requireDoublePeriod
              ? "border-purple-500 bg-purple-50 text-purple-700"
              : "border-gray-200 hover:bg-gray-50"
          )}
        >
          <Clock className="w-4 h-4 mb-1" />
          <p className="text-xs font-medium">Requires Double Period</p>
          <p className="text-xs opacity-70">For labs and practical subjects</p>
        </button>
      </div>
    </motion.div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function AIConstraintBuilder({
  constraints,
  onChange,
  teachers = [],
  subjects = [],
  rooms = [],
  classes = [],
}: AIConstraintBuilderProps) {
  const [activeTab, setActiveTab] = useState<"teacher" | "subject" | "room" | "class">("teacher");

  const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  const periods = [1, 2, 3, 4, 5, 6, 7, 8];

  const addTeacherConstraint = () => {
    const availableTeachers = teachers.filter(
      (t) => !constraints.teacherAvailability.some((c) => c.teacherId === t.id)
    );
    if (availableTeachers.length === 0) return;

    const teacher = availableTeachers[0];
    onChange({
      ...constraints,
      teacherAvailability: [
        ...constraints.teacherAvailability,
        {
          teacherId: teacher.id,
          teacherName: teacher.name,
          unavailablePeriods: [],
          maxConsecutivePeriods: 5,
          maxDailyPeriods: 6,
          maxWeeklyPeriods: 30,
          preferredDays: [],
        },
      ],
    });
  };

  const addSubjectConstraint = () => {
    const availableSubjects = subjects.filter(
      (s) => !constraints.subjectRules.some((c) => c.subjectId === s.id)
    );
    if (availableSubjects.length === 0) return;

    const subject = availableSubjects[0];
    onChange({
      ...constraints,
      subjectRules: [
        ...constraints.subjectRules,
        {
          subjectId: subject.id,
          subjectName: subject.name,
          preferMorningSlots: false,
          avoidLastPeriod: false,
          requireDoublePeriod: false,
          priority: "elective",
        },
      ],
    });
  };

  const updateTeacherConstraint = (index: number, updated: TeacherConstraint) => {
    const newTeacherAvailability = [...constraints.teacherAvailability];
    newTeacherAvailability[index] = updated;
    onChange({ ...constraints, teacherAvailability: newTeacherAvailability });
  };

  const removeTeacherConstraint = (index: number) => {
    onChange({
      ...constraints,
      teacherAvailability: constraints.teacherAvailability.filter((_, i) => i !== index),
    });
  };

  const updateSubjectConstraint = (index: number, updated: SubjectConstraint) => {
    const newSubjectRules = [...constraints.subjectRules];
    newSubjectRules[index] = updated;
    onChange({ ...constraints, subjectRules: newSubjectRules });
  };

  const removeSubjectConstraint = (index: number) => {
    onChange({
      ...constraints,
      subjectRules: constraints.subjectRules.filter((_, i) => i !== index),
    });
  };

  const constraintCount =
    constraints.teacherAvailability.length +
    constraints.subjectRules.length +
    constraints.roomRules.length +
    constraints.classRules.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">AI Constraints</h3>
            <p className="text-sm text-gray-500">{constraintCount} rules configured</p>
          </div>
        </div>
        <Button
          size="sm"
          className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-lg"
        >
          <Check className="w-4 h-4 mr-2" />
          Apply Constraints
        </Button>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 p-1 bg-gray-100/80 rounded-xl backdrop-blur-sm">
        <button
          onClick={() => setActiveTab("teacher")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all",
            activeTab === "teacher"
              ? "bg-white text-violet-700 shadow-md"
              : "text-gray-600 hover:text-gray-900"
          )}
        >
          <User className="w-4 h-4" />
          Teachers
          {constraints.teacherAvailability.length > 0 && (
            <Badge variant="secondary" className="ml-1">{constraints.teacherAvailability.length}</Badge>
          )}
        </button>
        <button
          onClick={() => setActiveTab("subject")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all",
            activeTab === "subject"
              ? "bg-white text-blue-700 shadow-md"
              : "text-gray-600 hover:text-gray-900"
          )}
        >
          <BookOpen className="w-4 h-4" />
          Subjects
          {constraints.subjectRules.length > 0 && (
            <Badge variant="secondary" className="ml-1">{constraints.subjectRules.length}</Badge>
          )}
        </button>
        <button
          onClick={() => setActiveTab("room")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all",
            activeTab === "room"
              ? "bg-white text-emerald-700 shadow-md"
              : "text-gray-600 hover:text-gray-900"
          )}
        >
          <DoorOpen className="w-4 h-4" />
          Rooms
          {constraints.roomRules.length > 0 && (
            <Badge variant="secondary" className="ml-1">{constraints.roomRules.length}</Badge>
          )}
        </button>
        <button
          onClick={() => setActiveTab("class")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all",
            activeTab === "class"
              ? "bg-white text-orange-700 shadow-md"
              : "text-gray-600 hover:text-gray-900"
          )}
        >
          <GraduationCap className="w-4 h-4" />
          Classes
          {constraints.classRules.length > 0 && (
            <Badge variant="secondary" className="ml-1">{constraints.classRules.length}</Badge>
          )}
        </button>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeTab === "teacher" && (
          <motion.div
            key="teacher"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">Configure teacher availability and workload limits</p>
              {teachers.length > constraints.teacherAvailability.length && (
                <Button size="sm" variant="outline" onClick={addTeacherConstraint}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Teacher
                </Button>
              )}
            </div>
            <div className="grid gap-3">
              {constraints.teacherAvailability.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <User className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No teacher constraints yet</p>
                  <p className="text-sm">Add teachers to configure their availability</p>
                </div>
              ) : (
                constraints.teacherAvailability.map((constraint, index) => (
                  <TeacherConstraintCard
                    key={constraint.teacherId}
                    constraint={constraint}
                    onUpdate={(c) => updateTeacherConstraint(index, c)}
                    onRemove={() => removeTeacherConstraint(index)}
                    days={days}
                    periods={periods}
                  />
                ))
              )}
            </div>
          </motion.div>
        )}

        {activeTab === "subject" && (
          <motion.div
            key="subject"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">Set subject scheduling preferences</p>
              {subjects.length > constraints.subjectRules.length && (
                <Button size="sm" variant="outline" onClick={addSubjectConstraint}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Subject
                </Button>
              )}
            </div>
            <div className="grid gap-3">
              {constraints.subjectRules.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No subject constraints yet</p>
                  <p className="text-sm">Add subjects to configure scheduling rules</p>
                </div>
              ) : (
                constraints.subjectRules.map((constraint, index) => (
                  <SubjectConstraintCard
                    key={constraint.subjectId}
                    constraint={constraint}
                    onUpdate={(c) => updateSubjectConstraint(index, c)}
                    onRemove={() => removeSubjectConstraint(index)}
                  />
                ))
              )}
            </div>
          </motion.div>
        )}

        {activeTab === "room" && (
          <motion.div
            key="room"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="space-y-4"
          >
            <div className="text-center py-8 text-gray-400">
              <DoorOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Room constraints coming soon</p>
              <p className="text-sm">Configure room requirements and capacity limits</p>
            </div>
          </motion.div>
        )}

        {activeTab === "class" && (
          <motion.div
            key="class"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="space-y-4"
          >
            <div className="text-center py-8 text-gray-400">
              <GraduationCap className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Class constraints coming soon</p>
              <p className="text-sm">Configure class-specific scheduling restrictions</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
