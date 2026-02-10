"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface WizardContainerProps {
  children: ReactNode;
  currentStep: number;
  totalSteps: number;
  title: string;
  subtitle?: string;
  onExit?: () => void;
  showExit?: boolean;
}

export function WizardContainer({
  children,
  currentStep,
  totalSteps,
  title,
  subtitle,
  onExit,
  showExit = true,
}: WizardContainerProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header Card */}
        <div className="bg-white rounded-t-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
              {subtitle && (
                <p className="text-gray-500 mt-1">{subtitle}</p>
              )}
            </div>
            {showExit && (
              <button
                onClick={onExit}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Exit wizard"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
              <span>Step {currentStep} of {totalSteps}</span>
              <span>{Math.round((currentStep / totalSteps) * 100)}% complete</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-300 ease-out"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Content Card */}
        <div className="bg-white rounded-b-2xl shadow-sm border border-t-0 border-gray-200 p-6">
          {children}
        </div>

        {/* Help Text */}
        <p className="text-center text-sm text-gray-500 mt-4">
          Need help? Contact <a href="mailto:support@careercompass.bt" className="text-blue-600 hover:underline">support</a>
        </p>
      </div>
    </div>
  );
}
