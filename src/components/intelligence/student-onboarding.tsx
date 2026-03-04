"use client";

/**
 * Student Onboarding Checklist
 *
 * Guides new students through their first 5 actions:
 * 1. Complete Profile
 * 2. Take RIASEC Assessment
 * 3. View Report
 * 4. Create Career Plan
 * 5. Explore Careers
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, ArrowRight, Sparkles, User, ClipboardCheck, MapPin, Briefcase, Compass } from "lucide-react";
import Link from "next/link";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  link: string;
  icon: any;
  completed: boolean;
  optional: boolean;
}

const ONBOARDING_STEPS: Omit<OnboardingStep, "completed">[] = [
  {
    id: "profile",
    title: "Complete Your Profile",
    description: "Tell us about yourself so we can personalize your experience",
    link: "/student/settings/profile",
    icon: User,
    optional: false,
  },
  {
    id: "riasec",
    title: "Take RIASEC Assessment",
    description: "Discover your career aptitudes and interests",
    link: "/student/assessment/riasec",
    icon: ClipboardCheck,
    optional: false,
  },
  {
    id: "report",
    title: "View Your Report",
    description: "See your personalized career recommendations",
    link: "/student/assessment/riasec/results",
    icon: MapPin,
    optional: false,
  },
  {
    id: "roadmap",
    title: "View Your Roadmap",
    description: "See your personalized path to your dream career",
    link: "/student/roadmap",
    icon: Briefcase,
    optional: false,
  },
  {
    id: "explore",
    title: "Explore Careers",
    description: "Learn about different career options in Bhutan",
    link: "/student/careers",
    icon: Compass,
    optional: true,
  },
];

export function StudentOnboarding({ userId }: { userId?: string }) {
  const [steps, setSteps] = useState<OnboardingStep[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchOnboardingStatus() {
      try {
        // In production, would fetch from API
        // For now, use static steps
        const response = await fetch("/api/student/onboarding");
        if (response.ok) {
          const data = await response.json();
          setSteps(data.steps || ONBOARDING_STEPS.map((s: Omit<OnboardingStep, "completed">) => ({
            ...s,
            completed: false, // Would come from API
          })));
        } else {
          // Fallback to static steps
          setSteps(ONBOARDING_STEPS.map((s) => ({ ...s, completed: false })));
        }
      } catch (error) {
        console.error("Failed to fetch onboarding status:", error);
        setSteps(ONBOARDING_STEPS.map((s) => ({ ...s, completed: false })));
      } finally {
        setIsLoading(false);
      }
    }

    fetchOnboardingStatus();
  }, [userId]);

  const completedCount = steps.filter((s) => s.completed).length;
  const totalCount = steps.filter((s) => !s.optional).length;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const isComplete = completedCount >= totalCount;

  if (isLoading) {
    return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-orange-500" />
          Getting Started
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-4 flex-1" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
  }

  if (isComplete) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className="text-center py-4">
            <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-3" />
            <h3 className="font-semibold text-green-900">You're all set up!</h3>
            <p className="text-sm text-green-700 mt-1">
              Complete your profile and explore your roadmap to continue your journey.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-orange-500" />
            Getting Started
            {completedCount > 0 && (
              <Badge variant="secondary">{completedCount}/{totalCount}</Badge>
            )}
          </CardTitle>
          <Button size="sm" variant="outline" asChild>
            <Link href="/student/onboarding">
              View All
            </Link>
          </Button>
        </div>
        <CardDescription className="text-xs">
          Complete these steps to get personalized career guidance
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span>Progress</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-2">
          {steps.slice(0, 3).map((step) => (
            <Link key={step.id} href={step.link} className="block">
              <div
                className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                  step.completed
                    ? "bg-green-50 text-green-900"
                    : "hover:bg-gray-50 text-gray-700"
                }`}
              >
                <div className={step.completed ? "text-green-600" : "text-gray-400"}>
                  {step.completed ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <Circle className="w-5 h-5" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{step.title}</p>
                  <p className="text-xs opacity-80">{step.description}</p>
                </div>
                <ArrowRight className="w-4 h-4 opacity-50" />
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Compact Onboarding Widget (for dashboard)
 */
export function OnboardingWidget() {
  const [completed, setCompleted] = useState(0);
  const [total, setTotal] = useState(3);

  useEffect(() => {
    async function fetchProgress() {
      try {
        const response = await fetch("/api/student/onboarding");
        if (response.ok) {
          const data = await response.json();
          setCompleted(data.completed || 0);
          setTotal(data.total || 3);
        }
      } catch (error) {
        console.error("Failed to fetch onboarding progress:", error);
      }
    }

    fetchProgress();
  }, []);

  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-5 h-5" />
        <span className="font-semibold">Welcome! Let's get started</span>
      </div>
      <p className="text-sm opacity-90 mb-3">
        {completed < total ? (
          <>Complete {total - completed} more step{total - completed > 1 ? "s" : ""} to see your roadmap</>
        ) : (
          <>Complete these steps to get your personalized roadmap</>
        )}
      </p>
      <div className="w-full bg-white/20 rounded-full h-2 mb-2">
        <div className="h-2 rounded-full bg-white" style={{ width: `${progress}%` }} />
      </div>
      <Button size="sm" variant="secondary" className="w-full" asChild>
        <Link href="/student/onboarding">
          {progress >= 100 ? "View Roadmap" : "Continue"}
        </Link>
      </Button>
    </div>
  );
}
