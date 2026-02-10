"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useSpring, useMotionValue, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * AnimatedStatProps - Configuration for the animated stat counter component
 *
 * @property value - The target number to count up to
 * @property suffix - Text to display after the number (e.g., "+", "%", "students")
 * @property prefix - Text to display before the number (e.g., "$", "₹")
 * @property duration - Animation duration in milliseconds (default: 2000ms)
 * @property label - Descriptive label shown below the number
 * @property icon - Optional icon/React node displayed above the number
 * @property size - Text size variant: 'sm' | 'md' | 'lg' | 'xl'
 * @property showProgress - Whether to show an animated progress bar
 * @property className - Additional CSS classes for styling
 */
export interface AnimatedStatProps {
  value: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  label?: string;
  icon?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  showProgress?: boolean;
  className?: string;
  /**
   * Progress bar max value (defaults to 100 if value is percentage-like, otherwise value * 1.2)
   * Use this to set a custom maximum for the progress bar
   */
  progressMax?: number;
  /**
   * Delay before starting animation (in milliseconds)
   */
  delay?: number;
  /**
   * Number of decimal places to show
   */
  decimals?: number;
  /**
   * Color variant for the stat
   */
  variant?: "default" | "primary" | "success" | "warning" | "danger" | "info";
}

const sizeStyles = {
  sm: {
    number: "text-2xl font-bold",
    label: "text-xs",
    icon: "w-8 h-8",
  },
  md: {
    number: "text-4xl font-bold",
    label: "text-sm",
    icon: "w-10 h-10",
  },
  lg: {
    number: "text-5xl font-bold",
    label: "text-base",
    icon: "w-12 h-12",
  },
  xl: {
    number: "text-6xl md:text-7xl font-bold",
    label: "text-lg",
    icon: "w-14 h-14",
  },
};

const variantStyles = {
  default: {
    text: "text-gray-900 dark:text-gray-100",
    label: "text-gray-600 dark:text-gray-400",
    progress: "bg-gray-900 dark:bg-gray-100",
    iconBg: "bg-gray-100 dark:bg-gray-800",
    iconText: "text-gray-600 dark:text-gray-400",
  },
  primary: {
    text: "text-purple-600 dark:text-purple-400",
    label: "text-gray-600 dark:text-gray-400",
    progress: "bg-purple-600",
    iconBg: "bg-purple-100 dark:bg-purple-900/30",
    iconText: "text-purple-600 dark:text-purple-400",
  },
  success: {
    text: "text-green-600 dark:text-green-400",
    label: "text-gray-600 dark:text-gray-400",
    progress: "bg-green-600",
    iconBg: "bg-green-100 dark:bg-green-900/30",
    iconText: "text-green-600 dark:text-green-400",
  },
  warning: {
    text: "text-amber-600 dark:text-amber-400",
    label: "text-gray-600 dark:text-gray-400",
    progress: "bg-amber-600",
    iconBg: "bg-amber-100 dark:bg-amber-900/30",
    iconText: "text-amber-600 dark:text-amber-400",
  },
  danger: {
    text: "text-red-600 dark:text-red-400",
    label: "text-gray-600 dark:text-gray-400",
    progress: "bg-red-600",
    iconBg: "bg-red-100 dark:bg-red-900/30",
    iconText: "text-red-600 dark:text-red-400",
  },
  info: {
    text: "text-blue-600 dark:text-blue-400",
    label: "text-gray-600 dark:text-gray-400",
    progress: "bg-blue-600",
    iconBg: "bg-blue-100 dark:bg-blue-900/30",
    iconText: "text-blue-600 dark:text-blue-400",
  },
};

/**
 * AnimatedStat - A counter component that animates numbers counting up from 0
 *
 * Uses Framer Motion's spring physics for smooth, natural-feeling animations.
 * Animation triggers when the component scrolls into view.
 *
 * @example
 * ```tsx
 * <AnimatedStat value={10000} suffix="+" label="Students Served" />
 * ```
 *
 * @example
 * ```tsx
 * <AnimatedStat value={95} suffix="%" label="Success Rate" showProgress />
 * ```
 *
 * @example
 * ```tsx
 * <AnimatedStat value={500} prefix="₹" suffix="+" label="Average Savings" size="xl" />
 * ```
 *
 * @example
 * ```tsx
 * <AnimatedStat
 *   value={1250}
 *   suffix=" students"
 *   label="Total Enrollment"
 *   icon={<Users className="w-full h-full" />}
 *   variant="primary"
 *   showProgress
 *   progressMax={2000}
 * />
 * ```
 */
export function AnimatedStat({
  value,
  suffix = "",
  prefix = "",
  duration = 2000,
  label,
  icon,
  size = "lg",
  showProgress = false,
  progressMax,
  delay = 0,
  decimals = 0,
  variant = "default",
  className,
}: AnimatedStatProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });
  const [hasAnimated, setHasAnimated] = useState(false);

  // Motion value for the number
  const motionValue = useMotionValue(0);

  // Spring animation for smooth counting
  const spring = useSpring(motionValue, {
    stiffness: 80,
    damping: 20,
    mass: 1,
  });

  // Transform motion value to displayed number
  const displayValue = useTransform(spring, (latest) => {
    // Format with commas and decimal places
    const formatted = latest.toLocaleString("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    return formatted;
  });

  // Progress bar animation
  const progressValue = useMotionValue(0);
  const progressSpring = useSpring(progressValue, {
    stiffness: 60,
    damping: 15,
  });
  const progressWidth = useTransform(progressSpring, (latest) => {
    const max = progressMax ?? (suffix.includes("%") ? 100 : value * 1.2);
    return `${Math.min((latest / max) * 100, 100)}%`;
  });

  useEffect(() => {
    if (isInView && !hasAnimated) {
      // Start animation after delay
      const timeoutId = setTimeout(() => {
        motionValue.set(value);
        progressValue.set(value);
        setHasAnimated(true);
      }, delay);

      return () => clearTimeout(timeoutId);
    }
  }, [isInView, hasAnimated, motionValue, progressValue, value, delay]);

  // Subscribe to displayValue to trigger re-renders
  const [currentDisplay, setCurrentDisplay] = useState("0");
  useEffect(() => {
    const unsubscribe = displayValue.on("change", (latest) => {
      setCurrentDisplay(latest);
    });
    return () => unsubscribe();
  }, [displayValue]);

  const styles = sizeStyles[size];
  const colors = variantStyles[variant];

  return (
    <div ref={ref} className={cn("flex flex-col items-center text-center", className)}>
      {icon && (
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={isInView ? { scale: 1, rotate: 0 } : { scale: 0, rotate: -180 }}
          transition={{ delay: delay / 1000, type: "spring", stiffness: 200, damping: 20 }}
          className={cn(
            "mb-3 flex items-center justify-center rounded-full",
            styles.icon,
            colors.iconBg,
            colors.iconText
          )}
        >
          {icon}
        </motion.div>
      )}

      <div className="relative overflow-hidden">
        <motion.span
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ delay: delay / 1000, duration: 0.5 }}
          className={cn("inline-block tabular-nums", styles.number, colors.text)}
        >
          {prefix}
          {currentDisplay}
          {suffix}
        </motion.span>
      </div>

      {label && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ delay: (delay + 200) / 1000, duration: 0.5 }}
          className={cn("mt-2 font-medium", styles.label, colors.label)}
        >
          {label}
        </motion.p>
      )}

      {showProgress && (
        <motion.div
          initial={{ scaleX: 0 }}
          animate={isInView ? { scaleX: 1 } : { scaleX: 0 }}
          transition={{ delay: (delay + 400) / 1000, duration: 0.6, ease: "easeOut" }}
          className="mt-4 w-full overflow-hidden"
        >
          <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
            <motion.div
              style={{ width: progressWidth }}
              className={cn("h-full rounded-full", colors.progress)}
            />
          </div>
        </motion.div>
      )}
    </div>
  );
}

/**
 * AnimatedStatGrid - A grid layout for displaying multiple AnimatedStat components
 *
 * @example
 * ```tsx
 * <AnimatedStatGrid
 *   stats={[
 *     { value: 10000, suffix: "+", label: "Students", icon: <Users /> },
 *     { value: 500, label: "Schools", icon: <School /> },
 *     { value: 95, suffix: "%", label: "Success Rate", showProgress: true },
 *   ]}
 * />
 * ```
 */
export interface AnimatedStatGridProps {
  stats: Omit<AnimatedStatProps, "className">[];
  columns?: 1 | 2 | 3 | 4;
  className?: string;
}

export function AnimatedStatGrid({
  stats,
  columns = 3,
  className,
}: AnimatedStatGridProps) {
  return (
    <div
      className={cn(
        "grid gap-8",
        columns === 1 && "grid-cols-1",
        columns === 2 && "grid-cols-1 md:grid-cols-2",
        columns === 3 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
        columns === 4 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
        className
      )}
    >
      {stats.map((stat, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: index * 0.1, duration: 0.5 }}
        >
          <AnimatedStat {...stat} />
        </motion.div>
      ))}
    </div>
  );
}

/**
 * AnimatedStatCard - A card variant of AnimatedStat with a container
 *
 * @example
 * ```tsx
 * <AnimatedStatCard
 *   value={10000}
 *   suffix="+"
 *   label="Students Served"
 *   icon={<Users />}
 *   variant="primary"
 * />
 * ```
 */
export interface AnimatedStatCardProps extends AnimatedStatProps {
  description?: string;
}

export function AnimatedStatCard({
  description,
  variant = "default",
  className,
  ...statProps
}: AnimatedStatCardProps) {
  const colors = variantStyles[variant];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={cn(
        "rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-lg dark:border-gray-700 dark:bg-gray-800",
        className
      )}
    >
      <AnimatedStat {...statProps} variant={variant} />
      {description && (
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className={cn("mt-3 text-sm", colors.label)}
        >
          {description}
        </motion.p>
      )}
    </motion.div>
  );
}
