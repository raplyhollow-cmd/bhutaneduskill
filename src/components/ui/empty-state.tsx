import * as React from "react"
import { motion } from "framer-motion"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export interface EmptyStateProps {
  /**
   * Icon element to display (typically from lucide-react)
   */
  icon?: React.ReactNode
  /**
   * The main title text for the empty state
   */
  title: string
  /**
   * Optional description text below the title
   */
  description?: string
  /**
   * Optional action button configuration
   */
  action?: {
    label: string
    onClick: () => void
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  }
  /**
   * Optional illustration image or graphic
   */
  illustration?: React.ReactNode
  /**
   * Optional additional CSS classes
   */
  className?: string
  /**
   * Container size variant
   * @default "default"
   */
  size?: "sm" | "default" | "lg"
}

const sizeStyles = {
  sm: {
    icon: "h-10 w-10",
    title: "text-sm",
    container: "py-8 px-4",
  },
  default: {
    icon: "h-12 w-12",
    title: "text-lg",
    container: "py-12 px-6",
  },
  lg: {
    icon: "h-16 w-16",
    title: "text-xl",
    container: "py-16 px-8",
  },
}

const containerVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut",
    },
  },
}

const iconVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: "easeOut",
    },
  },
}

function EmptyState({
  icon,
  title,
  description,
  action,
  illustration,
  className,
  size = "default",
}: EmptyStateProps) {
  const styles = sizeStyles[size]

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={cn(
        "flex flex-col items-center justify-center text-center rounded-lg",
        styles.container,
        className
      )}
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
          className="mb-4 text-gray-400 dark:text-gray-600"
        >
          {React.isValidElement(icon) ? React.cloneElement(icon, {
            className: cn(styles.icon, icon.props?.className),
          }) : icon}
        </motion.div>
      )}

      {/* Title */}
      <motion.h3
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className={cn(
          "font-semibold text-gray-900 dark:text-gray-100",
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
          className="mt-2 max-w-sm text-sm text-gray-500 dark:text-gray-400"
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
          <Button
            onClick={action.onClick}
            variant={action.variant ?? "default"}
            className="min-h-[44px]"
          >
            {action.label}
          </Button>
        </motion.div>
      )}
    </motion.div>
  )
}

export { EmptyState }
