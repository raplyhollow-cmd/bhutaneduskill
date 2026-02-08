"use client";

import { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";

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
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 text-green-600 mb-4">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Assessment Complete!
          </h1>
          <p className="text-gray-600">
            Thank you for completing the assessment.
          </p>
        </div>
        {children}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-gray-500">
            Question {currentQuestion + 1} of {totalQuestions}
          </span>
          <span className="text-sm font-medium text-gray-900">
            {Math.round(progress)}% Complete
          </span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
        <p className="text-gray-600">{description}</p>
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="pt-6">
          <Progress value={progress} className="h-2" />
        </CardContent>
      </Card>

      {/* Question Card */}
      <Card className="border-2">
        <CardContent className="p-6">
          {children}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={onPrevious}
          disabled={!canGoBack}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>

        {showComplete ? (
          <Button onClick={onComplete} disabled={!canGoNext} size="lg">
            Complete Assessment
            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </Button>
        ) : (
          <Button onClick={onNext} disabled={!canGoNext}>
            {actionLabel}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}
