"use client";

import { ReactNode } from "react";
import { useForm, UseFormReturn, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ZodSchema } from "zod";
import { WizardNavigation } from "./wizard-navigation";

interface WizardFormProps<T extends Record<string, any>> {
  schema: ZodSchema<any>;
  defaultValues?: Partial<T>;
  onSubmit: (data: T) => void | Promise<void>;
  children: (methods: UseFormReturn<T, any>) => ReactNode;
  currentStep: number;
  totalSteps: number;
  canGoNext: boolean;
  onBack: () => void;
  onSkip?: () => void;
  isSubmitting?: boolean;
  nextLabel?: string;
  backLabel?: string;
  showSkip?: boolean;
  skipLabel?: string;
}

export function WizardForm<T extends Record<string, any>>({
  schema,
  defaultValues,
  onSubmit,
  children,
  currentStep,
  totalSteps,
  canGoNext,
  onBack,
  onSkip,
  isSubmitting = false,
  nextLabel,
  backLabel,
  showSkip,
  skipLabel,
}: WizardFormProps<T>) {
  const methods = useForm<T>({
    resolver: zodResolver(schema) as any,
    defaultValues: defaultValues as any,
  });

  const handleSubmit = async (data: T) => {
    await onSubmit(data);
  };

  return (
    <form onSubmit={methods.handleSubmit(handleSubmit as SubmitHandler<T>)}>
      {children(methods as UseFormReturn<T, any>)}

      <WizardNavigation
        currentStep={currentStep}
        totalSteps={totalSteps}
        canGoNext={canGoNext}
        canGoBack={currentStep > 1}
        isNextLoading={isSubmitting}
        onNext={methods.handleSubmit(handleSubmit as SubmitHandler<T>)}
        onBack={onBack}
        onSkip={onSkip}
        nextLabel={nextLabel}
        backLabel={backLabel}
        showSkip={showSkip}
        skipLabel={skipLabel}
      />
    </form>
  );
}
