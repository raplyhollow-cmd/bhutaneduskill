"use client";

/**
 * AI STUDY PLANNER COMPONENT
 *
 * Generates personalized weekly study schedules based on:
 * - Subjects enrolled
 * - Available study hours per day
 * - Weak and strong subjects
 * - Exam dates
 * - Personal goals
 *
 * Uses AI to create balanced, effective study plans.
 */


import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  Clock,
  BookOpen,
  Target,
  TrendingUp,
  Lightbulb,
  Coffee,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { portal, semantic, semanticGradients } from "@/styles/design-tokens";

// ============================================================================
// TYPES
// ============================================================================

interface StudySlot {
  time: string;
  subject: string;
  activity: string;
  focus?: string;
}

interface WeeklySchedule {
  monday: StudySlot[];
  tuesday: StudySlot[];
  wednesday: StudySlot[];
  thursday: StudySlot[];
  friday: StudySlot[];
  saturday: StudySlot[];
  sunday: StudySlot[];
}

interface StudyPlanResponse {
  weeklySchedule: WeeklySchedule;
  dailyRoutine: Array<{
    time: string;
    subject: string;
    focus: string;
  }>;
  studyTips: string[];
  breakSchedule: string[];
  weeklyGoals: string[];
  recommendations?: string[];
  examPreparation?: Array<{
    examDate: string;
    subject: string;
    preparationTips: string[];
  }>;
}

interface StudyPlannerProps {
  userName?: string;
  classGrade?: string;
  initialSubjects?: string[];
  className?: string;
}

// ============================================================================
// SUBJECT OPTIONS
// ============================================================================

const COMMON_SUBJECTS = [
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "English",
  "Dzongkha",
  "History",
  "Geography",
  "Economics",
  "Computer Science",
  "Business Studies",
  "Accountancy",
];

const CLASS_OPTIONS = ["6", "7", "8", "9", "10", "11", "12"];

const STUDY_TIME_OPTIONS = [
  { value: "morning", label: "Morning (6 AM - 10 AM)" },
  { value: "afternoon", label: "Afternoon (12 PM - 4 PM)" },
  { value: "evening", label: "Evening (4 PM - 8 PM)" },
  { value: "night", label: "Night (8 PM - 11 PM)" },
];

// ============================================================================
// COMPONENT
// ============================================================================

export function AIStudyPlanner({
  userName = "Student",
  classGrade = "11",
  initialSubjects = [],
  className,
}: StudyPlannerProps) {
  // Form state
  const [selectedClass, setSelectedClass] = useState(classGrade);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(initialSubjects);
  const [availableHours, setAvailableHours] = useState(3);
  const [weakSubjects, setWeakSubjects] = useState<string[]>([]);
  const [strongSubjects, setStrongSubjects] = useState<string[]>([]);
  const [examDates, setExamDates] = useState<string>("");
  const [goals, setGoals] = useState("");
  const [preferredTime, setPreferredTime] = useState<"morning" | "afternoon" | "evening" | "night">("evening");

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [studyPlan, setStudyPlan] = useState<StudyPlanResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeDay, setActiveDay] = useState("monday");

  const daysOfWeek = [
    { value: "monday", label: "Monday" },
    { value: "tuesday", label: "Tuesday" },
    { value: "wednesday", label: "Wednesday" },
    { value: "thursday", label: "Thursday" },
    { value: "friday", label: "Friday" },
    { value: "saturday", label: "Saturday" },
    { value: "sunday", label: "Sunday" },
  ];

  // Subject selection handlers
  const toggleSubject = (subject: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(subject) ? prev.filter((s) => s !== subject) : [...prev, subject]
    );
  };

  const toggleWeakSubject = (subject: string) => {
    if (!selectedSubjects.includes(subject)) return;
    setWeakSubjects((prev) =>
      prev.includes(subject) ? prev.filter((s) => s !== subject) : [...prev, subject]
    );
  };

  const toggleStrongSubject = (subject: string) => {
    if (!selectedSubjects.includes(subject)) return;
    setStrongSubjects((prev) =>
      prev.includes(subject) ? prev.filter((s) => s !== subject) : [...prev, subject]
    );
  };

  // Generate study plan
  const generateStudyPlan = async () => {
    if (selectedSubjects.length === 0) {
      setError("Please select at least one subject");
      return;
    }

    setIsLoading(true);
    setError(null);
    setStudyPlan(null);

    try {
      const response = await fetch("/api/ai/study-planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classGrade: selectedClass,
          subjects: selectedSubjects,
          availableHoursPerDay: availableHours,
          weakSubjects,
          strongSubjects,
          examDates: examDates
            ? examDates
                .split(",")
                .map((d) => d.trim())
                .filter(Boolean)
            : [],
          goals: goals.trim(),
          preferredStudyTime: preferredTime,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate study plan");
      }

      const data = await response.json();
      setStudyPlan(data.data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to generate study plan. Please try again.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("w-full max-w-6xl mx-auto", className)}>
      {!studyPlan ? (
        // Input Form
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Sparkles className="w-6 h-6" style={{ color: portal.student.primary }} />
              AI Study Planner
            </CardTitle>
            <CardDescription>
              Create a personalized study schedule based on your subjects and goals
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Class Selection */}
            <div className="space-y-2">
              <Label htmlFor="class">Class Grade</Label>
              <div className="flex flex-wrap gap-2">
                {CLASS_OPTIONS.map((cls) => (
                  <Button
                    key={cls}
                    variant={selectedClass === cls ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedClass(cls)}
                    style={selectedClass === cls ? {
                      background: portal.student.gradient,
                    } : undefined}
                  >
                    Class {cls}
                  </Button>
                ))}
              </div>
            </div>

            {/* Subject Selection */}
            <div className="space-y-3">
              <Label>Select Your Subjects</Label>
              <div className="flex flex-wrap gap-2">
                {COMMON_SUBJECTS.map((subject) => (
                  <Badge
                    key={subject}
                    variant={selectedSubjects.includes(subject) ? "default" : "outline"}
                    className={cn(
                      "cursor-pointer px-3 py-1.5 text-sm transition-colors",
                      selectedSubjects.includes(subject)
                        ? "text-white"
                        : "hover:bg-orange-50"
                    )}
                    style={selectedSubjects.includes(subject) ? {
                      background: portal.student.gradient,
                    } : undefined}
                    onClick={() => toggleSubject(subject)}
                  >
                    {selectedSubjects.includes(subject) && (
                      <CheckCircle2 className="w-3 h-3 mr-1 inline" />
                    )}
                    {subject}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Available Hours */}
            <div className="space-y-2">
              <Label htmlFor="hours">
                Available Study Hours Per Day: {availableHours} hours
              </Label>
              <Input
                id="hours"
                type="range"
                min="1"
                max="8"
                step="0.5"
                value={availableHours}
                onChange={(e) => setAvailableHours(parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>1 hour</span>
                <span>4 hours</span>
                <span>8 hours</span>
              </div>
            </div>

            {/* Study Time Preference */}
            <div className="space-y-2">
              <Label>Preferred Study Time</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {STUDY_TIME_OPTIONS.map((option) => (
                  <Button
                    key={option.value}
                    variant={preferredTime === option.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPreferredTime(option.value as typeof preferredTime)}
                    className={cn(
                      "h-auto py-3 flex flex-col items-center gap-1"
                    )}
                    style={preferredTime === option.value ? {
                      background: portal.student.gradient,
                    } : undefined}
                  >
                    <Clock className="w-4 h-4" />
                    <span className="text-xs">{option.label.split(" ")[0]}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Weak and Strong Subjects */}
            {selectedSubjects.length > 0 && (
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2 p-4 bg-red-50 rounded-lg border border-red-100">
                  <Label className="flex items-center gap-2 text-red-700">
                    <TrendingUp className="w-4 h-4" />
                    Weak Subjects (Need Focus)
                  </Label>
                  <p className="text-xs text-red-600">
                    Select subjects you find challenging - they'll get more study time
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedSubjects.map((subject) => (
                      <Badge
                        key={subject}
                        variant={weakSubjects.includes(subject) ? "default" : "outline"}
                        className={cn(
                          "cursor-pointer",
                          weakSubjects.includes(subject)
                            ? "text-white"
                            : "hover:bg-red-100"
                        )}
                        style={weakSubjects.includes(subject) ? {
                          background: semantic.error.gradient,
                        } : undefined}
                        onClick={() => toggleWeakSubject(subject)}
                      >
                        {subject}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 p-4 bg-green-50 rounded-lg border border-green-100">
                  <Label className="flex items-center gap-2 text-green-700">
                    <CheckCircle2 className="w-4 h-4" />
                    Strong Subjects (Maintain)
                  </Label>
                  <p className="text-xs text-green-600">
                    Select subjects you're good at - they'll get practice time
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedSubjects.map((subject) => (
                      <Badge
                        key={subject}
                        variant={strongSubjects.includes(subject) ? "default" : "outline"}
                        className={cn(
                          "cursor-pointer",
                          strongSubjects.includes(subject)
                            ? "text-white"
                            : "hover:bg-green-100"
                        )}
                        style={strongSubjects.includes(subject) ? {
                          background: semantic.success.gradient,
                        } : undefined}
                        onClick={() => toggleStrongSubject(subject)}
                      >
                        {subject}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Exam Dates */}
            <div className="space-y-2">
              <Label htmlFor="exams">Upcoming Exam Dates (Optional)</Label>
              <Input
                id="exams"
                placeholder="e.g., 2026-03-15, 2026-04-20"
                value={examDates}
                onChange={(e) => setExamDates(e.target.value)}
              />
              <p className="text-xs text-gray-500">
                Comma-separated dates (YYYY-MM-DD format)
              </p>
            </div>

            {/* Goals */}
            <div className="space-y-2">
              <Label htmlFor="goals">Your Study Goals (Optional)</Label>
              <Textarea
                id="goals"
                placeholder="e.g., Improve physics grades, Complete math syllabus before exams..."
                value={goals}
                onChange={(e) => setGoals(e.target.value)}
                rows={3}
              />
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            {/* Generate Button */}
            <Button
              onClick={generateStudyPlan}
              disabled={isLoading || selectedSubjects.length === 0}
              className="w-full"
              style={{
                background: portal.student.gradient,
              }}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Generating your study plan...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Study Plan
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      ) : (
        // Study Plan Display
        <StudyPlanDisplay
          plan={studyPlan}
          subjects={selectedSubjects}
          onReset={() => setStudyPlan(null)}
          onRegenerate={generateStudyPlan}
          activeDay={activeDay}
          onDayChange={setActiveDay}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}

// ============================================================================
// STUDY PLAN DISPLAY
// ============================================================================

interface StudyPlanDisplayProps {
  plan: StudyPlanResponse;
  subjects: string[];
  onReset: () => void;
  onRegenerate: () => void;
  activeDay: string;
  onDayChange: (day: string) => void;
  isLoading: boolean;
}

function StudyPlanDisplay({
  plan,
  subjects,
  onReset,
  onRegenerate,
  activeDay,
  onDayChange,
  isLoading,
}: StudyPlanDisplayProps) {
  const daysOfWeek = [
    { value: "monday", label: "Mon" },
    { value: "tuesday", label: "Tue" },
    { value: "wednesday", label: "Wed" },
    { value: "thursday", label: "Thu" },
    { value: "friday", label: "Fri" },
    { value: "saturday", label: "Sat" },
    { value: "sunday", label: "Sun" },
  ];

  const totalStudySlots = Object.values(plan.weeklySchedule).reduce(
    (sum, slots) => sum + slots.length,
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Sparkles className="w-6 h-6 text-orange-500" />
                Your Personalized Study Plan
              </CardTitle>
              <CardDescription>
                {totalStudySlots} study sessions scheduled for this week
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onReset}>
                Modify
              </Button>
              <Button
                size="sm"
                onClick={onRegenerate}
                disabled={isLoading}
                style={{
                  background: portal.student.gradient,
                }}
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="schedule" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="schedule">Weekly Schedule</TabsTrigger>
          <TabsTrigger value="daily">Daily Routine</TabsTrigger>
          <TabsTrigger value="tips">Study Tips</TabsTrigger>
          <TabsTrigger value="goals">Goals</TabsTrigger>
        </TabsList>

        {/* Weekly Schedule Tab */}
        <TabsContent value="schedule" className="space-y-4">
          {/* Day Selector */}
          <div className="flex overflow-x-auto gap-2 pb-2">
            {daysOfWeek.map((day) => {
              const daySlots = plan.weeklySchedule[day.value as keyof WeeklySchedule] || [];
              const isActive = activeDay === day.value;
              return (
                <button
                  key={day.value}
                  onClick={() => onDayChange(day.value)}
                  className={cn(
                    "flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                    isActive
                      ? "bg-orange-600 text-white shadow-md"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  )}
                >
                  <div className="text-center">
                    <div>{day.label}</div>
                    <div className="text-xs opacity-80">{daySlots.length} sessions</div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Day Schedule */}
          <Card>
            <CardHeader>
              <CardTitle className="capitalize">
                {daysOfWeek.find((d) => d.value === activeDay)?.label}'s Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              {plan.weeklySchedule[activeDay as keyof WeeklySchedule]?.length > 0 ? (
                <div className="space-y-3">
                  {plan.weeklySchedule[activeDay as keyof WeeklySchedule].map((slot, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex-shrink-0 w-24 text-sm font-medium text-gray-700">
                        {slot.time}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <BookOpen className="w-4 h-4 text-orange-500" />
                          <span className="font-medium">{slot.subject}</span>
                        </div>
                        <p className="text-sm text-gray-600">{slot.activity}</p>
                        {slot.focus && (
                          <Badge variant="outline" className="mt-2 text-xs">
                            {slot.focus}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Coffee className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No study sessions scheduled. It's a rest day!</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Weekly Overview Grid */}
          <Card>
            <CardHeader>
              <CardTitle>Weekly Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2">
                {daysOfWeek.map((day) => {
                  const daySlots = plan.weeklySchedule[day.value as keyof WeeklySchedule] || [];
                  const subjects = [...new Set(daySlots.map((s) => s.subject))];
                  return (
                    <div
                      key={day.value}
                      className={cn(
                        "p-2 rounded-lg text-center transition-colors",
                        activeDay === day.value
                          ? "bg-orange-100 border-2 border-orange-400"
                          : "bg-gray-50 hover:bg-gray-100"
                      )}
                      onClick={() => onDayChange(day.value)}
                      style={{ cursor: "pointer" }}
                    >
                      <div className="text-xs font-medium text-gray-700 mb-1">
                        {day.label}
                      </div>
                      <div className="text-lg font-bold text-orange-600 mb-1">
                        {daySlots.length}
                      </div>
                      <div className="flex flex-wrap gap-1 justify-center">
                        {subjects.slice(0, 2).map((subject, i) => (
                          <Badge
                            key={i}
                            variant="outline"
                            className="text-xs px-1 py-0 h-5"
                          >
                            {subject.substring(0, 3)}
                          </Badge>
                        ))}
                        {subjects.length > 2 && (
                          <span className="text-xs text-gray-500">+</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Daily Routine Tab */}
        <TabsContent value="daily">
          <Card>
            <CardHeader>
              <CardTitle>Your Daily Study Routine</CardTitle>
              <CardDescription>
                Follow this routine for effective study sessions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {plan.dailyRoutine.map((slot, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-4 border rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="flex-shrink-0 w-16 flex items-center justify-center h-12 rounded-full bg-orange-100 text-orange-700 font-bold">
                      {slot.time.split("-")[0]?.trim()}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{slot.subject}</div>
                      <div className="text-sm text-gray-600">{slot.focus}</div>
                    </div>
                    <Target className="w-5 h-5 text-gray-400" />
                  </div>
                ))}
              </div>

              {/* Break Schedule */}
              {plan.breakSchedule.length > 0 && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <div className="flex items-center gap-2 text-blue-700 font-medium mb-2">
                    <Coffee className="w-4 h-4" />
                    Break Schedule
                  </div>
                  <ul className="text-sm text-blue-600 space-y-1">
                    {plan.breakSchedule.map((item, index) => (
                      <li key={index}>- {item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Study Tips Tab */}
        <TabsContent value="tips">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Study Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-yellow-500" />
                  Study Tips
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {plan.studyTips.map((tip, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{tip}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Recommendations */}
            {plan.recommendations && plan.recommendations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-500" />
                    Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {plan.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Target className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Goals Tab */}
        <TabsContent value="goals">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-500" />
                Weekly Goals
              </CardTitle>
              <CardDescription>
                Track your progress with these achievable goals
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {plan.weeklyGoals.map((goal, index) => (
                  <label
                    key={index}
                    className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      className="w-5 h-5 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                    <span className="text-sm">{goal}</span>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Exam Preparation */}
          {plan.examPreparation && plan.examPreparation.length > 0 && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-red-500" />
                  Exam Preparation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {plan.examPreparation.map((exam, index) => (
                    <div key={index} className="p-4 bg-red-50 rounded-lg border border-red-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{exam.subject}</span>
                        <Badge variant="outline">{exam.examDate}</Badge>
                      </div>
                      <ul className="text-sm text-red-700 space-y-1">
                        {exam.preparationTips.map((tip, i) => (
                          <li key={i}>- {tip}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default AIStudyPlanner;
