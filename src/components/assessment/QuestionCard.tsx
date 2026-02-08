"use client";

import { ReactNode } from "react";
import { CheckCircle2 } from "lucide-react";

interface QuestionCardProps {
  question: string;
  description?: string;
  category?: string;
  categoryName?: string;
  children: ReactNode;
  selectedValue?: any;
}

export function QuestionCard({
  question,
  description,
  category,
  categoryName,
  children,
  selectedValue,
}: QuestionCardProps) {
  return (
    <div className="space-y-6">
      {/* Category Badge */}
      {category && categoryName && (
        <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-medium">
          {categoryName} ({category})
        </div>
      )}

      {/* Question Text */}
      <h2 className="text-xl font-semibold text-gray-900">{question}</h2>

      {/* Description */}
      {description && (
        <p className="text-gray-600">{description}</p>
      )}

      {/* Options */}
      <div className="space-y-3">{children}</div>
    </div>
  );
}

interface OptionButtonProps {
  label: string;
  isSelected: boolean;
  onClick: () => void;
  icon?: ReactNode;
}

export function OptionButton({ label, isSelected, onClick, icon }: OptionButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full text-left p-4 rounded-lg border-2 transition-all
        flex items-center gap-3
        ${
          isSelected
            ? "border-blue-500 bg-blue-50 text-blue-900"
            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
        }
      `}
    >
      <div
        className={`
          w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0
          ${
            isSelected ? "border-blue-500 bg-blue-500" : "border-gray-300"
          }
        `}
      >
        {isSelected && <CheckCircle2 className="w-4 h-4 text-white" />}
      </div>
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span className="font-medium">{label}</span>
    </button>
  );
}

interface LikertOptionProps {
  value: number;
  label: string;
  isSelected: boolean;
  onClick: (value: number) => void;
}

export function LikertOption({ value, label, isSelected, onClick }: LikertOptionProps) {
  return (
    <button
      onClick={() => onClick(value)}
      className={`
        flex-1 py-3 px-4 rounded-lg border-2 transition-all text-center
        ${
          isSelected
            ? "border-blue-500 bg-blue-500 text-white"
            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
        }
      `}
    >
      <div className="text-2xl font-bold mb-1">{value}</div>
      <div className="text-xs">{label}</div>
    </button>
  );
}
