"use client";

/**
 * AI Study Planner Page
 *
 * Generate personalized study schedules based on subjects,
 * available time, strengths/weaknesses, and exam dates.
 */

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Calendar,
  Clock,
  Loader2,
  Sparkles,
  BookOpen,
  TrendingUp,
  Target,
  Coffee,
} from "lucide-react";

const COMMON_SUBJECTS = [
  "Mathematics", "English", "Dzongkha", "Physics", "Chemistry", "Biology",
  "History", "Geography", "Economics", "Computer Science", "ICT",
];

const TIME_OPTIONS = [
  { value: "morning", label: "Morning (6am - 12pm)", icon: "🌅" },
  { value: "afternoon", label: "Afternoon (12pm - 5pm)", icon: "☀️" },
  { value: "evening", label: "Evening (5pm - 9pm)", icon: "🌆" },
  { value: "night", label: "Night (9pm - 12am)", icon: "🌙" },
];

export default function StudyPlannerPage() {
  const [classGrade, setClassGrade] = useState("11");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [availableHours, setAvailableHours] = useState(3);
  const [weakSubjects, setWeakSubjects] = useState<string[]>([]);
  const [strongSubjects, setStrongSubjects] = useState<string[]>([]);
  const [goals, setGoals] = useState("");
  const [preferredTime, setPreferredTime] = useState<"morning" | "afternoon" | "evening" | "night">("evening");
  const [isGenerating, setIsGenerating] = useState(false);
  const [studyPlan, setStudyPlan] = useState<{
    weeklySchedule?: {
      monday: Array<{ time: string; subject: string; activity: string; focus?: string }>;
      tuesday: Array<{ time: string; subject: string; activity: string; focus?: string }>;
      wednesday: Array<{ time: string; subject: string; activity: string; focus?: string }>;
      thursday: Array<{ time: string; subject: string; activity: string; focus?: string }>;
      friday: Array<{ time: string; subject: string; activity: string; focus?: string }>;
      saturday: Array<{ time: string; subject: string; activity: string; focus?: string }>;
      sunday: Array<{ time: string; subject: string; activity: string; focus?: string }>;
    };
    tips?: string[];
    recommendations?: string[];
  } | null>(null);
  const [error, setError] = useState("");

  const toggleSubject = (subject: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(subject) ? prev.filter((s) => s !== subject) : [...prev, subject]
    );
  };

  const toggleWeakSubject = (subject: string) => {
    setWeakSubjects((prev) =>
      prev.includes(subject) ? prev.filter((s) => s !== subject) : [...prev, subject]
    );
  };

  const toggleStrongSubject = (subject: string) => {
    setStrongSubjects((prev) =>
      prev.includes(subject) ? prev.filter((s) => s !== subject) : [...prev, subject]
    );
  };

  const generatePlan = async () => {
    if (selectedSubjects.length === 0) {
      setError("Please select at least one subject");
      return;
    }

    setIsGenerating(true);
    setError("");
    setStudyPlan(null);

    try {
      const response = await fetch("/api/ai/study-planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classGrade,
          subjects: selectedSubjects,
          availableHoursPerDay: availableHours,
          weakSubjects,
          strongSubjects,
          goals: goals || undefined,
          preferredStudyTime: preferredTime,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to generate study plan");
      }

      const data = await response.json();
      setStudyPlan(data.data || data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate study plan");
    } finally {
      setIsGenerating(false);
    }
  };

  const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-orange-100 text-orange-600">
            <Calendar className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-bold">AI Study Planner</h1>
        </div>
        <p className="text-muted-foreground">
          Create a personalized study schedule based on your needs
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Input Section */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Your Preferences</CardTitle>
              <CardDescription>Tell us about your study needs</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Class Grade */}
              <div>
                <Label htmlFor="class-grade">Class</Label>
                <select
                  id="class-grade"
                  value={classGrade}
                  onChange={(e) => setClassGrade(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border rounded-md"
                >
                  {["9", "10", "11", "12"].map((grade) => (
                    <option key={grade} value={grade}>Class {grade}</option>
                  ))}
                </select>
              </div>

              {/* Available Hours */}
              <div>
                <Label htmlFor="hours">
                  Study Hours Per Day: {availableHours}h
                </Label>
                <input
                  id="hours"
                  type="range"
                  min="1"
                  max="8"
                  value={availableHours}
                  onChange={(e) => setAvailableHours(Number(e.target.value))}
                  className="w-full mt-1"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>1h</span>
                  <span>8h</span>
                </div>
              </div>

              {/* Preferred Time */}
              <div>
                <Label>Preferred Study Time</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {TIME_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setPreferredTime(option.value as any)}
                      className={`p-2 rounded-md border text-sm text-center transition-colors ${
                        preferredTime === option.value
                          ? "border-orange-500 bg-orange-50 text-orange-700"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <span className="text-lg">{option.icon}</span>
                      <div className="text-xs mt-1">{option.label.split(" ")[0]}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Goals */}
              <div>
                <Label htmlFor="goals">
                  Goals <span className="text-muted-foreground">(Optional)</span>
                </Label>
                <Input
                  id="goals"
                  placeholder="e.g., Improve math grades, prepare for exams"
                  value={goals}
                  onChange={(e) => setGoals(e.target.value)}
                  className="mt-1"
                />
              </div>

              {/* Error */}
              {error && (
                <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">
                  {error}
                </div>
              )}

              <Button
                onClick={generatePlan}
                disabled={isGenerating || selectedSubjects.length === 0}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Plan
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Subjects Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Select Subjects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {COMMON_SUBJECTS.map((subject) => (
                  <label
                    key={subject}
                    className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 cursor-pointer"
                  >
                    <Checkbox
                      checked={selectedSubjects.includes(subject)}
                      onCheckedChange={() => toggleSubject(subject)}
                    />
                    <span className="text-sm">{subject}</span>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Strengths/Weaknesses */}
          {(selectedSubjects.length > 0) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Strengths & Weaknesses</CardTitle>
                <CardDescription>Optional - helps personalize your plan</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm text-orange-600">Weak Subjects (Need Focus)</Label>
                  <div className="mt-2 space-y-1">
                    {selectedSubjects.map((subject) => (
                      <label
                        key={subject}
                        className="flex items-center gap-2 p-1 rounded hover:bg-orange-50 cursor-pointer"
                      >
                        <Checkbox
                          checked={weakSubjects.includes(subject)}
                          onCheckedChange={() => toggleWeakSubject(subject)}
                        />
                        <span className="text-sm">{subject}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-sm text-green-600">Strong Subjects</Label>
                  <div className="mt-2 space-y-1">
                    {selectedSubjects.map((subject) => (
                      <label
                        key={subject}
                        className="flex items-center gap-2 p-1 rounded hover:bg-green-50 cursor-pointer"
                      >
                        <Checkbox
                          checked={strongSubjects.includes(subject)}
                          onCheckedChange={() => toggleStrongSubject(subject)}
                        />
                        <span className="text-sm">{subject}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Results Section */}
        <div className="lg:col-span-2">
          {studyPlan ? (
            <div className="space-y-4">
              {/* Tips */}
              {studyPlan.tips && studyPlan.tips.length > 0 && (
                <Card className="border-orange-200 bg-orange-50/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Target className="w-5 h-5 text-orange-600" />
                      Study Tips
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-1">
                      {studyPlan.tips.map((tip, i) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <Sparkles className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Weekly Schedule */}
              {studyPlan.weeklySchedule && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      Weekly Schedule
                    </CardTitle>
                    <CardDescription>
                      {availableHours} hours/day • {selectedSubjects.length} subjects
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[600px]">
                      <div className="space-y-4 pr-4">
                        {DAYS.map((day) => {
                          const schedule = studyPlan.weeklySchedule![day];
                          if (!schedule || schedule.length === 0) return null;

                          return (
                            <div key={day}>
                              <h4 className="font-semibold text-sm capitalize mb-2 flex items-center gap-2">
                                <Clock className="w-4 h-4 text-orange-600" />
                                {day}
                              </h4>
                              <div className="space-y-2">
                                {schedule.map((slot, i) => (
                                  <div
                                    key={i}
                                    className="p-3 bg-gray-50 rounded-md border-l-4 border-orange-500"
                                  >
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="font-medium text-sm">{slot.subject}</span>
                                      <Badge variant="outline" className="text-xs">
                                        {slot.time}
                                      </Badge>
                                    </div>
                                    <div className="text-sm text-muted-foreground">{slot.activity}</div>
                                    {slot.focus && (
                                      <div className="text-xs text-orange-600 mt-1">
                                        <TrendingUp className="w-3 h-3 inline mr-1" />
                                        Focus: {slot.focus}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}

              {/* Recommendations */}
              {studyPlan.recommendations && studyPlan.recommendations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Coffee className="w-5 h-5 text-amber-600" />
                      Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {studyPlan.recommendations.map((rec, i) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-amber-600 mt-1.5 flex-shrink-0" />
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card className="h-[600px] flex items-center justify-center">
              <CardContent className="text-center py-12">
                <BookOpen className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Select your subjects and click "Generate Plan" to create your personalized study schedule
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
