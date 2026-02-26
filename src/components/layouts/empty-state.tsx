"use client";

import { forwardRef, HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { motion, Variants } from "framer-motion";

/**
 * EmptyState - Centered content for empty states
 *
 * Features:
 * - Centered content layout
 * - Subtle illustration or icon
 * - Helpful message
 * - Action button
 * - Not too bulky!
 * - Animated entrance
 *
 * @example
 * ```tsx
 * <EmptyState
 *   icon={<FolderOpen className="h-12 w-12" />}
 *   title="No documents found"
 *   description="Create your first document to get started."
 *   action={{ label: "Create Document", onClick: () => {} }}
 * />
 * ```
 */

export interface EmptyStateProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Icon element to display (typically from lucide-react)
   */
  icon?: ReactNode;
  /**
   * The main title text for the empty state
   */
  title: string;
  /**
   * Optional description text below the title
   */
  description?: string;
  /**
   * Optional action button configuration
   */
  action?: {
    label: string;
    onClick: () => void;
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
    icon?: ReactNode;
  };
  /**
   * Optional illustration image or graphic
   */
  illustration?: ReactNode;
  /**
   * Container size variant
   * @default "default"
   */
  size?: "sm" | "default" | "lg" | "full";
  /**
   * Visual style variant
   * @default "default"
   */
  variant?: "default" | "muted" | "bordered";
}

const sizeStyles = {
  sm: {
    icon: "h-10 w-10",
    title: "text-base",
    description: "text-sm",
    container: "py-8 px-4",
  },
  default: {
    icon: "h-12 w-12",
    title: "text-lg",
    description: "text-sm",
    container: "py-12 px-6",
  },
  lg: {
    icon: "h-16 w-16",
    title: "text-xl",
    description: "text-base",
    container: "py-16 px-8",
  },
  full: {
    icon: "h-20 w-20",
    title: "text-2xl",
    description: "text-lg",
    container: "min-h-[400px] py-24 px-8",
  },
};

const variantStyles = {
  default: "",
  muted: "bg-muted/30 rounded-lg",
  bordered: "border rounded-lg",
};

const containerVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut",
    },
  },
};

const iconVariants: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: "easeOut",
    },
  },
};

export const EmptyState = forwardRef<HTMLDivElement, EmptyStateProps>(
  ({
    icon,
    title,
    description,
    action,
    illustration,
    size = "default",
    variant = "default",
    className,
    ...props
  }, ref) => {
    const styles = sizeStyles[size];

    return (
      <motion.div
        ref={ref}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className={cn(
          "flex flex-col items-center justify-center text-center",
          styles.container,
          variantStyles[variant],
          className
        )}
        {...props}
      >
        {/* Illustration (if provided) */}
        {illustration && (
          <motion.div
            className="mb-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
          >
            {illustration}
          </motion.div>
        )}

        {/* Icon */}
        {icon && (
          <motion.div
            variants={iconVariants}
            className="mb-4 text-muted-foreground"
          >
            {icon}
          </motion.div>
        )}

        {/* Title */}
        <motion.h3
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className={cn(
            "font-semibold text-foreground",
            styles.title
          )}
        >
          {title}
        </motion.h3>

        {/* Description */}
        {description && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className={cn(
              "mt-2 max-w-sm text-muted-foreground",
              styles.description
            )}
          >
            {description}
          </motion.p>
        )}

        {/* Action Button */}
        {action && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.3 }}
            className="mt-6"
          >
            <button
              onClick={action.onClick}
              className={cn(
                "inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium",
                "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                "disabled:pointer-events-none disabled:opacity-50",
                action.variant === "default" && "bg-primary text-primary-foreground hover:bg-primary/90",
                action.variant === "destructive" && "bg-destructive text-destructive-foreground hover:bg-destructive/90",
                action.variant === "outline" && "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
                action.variant === "secondary" && "bg-secondary text-secondary-foreground hover:bg-secondary/80",
                action.variant === "ghost" && "hover:bg-accent hover:text-accent-foreground",
                action.variant === "link" && "text-primary underline-offset-4 hover:underline",
                !action.variant && "bg-primary text-primary-foreground hover:bg-primary/90"
              )}
            >
              {action.icon}
              {action.label}
            </button>
          </motion.div>
        )}
      </motion.div>
    );
  }
);

EmptyState.displayName = "EmptyState";

/**
 * EmptyStateIcon - Pre-configured icon wrapper for common empty states
 *
 * @example
 * ```tsx
 * <EmptyStateIcon type="no-data" />
 * <EmptyStateIcon type="search" />
 * <EmptyStateIcon type="error" />
 * ```
 */
export type EmptyStateIconType =
  | "no-data"
  | "no-results"
  | "no-notifications"
  | "no-files"
  | "no-users"
  | "error"
  | "search"
  | "success"
  | "loading";

export interface EmptyStateIconProps {
  type: EmptyStateIconType;
  className?: string;
}

export function EmptyStateIcon({ type, className }: EmptyStateIconProps) {
  const icons = {
    "no-data": (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <rect x={3} y={3} width={18} height={18} rx={2} />
        <path d="M3 9h18" />
        <path d="M9 21V9" />
      </svg>
    ),
    "no-results": (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <circle cx={11} cy={11} r={8} />
        <path d="m21 21-4.35-4.35" />
      </svg>
    ),
    "no-notifications": (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
    "no-files": (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
      </svg>
    ),
    "no-users": (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx={9} cy={7} r={4} />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    error: (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <circle cx={12} cy={12} r={10} />
        <line x1={15} y1={9} x2={9} y2={15} />
        <line x1={9} y1={9} x2={15} y2={15} />
      </svg>
    ),
    search: (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <circle cx={11} cy={11} r={8} />
        <path d="m21 21-4.35-4.35" />
      </svg>
    ),
    success: (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
    loading: (
      <svg
        className={cn("animate-spin", className)}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <line x1={12} y1={2} x2={12} y2={6} />
        <line x1={12} y1={18} x2={12} y2={22} />
        <line x1={4.93} y1={4.93} x2={7.76} y2={7.76} />
        <line x1={16.24} y1={16.24} x2={19.07} y2={19.07} />
        <line x1={2} y1={12} x2={6} y2={12} />
        <line x1={18} y1={12} x2={22} y2={12} />
        <line x1={4.93} y1={19.07} x2={7.76} y2={16.24} />
        <line x1={16.24} y1={7.76} x2={19.07} y2={4.93} />
      </svg>
    ),
  };

  return icons[type] || icons["no-data"];
}

/**
 * Preset EmptyState configurations for common scenarios
 */

export function NoData({ action, ...props }: Omit<EmptyStateProps, "title" | "icon">) {
  return (
    <EmptyState
      icon={<EmptyStateIcon type="no-data" className="text-muted-foreground" />}
      title="No data available"
      description="There's no data to display right now."
      action={action}
      {...props}
    />
  );
}

export function NoResults({ action, ...props }: Omit<EmptyStateProps, "title" | "icon">) {
  return (
    <EmptyState
      icon={<EmptyStateIcon type="no-results" className="text-muted-foreground" />}
      title="No results found"
      description="We couldn't find anything matching your search."
      action={action}
      {...props}
    />
  );
}

export function NoFiles({ action, ...props }: Omit<EmptyStateProps, "title" | "icon">) {
  return (
    <EmptyState
      icon={<EmptyStateIcon type="no-files" className="text-muted-foreground" />}
      title="No files yet"
      description="Upload your first file to get started."
      action={action}
      {...props}
    />
  );
}

export function NoUsers({ action, ...props }: Omit<EmptyStateProps, "title" | "icon">) {
  return (
    <EmptyState
      icon={<EmptyStateIcon type="no-users" className="text-muted-foreground" />}
      title="No users found"
      description="There are no users to display."
      action={action}
      {...props}
    />
  );
}

export function NoNotifications({ action, ...props }: Omit<EmptyStateProps, "title" | "icon">) {
  return (
    <EmptyState
      icon={<EmptyStateIcon type="no-notifications" className="text-muted-foreground" />}
      title="No notifications"
      description="You're all caught up!"
      action={action}
      {...props}
    />
  );
}

export function ErrorState({ action, ...props }: Omit<EmptyStateProps, "title" | "icon">) {
  return (
    <EmptyState
      icon={<EmptyStateIcon type="error" className="text-destructive" />}
      title="Something went wrong"
      description="An error occurred while loading this content."
      action={action}
      {...props}
    />
  );
}

export function LoadingState({ message = "Loading..." }: { message?: string }) {
  return (
    <EmptyState
      icon={<EmptyStateIcon type="loading" className="text-primary" />}
      title={message}
      size="sm"
    />
  );
}
