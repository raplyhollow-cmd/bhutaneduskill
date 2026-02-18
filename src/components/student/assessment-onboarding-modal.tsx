"use client";

/**
 * Premium Assessment Onboarding Modal
 *
 * Shows for new students who haven't completed assessments yet.
 * Features:
 * - Full-screen overlay with backdrop blur
 * - Assessment cards with progress tracking
 * - Interactive hover effects and animations
 * - Confetti celebration when all assessments complete
 * - Skip for now option (returns to dashboard)
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Briefcase,
  Users,
  Heart,
  BookOpen,
  MessageSquare,
  Clock,
  CheckCircle,
  ChevronRight,
  Sparkles,
  Target,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { logger } from "@/lib/logger";

interface OnboardingData {
  isFirstTime: boolean;
  hasCompletedAssessments: boolean;
  completedAssessments: number;
  requiredAssessments: number;
  profileComplete: boolean;
  canProceed: boolean;
  assessmentProgress: {
    riasec: boolean;
    mbti: boolean;
    workValues: boolean;
    learningStyles: boolean;
    disc: boolean;
  };
}

interface AssessmentCard {
  id: string;
  title: string;
  description: string;
  icon: typeof Briefcase;
  time: string;
  questions: number;
  route: string;
  gradient: string;
  bgColor: string;
  completed: boolean;
}

const ASSESSMENTS: Omit<AssessmentCard, "completed">[] = [
  {
    id: "riasec",
    title: "Career Interests",
    description: "Discover which careers match your interests through Holland Code (RIASEC)",
    icon: Briefcase,
    time: "10 min",
    questions: 18,
    route: "/student/assessment/riasec",
    gradient: "linear-gradient(135deg, rgb(168 85 247) 0%, rgb(147 51 234) 100%)",
    bgColor: "bg-purple-50 dark:bg-purple-950",
  },
  {
    id: "mbti",
    title: "Personality Type",
    description: "Understand your personality type and how it affects your learning",
    icon: Users,
    time: "15 min",
    questions: 16,
    route: "/student/assessment/mbti",
    gradient: "linear-gradient(135deg, rgb(59 130 246) 0%, rgb(37 99 235) 100%)",
    bgColor: "bg-blue-50 dark:bg-blue-950",
  },
  {
    id: "workValues",
    title: "Work Values",
    description: "Identify what matters most to you in a future career",
    icon: Heart,
    time: "10 min",
    questions: 18,
    route: "/student/assessment/work-values",
    gradient: "linear-gradient(135deg, rgb(249 115 22) 0%, rgb(194 65 12) 100%)",
    bgColor: "bg-orange-50 dark:bg-orange-950",
  },
  {
    id: "learningStyles",
    title: "Learning Style",
    description: "Find out how you learn best (VARK assessment)",
    icon: BookOpen,
    time: "8 min",
    questions: 12,
    route: "/student/assessment/learning-styles",
    gradient: "linear-gradient(135deg, rgb(34 197 94) 0%, rgb(22 163 74) 100%)",
    bgColor: "bg-green-50 dark:bg-green-950",
  },
  {
    id: "disc",
    title: "Behavioral Style",
    description: "Understand your communication and work style",
    icon: MessageSquare,
    time: "12 min",
    questions: 8,
    route: "/student/assessment/disc",
    gradient: "linear-gradient(135deg, rgb(236 72 153) 0%, rgb(219 39 119) 100%)",
    bgColor: "bg-pink-50 dark:bg-pink-950",
  },
];

interface AssessmentOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

export function AssessmentOnboardingModal({
  isOpen,
  onClose,
  onComplete,
}: AssessmentOnboardingModalProps) {
  const router = useRouter();
  const [onboardingData, setOnboardingData] = useState<OnboardingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchOnboardingStatus();
    }
  }, [isOpen]);

  const fetchOnboardingStatus = async () => {
    try {
      const response = await fetch("/api/student/onboarding/status");
      if (response.ok) {
        const data = await response.json();
        setOnboardingData(data);

        // Trigger celebration if all assessments complete
        if (data.hasCompletedAssessments && data.completedAssessments >= data.requiredAssessments) {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 3000);
        }
      }
    } catch (error) {
      logger.error("Failed to fetch onboarding status:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssessmentClick = (assessment: AssessmentCard) => {
    router.push(assessment.route);
    onClose();
  };

  const handleSkip = () => {
    logger.info("User skipped assessment onboarding");
    onClose();
  };

  const completedCount = onboardingData?.completedAssessments || 0;
  const requiredCount = onboardingData?.requiredAssessments || 3;
  const progressPercent = Math.min((completedCount / requiredCount) * 100, 100);
  const allComplete = completedCount >= requiredCount;

  // Create assessment cards with completion status
  const assessmentCards: AssessmentCard[] = ASSESSMENTS.map((a) => ({
    ...a,
    completed: onboardingData?.assessmentProgress?.[a.id as keyof typeof onboardingData.assessmentProgress] || false,
  }));

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={allComplete ? onClose : undefined}
        />

        {/* Confetti Celebration */}
        {showConfetti && <ConfettiOverlay />}

        {/* Modal */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 25,
          }}
          className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden bg-white dark:bg-gray-900 rounded-2xl shadow-2xl"
        >
          {/* Header with Gradient */}
          <div className="relative overflow-hidden">
            <div
              className="absolute inset-0 opacity-10"
              style={{
                background:
                  "linear-gradient(135deg, rgb(249 115 22) 0%, rgb(168 85 247) 50%, rgb(59 130 246) 100%)",
              }}
            />
            <div className="relative px-6 py-8 sm:px-8">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg"
                    style={{
                      background:
                        "linear-gradient(135deg, rgb(249 115 22) 0%, rgb(194 65 12) 100%)",
                    }}
                  >
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                      {allComplete ? "Assessments Complete! 🎉" : "Let's Discover Your Unique Profile"}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                      {allComplete
                        ? "You're all set! AI-powered insights are now available on your dashboard."
                        : `Complete ${requiredCount} quick assessments to unlock personalized AI career guidance`}
                    </p>
                  </div>
                </div>
                {allComplete && (
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                )}
              </div>

              {/* Progress Bar */}
              {!allComplete && (
                <div className="bg-gray-100 dark:bg-gray-800 rounded-full p-1">
                  <div className="flex items-center justify-between px-3 py-2 mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {completedCount} of {requiredCount} assessments completed
                    </span>
                    <span className="text-sm font-bold text-orange-600">
                      {Math.round(progressPercent)}%
                    </span>
                  </div>
                  <Progress value={progressPercent} className="h-3" />
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-6 sm:px-8 overflow-y-auto max-h-[60vh]">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : allComplete ? (
              /* Celebration State */
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8"
              >
                <div
                  className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center"
                  style={{
                    background:
                      "linear-gradient(135deg, rgb(34 197 94) 0%, rgb(22 163 74) 100%)",
                  }}
                >
                  <CheckCircle className="w-12 h-12 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                  Amazing Work!
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                  You've completed all assessments. Check your dashboard for personalized AI insights,
                  career recommendations, and learning suggestions based on your unique profile.
                </p>
                <Button
                  onClick={onClose}
                  size="lg"
                  className="shadow-lg"
                  style={{
                    background:
                      "linear-gradient(135deg, rgb(249 115 22) 0%, rgb(194 65 12) 100%)",
                  }}
                >
                  Go to Dashboard
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </motion.div>
            ) : (
              /* Assessment Cards */
              <div className="grid sm:grid-cols-2 gap-4">
                {assessmentCards.map((assessment, index) => {
                  const Icon = assessment.icon;
                  return (
                    <motion.div
                      key={assessment.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card
                        className={`p-5 cursor-pointer transition-all duration-300 hover:shadow-xl ${
                          assessment.completed
                            ? "border-green-300 bg-green-50/50 dark:bg-green-950/20"
                            : "hover:border-orange-300"
                        }`}
                        onClick={() => handleAssessmentClick(assessment)}
                      >
                        <div className="flex items-start gap-4">
                          <div
                            className={`w-14 h-14 rounded-xl flex items-center justify-center shadow-md flex-shrink-0 ${
                              assessment.completed ? "opacity-60" : ""
                            }`}
                            style={{ background: assessment.gradient }}
                          >
                            <Icon className="w-7 h-7 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h3 className="font-semibold text-gray-900 dark:text-white">
                                {assessment.title}
                              </h3>
                              {assessment.completed && (
                                <Badge className="bg-green-100 text-green-700 border-green-300 flex-shrink-0">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Done
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                              {assessment.description}
                            </p>
                            <div className="flex items-center gap-3 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {assessment.time}
                              </span>
                              <span>{assessment.questions} questions</span>
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {!allComplete && !loading && (
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800 border-t flex items-center justify-between">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                You can complete these anytime from your dashboard
              </p>
              <Button variant="ghost" onClick={handleSkip}>
                Skip for now
              </Button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Simple confetti overlay component
 * Uses CSS animations for performance
 */
function ConfettiOverlay() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {[...Array(50)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2"
          style={{
            left: `${Math.random() * 100}%`,
            top: "-20px",
            backgroundColor: ["rgb(249 115 22)", "rgb(168 85 247)", "rgb(59 130 246)", "rgb(34 197 94)"][
              Math.floor(Math.random() * 4)
            ],
          }}
          animate={{
            y: [0, window.innerHeight + 20],
            x: [0, (Math.random() - 0.5) * 200],
            rotate: [0, Math.random() * 360],
          }}
          transition={{
            duration: 2 + Math.random() * 2,
            ease: "easeOut",
            repeat: 1,
          }}
        />
      ))}
    </div>
  );
}
