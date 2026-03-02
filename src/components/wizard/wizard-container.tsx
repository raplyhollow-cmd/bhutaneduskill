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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-50/95 to-slate-50 flex items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-2xl animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
        {/* Main Card Container - Apple-inspired Premium Design */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-200/60 overflow-hidden">
          {/* Header - Compact */}
          <div className="px-6 py-5 border-b border-gray-200/60 bg-white/40">
            <div className="flex items-center justify-between mb-5">
              <div className="flex-1">
                <h1 className="text-lg sm:text-xl font-semibold text-gray-900 tracking-tight">
                  {title}
                </h1>
                {subtitle && (
                  <p className="text-gray-500 text-xs mt-0.5 leading-tight">{subtitle}</p>
                )}
              </div>
              {showExit && (
                <button
                  onClick={onExit}
                  className="w-8 h-8 rounded-lg bg-gray-100/80 hover:bg-gray-200/80 border border-gray-200/60 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-all"
                  aria-label="Exit wizard"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Compact Progress Bar - Apple Style */}
            <div className="relative h-1 bg-gray-200/80 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500 ease-out shadow-sm shadow-blue-500/30"
                style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
              />
            </div>

            {/* Step Labels - Compact Row */}
            <div className="flex items-center justify-between mt-4">
              {Array.from({ length: totalSteps }).map((_, index) => {
                const stepNumber = index + 1;
                const isCompleted = stepNumber < currentStep;
                const isCurrent = stepNumber === currentStep;
                const stepTitle = stepTitles?.[index];

                return (
                  <div key={stepNumber} className="flex items-center gap-1.5">
                    <div
                      className={cn(
                        "w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-medium transition-all duration-300",
                        isCompleted && "bg-blue-500 text-white shadow-sm shadow-blue-500/30",
                        isCurrent && "bg-gray-900 text-white shadow-sm shadow-gray-900/20",
                        !isCompleted && !isCurrent && "bg-gray-200 text-gray-500"
                      )}
                    >
                      {isCompleted ? <Check className="w-3 h-3" /> : <span>{stepNumber}</span>}
                    </div>
                    {stepTitle && (
                      <span
                        className={cn(
                          "text-[10px] sm:text-xs uppercase tracking-wide hidden sm:block transition-colors duration-300",
                          (isCompleted || isCurrent) && "text-gray-900 font-medium",
                          !isCompleted && !isCurrent && "text-gray-400"
                        )}
                      >
                        {stepTitle}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Content Area - Tighter padding */}
          <div className="p-6 sm:p-8 bg-white/30">
            <div className="animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
              {children}
            </div>
          </div>
        </div>

        {/* Help Text - Minimal */}
        <p className="text-center text-xs text-gray-400 mt-5">
          Need help? <a href="mailto:support@bhutaneduskill.bt" className="text-gray-500 hover:text-gray-700 transition-colors font-medium">support@bhutaneduskill.bt</a>
        </p>
      </div>
    </div>
  );
}
