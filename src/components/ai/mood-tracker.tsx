/**
 * AI MOOD TRACKER / WELLNESS COACH COMPONENT
 *
 * Client component for tracking student mood and wellness
 * Features:
 * - Mood selection with emojis
 * - Stress level tracking
 * - Sleep pattern logging
 * - Exercise/habit tracking
 * - Quick concern tags
 * - AI-powered insights
 * - Mood history calendar
 * - Crisis resources for Bhutan
 */

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Heart,
  Smile,
  Meh,
  Frown,
  Sun,
  Moon,
  Zap,
  Phone,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  CheckCircle2,
  Loader2,
  X,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================================================
// TYPES
// ============================================================================

export interface MoodEntry {
  date: string;
  mood: number;
  stress?: number;
  sleepHours?: number;
  sleepQuality?: number;
  exercised?: boolean;
  exerciseMinutes?: number;
  concerns?: string[];
  notes?: string;
}

export interface WellnessInsights {
  moodSummary: string;
  observations: string[];
  encouragement: string;
  recommendations: string[];
  whenToSeekHelp: string[];
  redFlags: string[];
  crisisResources?: {
    name: string;
    phone: string;
    description: string;
  }[];
  moodTrend: "improving" | "declining" | "stable";
  averageMood: number;
  averageStress: number;
}

export interface AIMoodTrackerProps {
  userName?: string;
  initialHistory?: MoodEntry[];
  className?: string;
  compact?: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const MOOD_OPTIONS = [
  { value: 1, label: "Very Low", emoji: "😢", color: "bg-red-100 text-red-600 border-red-200" },
  { value: 2, label: "Low", emoji: "😔", color: "bg-orange-100 text-orange-600 border-orange-200" },
  { value: 3, label: "Okay", emoji: "😐", color: "bg-yellow-100 text-yellow-600 border-yellow-200" },
  { value: 4, label: "Good", emoji: "🙂", color: "bg-green-100 text-green-600 border-green-200" },
  { value: 5, label: "Great", emoji: "😊", color: "bg-emerald-100 text-emerald-600 border-emerald-200" },
];

const CONCERN_TAGS = [
  "School/Study Stress",
  "Exams/Tests",
  "Friends/Social",
  "Family",
  "Future/Career",
  "Health",
  "Sleep Issues",
  "Financial",
  "Other",
];

const QUICK_RECOMMENDATIONS = [
  "Take 5 deep breaths",
  "Go for a short walk",
  "Talk to a friend",
  "Listen to calming music",
  "Write in a journal",
  "Get some fresh air",
];

// ============================================================================
// LOCAL STORAGE
// ============================================================================

const MOOD_STORAGE_KEY = "mood_tracker_history";

function getStoredHistory(): MoodEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(MOOD_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveToStorage(history: MoodEntry[]) {
  if (typeof window === "undefined") return;
  try {
    // Keep only last 30 entries
    const trimmed = history.slice(-30);
    localStorage.setItem(MOOD_STORAGE_KEY, JSON.stringify(trimmed));
  } catch (e) {
    console.error("Failed to save mood history:", e);
  }
}

// ============================================================================
// COMPONENT
// ============================================================================

export function AIMoodTracker({
  userName = "Student",
  initialHistory = [],
  className,
  compact = false,
}: AIMoodTrackerProps) {
  const [history, setHistory] = useState<MoodEntry[]>([]);
  const [currentEntry, setCurrentEntry] = useState<Partial<MoodEntry>>({
    date: new Date().toISOString().split("T")[0],
    mood: 3,
    stress: 3,
    sleepHours: 7,
    sleepQuality: 3,
    exercised: false,
    concerns: [],
  });

  const [insights, setInsights] = useState<WellnessInsights | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCrisisResources, setShowCrisisResources] = useState(false);
  const [selectedConcerns, setSelectedConcerns] = useState<string[]>([]);

  // Load history from localStorage on mount
  useEffect(() => {
    const stored = getStoredHistory();
    setHistory([...initialHistory, ...stored]);
  }, [initialHistory]);

  // Check if already logged today
  const today = new Date().toISOString().split("T")[0];
  const todayEntry = history.find((e) => e.date === today);
  const hasLoggedToday = !!todayEntry;

  // Submit mood entry
  async function submitMoodEntry() {
    if (!currentEntry.mood) return;

    setIsLoading(true);
    setError(null);

    const entry: MoodEntry = {
      date: today,
      mood: currentEntry.mood,
      stress: currentEntry.stress,
      sleepHours: currentEntry.sleepHours,
      sleepQuality: currentEntry.sleepQuality,
      exercised: currentEntry.exercised,
      exerciseMinutes: currentEntry.exercised ? currentEntry.exerciseMinutes : undefined,
      concerns: selectedConcerns.length > 0 ? selectedConcerns : undefined,
      notes: currentEntry.notes || undefined,
    };

    try {
      const response = await fetch("/api/ai/mood-tracker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentEntry: entry,
          history,
          userName,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to analyze mood");
      }

      const data: WellnessInsights = await response.json();
      setInsights(data);

      // Save to local history
      const newHistory = [...history, entry];
      setHistory(newHistory);
      saveToStorage(newHistory);

      // Show crisis resources if red flags detected
      if (data.redFlags && data.redFlags.length > 0) {
        setShowCrisisResources(true);
      }

      // Reset form (except today's entry check)
      setCurrentEntry({
        date: new Date().toISOString().split("T")[0],
        mood: 3,
        stress: 3,
        sleepHours: 7,
        sleepQuality: 3,
        exercised: false,
        concerns: [],
      });
      setSelectedConcerns([]);

    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  // Toggle concern tag
  function toggleConcern(concern: string) {
    setSelectedConcerns((prev) =>
      prev.includes(concern)
        ? prev.filter((c) => c !== concern)
        : [...prev, concern]
    );
  }

  // Get trend icon
  function getTrendIcon(trend: "improving" | "declining" | "stable") {
    switch (trend) {
      case "improving":
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case "declining":
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-gray-500" />;
    }
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Crisis Alert Banner */}
      {showCrisisResources && insights?.crisisResources && (
        <Card className="border-red-300 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-900">Support Resources Available</h3>
                <p className="text-sm text-red-700 mt-1">
                  We noticed you might be going through a difficult time. These resources are here to help you.
                </p>
                <div className="mt-3 space-y-2">
                  {insights.crisisResources.slice(0, 3).map((resource, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-white rounded-lg border border-red-200">
                      <div>
                        <p className="font-medium text-sm text-gray-900">{resource.name}</p>
                        <p className="text-xs text-gray-600">{resource.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-red-500" />
                        <span className="font-mono text-sm font-semibold">{resource.phone}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setShowCrisisResources(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mood Entry Card */}
      {(!hasLoggedToday || !insights) && (
        <Card
          className="border-teal-200"
          style={{ background: "linear-gradient(to bottom right, rgb(153 246 228), rgb(255 255 255))" }}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-teal-600" />
              How are you feeling today?
            </CardTitle>
            <CardDescription>
              Take a moment to check in with yourself. Your wellbeing matters.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Mood Selector */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Your Mood
              </label>
              <div className="grid grid-cols-5 gap-2">
                {MOOD_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setCurrentEntry({ ...currentEntry, mood: option.value })}
                    className={cn(
                      "flex flex-col items-center p-3 rounded-xl border-2 transition-all",
                      currentEntry.mood === option.value
                        ? option.color + " border-current scale-105"
                        : "bg-white border-gray-200 hover:border-gray-300"
                    )}
                  >
                    <span className="text-2xl mb-1">{option.emoji}</span>
                    <span className="text-xs font-medium">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Stress Level */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-500" />
                Stress Level
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={currentEntry.stress || 3}
                  onChange={(e) => setCurrentEntry({ ...currentEntry, stress: Number(e.target.value) })}
                  className="flex-1 h-2 bg-gray-200 rounded-full appearance-none cursor-pointer accent-teal-500"
                />
                <span className="text-sm font-medium w-20 text-center">
                  {currentEntry.stress}/5
                </span>
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Very Low</span>
                <span>Very High</span>
              </div>
            </div>

            {/* Sleep */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Moon className="w-4 h-4 text-indigo-500" />
                Sleep Last Night
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500">Hours</label>
                  <input
                    type="number"
                    min="0"
                    max="12"
                    step="0.5"
                    value={currentEntry.sleepHours || 7}
                    onChange={(e) => setCurrentEntry({ ...currentEntry, sleepHours: Number(e.target.value) })}
                    className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Quality (1-5)</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={currentEntry.sleepQuality || 3}
                    onChange={(e) => setCurrentEntry({ ...currentEntry, sleepQuality: Number(e.target.value) })}
                    className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>
              </div>
            </div>

            {/* Exercise */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Sun className="w-4 h-4 text-orange-500" />
                Exercise / Physical Activity
              </label>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setCurrentEntry({ ...currentEntry, exercised: !currentEntry.exercised })}
                  className={cn(
                    "px-4 py-2 rounded-lg border-2 transition-all",
                    currentEntry.exercised
                      ? "bg-teal-100 border-teal-500 text-teal-700"
                      : "bg-white border-gray-300 hover:border-gray-400"
                  )}
                >
                  {currentEntry.exercised ? "Yes, I exercised" : "No exercise today"}
                </button>
                {currentEntry.exercised && (
                  <input
                    type="number"
                    min="0"
                    max="300"
                    placeholder="Minutes"
                    value={currentEntry.exerciseMinutes || ""}
                    onChange={(e) => setCurrentEntry({ ...currentEntry, exerciseMinutes: Number(e.target.value) })}
                    className="w-24 px-3 py-2 border rounded-lg text-sm"
                  />
                )}
              </div>
            </div>

            {/* Concern Tags */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2">
                What's on your mind? (optional)
              </label>
              <div className="flex flex-wrap gap-2">
                {CONCERN_TAGS.map((concern) => (
                  <button
                    key={concern}
                    onClick={() => toggleConcern(concern)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-sm transition-all",
                      selectedConcerns.includes(concern)
                        ? "bg-teal-500 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    )}
                  >
                    {concern}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2">
                Additional Notes (optional)
              </label>
              <textarea
                rows={2}
                placeholder="How are you really feeling? Anything you want to remember..."
                value={currentEntry.notes || ""}
                onChange={(e) => setCurrentEntry({ ...currentEntry, notes: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 resize-none"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Submit Button */}
            <Button
              onClick={submitMoodEntry}
              disabled={isLoading}
              className="w-full"
              style={{
                background: "linear-gradient(135deg, rgb(20 184 166) 0%, rgb(13 148 136) 100%)",
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Heart className="w-4 h-4 mr-2" />
                  Get Wellness Insights
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Insights Display */}
      {insights && (
        <div className="space-y-4">
          {/* Mood Summary Card */}
          <Card className="border-teal-200">
            <CardHeader
              className="text-white"
              style={{ background: "linear-gradient(to right, rgb(20 184 166), rgb(13 148 136))" }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white">Your Wellness Summary</CardTitle>
                  <CardDescription className="text-teal-100">
                    Based on your mood tracking
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-full">
                  {getTrendIcon(insights.moodTrend)}
                  <span className="text-sm font-medium">
                    Avg: {insights.averageMood}/5
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-gray-700">{insights.moodSummary}</p>

              {/* Red Flags Warning */}
              {insights.redFlags && insights.redFlags.length > 0 && (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-amber-900">Things to Watch</p>
                      <ul className="mt-1 text-sm text-amber-800 space-y-1">
                        {insights.redFlags.map((flag, i) => (
                          <li key={i}>• {flag}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Encouragement Card */}
          <Card className="bg-gradient-to-br from-teal-50 to-emerald-50 border-teal-200">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <Heart className="w-6 h-6 text-teal-600 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-teal-900">A Note for You</h3>
                  <p className="mt-2 text-gray-700">{insights.encouragement}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Observations */}
          {insights.observations && insights.observations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Smile className="w-5 h-5 text-teal-600" />
                  Observations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {insights.observations.map((observation, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <CheckCircle2 className="w-4 h-4 text-teal-500 flex-shrink-0 mt-0.5" />
                      {observation}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Recommendations */}
          {insights.recommendations && insights.recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sun className="w-5 h-5 text-orange-500" />
                  Wellness Suggestions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {insights.recommendations.map((rec, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 p-3 bg-teal-50 rounded-lg border border-teal-100"
                    >
                      <CheckCircle2 className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700">{rec}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* When to Seek Help */}
          <Card className="border-blue-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-blue-900">
                <Phone className="w-5 h-5 text-blue-600" />
                When to Reach Out
              </CardTitle>
              <CardDescription>
                It's okay to ask for help. Here's when you should talk to someone.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {insights.whenToSeekHelp.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <ChevronRight className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>

              {/* Crisis Resources */}
              {insights.crisisResources && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm font-medium text-gray-900 mb-2">
                    Crisis Resources (Bhutan):
                  </p>
                  <div className="space-y-2">
                    {insights.crisisResources.slice(0, 2).map((resource, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-2 bg-blue-50 rounded-lg"
                      >
                        <div>
                          <p className="text-sm font-medium">{resource.name}</p>
                          <p className="text-xs text-gray-600">{resource.description}</p>
                        </div>
                        <span className="text-sm font-mono font-semibold text-blue-600">
                          {resource.phone}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Check In Again Button */}
          <Button
            onClick={() => {
              setInsights(null);
              setShowCrisisResources(false);
            }}
            variant="outline"
            className="w-full"
          >
            <Calendar className="w-4 h-4 mr-2" />
            {hasLoggedToday ? "Update Today's Entry" : "Check In Again"}
          </Button>
        </div>
      )}

      {/* Mood History Summary */}
      {!compact && history.length > 0 && !insights && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5 text-teal-600" />
              Recent Check-ins
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {history.slice(-7).reverse().map((entry, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">
                      {MOOD_OPTIONS.find((m) => m.value === entry.mood)?.emoji}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{entry.date}</p>
                      {entry.concerns && entry.concerns.length > 0 && (
                        <p className="text-xs text-gray-500">
                          {entry.concerns.slice(0, 2).join(", ")}
                          {entry.concerns.length > 2 && "..."}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    {entry.stress && (
                      <Badge variant="outline" className="text-xs">
                        Stress: {entry.stress}/5
                      </Badge>
                    )}
                    {entry.sleepHours && (
                      <Badge variant="outline" className="text-xs">
                        {entry.sleepHours}h sleep
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default AIMoodTracker;
