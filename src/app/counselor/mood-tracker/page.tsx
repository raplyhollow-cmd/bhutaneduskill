"use client";

/**
 * Counselor Mood Tracker & Wellness Insights Page
 *
 * View student wellness trends, mood patterns, and AI-powered insights.
 * Helps counselors identify students who may need support.
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Heart,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Search,
  Loader2,
  Sparkles,
  Brain,
  Phone,
} from "lucide-react";

interface MoodEntry {
  date: string;
  mood: number; // 1-5
  stress?: number;
  sleepHours?: number;
  notes?: string;
}

interface StudentMoodData {
  studentId: string;
  studentName: string;
  moodTrend: "improving" | "stable" | "declining";
  averageMood: number;
  averageStress: number;
  sleepAverage: number;
  recentEntries: MoodEntry[];
  redFlags: string[];
  recommendations: string[];
}

export default function CounselorMoodTrackerPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [studentData, setStudentData] = useState<StudentMoodData | null>(null);
  const [error, setError] = useState("");

  const fetchStudentData = async () => {
    if (!selectedStudent) return;

    setIsLoading(true);
    setError("");

    try {
      // In a real implementation, this would fetch from an API
      // For now, we'll simulate with mock data
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setStudentData({
        studentId: selectedStudent,
        studentName: "Student Name", // Would come from API
        moodTrend: "stable",
        averageMood: 3.5,
        averageStress: 2.8,
        sleepAverage: 7.2,
        recentEntries: [
          { date: "2026-02-24", mood: 4, stress: 2, sleepHours: 8, notes: "Feeling good after exam" },
          { date: "2026-02-25", mood: 3, stress: 3, sleepHours: 7, notes: "Some homework stress" },
          { date: "2026-02-26", mood: 4, stress: 2, sleepHours: 8 },
          { date: "2026-02-27", mood: 3, stress: 4, sleepHours: 6, notes: "Project deadline approaching" },
          { date: "2026-02-28", mood: 4, stress: 2, sleepHours: 7 },
        ],
        redFlags: [],
        recommendations: [
          "Student maintains consistent mood patterns",
          "Consider discussing stress management techniques",
          "Sleep schedule is healthy - encourage to maintain",
        ],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch student data");
    } finally {
      setIsLoading(false);
    }
  };

  const getMoodColor = (mood: number) => {
    if (mood >= 4) return "text-green-600 bg-green-50";
    if (mood >= 3) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  const getMoodEmoji = (mood: number) => {
    if (mood >= 4.5) return "😊";
    if (mood >= 3.5) return "🙂";
    if (mood >= 2.5) return "😐";
    if (mood >= 1.5) return "😟";
    return "😢";
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "improving":
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case "declining":
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      default:
        return <CheckCircle2 className="w-4 h-4 text-blue-600" />;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-purple-100 text-purple-600">
            <Heart className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-bold">Student Mood Tracker</h1>
        </div>
        <p className="text-muted-foreground">
          Monitor student wellness trends and identify those needing support
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Search/Selection */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Find Student</CardTitle>
              <CardDescription>Search by name or ID</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Student name or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {searchQuery && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">SIMULATED RESULTS</Label>
                  {["John Doe (PPG-001)", "Karma Wangmo (PPG-002)", "Tashi Dorji (PPG-003)"]
                    .filter((name) =>
                      name.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((name) => (
                      <button
                        key={name}
                        onClick={() => {
                          setSelectedStudent(name.split(" (")[1].replace(")", ""));
                          setSearchQuery(name);
                        }}
                        className="w-full p-2 text-left text-sm rounded-md hover:bg-gray-100 transition-colors"
                      >
                        {name}
                      </button>
                    ))}
                </div>
              )}

              {selectedStudent && (
                <Button onClick={fetchStudentData} disabled={isLoading} className="w-full">
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Get Wellness Insights
                    </>
                  )}
                </Button>
              )}

              {error && (
                <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">
                  {error}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Crisis Resources */}
          <Card className="border-red-200 bg-red-50/50">
            <CardHeader>
              <CardTitle className="text-red-700 flex items-center gap-2 text-lg">
                <AlertTriangle className="w-5 h-5" />
                Crisis Resources
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <Phone className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium">National Helpline</div>
                  <div className="text-red-700">112 (Bhutan Emergency)</div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Brain className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium">School Counselor</div>
                  <div className="text-muted-foreground">On-campus support available</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results */}
        <div className="lg:col-span-2">
          {studentData ? (
            <div className="space-y-4">
              {/* Student Overview */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{studentData.studentName}</CardTitle>
                      <CardDescription>ID: {studentData.studentId}</CardDescription>
                    </div>
                    <Badge
                      variant="outline"
                      className={`flex items-center gap-1 ${
                        studentData.moodTrend === "improving"
                          ? "border-green-500 text-green-700"
                          : studentData.moodTrend === "declining"
                          ? "border-red-500 text-red-700"
                          : "border-blue-500 text-blue-700"
                      }`}
                    >
                      {getTrendIcon(studentData.moodTrend)}
                      {studentData.moodTrend.charAt(0).toUpperCase() + studentData.moodTrend.slice(1)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 rounded-lg bg-gray-50">
                      <div className="text-2xl mb-1">{getMoodEmoji(studentData.averageMood)}</div>
                      <div className="text-sm text-muted-foreground">Avg Mood</div>
                      <div className="font-semibold">{studentData.averageMood}/5</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-gray-50">
                      <div className="text-2xl mb-1">😰</div>
                      <div className="text-sm text-muted-foreground">Avg Stress</div>
                      <div className="font-semibold">{studentData.averageStress}/5</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-gray-50">
                      <div className="text-2xl mb-1">😴</div>
                      <div className="text-sm text-muted-foreground">Avg Sleep</div>
                      <div className="font-semibold">{studentData.sleepAverage}h</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Mood Entries */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recent Mood Entries</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {studentData.recentEntries.map((entry, i) => (
                      <div
                        key={i}
                        className={`p-3 rounded-lg border ${getMoodColor(entry.mood)}`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{getMoodEmoji(entry.mood)}</span>
                            <span className="font-medium">{entry.mood}/5 Mood</span>
                          </div>
                          <span className="text-sm text-muted-foreground">{entry.date}</span>
                        </div>
                        {entry.stress && (
                          <div className="text-sm">
                            Stress: {entry.stress}/5
                            {entry.sleepHours && ` • Sleep: ${entry.sleepHours}h`}
                          </div>
                        )}
                        {entry.notes && (
                          <div className="text-sm mt-1 italic">"{entry.notes}"</div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Red Flags */}
              {studentData.redFlags.length > 0 ? (
                <Card className="border-red-200 bg-red-50/50">
                  <CardHeader>
                    <CardTitle className="text-red-700 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5" />
                      Attention Needed
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {studentData.redFlags.map((flag, i) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                          {flag}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-green-200 bg-green-50/50">
                  <CardContent className="py-4">
                    <div className="flex items-center gap-2 text-green-700">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="font-medium">No immediate concerns detected</span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Recommendations */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Counselor Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {studentData.recommendations.map((rec, i) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <Sparkles className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="h-[500px] flex items-center justify-center">
              <CardContent className="text-center py-12">
                <Heart className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Search for a student to view their wellness insights
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
