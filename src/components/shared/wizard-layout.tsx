"use client";

import { ReactNode, useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { portal } from "@/styles/design-tokens";

export interface WizardStep {
  id: string;
  title: string;
  content: ReactNode;
  canProceed?: boolean;
  onSubmit?: () => Promise<boolean | void> | boolean | void;
}

interface WizardLayoutProps {
  steps: WizardStep[];
  portalType: "student" | "teacher" | "parent" | "counselor" | "school-admin" | "admin" | "ministry";
  onComplete?: () => Promise<void> | void;
  onCancel?: () => void;
  title?: string;
  subtitle?: string;
  showExit?: boolean;
  autoSaveKey?: string;
}

const PORTAL_COLORS = {
  student: portal.student.primary,
  teacher: portal.teacher.primary,
  parent: portal.parent.primary,
  counselor: portal.counselor.primary,
  "school-admin": portal.schoolAdmin.primary,
  admin: portal.admin.primary,
  ministry: portal.ministry.primary,
} as const;

const PORTAL_GRADIENTS = {
  student: portal.student.gradient,
  teacher: portal.teacher.gradient,
  parent: portal.parent.gradient,
  counselor: portal.counselor.gradient,
  "school-admin": portal.schoolAdmin.gradient,
  admin: portal.admin.gradient,
  ministry: portal.ministry.gradient,
} as const;

export function WizardLayout({
  steps,
  portalType,
  onComplete,
  onCancel,
  title,
  subtitle,
  showExit = true,
  autoSaveKey,
}: WizardLayoutProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedData, setSavedData] = useState<Record<string, any>>({});

  // Auto-save to localStorage
  useEffect(() => {
    if (!autoSaveKey) return;

    // Load saved data
    const saved = localStorage.getItem(autoSaveKey);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setSavedData(data);
        if (data.step !== undefined) {
          setActiveStep(Math.min(data.step, steps.length - 1));
        }
      } catch {
        // Ignore parse errors
      }
    }

    // Save current step
    const saveInterval = setInterval(() => {
      localStorage.setItem(
        autoSaveKey,
        JSON.stringify({ ...savedData, step: activeStep })
      );
    }, 1000);

    return () => clearInterval(saveInterval);
  }, [autoSaveKey, activeStep, savedData]);

  const updateSavedData = useCallback((key: string, value: string | number | boolean | Record<string, unknown>) => {
    setSavedData((prev) => {
      const updated = { ...prev, [key]: value };
      if (autoSaveKey) {
        localStorage.setItem(autoSaveKey, JSON.stringify(updated));
      }
      return updated;
    });
  }, [autoSaveKey]);

  const handleNext = async () => {
    const currentStepData = steps[activeStep];

    if (currentStepData.onSubmit) {
      setIsSubmitting(true);
      try {
        const result = await currentStepData.onSubmit();
        // If onSubmit returns false, don't proceed
        if (result === false) {
          setIsSubmitting(false);
          return;
        }
      } catch (error) {
        console.error("Step submission error:", error);
        setIsSubmitting(false);
        return;
      }
      setIsSubmitting(false);
    }

    if (activeStep === steps.length - 1) {
      // Complete wizard
      if (autoSaveKey) {
        localStorage.removeItem(autoSaveKey);
      }
      if (onComplete) {
        setIsSubmitting(true);
        try {
          await onComplete();
        } finally {
          setIsSubmitting(false);
        }
      }
    } else {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => Math.max(0, prev - 1));
  };

  const canGoNext = steps[activeStep]?.canProceed ?? true;
  const isFirstStep = activeStep === 0;
  const isLastStep = activeStep === steps.length - 1;
  const portalColor = PORTAL_COLORS[portalType];
  const portalGradient = PORTAL_GRADIENTS[portalType];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100/50 to-slate-200/50 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-4xl animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
        {/* Main Card Container */}
        <div
          className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200/60 overflow-hidden"
          style={{ background: "rgba(255, 255, 255, 0.8)" }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-50 to-white p-6 sm:p-8 border-b border-slate-200/60">
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                {title && (
                  <h1
                    className="text-2xl sm:text-3xl font-bold bg-clip-text text-transparent"
                    style={{ backgroundImage: portalGradient }}
                  >
                    {title}
                  </h1>
                )}
                {subtitle && (
                  <p className="text-slate-500 mt-2 text-sm sm:text-base">{subtitle}</p>
                )}
              </div>
              {showExit && onCancel && (
                <button
                  onClick={onCancel}
                  className="ml-4 w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:border-slate-300 hover:shadow-md transition-all duration-200"
                  aria-label="Exit wizard"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Current Step Title */}
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-slate-800">
                {steps[activeStep]?.title}
              </h2>
              <p className="text-sm text-slate-500">
                Step {activeStep + 1} of {steps.length}
              </p>
            </div>

            {/* Progress Bar - Slim Neon Line */}
            <div className="flex gap-1 mt-4">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-1 flex-1 transition-all duration-500 rounded-full",
                    i <= activeStep
                      ? "bg-slate-800"
                      : "bg-slate-200"
                  )}
                  style={{
                    backgroundColor: i <= activeStep ? portalColor : undefined,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Content Area */}
          <div className="p-6 sm:p-8 min-h-[400px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeStep}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.3 }}
                className="glass-panel p-6 rounded-2xl relative overflow-hidden"
                style={{
                  backdropFilter: "blur(12px)",
                  background: "rgba(255, 255, 255, 0.6)",
                  border: "1px solid rgba(255, 255, 255, 0.3)",
                }}
              >
                {/* Portal-specific accent */}
                <div
                  className="absolute top-0 left-0 w-1 h-full"
                  style={{ background: portalGradient }}
                />

                <div className="pl-4">
                  {steps[activeStep]?.content}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation */}
          <div className="px-6 sm:px-8 pb-6 sm:pb-8">
            <div className="flex items-center justify-between pt-6 border-t border-slate-200">
              <div>
                {!isFirstStep && (
                  <motion.button
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={handleBack}
                    disabled={isSubmitting}
                    className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-slate-800 disabled:opacity-50 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Back
                  </motion.button>
                )}
              </div>

              <div>
                <motion.button
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  onClick={handleNext}
                  disabled={!canGoNext || isSubmitting}
                  className="flex items-center gap-2 px-8 py-3 text-white text-xs font-black uppercase tracking-tighter rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-lg"
                  style={{
                    background: portalGradient,
                  }}
                >
                  {isSubmitting ? (
                    <>Processing...</>
                  ) : isLastStep ? (
                    <>Complete</>
                  ) : (
                    <>
                      Next Step
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          </div>
        </div>

        {/* Help Text */}
        <p className="text-center text-sm text-slate-500 mt-6 flex items-center justify-center gap-2">
          Need help? Contact{" "}
          <a
            href="mailto:support@careercompass.bt"
            className="font-medium hover:underline transition-colors"
            style={{ color: portalColor }}
          >
            support@careercompass.bt
          </a>
        </p>
      </div>
    </div>
  );
}

// Hook for wizard data management
export function useWizardData<T extends Record<string, unknown>>(
  initialData: T
) {
  const [data, setData] = useState<T>(initialData);

  const updateField = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const updateFields = useCallback((updates: Partial<T>) => {
    setData((prev) => ({ ...prev, ...updates }));
  }, []);

  return { data, updateField, updateFields, setData };
}
