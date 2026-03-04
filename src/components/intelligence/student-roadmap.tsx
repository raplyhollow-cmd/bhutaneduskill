"use client";

/**
 * Student Roadmap Component
 *
 * Visual timeline showing student's personalized path:
 * Class 6 → Class 12 → RUB → Career
 *
 * Displays milestones, progress, and next steps
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MapPin,
  Target,
  BookOpen,
  GraduationCap,
  Briefcase,
  CheckCircle2,
  Circle,
  Lock,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Award,
  School,
  Building,
  Calendar,
} from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";

interface RoadmapMilestone {
  id: string;
  title: string;
  description: string;
  targetGrade?: string;
  targetYear?: number;
  status: "completed" | "in_progress" | "pending" | "locked";
  progress: number;
  icon: string;
  color: string;
}

interface RoadmapData {
  studentId: string;
  studentName: string;
  currentGrade: number;
  careerPath: string;
  recommendedStream: string;
  recommendedSubjects: string[];
  targetCareer: string;
  bcseTarget: number;
  currentBcseReadiness: number;
  rubColleges: string[];
  rubPrograms: string[];
  milestones: RoadmapMilestone[];
  timeline: {
    now: string;
    class9_10: string;
    class11_12: string;
    bcse: string;
    rub: string;
    career: string;
  };
}

const MILESTONE_ICONS: Record<string, any> = {
  clipboard: BookOpen,
  explore: MapPin,
  subjects_9_10: BookOpen,
  stream_selection: Target,
  bcse_prep: Award,
  bcse_gap: AlertTriangle,
  rub_application: GraduationCap,
  career_goal: Briefcase,
};

export function StudentRoadmap({ userId }: { userId?: string }) {
  const [roadmap, setRoadmap] = useState<RoadmapData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchRoadmap() {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/student/roadmap`);
        if (response.ok) {
          const data = await response.json();
          setRoadmap(data);
        }
      } catch (error) {
        console.error("Failed to fetch roadmap:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchRoadmap();
  }, [userId]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Career Roadmap</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!roadmap) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Career Roadmap</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 mb-4">Complete your RIASEC assessment to see your personalized roadmap!</p>
            <Button asChild>
              <Link href="/student/assessment/riasec">Take Assessment</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { careerPath, targetCareer, recommendedStream, bcseTarget, currentBcseReadiness, milestones } = roadmap;

  // Calculate if student is on track
  const onTrack = currentBcseReadiness >= bcseTarget * 0.8;

  // Find current milestone
  const currentMilestone = milestones.find((m) => m.status === "in_progress") || milestones.find((m) => m.status === "pending");

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-orange-500" />
            Your Career Roadmap
          </CardTitle>
          <Badge variant={onTrack ? "default" : "secondary"} className="gap-1">
            {onTrack ? <TrendingUp className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
            {onTrack ? "On Track" : "Needs Focus"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Career Path Header */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl p-4">
          <p className="text-sm opacity-90">Your Career Path</p>
          <p className="text-2xl font-bold">{careerPath}</p>
          <p className="text-sm opacity-90 mt-1">
            Goal: <span className="font-semibold">{targetCareer}</span>
          </p>
        </div>

        {/* BCSE Readiness */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">BCSE Readiness</span>
            <span className="text-sm text-gray-600">
              {currentBcseReadiness.toFixed(0)}% / {bcseTarget}%
            </span>
          </div>
          <Progress
            value={currentBcseReadiness}
            className="h-3"
          />
          {currentBcseReadiness < bcseTarget - 10 && (
            <p className="text-xs text-amber-600 mt-1">
              <AlertTriangle className="w-3 h-3 inline mr-1" />
              You're {Math.round(bcseTarget - currentBcseReadiness)}% below target
            </p>
          )}
        </div>

        {/* Milestones Timeline */}
        <div className="space-y-3">
          <p className="text-sm font-medium">Your Journey</p>
          {milestones.map((milestone, index) => {
            const Icon = MILESTONE_ICONS[milestone.icon] || Circle;
            const isLocked = milestone.status === "locked";
            const isCompleted = milestone.status === "completed";
            const isCurrent = milestone.status === "in_progress";

            return (
              <div key={milestone.id} className="flex items-start gap-3">
                <div className="relative">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isCompleted ? "bg-green-600 text-white" :
                    isCurrent ? "bg-blue-600 text-white" :
                    isLocked ? "bg-gray-200 text-gray-400" : "bg-gray-100 text-gray-600"
                  }`}>
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : isLocked ? (
                      <Lock className="w-4 h-4" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>
                  {index < milestones.length - 1 && (
                    <div className="absolute left-5 top-10 w-0.5 h-8 bg-gray-200" />
                  )}
                </div>

                <div className={`flex-1 pb-4 ${isLocked ? "opacity-50" : ""}`}>
                  <div className="flex items-center justify-between mb-1">
                    <p className={`font-medium ${isCurrent ? "text-blue-600" : ""}`}>
                      {milestone.title}
                    </p>
                    {milestone.progress > 0 && milestone.progress < 100 && (
                      <Badge variant="outline" className="text-xs">
                        {milestone.progress.toFixed(0)}%
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{milestone.description}</p>
                  {isCurrent && milestone.progress > 0 && (
                    <Progress value={milestone.progress} className="h-1 mt-2" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Timeline Summary */}
        <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 space-y-2">
          <p className="text-sm font-medium">Timeline</p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-600">Now:</span>
              <p className="font-medium">{roadmap.timeline.now}</p>
            </div>
            <div>
              <span className="text-gray-600">Class 11-12:</span>
              <p className="font-medium">{roadmap.timeline.class11_12}</p>
            </div>
            <div>
              <span className="text-gray-600">After BCSE:</span>
              <p className="font-medium">{roadmap.timeline.rub}</p>
            </div>
            <div>
              <span className="text-gray-600">Career:</span>
              <p className="font-medium">{roadmap.timeline.career}</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        {currentMilestone && !currentMilestone.status.includes("locked") && (
          <div className="bg-blue-50 dark:bg-blue-950/30 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-3 mb-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              <p className="font-medium">Next Step</p>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">{currentMilestone.description}</p>
            <Button size="sm" className="gap-1">
              {currentMilestone.title}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
