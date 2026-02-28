/**
 * ProgressIndicator Component
 *
 * Smooth, GPU-accelerated progress indicators.
 * Supports linear, circular, and indeterminate states.
 *
 * @example
 * <ProgressIndicator progress={75} />
 *
 * @example
 * <ProgressIndicator variant="circular" progress={60} size={48} />
 *
 * @example
 * <ProgressIndicator variant="indeterminate" />
 */

"use client";

import { motion, HTMLMotionProps } from "framer-motion";
import { forwardRef, useMemo, type CSSProperties } from "react";
import { prefersReducedMotion } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils";

// ============================================================================
// TYPES
// ============================================================================

export type ProgressVariant =
  | "linear"         // Horizontal bar
  | "circular"       // Circular progress
  | "indeterminate"; // Loading animation (no progress)

export type ProgressSize = "sm" | "md" | "lg" | "xl";

export interface ProgressIndicatorProps extends Omit<HTMLMotionProps<"div">, "variants"> {
  /**
   * Progress value (0-100)
   * Ignored for indeterminate variant
   */
  progress?: number;

  /**
   * Display variant
   * @default "linear"
   */
  variant?: ProgressVariant;

  /**
   * Size of the indicator
   * @default "md"
   */
  size?: ProgressSize;

  /**
   * Color theme
   * @default "brand"
   */
  color?: "brand" | "success" | "warning" | "error" | "gray";

  /**
   * Show percentage label (linear only)
   * @default false
   */
  showLabel?: boolean;

  /**
   * Custom thickness/stroke width
   */
  thickness?: number;

  /**
   * CSS variable for custom color
   */
  customColor?: string;
}

// ============================================================================
// SIZE MAPPINGS
// ============================================================================

const sizeMap: Record<ProgressSize, { height: string; circle: number; thickness: number }> = {
  sm: { height: "h-1", circle: 24, thickness: 2 },
  md: { height: "h-2", circle: 32, thickness: 3 },
  lg: { height: "h-3", circle: 48, thickness: 4 },
  xl: { height: "h-4", circle: 64, thickness: 6 },
};

const colorMap = {
  brand: "rgb(139 92 246)", // Violet
  success: "rgb(16 185 129)", // Green
  warning: "rgb(245 158 11)", // Amber
  error: "rgb(239 68 68)", // Red
  gray: "rgb(156 163 175)", // Gray
};

// ============================================================================
// LINEAR PROGRESS
// ============================================================================

const LinearProgress = forwardRef<HTMLDivElement, ProgressIndicatorProps>(
  (
    {
      progress = 0,
      color = "brand",
      customColor,
      showLabel = false,
      size = "md",
      thickness,
      className = "",
      style: propStyle,
      ...props
    },
    ref
  ) => {
    const height = thickness ? `${thickness}px` : sizeMap[size].height;
    const barColor = customColor || colorMap[color];

    // Extract non-style props to pass to div
    const { style: _style, ...divProps } = props as any;

    return (
      <div
        ref={ref}
        className={cn("relative w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700", className)}
        style={{ height, ...propStyle } as React.CSSProperties}
        {...divProps}
      >
        <motion.div
          className="h-full"
          style={{ backgroundColor: barColor, transformOrigin: "left" } as React.CSSProperties}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: progress / 100 }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        />
        {showLabel && (
          <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white mix-blend-difference">
            {Math.round(progress)}%
          </span>
        )}
      </div>
    );
  }
);

LinearProgress.displayName = "LinearProgress";

// ============================================================================
// CIRCULAR PROGRESS
// ============================================================================

const CircularProgress = forwardRef<HTMLDivElement, ProgressIndicatorProps>(
  (
    {
      progress = 0,
      color = "brand",
      customColor,
      size = "md",
      thickness,
      className = "",
      style: propStyle,
      ...props
    },
    ref
  ) => {
    const circleSize = sizeMap[size].circle;
    const stroke = thickness || sizeMap[size].thickness;
    const barColor = customColor || colorMap[color];
    const radius = (circleSize - stroke) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    // Extract non-style props to pass to div
    const { style: _style, ...divProps } = props as any;

    return (
      <div
        ref={ref}
        className={cn("relative inline-flex items-center justify-center", className)}
        style={{ width: circleSize, height: circleSize, ...propStyle } as React.CSSProperties}
        {...divProps}
      >
        {/* Background circle */}
        <svg
          className="absolute inset-0"
          width={circleSize}
          height={circleSize}
          viewBox={`0 0 ${circleSize} ${circleSize}`}
        >
          <circle
            cx={circleSize / 2}
            cy={circleSize / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            className="text-gray-200 dark:text-gray-700"
          />
        </svg>
        {/* Progress circle */}
        <svg
          className="absolute inset-0 -rotate-90"
          width={circleSize}
          height={circleSize}
          viewBox={`0 0 ${circleSize} ${circleSize}`}
        >
          <motion.circle
            cx={circleSize / 2}
            cy={circleSize / 2}
            r={radius}
            fill="none"
            stroke={barColor}
            strokeWidth={stroke}
            strokeLinecap="round"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            style={{
              strokeDasharray: circumference,
            }}
          />
        </svg>
        {/* Center text */}
        <span className="text-xs font-medium">{Math.round(progress)}%</span>
      </div>
    );
  }
);

CircularProgress.displayName = "CircularProgress";

// ============================================================================
// INDETERMINATE PROGRESS
// ============================================================================

const IndeterminateProgress = forwardRef<HTMLDivElement, ProgressIndicatorProps>(
  ({ color = "brand", customColor, size = "md", thickness, className = "", style: propStyle, ...props }, ref) => {
    const height = thickness ? `${thickness}px` : sizeMap[size].height;
    const barColor = customColor || colorMap[color];

    // Extract non-style props to pass to div
    const { style: _style, ...divProps } = props as any;

    if (prefersReducedMotion()) {
      // Static loading bar for reduced motion
      return (
        <div
          ref={ref}
          className={cn(
            "w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700",
            className
          )}
          style={{ height, ...propStyle } as React.CSSProperties}
          {...divProps}
        >
          <div className="h-full" style={{ backgroundColor: barColor, width: "30%" } as React.CSSProperties} />
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn(
          "relative w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700",
          className
        )}
        style={{ height, ...propStyle } as React.CSSProperties}
        {...divProps}
      >
        <motion.div
          className="absolute inset-y-0 left-0 h-full"
          style={{ backgroundColor: barColor, width: "30%" } as React.CSSProperties}
          animate={{ x: ["-100%", "400%"] }}
          transition={{ duration: 1.5, repeat: Infinity, repeatType: "loop", ease: "linear" }}
        />
      </div>
    );
  }
);

IndeterminateProgress.displayName = "IndeterminateProgress";

// ============================================================================
// SPINNER (compact circular indeterminate)
// ============================================================================

interface SpinnerProps {
  size?: ProgressSize;
  color?: "brand" | "success" | "warning" | "error" | "gray";
  customColor?: string;
  className?: string;
  thickness?: number;
}

export const Spinner = forwardRef<HTMLDivElement, SpinnerProps>(
  ({ size = "md", color = "brand", customColor, className = "", thickness }, ref) => {
    const circleSize = sizeMap[size].circle;
    const stroke = thickness || sizeMap[size].thickness;
    const barColor = customColor || colorMap[color];
    const radius = (circleSize - stroke) / 2;

    if (prefersReducedMotion()) {
      // Static spinner for reduced motion
      return (
        <div
          ref={ref}
          className={cn("inline-flex items-center justify-center", className)}
          style={{ width: circleSize, height: circleSize }}
        >
          <svg width={circleSize} height={circleSize} viewBox={`0 0 ${circleSize} ${circleSize}`}>
            <circle
              cx={circleSize / 2}
              cy={circleSize / 2}
              r={radius}
              fill="none"
              stroke={barColor}
              strokeWidth={stroke}
              className="opacity-30"
            />
          </svg>
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn("inline-flex items-center justify-center", className)}
        style={{ width: circleSize, height: circleSize }}
      >
        <motion.svg
          width={circleSize}
          height={circleSize}
          viewBox={`0 0 ${circleSize} ${circleSize}`}
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, repeatType: "loop", ease: "linear" }}
        >
          <circle
            cx={circleSize / 2}
            cy={circleSize / 2}
            r={radius}
            fill="none"
            stroke={barColor}
            strokeWidth={stroke}
            strokeLinecap="round"
            className="opacity-25"
          />
          <motion.circle
            cx={circleSize / 2}
            cy={circleSize / 2}
            r={radius}
            fill="none"
            stroke={barColor}
            strokeWidth={stroke}
            strokeLinecap="round"
            initial={{ pathLength: 0.3, rotate: 0 }}
            animate={{ pathLength: [0.3, 0.8, 0.3], rotate: [0, 180, 360] }}
            transition={{ duration: 1.5, repeat: Infinity, repeatType: "loop", ease: "easeInOut" }}
            style={{
              strokeDasharray: circumference(radius),
              strokeDashoffset: circumference(radius) * 0.7,
              transformOrigin: "center",
            }}
          />
        </motion.svg>
      </div>
    );
  }
);

Spinner.displayName = "Spinner";

function circumference(radius: number) {
  return 2 * Math.PI * radius;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const ProgressIndicator = forwardRef<HTMLDivElement, ProgressIndicatorProps>(
  ({ variant = "linear", ...props }, ref) => {
    switch (variant) {
      case "circular":
        return <CircularProgress ref={ref} variant={variant} {...props} />;
      case "indeterminate":
        return <IndeterminateProgress ref={ref} variant={variant} {...props} />;
      default:
        return <LinearProgress ref={ref} variant={variant} {...props} />;
    }
  }
);

ProgressIndicator.displayName = "ProgressIndicator";

// ============================================================================
// CONVENIENCE COMPONENTS
// ============================================================================>

/**
 * Compact spinner for inline loading.
 */
export const LoadingSpinner = Spinner;
