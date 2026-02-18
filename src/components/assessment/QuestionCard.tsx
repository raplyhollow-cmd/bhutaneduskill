"use client";

import { ReactNode } from "react";
import { CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

interface QuestionCardProps {
  question: string;
  description?: string;
  category?: string;
  categoryName?: string;
  children: ReactNode;
}

export function QuestionCard({
  question,
  description,
  category,
  categoryName,
  children,
}: QuestionCardProps) {
  return (
    <div className="space-y-6">
      {/* Category Badge - Premium Gradient */}
      {category && categoryName && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center px-4 py-1.5 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-semibold shadow-md"
        >
          {categoryName} ({category})
        </motion.div>
      )}

      {/* Question Text - Premium Typography */}
      <h2 className="text-2xl font-bold text-gray-900 leading-tight">{question}</h2>

      {/* Description */}
      {description && (
        <p className="text-gray-600 text-lg">{description}</p>
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
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.01, y: -2 }}
      whileTap={{ scale: 0.99 }}
      className={`
        w-full text-left p-5 rounded-xl border-2 transition-all relative overflow-hidden
        flex items-center gap-4 shadow-sm
        ${
          isSelected
            ? "border-orange-400 bg-gradient-to-r from-orange-50 to-orange-100/50 shadow-lg shadow-orange-200/50"
            : "border-gray-200 bg-white hover:border-orange-300 hover:bg-orange-50/30 hover:shadow-md"
        }
      `}
    >
      {/* Shimmer effect for selected state */}
      {isSelected && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
          initial={{ x: "-100%" }}
          animate={{ x: "200%" }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        />
      )}

      {/* Radio indicator */}
      <motion.div
        className={`
          w-7 h-7 rounded-full border-3 flex items-center justify-center flex-shrink-0 relative z-10
          ${
            isSelected
              ? "border-orange-500 bg-orange-500 shadow-inner"
              : "border-gray-300 bg-white"
          }
        `}
        animate={isSelected ? { scale: [1, 1.1, 1] } : {}}
        transition={{ duration: 0.3 }}
      >
        {isSelected && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <CheckCircle2 className="w-5 h-5 text-white" />
          </motion.div>
        )}
      </motion.div>

      {/* Icon if provided */}
      {icon && (
        <span className="flex-shrink-0 relative z-10">{icon}</span>
      )}

      {/* Label */}
      <span className={`
        font-medium text-lg relative z-10
        ${isSelected ? "text-orange-900" : "text-gray-700"}
      `}>
        {label}
      </span>

      {/* Checkmark indicator for selected state */}
      {isSelected && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="ml-auto relative z-10"
        >
          <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4 text-white" />
          </div>
        </motion.div>
      )}
    </motion.button>
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
    <motion.button
      onClick={() => onClick(value)}
      whileHover={{ scale: 1.05, y: -3 }}
      whileTap={{ scale: 0.95 }}
      className={`
        flex-1 py-4 px-4 rounded-xl border-2 transition-all text-center shadow-sm relative overflow-hidden
        ${
          isSelected
            ? "border-orange-400 bg-gradient-to-br from-orange-400 to-orange-500 text-white shadow-lg shadow-orange-200/50"
            : "border-gray-200 bg-white hover:border-orange-300 hover:bg-orange-50/50"
        }
      `}
    >
      {isSelected && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
          initial={{ x: "-100%" }}
          animate={{ x: "200%" }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        />
      )}
      <div className={`text-3xl font-bold mb-1 relative z-10 ${isSelected ? "text-white" : "text-gray-900"}`}>
        {value}
      </div>
      <div className={`text-xs font-medium relative z-10 ${isSelected ? "text-orange-100" : "text-gray-600"}`}>
        {label}
      </div>
    </motion.button>
  );
}
