"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";

interface WizardNavigationProps {
  currentStep: number;
  totalSteps: number;
  canGoNext: boolean;
  canGoBack: boolean;
  isNextLoading?: boolean;
  onNext: () => void;
  onBack: () => void;
  onSkip?: () => void;
  nextLabel?: string;
  backLabel?: string;
  showSkip?: boolean;
  skipLabel?: string;
}

export function WizardNavigation({
  currentStep,
  totalSteps,
  canGoNext,
  canGoBack,
  isNextLoading = false,
  onNext,
  onBack,
  onSkip,
  nextLabel,
  backLabel,
  showSkip = false,
  skipLabel = "Skip for now",
}: WizardNavigationProps) {
  const isLastStep = currentStep === totalSteps;
  const isFirstStep = currentStep === 1;

  return (
    <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
      <div className="flex items-center gap-3">
        {!isFirstStep && canGoBack && (
          <Button
            variant="outline"
            onClick={onBack}
            disabled={isNextLoading}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {backLabel || "Back"}
          </Button>
        )}
      </div>

      <div className="flex items-center gap-3">
        {showSkip && onSkip && !isLastStep && (
          <Button
            variant="ghost"
            onClick={onSkip}
            disabled={isNextLoading}
            type="button"
          >
            {skipLabel}
          </Button>
        )}

        <Button
          onClick={onNext}
          disabled={!canGoNext || isNextLoading}
          type="submit"
        >
          {isNextLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              {nextLabel || (isLastStep ? "Complete" : "Continue")}
              {!isLastStep && <ArrowRight className="w-4 h-4 ml-2" />}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
