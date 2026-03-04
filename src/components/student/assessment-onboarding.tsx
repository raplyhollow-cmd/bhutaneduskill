/**
 * STUDENT ASSESSMENT ONBOARDING
 *
 * Shows when students first log in and haven't completed required assessments.
 * Blocks access to dashboard until 4 assessments are completed:
 * 1. MBTI (Personality Type)
 * 2. RIASEC (Career Interests)
 * 3. Work Values
 * 4. Skills Assessment
 *
 * Progress is saved - students can close and continue later.
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Check,
  ChevronRight,
  Brain,
  Compass,
  Heart,
  Star,
  Loader2,
  Sparkles,
  PartyPopper,
  Lock,
} from "lucide-react";

interface AssessmentOnboardingProps {
  userId: string;
  onComplete?: () => void;
}

interface AssessmentStatus {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  path: string;
  completed: boolean;
  color: string;
}

const REQUIRED_ASSESSMENTS: Omit<AssessmentStatus, "completed">[] = [
  {
    id: "mbti",
    name: "Personality Assessment",
    description: "Discover your personality type and how you learn best",
    icon: <Brain className="w-6 h-6" />,
    path: "/student/assessment/mbti",
    color: "bg-purple-500",
  },
  {
    id: "riasec",
    name: "Career Interests",
    description: "Explore which careers match your interests",
    icon: <Compass className="w-6 h-6" />,
    path: "/student/assessment/riasec",
    color: "bg-blue-500",
  },
  {
    id: "work-values",
    name: "Work Values",
    description: "Understand what matters most to you in a career",
    icon: <Heart className="w-6 h-6" />,
    path: "/student/assessment/work-values",
    color: "bg-pink-500",
  },
  {
    id: "skills",
    name: "Skills Assessment",
    description: "Identify your current skills and areas to develop",
    icon: <Star className="w-6 h-6" />,
    path: "/student/skills",
    color: "bg-amber-500",
  },
];

export function AssessmentOnboarding({ userId, onComplete }: AssessmentOnboardingProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [assessments, setAssessments] = useState<AssessmentStatus[]>([]);
  const [currentAssessment, setCurrentAssessment] = useState<number | null>(null);
  const [allComplete, setAllComplete] = useState(false);

  useEffect(() => {
    checkAssessmentStatus();
  }, [userId]);

  const checkAssessmentStatus = async () => {
    try {
      const res = await fetch("/api/student/assessment-status");
      const json = await res.json();

      if (json.data) {
        const status = json.data;
        const assessmentsWithStatus = REQUIRED_ASSESSMENTS.map((assessment) => ({
          ...assessment,
          completed: status.completedAssessments?.includes(assessment.id) || false,
        }));

        setAssessments(assessmentsWithStatus);

        // Find first incomplete assessment
        const firstIncomplete = assessmentsWithStatus.findIndex((a) => !a.completed);
        setCurrentAssessment(firstIncomplete === -1 ? null : firstIncomplete);

        // Check if all complete
        setAllComplete(firstIncomplete === -1);

        // If all complete, mark onboarding done
        if (firstIncomplete === -1) {
          await markOnboardingComplete();
          onComplete?.();
        }
      }
    } catch (error) {
      console.error("Failed to check assessment status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const markOnboardingComplete = async () => {
    try {
      await fetch("/api/student/onboarding-complete", { method: "POST" });
    } catch (error) {
      console.error("Failed to mark onboarding complete:", error);
    }
  };

  const handleStartAssessment = (index: number) => {
    if (assessments[index].completed) {
      // View results if already completed
      router.push(`${assessments[index].path}`);
    } else {
      // Start assessment
      router.push(`${assessments[index].path}?onboarding=true`);
    }
  };

  const handleSkipForNow = () => {
    // Let them explore but they'll be reminded
    onComplete?.();
  };

  const completedCount = assessments.filter((a) => a.completed).length;
  const progress = (completedCount / REQUIRED_ASSESSMENTS.length) * 100;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-blue-50 flex items-center justify-center p-4">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    );
  }

  if (allComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg text-center">
          <CardContent className="pt-12 pb-12">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <PartyPopper className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">You're All Set!</h2>
            <p className="text-gray-600 mb-6">
              You've completed all 4 assessments. We can now provide personalized guidance
              based on your personality, interests, and skills.
            </p>
            <Button onClick={onComplete} size="lg" className="bg-green-600 hover:bg-green-700">
              Go to Dashboard
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-blue-50 p-4 py-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <Card className="mb-6 border-violet-200 bg-white/80 backdrop-blur">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-violet-100 rounded-full flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-violet-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Welcome to Your Personalized Journey!</h1>
                <p className="text-gray-600">Let's discover your unique strengths and interests</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-2">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Assessment Progress</span>
                <span className="font-medium text-violet-700">{completedCount} of {REQUIRED_ASSESSMENTS.length} completed</span>
              </div>
              <Progress value={progress} className="h-3" />
            </div>

            <p className="text-sm text-gray-500 mt-2">
              {completedCount === 0 && "Start your first assessment to unlock personalized insights!"}
              {completedCount > 0 && completedCount < REQUIRED_ASSESSMENTS.length && `Great progress! ${REQUIRED_ASSESSMENTS.length - completedCount} more to go.`}
            </p>
          </CardContent>
        </Card>

        {/* Assessment Cards */}
        <div className="grid md:grid-cols-2 gap-4">
          {assessments.map((assessment, index) => (
            <Card
              key={assessment.id}
              className={`cursor-pointer transition-all hover:shadow-lg ${
                assessment.completed
                  ? "border-green-300 bg-green-50/50"
                  : currentAssessment === index
                    ? "border-violet-400 bg-violet-50/50 ring-2 ring-violet-200"
                    : "border-gray-200 hover:border-violet-300"
              }`}
              onClick={() => handleStartAssessment(index)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    assessment.completed ? "bg-green-100" : assessment.color + " bg-opacity-20"
                  }`}>
                    {assessment.completed ? (
                      <Check className="w-6 h-6 text-green-600" />
                    ) : (
                      <div className={assessment.color.replace("bg-", "text-")}>
                        {assessment.icon}
                      </div>
                    )}
                  </div>
                  {assessment.completed && (
                    <Badge className="bg-green-100 text-green-700">Complete</Badge>
                  )}
                  {!assessment.completed && currentAssessment === index && (
                    <Badge className="bg-violet-100 text-violet-700">Up Next</Badge>
                  )}
                </div>
                <CardTitle className="text-lg">{assessment.name}</CardTitle>
                <CardDescription>{assessment.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant={assessment.completed ? "outline" : "default"}
                  className={`w-full ${
                    !assessment.completed && currentAssessment === index
                      ? "bg-violet-600 hover:bg-violet-700"
                      : ""
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStartAssessment(index);
                  }}
                >
                  {assessment.completed ? "View Results" : "Start Assessment"}
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-8 flex justify-between items-center">
          <p className="text-sm text-gray-500">
            You can come back anytime to complete these assessments.
          </p>
          <Button variant="ghost" onClick={handleSkipForNow} className="text-gray-500">
            Skip for now
            <Lock className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
