/**
 * SuccessToast Component
 *
 * Delightful success notification with checkmark animation.
 * Includes optional confetti for celebratory moments.
 *
 * @example
 * <SuccessToast
 *   message="Changes saved successfully!"
 *   onDismiss={() => setShowToast(false)}
 * />
 *
 * @example
 * <SuccessToast
 *   message="Account created!"
 *   withConfetti
 *   duration={5000}
 * />
 */

"use client";

import { motion, AnimatePresence, HTMLMotionProps } from "framer-motion";
import { forwardRef, useEffect, useState, useRef, useMemo, ReactNode } from "react";
import { Check, X } from "lucide-react";
import { prefersReducedMotion } from "@/lib/motion/tokens";
import {
  toastSlideUp,
  checkmarkVariants,
  checkmarkCircleVariants,
} from "@/lib/motion/feedback";
import { cn } from "@/lib/utils";

// ============================================================================
// TYPES
// ============================================================================

export type ToastVariant = "success" | "error" | "warning" | "info";

export interface SuccessToastProps extends Omit<HTMLMotionProps<"div">, "variants"> {
  /**
   * Message to display
   */
  message?: string;

  /**
   * Custom icon/node to display instead of default
   */
  icon?: ReactNode;

  /**
   * Toast variant
   * @default "success"
   */
  variant?: ToastVariant;

  /**
   * Show confetti celebration
   * @default false
   */
  withConfetti?: boolean;

  /**
   * Auto-dismiss duration (ms)
   * @default 4000
   */
  duration?: number;

  /**
   * Callback when dismissed
   */
  onDismiss?: () => void;

  /**
   * Show close button
   * @default true
   */
  showClose?: boolean;

  /**
   * Position on screen
   * @default "bottom"
   */
  position?: "top" | "bottom" | "top-right" | "bottom-right";

  /**
   * Visible state (controlled)
   */
  isOpen?: boolean;

  /**
   * Custom action button
   */
  action?: {
    label: string;
    onClick: () => void;
  };
}

// ============================================================================
// ICONS
// ============================================================================

const variantIcons: Record<ToastVariant, ReactNode> = {
  success: <Check className="h-4 w-4" />,
  error: <X className="h-4 w-4" />,
  warning: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  info: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <circle cx="12" cy="12" r="10" strokeWidth={2} />
      <path d="M12 16v-4" strokeWidth={2} strokeLinecap="round" />
      <circle cx="12" cy="8" r={1} fill="currentColor" />
    </svg>
  ),
};

const variantColors: Record<ToastVariant, string> = {
  success: "bg-green-500 dark:bg-green-600",
  error: "bg-red-500 dark:bg-red-600",
  warning: "bg-amber-500 dark:bg-amber-600",
  info: "bg-blue-500 dark:bg-blue-600",
};

// ============================================================================
// CONFETTI PARTICLE
// ============================================================================

interface ConfettiParticleProps {
  color: string;
  delay: number;
  x: number;
  rotation: number;
}

const ConfettiParticle = ({ color, delay, x, rotation }: ConfettiParticleProps) => {
  if (prefersReducedMotion()) return null;

  return (
    <motion.div
      className="absolute w-2 h-2"
      style={{ backgroundColor: color }}
      initial={{ y: 0, x: 0, scale: 0, opacity: 1 }}
      animate={{
        y: [0, -80, -60],
        x: [0, x, x * 0.8],
        scale: [0, 1, 0.5],
        opacity: [1, 1, 0],
        rotate: [0, rotation],
      }}
      transition={{
        duration: 1.5,
        delay: delay / 1000,
        ease: [0.25, 0.1, 0.25, 1],
      }}
    />
  );
};

// ============================================================================
// TOAST COMPONENT
// ============================================================================

export const SuccessToast = forwardRef<HTMLDivElement, SuccessToastProps>(
  (
    {
      message = "Success!",
      icon,
      variant = "success",
      withConfetti = false,
      duration = 4000,
      onDismiss,
      showClose = true,
      position = "bottom",
      isOpen = true,
      action,
      className = "",
      ...props
    },
    ref
  ) => {
    const [shouldShow, setShouldShow] = useState(isOpen);
    const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

    // Handle auto-dismiss
    useEffect(() => {
      if (isOpen && duration > 0) {
        timeoutRef.current = setTimeout(() => {
          handleDismiss();
        }, duration);
      }

      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }, [isOpen, duration]);

    // Sync controlled state
    useEffect(() => {
      setShouldShow(isOpen);
    }, [isOpen]);

    const handleDismiss = () => {
      setShouldShow(false);
      onDismiss?.();
    };

    // Generate confetti particles
    const confetti = useMemo(() => {
      if (!withConfetti) return null;

      const colors = [
        "#6366f1", "#8b5cf6", "#ec4899", "#10b981", "#f59e0b",
      ];

      return Array.from({ length: 12 }, (_, i) => ({
        id: i,
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: i * 30,
        x: (Math.random() - 0.5) * 60,
        rotation: Math.random() * 360 - 180,
      }));
    }, [withConfetti]);

    // Position classes
    const positionClasses: Record<typeof position, string> = {
      top: "top-4 left-1/2 -translate-x-1/2",
      bottom: "bottom-4 left-1/2 -translate-x-1/2",
      "top-right": "top-4 right-4",
      "bottom-right": "bottom-4 right-4",
    };

    return (
      <AnimatePresence>
        {shouldShow && (
          <motion.div
            ref={ref}
            className={cn(
              "fixed z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg",
              "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700",
              positionClasses[position],
              className
            )}
            variants={toastSlideUp}
            initial="hidden"
            animate="visible"
            exit="exit"
            {...props}
          >
            {/* Icon with checkmark animation */}
            <motion.div
              className={cn(
                "flex items-center justify-center w-8 h-8 rounded-full",
                variantColors[variant]
              )}
              variants={checkmarkCircleVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.svg
                className="text-white"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
                variants={checkmarkVariants}
                initial="hidden"
                animate="visible"
              >
                <motion.path d="M20 6 9 17l-5-5" />
              </motion.svg>
            </motion.div>

            {/* Message */}
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {message}
              </p>
              {action && (
                <motion.button
                  onClick={action.onClick}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-1"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {action.label}
                </motion.button>
              )}
            </div>

            {/* Close button */}
            {showClose && (
              <motion.button
                onClick={handleDismiss}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <X className="h-4 w-4" />
              </motion.button>
            )}

            {/* Confetti overlay */}
            {confetti && (
              <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg">
                {confetti.map((p) => (
                  <ConfettiParticle key={p.id} {...p} />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    );
  }
);

SuccessToast.displayName = "SuccessToast";

// ============================================================================
// CONVENIENCE COMPONENTS
// ============================================================================

/**
 * Error toast variant.
 */
export const ErrorToast = forwardRef<HTMLDivElement, Omit<SuccessToastProps, "variant">>(
  (props, ref) => <SuccessToast ref={ref} variant="error" {...props} />
);
ErrorToast.displayName = "ErrorToast";

/**
 * Warning toast variant.
 */
export const WarningToast = forwardRef<HTMLDivElement, Omit<SuccessToastProps, "variant">>(
  (props, ref) => <SuccessToast ref={ref} variant="warning" {...props} />
);
WarningToast.displayName = "WarningToast";

/**
 * Info toast variant.
 */
export const InfoToast = forwardRef<HTMLDivElement, Omit<SuccessToastProps, "variant">>(
  (props, ref) => <SuccessToast ref={ref} variant="info" {...props} />
);
InfoToast.displayName = "InfoToast";

// ============================================================================
// HOOK FOR TOAST STATE
// ============================================================================

export function useToast() {
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    variant: ToastVariant;
    withConfetti: boolean;
  }>({
    show: false,
    message: "",
    variant: "success",
    withConfetti: false,
  });

  const showToast = (
    message: string,
    variant: ToastVariant = "success",
    withConfetti: boolean = false
  ) => {
    setToast({ show: true, message, variant, withConfetti });
  };

  const hideToast = () => {
    setToast((prev) => ({ ...prev, show: false }));
  };

  const success = (message: string, confetti: boolean = false) =>
    showToast(message, "success", confetti);
  const error = (message: string) => showToast(message, "error", false);
  const warning = (message: string) => showToast(message, "warning", false);
  const info = (message: string) => showToast(message, "info", false);

  return {
    toast,
    showToast,
    hideToast,
    success,
    error,
    warning,
    info,
  };
}
