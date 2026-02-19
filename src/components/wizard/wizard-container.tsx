"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { X, Check } from "lucide-react";

interface WizardContainerProps {
  children: ReactNode;
  currentStep: number;
  totalSteps: number;
  title: string;
  subtitle?: string;
  onExit?: () => void;
  showExit?: boolean;
  stepTitles?: string[];
}

export function WizardContainer({
  children,
  currentStep,
  totalSteps,
  title,
  subtitle,
  onExit,
  showExit = true,
  stepTitles,
}: WizardContainerProps) {
  const progress = Math.round((currentStep / totalSteps) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-3xl animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
        {/* Main Card Container */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200/60 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-50 to-white p-6 sm:p-8 border-b border-slate-200/60">
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  {title}
                </h1>
                {subtitle && (
                  <p className="text-slate-500 mt-2 text-sm sm:text-base">{subtitle}</p>
                )}
              </div>
              {showExit && (
                <button
                  onClick={onExit}
                  className="ml-4 w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:border-slate-300 hover:shadow-md transition-all duration-200"
                  aria-label="Exit wizard"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Modern Stepper Progress */}
            <div className="relative">
              {/* Progress Bar Background */}
              <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-200 -translate-y-1/2 rounded-full" />

              {/* Progress Bar Fill */}
              <div
                className="absolute top-1/2 left-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 -translate-y-1/2 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
              />

              {/* Step Indicators */}
              <div className="relative flex justify-between">
                {Array.from({ length: totalSteps }).map((_, index) => {
                  const stepNumber = index + 1;
                  const isCompleted = stepNumber < currentStep;
                  const isCurrent = stepNumber === currentStep;
                  const isUpcoming = stepNumber > currentStep;

                  return (
                    <div key={stepNumber} className="flex flex-col items-center">
                      {/* Step Circle */}
                      <div
                        className={cn(
                          "w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 relative z-10",
                          isCompleted && "bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/30 scale-110",
                          isCurrent && "bg-white border-3 border-blue-500 text-blue-600 shadow-lg scale-110",
                          isUpcoming && "bg-white border-2 border-slate-200 text-slate-400"
                        )}
                      >
                        {isCompleted ? (
                          <Check className="w-5 h-5 sm:w-6 sm:h-6" />
                        ) : (
                          <span>{stepNumber}</span>
                        )}
                      </div>

                      {/* Step Label */}
                      {stepTitles && stepTitles[index] && (
                        <span
                          className={cn(
                            "mt-2 text-xs sm:text-sm font-medium hidden sm:block transition-colors duration-300",
                            isCompleted && "text-blue-600",
                            isCurrent && "text-slate-800",
                            isUpcoming && "text-slate-400"
                          )}
                        >
                          {stepTitles[index]}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Progress Percentage */}
            <div className="mt-6 flex items-center justify-between">
              <span className="text-sm text-slate-500">
                Step {currentStep} of {totalSteps}
              </span>
              <span className="text-sm font-semibold text-blue-600">
                {progress}% complete
              </span>
            </div>
          </div>

          {/* Content Area */}
          <div className="p-6 sm:p-8 min-h-[400px]">
            <div className="animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
              {children}
            </div>
          </div>
        </div>

        {/* Help Text */}
        <p className="text-center text-sm text-slate-500 mt-6 flex items-center justify-center gap-2">
          Need help? Contact{" "}
          <a
            href="mailto:support@careercompass.bt"
            className="text-blue-600 hover:text-blue-700 hover:underline font-medium inline-flex items-center gap-1 transition-colors"
          >
            support@careercompass.bt
          </a>
        </p>
      </div>
    </div>
  );
}
