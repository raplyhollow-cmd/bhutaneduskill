"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

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
    <div className="flex items-center justify-between mt-6 pt-5 border-t border-gray-200/60">
      <div className="flex items-center gap-2">
        {!isFirstStep && canGoBack && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Button
              variant="ghost"
              onClick={onBack}
              disabled={isNextLoading}
              className="text-gray-500 hover:text-gray-900 hover:bg-gray-100/80"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              {backLabel || "Back"}
            </Button>
          </motion.div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Button
            onClick={onNext}
            disabled={!canGoNext || isNextLoading}
            type="submit"
            className={cn(
              "min-w-[120px] bg-gray-900 text-white hover:bg-gray-800 border-0 shadow-sm shadow-gray-900/10",
              "font-medium transition-all duration-200"
            )}
          >
            {isNextLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                {nextLabel || (isLastStep ? "Complete" : "Continue")}
                {!isLastStep && <ArrowRight className="w-4 h-4 ml-1" />}
              </>
            )}
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
