/**
 * PROGRESSIVE FORM
 *
 * A multi-step, single-page form inspired by Typeform and Linear.
 *
 * FEATURES:
 * - One question at a time
 * - Auto-advance on valid input
 * - Progress indicator
 * - Back navigation
 * - Smooth transitions between steps
 * - Keyboard shortcuts (Enter to advance, Esc to go back)
 * - Framer Motion animations
 *
 * DESIGN PHILOSOPHY:
 * - "Don't overwhelm, guide progressively"
 * - Focus attention on one thing at a time
 * - Make progress feel rewarding
 * - Fast completion with auto-advance
 *
 * @example
 * ```tsx
 * import { ProgressiveForm } from "@/components/ui/progressive-form"
 *
 * const steps = [
 *   {
 *     id: "name",
 *     question: "What's your name?",
 *     type: "text",
 *     placeholder: "Enter your full name",
 *     validate: (v) => v.length >= 2 || "Name too short",
 *   },
 *   {
 *     id: "email",
 *     question: "What's your email?",
 *     type: "email",
 *     placeholder: "you@example.com",
 *   },
 * ]
 *
 * function Onboarding() {
 *   const handleSubmit = async (data) => {
 *     await createUser(data)
 *   }
 *
 *   return (
 *     <ProgressiveForm
 *       steps={steps}
 *       onSubmit={handleSubmit}
 *       title="Welcome! Let's get you set up."
 *     />
 *   )
 * }
 * ```
 */

"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight, Check, Loader2, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

// =============================================================================
// TYPES
// =============================================================================

export type FieldType = "text" | "email" | "number" | "textarea" | "select" | "multiselect" | "password" | "date"

export interface SelectOption {
  value: string
  label: string
  icon?: React.ComponentType<{ className?: string }>
  description?: string
}

export interface FormStep {
  id: string
  question: string
  description?: string
  type: FieldType
  placeholder?: string
  defaultValue?: string | string[]
  options?: SelectOption[]
  required?: boolean
  validate?: (value: string | string[]) => string | true | undefined
  minLength?: number
  maxLength?: number
  min?: number
  max?: number
  rows?: number
  // For conditional steps
  condition?: (values: Record<string, string | string[]>) => boolean
}

export interface ProgressiveFormProps {
  steps: FormStep[]
  onSubmit: (values: Record<string, string | string[]>) => Promise<{ success: boolean; error?: string }>
  title?: string
  subtitle?: string
  submitLabel?: string
  submitIcon?: React.ComponentType<{ className?: string }>
  showProgress?: boolean
  showStepNumber?: boolean
  allowSkip?: boolean
  autoAdvance?: boolean
  autoAdvanceDelay?: number
  onComplete?: (values: Record<string, string | string[]>) => void
  className?: string
}

export interface ProgressiveFormState {
  currentStep: number
  values: Record<string, string | string[]>
  errors: Record<string, string>
  isSubmitting: boolean
  direction: number // 1 for forward, -1 for backward
}

// =============================================================================
// HOOK
// =============================================================================

export function useProgressiveForm(
  steps: FormStep[],
  options: {
    autoAdvance?: boolean
    autoAdvanceDelay?: number
    allowSkip?: boolean
  } = {}
) {
  const [state, setState] = React.useState<ProgressiveFormState>({
    currentStep: 0,
    values: {},
    errors: {},
    isSubmitting: false,
    direction: 1,
  })

  const activeSteps = React.useMemo(() => {
    return steps.filter((step) => {
      if (!step.condition) return true
      return step.condition(state.values)
    })
  }, [steps, state.values])

  const currentStepData = activeSteps[state.currentStep]
  const progress = ((state.currentStep + 1) / activeSteps.length) * 100

  const setValue = React.useCallback((stepId: string, value: string | string[]) => {
    setState((prev) => ({
      ...prev,
      values: { ...prev.values, [stepId]: value },
      errors: { ...prev.errors, [stepId]: "" },
    }))
  }, [])

  const setError = React.useCallback((stepId: string, error: string) => {
    setState((prev) => ({
      ...prev,
      errors: { ...prev.errors, [stepId]: error },
    }))
  }, [])

  const validateStep = React.useCallback(
    (step: FormStep): string | true => {
      const value = state.values[step.id]

      // Required check
      if (step.required && (!value || (Array.isArray(value) && value.length === 0))) {
        return "This field is required"
      }

      // Type-specific validation
      if (typeof value === "string" && value) {
        if (step.minLength && value.length < step.minLength) {
          return `Minimum ${step.minLength} characters required`
        }
        if (step.maxLength && value.length > step.maxLength) {
          return `Maximum ${step.maxLength} characters allowed`
        }
        if (step.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          return "Please enter a valid email address"
        }
        if (step.type === "number") {
          const num = parseFloat(value)
          if (isNaN(num)) return "Please enter a valid number"
          if (step.min !== undefined && num < step.min) return `Minimum value is ${step.min}`
          if (step.max !== undefined && num > step.max) return `Maximum value is ${step.max}`
        }
      }

      // Custom validation
      if (step.validate) {
        return step.validate(value || "") || true
      }

      return true
    },
    [state.values]
  )

  const nextStep = React.useCallback(() => {
    const validation = validateStep(currentStepData)
    if (validation !== true) {
      setError(currentStepData.id, validation)
      return false
    }

    if (state.currentStep < activeSteps.length - 1) {
      setState((prev) => ({ ...prev, currentStep: prev.currentStep + 1, direction: 1 }))
      return true
    }
    return false
  }, [state.currentStep, activeSteps.length, currentStepData, validateStep, setError])

  const prevStep = React.useCallback(() => {
    if (state.currentStep > 0) {
      setState((prev) => ({ ...prev, currentStep: prev.currentStep - 1, direction: -1 }))
      return true
    }
    return false
  }, [state.currentStep])

  const goToStep = React.useCallback(
    (index: number) => {
      if (index >= 0 && index < activeSteps.length) {
        setState((prev) => ({
          ...prev,
          currentStep: index,
          direction: index > prev.currentStep ? 1 : -1,
        }))
      }
    },
    [activeSteps.length]
  )

  return {
    state,
    activeSteps,
    currentStepData,
    progress,
    setValue,
    setError,
    validateStep,
    nextStep,
    prevStep,
    goToStep,
    setState,
  }
}

// =============================================================================
// SLIDE TRANSITION
// =============================================================================

interface SlideProps {
  children: React.ReactNode
  direction: number
  className?: string
}

function Slide({ children, direction, className }: SlideProps) {
  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 50 : -50,
      opacity: 0,
      scale: 0.95,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 50 : -50,
      opacity: 0,
      scale: 0.95,
    }),
  }

  return (
    <motion.div
      custom={direction}
      variants={variants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{
        x: { type: "spring", stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 },
        scale: { duration: 0.2 },
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// =============================================================================
// INPUT FIELD COMPONENTS
// =============================================================================

interface FieldProps {
  step: FormStep
  value: string | string[]
  error: string
  onChange: (value: string | string[]) => void
  onNext: () => void
  autoAdvance?: boolean
  autoFocus?: boolean
}

function InputField({ step, value, error, onChange, onNext, autoAdvance, autoFocus }: FieldProps) {
  const inputRef = React.useRef<HTMLInputElement | HTMLTextAreaElement>(null)

  React.useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus()
    }
  }, [autoFocus])

  const handleChange = (newValue: string) => {
    onChange(newValue)
    // Auto-advance on valid input
    if (autoAdvance && newValue && !error) {
      // Check validation
      if (step.minLength && newValue.length < step.minLength) return
      // Small delay before advancing
      setTimeout(() => {
        if (document.activeElement === inputRef.current) {
          onNext()
        }
      }, 300)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && step.type !== "textarea") {
      e.preventDefault()
      onNext()
    }
  }

  const sharedProps = {
    value: value as string,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      handleChange(e.target.value),
    onKeyDown: handleKeyDown,
    placeholder: step.placeholder,
    disabled: false,
    className: cn(
      "w-full px-4 py-3 rounded-lg border-2 text-base transition-all",
      "focus:outline-none focus:ring-0",
      error
        ? "border-red-300 dark:border-red-700 focus:border-red-500"
        : "border-purple-300 dark:border-purple-700 focus:border-purple-500",
      "bg-white dark:bg-gray-800",
      "text-gray-900 dark:text-gray-100",
      "placeholder:text-gray-400"
    ),
  }

  if (step.type === "textarea") {
    return (
      <textarea
        ref={inputRef as React.RefObject<HTMLTextAreaElement>}
        rows={step.rows || 3}
        maxLength={step.maxLength}
        {...sharedProps}
      />
    )
  }

  return (
    <input
      ref={inputRef as React.RefObject<HTMLInputElement>}
      type={step.type}
      maxLength={step.maxLength}
      {...sharedProps}
    />
  )
}

function SelectField({ step, value, onChange, onNext }: FieldProps) {
  const selectedValue = value as string

  const handleSelect = (optionValue: string) => {
    onChange(optionValue)
    // Auto-advance after selection
    setTimeout(() => onNext(), 150)
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {step.options?.map((option) => {
        const Icon = option.icon
        const isSelected = selectedValue === option.value

        return (
          <motion.button
            key={option.value}
            type="button"
            onClick={() => handleSelect(option.value)}
            className={cn(
              "p-4 rounded-lg border-2 text-left transition-all",
              "hover:border-purple-400 dark:hover:border-purple-600",
              isSelected
                ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
            )}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-start gap-3">
              {Icon && (
                <span
                  className={cn(
                    "flex-shrink-0",
                    isSelected ? "text-purple-600 dark:text-purple-400" : "text-gray-500"
                  )}
                >
                  <Icon className="w-5 h-5" />
                </span>
              )}
              <div className="flex-1 min-w-0">
                <span
                  className={cn(
                    "block font-medium",
                    isSelected
                      ? "text-purple-900 dark:text-purple-100"
                      : "text-gray-900 dark:text-gray-100"
                  )}
                >
                  {option.label}
                </span>
                {option.description && (
                  <span
                    className={cn(
                      "block text-sm mt-0.5",
                      isSelected
                        ? "text-purple-700 dark:text-purple-300"
                        : "text-gray-500 dark:text-gray-400"
                    )}
                  >
                    {option.description}
                  </span>
                )}
              </div>
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="flex-shrink-0 text-purple-600 dark:text-purple-400"
                >
                  <Check className="w-5 h-5" />
                </motion.div>
              )}
            </div>
          </motion.button>
        )
      })}
    </div>
  )
}

function MultiselectField({ step, value, onChange, onNext }: FieldProps) {
  const selectedValues = value as string[] || []

  const handleToggle = (optionValue: string) => {
    const newValues = selectedValues.includes(optionValue)
      ? selectedValues.filter((v) => v !== optionValue)
      : [...selectedValues, optionValue]
    onChange(newValues)
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        {selectedValues.length > 0
          ? `${selectedValues.length} selected`
          : "Select all that apply"}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {step.options?.map((option) => {
          const Icon = option.icon
          const isSelected = selectedValues.includes(option.value)

          return (
            <motion.button
              key={option.value}
              type="button"
              onClick={() => handleToggle(option.value)}
              className={cn(
                "p-4 rounded-lg border-2 text-left transition-all",
                "hover:border-purple-400 dark:hover:border-purple-600",
                isSelected
                  ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                  : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-start gap-3">
                <div className={cn(
                  "w-5 h-5 rounded border-2 flex-shrink-0 mt-0.5 flex items-center justify-center",
                  isSelected
                    ? "border-purple-500 bg-purple-500"
                    : "border-gray-300 dark:border-gray-600"
                )}>
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-2.5 h-2.5 rounded-sm bg-white"
                    />
                  )}
                </div>
                {Icon && (
                  <span
                    className={cn(
                      "flex-shrink-0",
                      isSelected ? "text-purple-600 dark:text-purple-400" : "text-gray-500"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                  </span>
                )}
                <div className="flex-1 min-w-0">
                  <span
                    className={cn(
                      "block font-medium",
                      isSelected
                        ? "text-purple-900 dark:text-purple-100"
                        : "text-gray-900 dark:text-gray-100"
                    )}
                  >
                    {option.label}
                  </span>
                  {option.description && (
                    <span
                      className={cn(
                        "block text-sm mt-0.5",
                        isSelected
                          ? "text-purple-700 dark:text-purple-300"
                          : "text-gray-500 dark:text-gray-400"
                      )}
                    >
                      {option.description}
                    </span>
                  )}
                </div>
              </div>
            </motion.button>
          )
        })}
      </div>
      {selectedValues.length > 0 && (
        <motion.button
          type="button"
          onClick={onNext}
          className="w-full mt-4 flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Continue with {selectedValues.length} selected
          <ChevronRight className="w-4 h-4" />
        </motion.button>
      )}
    </div>
  )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function ProgressiveForm({
  steps,
  onSubmit,
  title,
  subtitle,
  submitLabel = "Complete",
  submitIcon: SubmitIcon = Check,
  showProgress = true,
  showStepNumber = true,
  allowSkip = false,
  autoAdvance = true,
  autoAdvanceDelay = 300,
  onComplete,
  className,
}: ProgressiveFormProps) {
  const {
    state,
    activeSteps,
    currentStepData,
    progress,
    setValue,
    setError,
    validateStep,
    nextStep,
    prevStep,
    goToStep,
    setState,
  } = useProgressiveForm(steps, { autoAdvance, autoAdvanceDelay, allowSkip })

  const currentStep = activeSteps[state.currentStep]
  const isLastStep = state.currentStep === activeSteps.length - 1
  const currentValue = state.values[currentStep?.id] ?? currentStep?.defaultValue ?? ""
  const currentError = state.errors[currentStep?.id] ?? ""

  const handleNext = async () => {
    if (isLastStep) {
      // Submit form
      setState((prev) => ({ ...prev, isSubmitting: true }))
      const result = await onSubmit(state.values)
      if (result.success) {
        onComplete?.(state.values)
      } else {
        setError(currentStep.id, result.error || "Submission failed")
      }
      setState((prev) => ({ ...prev, isSubmitting: false }))
    } else {
      nextStep()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleNext()
    }
  }

  // Skip step
  const handleSkip = () => {
    setValue(currentStep.id, currentStep.defaultValue ?? "")
    nextStep()
  }

  return (
    <div className={cn("w-full max-w-xl mx-auto", className)} onKeyDown={handleKeyDown}>
      {/* Header */}
      {title && (
        <div className="mb-8 text-center">
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2"
          >
            {title}
          </motion.h1>
          {subtitle && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-gray-600 dark:text-gray-400"
            >
              {subtitle}
            </motion.p>
          )}
        </div>
      )}

      {/* Progress Bar */}
      {showProgress && activeSteps.length > 1 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {showStepNumber && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Step {state.currentStep + 1} of {activeSteps.length}
              </span>
            )}
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {Math.round(progress)}% complete
            </span>
          </div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            />
          </div>
        </div>
      )}

      {/* Form Content */}
      <div className="relative min-h-[200px]">
        <AnimatePresence mode="wait" custom={state.direction}>
          <Slide key={currentStep?.id} direction={state.direction}>
            {currentStep && (
              <div className="space-y-6">
                {/* Question */}
                <div>
                  <motion.label
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="block text-lg font-medium text-gray-900 dark:text-gray-100 mb-2"
                  >
                    {currentStep.question}
                    {currentStep.required && <span className="text-red-500 ml-1">*</span>}
                  </motion.label>
                  {currentStep.description && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.1 }}
                      className="text-sm text-gray-600 dark:text-gray-400"
                    >
                      {currentStep.description}
                    </motion.p>
                  )}
                </div>

                {/* Input */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  {currentStep.type === "select" || currentStep.type === "multiselect" ? (
                    <SelectField
                      step={currentStep}
                      value={currentValue}
                      error={currentError}
                      onChange={(v) => setValue(currentStep.id, v)}
                      onNext={handleNext}
                    />
                  ) : (
                    <InputField
                      step={currentStep}
                      value={currentValue}
                      error={currentError}
                      onChange={(v) => setValue(currentStep.id, v)}
                      onNext={handleNext}
                      autoAdvance={autoAdvance}
                      autoFocus
                    />
                  )}
                </motion.div>

                {/* Error */}
                <AnimatePresence>
                  {currentError && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="text-sm text-red-500 dark:text-red-400 flex items-center gap-1"
                    >
                      {currentError}
                    </motion.p>
                  )}
                </AnimatePresence>

                {/* Navigation */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-center justify-between pt-4"
                >
                  <div>
                    {state.currentStep > 0 && (
                      <button
                        type="button"
                        onClick={prevStep}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Back
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    {allowSkip && !currentStep.required && !isLastStep && (
                      <button
                        type="button"
                        onClick={handleSkip}
                        className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                      >
                        Skip
                      </button>
                    )}

                    {isLastStep ? (
                      <motion.button
                        type="button"
                        onClick={handleNext}
                        disabled={state.isSubmitting}
                        className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg font-medium shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        whileHover={{ scale: state.isSubmitting ? 1 : 1.02 }}
                        whileTap={{ scale: state.isSubmitting ? 1 : 0.98 }}
                      >
                        {state.isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <SubmitIcon className="w-4 h-4" />
                            {submitLabel}
                          </>
                        )}
                      </motion.button>
                    ) : (
                      <motion.button
                        type="button"
                        onClick={handleNext}
                        className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {autoAdvance && currentStep.type !== "select" ? (
                          <>
                            Press Enter
                            <ArrowRight className="w-4 h-4" />
                          </>
                        ) : (
                          <>
                            Continue
                            <ChevronRight className="w-4 h-4" />
                          </>
                        )}
                      </motion.button>
                    )}
                  </div>
                </motion.div>

                {/* Step indicators */}
                {activeSteps.length > 1 && (
                  <div className="flex justify-center gap-2 mt-6">
                    {activeSteps.map((step, index) => (
                      <button
                        key={step.id}
                        type="button"
                        onClick={() => goToStep(index)}
                        className={cn(
                          "w-2 h-2 rounded-full transition-all",
                          index === state.currentStep
                            ? "bg-purple-600 w-8"
                            : index < state.currentStep
                            ? "bg-purple-400"
                            : "bg-gray-300 dark:bg-gray-600"
                        )}
                        aria-label={`Go to step ${index + 1}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </Slide>
        </AnimatePresence>
      </div>
    </div>
  )
}

// =============================================================================
// SUMMARY VIEW (for review before submit)
// =============================================================================

export interface ProgressiveFormSummaryProps {
  steps: FormStep[]
  values: Record<string, string | string[]>
  onEdit: (stepId: string) => void
  onSubmit: () => void
  isSubmitting?: boolean
  submitLabel?: string
}

export function ProgressiveFormSummary({
  steps,
  values,
  onEdit,
  onSubmit,
  isSubmitting = false,
  submitLabel = "Complete",
}: ProgressiveFormSummaryProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Review your answers
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Check everything looks good before submitting
        </p>
      </div>

      <div className="space-y-4">
        {steps.map((step) => {
          const value = values[step.id]
          if (!value) return null

          return (
            <motion.div
              key={step.id}
              layout
              className="flex items-start justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {step.question}
                </label>
                <p className="text-gray-900 dark:text-gray-100 mt-1">
                  {Array.isArray(value) ? value.join(", ") : value}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onEdit(step.id)}
                className="ml-4 text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
              >
                Edit
              </button>
            </motion.div>
          )
        })}
      </div>

      <div className="flex justify-center">
        <motion.button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting}
          className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg font-medium shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
          whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Check className="w-5 h-5" />
              {submitLabel}
            </>
          )}
        </motion.button>
      </div>
    </motion.div>
  )
}

export default ProgressiveForm
