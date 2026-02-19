"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

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
    <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-200">
      <div className="flex items-center gap-3">
        {!isFirstStep && canGoBack && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Button
              variant="outline"
              onClick={onBack}
              disabled={isNextLoading}
              className="border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {backLabel || "Back"}
            </Button>
          </motion.div>
        )}
      </div>

      <div className="flex items-center gap-3">
        {showSkip && onSkip && !isLastStep && (
          <Button
            variant="ghost"
            onClick={onSkip}
            disabled={isNextLoading}
            type="button"
            className="text-slate-500 hover:text-slate-700 hover:bg-slate-100"
          >
            {skipLabel}
          </Button>
        )}

        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Button
            onClick={onNext}
            disabled={!canGoNext || isNextLoading}
            type="submit"
            className="min-w-[140px] bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-200"
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
        </motion.div>
      </div>
    </div>
  );
}