"use client";

import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface AssessmentContainerProps {
  title: string;
  description: string;
  currentQuestion: number;
  totalQuestions: number;
  onPrevious: () => void;
  onNext: () => void;
  canGoNext: boolean;
  canGoBack: boolean;
  children: ReactNode;
  actionLabel?: string;
  onComplete?: () => void;
  showComplete?: boolean;
  isCompleted?: boolean;
}

export function AssessmentContainer({
  title,
  description,
  currentQuestion,
  totalQuestions,
  onPrevious,
  onNext,
  canGoNext,
  canGoBack,
  children,
  actionLabel = "Next",
  onComplete,
  showComplete = false,
  isCompleted = false,
}: AssessmentContainerProps) {
  const progress = ((currentQuestion + 1) / totalQuestions) * 100;

  if (isCompleted) {
    return (
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-12"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-white mb-6 shadow-lg"
          >
            <Check className="w-12 h-12" />
          </motion.div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Assessment Complete!
          </h1>
          <p className="text-gray-600 text-lg">
            Thank you for completing the assessment.
          </p>
        </motion.div>
        {children}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Premium Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative"
      >
        {/* Background decoration */}
        <div className="absolute -top-8 -left-8 w-32 h-32 bg-orange-100 rounded-full blur-3xl opacity-50" />
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-orange-200 rounded-full blur-2xl opacity-40" />

        <div className="relative">
          {/* Progress bar with glow effect */}
          <Card className="border-2 border-gray-100 shadow-lg shadow-orange-100/50 overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-gray-600">
                  Question {currentQuestion + 1} of {totalQuestions}
                </span>
                <span className="text-sm font-bold text-orange-600 bg-orange-50 px-3 py-1 rounded-full">
                  {Math.round(progress)}%
                </span>
              </div>
              <div className="relative">
                <Progress
                  value={progress}
                  className="h-3 bg-gray-100"
                />
                {/* Animated glow on progress bar */}
                <motion.div
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-transparent via-white/30 to-transparent w-20"
                  animate={{ x: ["0%", "500%", "1000%"] }}
                  transition={{ duration: 2, repeat: Infinity, repeatType: "loop", ease: "linear" }}
                  style={{ width: "80px" }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Title and description */}
          <div className="mt-6 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
            <p className="text-gray-600">{description}</p>
          </div>
        </div>
      </motion.div>

      {/* Question Card with premium styling */}
      <motion.div
        key={currentQuestion}
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -50 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <Card className="border-2 border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden">
          {/* Subtle gradient top border */}
          <div className="h-1.5 bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600" />
          <CardContent className="p-8">
            {children}
          </CardContent>
        </Card>
      </motion.div>

      {/* Premium Navigation */}
      <div className="flex items-center justify-between gap-4">
        <Button
          variant="outline"
          onClick={onPrevious}
          disabled={!canGoBack}
          className={`
            px-6 py-6 rounded-xl font-semibold shadow-md transition-all duration-200
            ${!canGoBack ? 'opacity-40 cursor-not-allowed' : 'hover:shadow-lg hover:-translate-y-0.5'}
          `}
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Previous
        </Button>

        {showComplete ? (
          <Button
            onClick={onComplete}
            disabled={!canGoNext}
            className="px-8 py-6 rounded-xl font-semibold bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg shadow-orange-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-xl hover:-translate-y-0.5"
          >
            Complete Assessment
            <Check className="w-5 h-5 ml-2" />
          </Button>
        ) : (
          <Button
            onClick={onNext}
            disabled={!canGoNext}
            className={`
              px-8 py-6 rounded-xl font-semibold shadow-lg transition-all duration-200
              ${canGoNext
                ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-orange-200 hover:shadow-xl hover:-translate-y-0.5'
                : 'bg-gray-300 cursor-not-allowed'
              }
            `}
          >
            {actionLabel}
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}
