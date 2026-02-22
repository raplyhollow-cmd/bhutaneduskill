"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { WizardLayout, WizardStep, useWizardData } from "@/components/shared/wizard-layout";
import { VictoryScreen } from "@/components/shared/victory-screen";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  User,
  AlertTriangle,
  TrendingDown,
  Sparkles,
  Calendar,
  Clock,
  MessageSquare,
  CheckCircle2,
  Brain,
  Lightbulb,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface WellnessCompassWizardProps {
  studentId?: string;
  onCancel?: () => void;
  onComplete?: () => void;
}

interface StudentContext {
  id: string;
  name: string;
  photo?: string;
  classGrade?: string;
  section?: string;
  gradeTrend?: "up" | "down" | "stable";
  gradeChange?: number;
  attendanceRate?: number;
  homeworkCompletion?: number;
  recentFlags?: string[];
  previousInterventions?: Array<{ type: string; date: string; outcome?: string }>;
}

interface AISuggestion {
  talkingPoints?: string[];
  resources?: Array<{ title: string; description: string; link?: string }>;
  gnhAlignment?: string[];
}

const BEHAVIORAL_TAGS = [
  { id: "low_participation", label: "Low Participation", icon: "🔇" },
  { id: "frequent_lateness", label: "Frequent Lateness", icon: "⏰" },
  { id: "social_withdrawal", label: "Social Withdrawal", icon: "👤" },
  { id: "disruptive_behavior", label: "Disruptive Behavior", icon: "📢" },
  { id: "homework_incompletion", label: "Homework Incompletion", icon: "📝" },
  { id: "absenteeism", label: "Absenteeism", icon: "🏠" },
  { id: "anxiety_signs", label: "Signs of Anxiety", icon: "😰" },
  { id: "mood_changes", label: "Mood Changes", icon: "🎭" },
];

const INTERVENTION_TYPES = [
  { id: "one_on_one", label: "One-on-One Session", icon: "👥", duration: "30-45 min" },
  { id: "parent_conference", label: "Parent Conference", icon: "👨‍👩‍👧", duration: "30-60 min" },
  { id: "peer_mentoring", label: "Peer Mentoring", icon: "🤝", duration: "Ongoing" },
  { id: "group_counseling", label: "Group Counseling", icon: "👥", duration: "45 min" },
  { id: "teacher_referral", label: "Teacher Referral", icon: "📚", duration: "Varies" },
];

const DURATIONS = ["15", "30", "45", "60"];

export function WellnessCompassWizard({
  studentId,
  onCancel,
  onComplete,
}: WellnessCompassWizardProps) {
  const router = useRouter();
  const params = useParams();
  const actualStudentId = studentId || params.id;

  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [studentContext, setStudentContext] = useState<StudentContext | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion | null>(null);
  const [interventionCreated, setInterventionCreated] = useState(false);

  const wizardData = useWizardData({
    selectedTags: [] as string[],
    notes: "",
    severity: "medium",
    interventionType: "",
    interventionDate: "",
    interventionTime: "",
    duration: "30",
    aiCustomizedResponse: "",
  });

  // Load student context on mount
  useEffect(() => {
    if (actualStudentId) {
      loadStudentContext();
    }
  }, [actualStudentId]);

  const loadStudentContext = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/counselor/student-context?studentId=${actualStudentId}`);
      const data = await response.json();
      if (response.ok) {
        setStudentContext(data);
      }
    } catch (err) {
      console.error("Failed to load student context:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTag = (tagId: string) => {
    const tags = wizardData.data.selectedTags;
    if (tags.includes(tagId)) {
      wizardData.updateField("selectedTags", tags.filter((t) => t !== tagId));
    } else {
      wizardData.updateField("selectedTags", [...tags, tagId]);
    }
  };

  // Step 2: Log observations
  const submitObservations = async () => {
    return true; // Just validation, data saved with final submission
  };

  // Step 4: Get AI suggestions
  const fetchAISuggestions = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/counselor/intervention-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: actualStudentId,
          behavioralTags: wizardData.data.selectedTags,
          notes: wizardData.data.notes,
          severity: wizardData.data.severity,
          interventionType: wizardData.data.interventionType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to get AI suggestions");
      }

      setAiSuggestions(data.suggestions);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI suggestions failed");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Step 4: Create intervention
  const createIntervention = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/counselor/interventions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: actualStudentId,
          behavioralTags: wizardData.data.selectedTags,
          notes: wizardData.data.notes,
          severity: wizardData.data.severity,
          interventionType: wizardData.data.interventionType,
          scheduledDate: wizardData.data.interventionDate,
          scheduledTime: wizardData.data.interventionTime,
          duration: parseInt(wizardData.data.duration),
          aiSuggestions: aiSuggestions,
          customizedResponse: wizardData.data.aiCustomizedResponse,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create intervention");
      }

      setInterventionCreated(true);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create intervention");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Step definitions
  const steps: WizardStep[] = [
    {
      id: "context",
      title: "Contextual Review",
      canProceed: true,
      content: (
        <div className="space-y-6">
          {/* Student Summary Card */}
          {studentContext && (
            <Card className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden">
                  {studentContext.photo ? (
                    <img src={studentContext.photo} alt={studentContext.name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-8 h-8 text-slate-400" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-slate-900">{studentContext.name}</h3>
                  <p className="text-sm text-slate-500">
                    Class {studentContext.classGrade}{studentContext.section && `-${studentContext.section}`}
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Alert Summary */}
          <div className="p-4 rounded-xl bg-amber-50 border-2 border-amber-200">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-900">Why this student was flagged</p>
                {studentContext?.gradeChange && (
                  <p className="text-amber-800 mt-1">
                    Grades dropped by <strong>{Math.abs(studentContext.gradeChange)}%</strong> in the last 30 days
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="p-4 text-center">
              <TrendingDown className={cn("w-5 h-5 mx-auto mb-2", studentContext?.gradeTrend === "down" ? "text-red-500" : "text-green-500")} />
              <p className="text-2xl font-bold text-slate-900">{studentContext?.gradeChange || 0}%</p>
              <p className="text-xs text-slate-500">Grade Change</p>
            </Card>
            <Card className="p-4 text-center">
              <CheckCircle2 className="w-5 h-5 mx-auto mb-2 text-blue-500" />
              <p className="text-2xl font-bold text-slate-900">{studentContext?.attendanceRate || 0}%</p>
              <p className="text-xs text-slate-500">Attendance</p>
            </Card>
            <Card className="p-4 text-center">
              <Sparkles className="w-5 h-5 mx-auto mb-2 text-purple-500" />
              <p className="text-2xl font-bold text-slate-900">{studentContext?.homeworkCompletion || 0}%</p>
              <p className="text-xs text-slate-500">Homework</p>
            </Card>
          </div>

          {/* Recent Flags */}
          {studentContext?.recentFlags && studentContext.recentFlags.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-slate-700 mb-2">Recent Behavioral Flags</h4>
              <div className="flex flex-wrap gap-2">
                {studentContext.recentFlags.map((flag, i) => (
                  <span key={i} className="px-3 py-1 rounded-full bg-red-100 text-red-700 text-sm">
                    {flag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Previous Interventions */}
          {studentContext?.previousInterventions && studentContext.previousInterventions.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-slate-700 mb-2">Previous Interventions</h4>
              <div className="space-y-2">
                {studentContext.previousInterventions.map((intervention, i) => (
                  <div key={i} className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-900">{intervention.type}</span>
                      <span className="text-xs text-slate-500">{intervention.date}</span>
                    </div>
                    {intervention.outcome && (
                      <p className="text-sm text-slate-600 mt-1">Outcome: {intervention.outcome}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ),
    },
    {
      id: "observations",
      title: "Log Observations",
      canProceed: wizardData.data.selectedTags.length > 0,
      onSubmit: submitObservations,
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <p className="text-slate-600">Select behavioral tags that describe your observations</p>
          </div>

          {/* Behavioral Tags */}
          <div className="grid grid-cols-2 gap-3">
            {BEHAVIORAL_TAGS.map((tag) => {
              const isSelected = wizardData.data.selectedTags.includes(tag.id);
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  className={cn(
                    "flex items-center gap-2 p-3 rounded-xl border-2 transition-all text-left",
                    isSelected
                      ? "border-purple-500 bg-purple-50"
                      : "border-slate-200 hover:border-slate-300"
                  )}
                >
                  <span className="text-xl">{tag.icon}</span>
                  <span className="text-sm font-medium">{tag.label}</span>
                  {isSelected && <CheckCircle2 className="w-4 h-4 text-purple-500 ml-auto" />}
                </button>
              );
            })}
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={wizardData.data.notes}
              onChange={(e) => wizardData.updateField("notes", e.target.value)}
              placeholder="Describe any additional observations or concerns..."
              rows={4}
              className="mt-2"
            />
          </div>

          {/* Severity Slider */}
          <div>
            <Label>Severity Level</Label>
            <RadioGroup
              value={wizardData.data.severity}
              onValueChange={(v) => wizardData.updateField("severity", v)}
              className="flex gap-2 mt-2"
            >
              {["low", "medium", "high"].map((level) => (
                <label
                  key={level}
                  className={cn(
                    "flex-1 p-3 rounded-lg border-2 text-center cursor-pointer transition-all capitalize",
                    wizardData.data.severity === level
                      ? level === "low" ? "border-green-500 bg-green-50"
                        : level === "medium" ? "border-amber-500 bg-amber-50"
                        : "border-red-500 bg-red-50"
                      : "border-slate-200"
                  )}
                >
                  <RadioGroupItem value={level} className="sr-only" />
                  <span className="text-sm font-medium">{level}</span>
                </label>
              ))}
            </RadioGroup>
          </div>
        </div>
      ),
    },
    {
      id: "intervention",
      title: "Choose Intervention",
      canProceed: !!wizardData.data.interventionType && !!wizardData.data.interventionDate && !!wizardData.data.interventionTime,
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <p className="text-slate-600">Select the type of intervention and schedule it</p>
          </div>

          {/* Intervention Type */}
          <div>
            <Label>Intervention Type</Label>
            <div className="grid grid-cols-1 gap-2 mt-2">
              {INTERVENTION_TYPES.map((type) => {
                const isSelected = wizardData.data.interventionType === type.id;
                return (
                  <label
                    key={type.id}
                    className={cn(
                      "flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all",
                      isSelected ? "border-purple-500 bg-purple-50" : "border-slate-200"
                    )}
                  >
                    <RadioGroupItem value={type.id} checked={isSelected} onChange={() => wizardData.updateField("interventionType", type.id)} />
                    <span className="text-xl">{type.icon}</span>
                    <div className="flex-1">
                      <p className="font-medium">{type.label}</p>
                      <p className="text-xs text-slate-500">{type.duration}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={wizardData.data.interventionDate}
                onChange={(e) => wizardData.updateField("interventionDate", e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="time">Time</Label>
              <Input
                id="time"
                type="time"
                value={wizardData.data.interventionTime}
                onChange={(e) => wizardData.updateField("interventionTime", e.target.value)}
                className="mt-2"
              />
            </div>
          </div>

          {/* Duration */}
          <div>
            <Label>Duration</Label>
            <div className="flex gap-2 mt-2">
              {DURATIONS.map((dur) => (
                <button
                  key={dur}
                  type="button"
                  onClick={() => wizardData.updateField("duration", dur)}
                  className={cn(
                    "flex-1 py-2 rounded-lg border-2 transition-all",
                    wizardData.data.duration === dur
                      ? "border-purple-500 bg-purple-50 text-purple-700"
                      : "border-slate-200"
                  )}
                >
                  {dur} min
                </button>
              ))}
            </div>
          </div>

          {/* Summary */}
          {wizardData.data.interventionType && wizardData.data.interventionDate && (
            <Card className="p-4 bg-purple-50 border-purple-200">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-purple-600" />
                <p className="text-sm">
                  <strong className="text-purple-900">
                    {INTERVENTION_TYPES.find((t) => t.id === wizardData.data.interventionType)?.label}
                  </strong>{" "}
                  scheduled for{" "}
                  <strong className="text-purple-900">
                    {new Date(wizardData.data.interventionDate).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}{" "}
                    at {wizardData.data.interventionTime}
                  </strong>{" "}
                  ({wizardData.data.duration} minutes)
                </p>
              </div>
            </Card>
          )}
        </div>
      ),
    },
    {
      id: "ai-support",
      title: "AI Support",
      canProceed: true,
      onSubmit: !aiSuggestions ? fetchAISuggestions : createIntervention,
      content: (
        <div className="space-y-6">
          {!aiSuggestions ? (
            <div className="text-center py-8">
              <Brain className="w-16 h-16 text-purple-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Get AI-Powered Suggestions</h3>
              <p className="text-slate-600 mb-4">
                Our AI will provide talking points, resources, and GNH-aligned guidance based on your observations
              </p>
              {error && (
                <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm mb-4">
                  {error}
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="text-center">
                <Lightbulb className="w-12 h-12 text-amber-500 mx-auto mb-2" />
                <h3 className="font-semibold text-slate-900">AI Suggestions</h3>
              </div>

              {/* Talking Points */}
              {aiSuggestions.talkingPoints && aiSuggestions.talkingPoints.length > 0 && (
                <div>
                  <h4 className="font-medium text-slate-700 mb-2">Suggested Talking Points</h4>
                  <div className="space-y-2">
                    {aiSuggestions.talkingPoints.map((point, i) => (
                      <div key={i} className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                        <p className="text-sm text-blue-900">{point}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* GNH Alignment */}
              {aiSuggestions.gnhAlignment && aiSuggestions.gnhAlignment.length > 0 && (
                <div>
                  <h4 className="font-medium text-slate-700 mb-2">GNH Alignment</h4>
                  <div className="flex flex-wrap gap-2">
                    {aiSuggestions.gnhAlignment.map((item, i) => (
                      <span key={i} className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Resources */}
              {aiSuggestions.resources && aiSuggestions.resources.length > 0 && (
                <div>
                  <h4 className="font-medium text-slate-700 mb-2">Recommended Resources</h4>
                  <div className="space-y-2">
                    {aiSuggestions.resources.map((resource, i) => (
                      <Card key={i} className="p-3">
                        <p className="font-medium text-slate-900">{resource.title}</p>
                        <p className="text-sm text-slate-600 mt-1">{resource.description}</p>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Customize Response */}
              <div>
                <Label htmlFor="customResponse">Customize Your Approach (Optional)</Label>
                <Textarea
                  id="customResponse"
                  value={wizardData.data.aiCustomizedResponse}
                  onChange={(e) => wizardData.updateField("aiCustomizedResponse", e.target.value)}
                  placeholder="Add any personal notes or modifications to the AI suggestions..."
                  rows={3}
                  className="mt-2"
                />
              </div>
            </>
          )}

          {error && !aiSuggestions && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
              <AlertTriangle className="w-4 h-4" />
              {error}
            </div>
          )}
        </div>
      ),
    },
  ];

  // Victory state
  if (interventionCreated) {
    const scheduledDate = wizardData.data.interventionDate
      ? new Date(wizardData.data.interventionDate).toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
        })
      : "";

    const interventionTypeName = INTERVENTION_TYPES.find(
      (t) => t.id === wizardData.data.interventionType
    )?.label || "Session";

    return (
      <VictoryScreen
        title={`Intervention Plan Created for ${studentContext?.name || "Student"}`}
        message="The intervention has been scheduled and documented."
        highlights={[
          `Session Scheduled: ${scheduledDate} at ${wizardData.data.interventionTime}`,
          `Type: ${interventionTypeName}`,
          `Duration: ${wizardData.data.duration} minutes`,
          "AI-powered suggestions provided",
          "GNH-aligned approach documented",
        ]}
        actionLabel="Go to Calendar"
        actionHref="/counselor/sessions"
        portalType="counselor"
      />
    );
  }

  return (
    <WizardLayout
      steps={steps}
      portalType="counselor"
      title="Wellness Compass"
      subtitle="Create a holistic intervention plan with AI support"
      onCancel={onCancel}
      autoSaveKey={`wellness-compass-${actualStudentId}`}
      onComplete={onComplete}
    />
  );
}
