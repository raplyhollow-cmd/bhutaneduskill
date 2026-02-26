"use client";

import { cn } from "@/lib/utils";
import { ReactNode, ButtonHTMLAttributes, forwardRef } from "react";
import { Loader2 } from "lucide-react";

/**
 * Touch-Friendly Button Component
 *
 * A button component optimized for mobile touch interactions:
 * - Minimum 44x44px touch target (iOS HIG standard)
 * - Visual feedback on tap
 * - Loading state support
 * - Accessible focus states
 *
 * Usage:
 *   <TouchButton variant="primary" size="lg">
 *     Click Me
 *   </TouchButton>
 */

export interface TouchButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "success";
  size?: "sm" | "md" | "lg" | "xl";
  fullWidth?: boolean;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  children: ReactNode;
}

export const TouchButton = forwardRef<HTMLButtonElement, TouchButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      fullWidth = false,
      loading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      className,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    const variantStyles = {
      primary:
        "bg-gray-900 text-white hover:bg-gray-800 active:bg-gray-700 disabled:bg-gray-300 disabled:text-gray-500",
      secondary:
        "bg-gray-100 text-gray-900 hover:bg-gray-200 active:bg-gray-300 disabled:bg-gray-50 disabled:text-gray-400",
      ghost: "bg-transparent text-gray-700 hover:bg-gray-100 active:bg-gray-200 disabled:text-gray-400",
      danger:
        "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 disabled:bg-red-300 disabled:text-red-100",
      success:
        "bg-green-600 text-white hover:bg-green-700 active:bg-green-800 disabled:bg-green-300 disabled:text-green-100",
    };

    const sizeStyles = {
      sm: "h-10 px-4 text-sm min-h-[40px] min-w-[40px]",
      md: "h-12 px-5 text-base min-h-[48px] min-w-[48px]",
      lg: "h-14 px-6 text-lg min-h-[56px] min-w-[56px]",
      xl: "h-16 px-8 text-xl min-h-[64px] min-w-[64px]",
    };

    const iconSize = {
      sm: "w-4 h-4",
      md: "w-5 h-5",
      lg: "w-6 h-6",
      xl: "w-6 h-6",
    };

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={cn(
          "inline-flex items-center justify-center gap-2",
          "font-medium rounded-xl",
          "transition-all duration-150",
          "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900",
          "disabled:cursor-not-allowed disabled:opacity-60",
          "active:scale-[0.97]",
          fullWidth && "w-full",
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {loading ? (
          <Loader2 className={cn("animate-spin", iconSize[size])} />
        ) : leftIcon ? (
          <span className={cn("flex-shrink-0", iconSize[size])}>{leftIcon}</span>
        ) : null}
        <span className="truncate">{children}</span>
        {!loading && rightIcon && (
          <span className={cn("flex-shrink-0", iconSize[size])}>{rightIcon}</span>
        )}
      </button>
    );
  }
);

TouchButton.displayName = "TouchButton";

/**
 * Touch-Friendly Icon Button
 *
 * A circular button for icon-only actions.
 * Always meets minimum touch target size.
 */
export interface TouchIconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  children: ReactNode;
  ariaLabel: string;
}

export const TouchIconButton = forwardRef<HTMLButtonElement, TouchIconButtonProps>(
  (
    {
      variant = "secondary",
      size = "md",
      loading = false,
      children,
      disabled,
      ariaLabel,
      className,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    const variantStyles = {
      primary:
        "bg-gray-900 text-white hover:bg-gray-800 active:bg-gray-700 disabled:bg-gray-300",
      secondary:
        "bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300 disabled:bg-gray-50",
      ghost: "bg-transparent text-gray-700 hover:bg-gray-100 active:bg-gray-200",
      danger:
        "bg-red-100 text-red-600 hover:bg-red-200 active:bg-red-300 disabled:bg-red-50 disabled:text-red-300",
    };

    const sizeStyles = {
      sm: "w-10 h-10 min-w-[40px] min-h-[40px]",
      md: "w-12 h-12 min-w-[48px] min-h-[48px]",
      lg: "w-14 h-14 min-w-[56px] min-h-[56px]",
    };

    const iconSize = {
      sm: "w-4 h-4",
      md: "w-5 h-5",
      lg: "w-6 h-6",
    };

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        aria-label={ariaLabel}
        className={cn(
          "inline-flex items-center justify-center",
          "rounded-full",
          "transition-all duration-150",
          "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900",
          "disabled:cursor-not-allowed disabled:opacity-60",
          "active:scale-90",
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {loading ? (
          <Loader2 className={cn("animate-spin", iconSize[size])} />
        ) : (
          <span className={cn("flex-shrink-0", iconSize[size])}>{children}</span>
        )}
      </button>
    );
  }
);

TouchIconButton.displayName = "TouchIconButton";

/**
 * Touch-Friendly Fab (Floating Action Button)
 *
 * A circular floating button for primary actions.
 * Positioned at bottom-right corner with safe area padding.
 */
export interface TouchFabProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger";
  size?: "md" | "lg";
  position?: "bottom-right" | "bottom-left" | "bottom-center";
  loading?: boolean;
  children: ReactNode;
  ariaLabel: string;
}

export const TouchFab = forwardRef<HTMLButtonElement, TouchFabProps>(
  (
    {
      variant = "primary",
      size = "lg",
      position = "bottom-right",
      loading = false,
      children,
      disabled,
      ariaLabel,
      className,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    const variantStyles = {
      primary:
        "bg-gray-900 text-white hover:bg-gray-800 active:bg-gray-700 shadow-lg disabled:bg-gray-300",
      secondary:
        "bg-white text-gray-900 border border-gray-200 hover:bg-gray-50 active:bg-gray-100 shadow-lg disabled:bg-gray-50",
      danger:
        "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-lg disabled:bg-red-300",
    };

    const sizeStyles = {
      md: "w-14 h-14 min-w-[56px] min-h-[56px]",
      lg: "w-16 h-16 min-w-[64px] min-h-[64px]",
    };

    const iconSize = {
      md: "w-6 h-6",
      lg: "w-7 h-7",
    };

    const positionStyles = {
      "bottom-right": "bottom-4 right-4",
      "bottom-left": "bottom-4 left-4",
      "bottom-center": "bottom-4 left-1/2 -translate-x-1/2",
    };

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        aria-label={ariaLabel}
        className={cn(
          "fixed z-40",
          "rounded-full",
          "flex items-center justify-center",
          "transition-all duration-150",
          "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900",
          "disabled:cursor-not-allowed disabled:opacity-60",
          "active:scale-90",
          "shadow-xl",
          positionStyles[position],
          // Add safe area for bottom
          "pb-[env(safe-area-inset-bottom)]",
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {loading ? (
          <Loader2 className={cn("animate-spin", iconSize[size])} />
        ) : (
          <span className={cn("flex-shrink-0", iconSize[size])}>{children}</span>
        )}
      </button>
    );
  }
);

TouchFab.displayName = "TouchFab";

/**
 * Touch-Friendly Toggle Switch
 *
 * A toggle switch optimized for mobile touch interactions.
 */
export interface TouchToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  ariaLabel?: string;
  size?: "md" | "lg";
  className?: string;
}

export function TouchToggle({
  checked,
  onChange,
  disabled = false,
  label,
  ariaLabel,
  size = "md",
  className,
}: TouchToggleProps) {
  const sizeStyles = {
    md: "w-12 h-7 min-w-[48px] min-h-[44px]",
    lg: "w-14 h-8 min-w-[56px] min-h-[48px]",
  };

  const thumbStyles = {
    md: checked ? "translate-x-5" : "translate-x-0.5",
    lg: checked ? "translate-x-6" : "translate-x-0.5",
  };

  const thumbSize = {
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel || label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "bg-gray-900" : "bg-gray-200",
        sizeStyles[size],
        className
      )}
    >
      <span
        className={cn(
          "pointer-events-none inline-block rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
          thumbSize[size],
          thumbStyles[size]
        )}
      />
    </button>
  );
}

/**
 * Touch-Friendly Segment Control
 *
 * A segmented control for selecting between options.
 */
export interface TouchSegmentProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function TouchSegment({
  value,
  onChange,
  options,
  disabled = false,
  size = "md",
  className,
}: TouchSegmentProps) {
  const sizeStyles = {
    sm: "h-9 min-h-[36px]",
    md: "h-11 min-h-[44px]",
    lg: "h-13 min-h-[52px]",
  };

  const textStyles = {
    sm: "text-xs px-3",
    md: "text-sm px-4",
    lg: "text-base px-5",
  };

  return (
    <div
      className={cn(
        "inline-flex bg-gray-100 rounded-xl p-1",
        "focus-within:ring-2 focus-within:ring-gray-900 focus-within:ring-offset-2",
        sizeStyles[size],
        disabled && "opacity-50 pointer-events-none",
        className
      )}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          disabled={disabled}
          onClick={() => onChange(option.value)}
          className={cn(
            "flex-1 rounded-lg font-medium transition-all duration-150",
            textStyles[size],
            value === option.value
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
