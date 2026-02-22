/**
 * Page Transition
 *
 * Wraps page content with smooth enter/exit animations.
 */

import { motion } from "framer-motion";
import { ceramicDuration, ceramicEasing } from "@/lib/design-system";

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

export function PageTransition({ children, className }: PageTransitionProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{
        duration: parseFloat(ceramicDuration.default),
        ease: ceramicEasing.default,
      }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Fade transition (simpler, for modals and overlays)
 */
export function FadeTransition({ children, className }: PageTransitionProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{
        duration: parseFloat(ceramicDuration.fast),
        ease: ceramicEasing.out,
      }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Scale transition (for dialogs and menus)
 */
export function ScaleTransition({ children, className }: PageTransitionProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{
        duration: parseFloat(ceramicDuration.default),
        ease: ceramicEasing.default,
      }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Slide transition (for side-panels and drawers)
 */
export function SlideTransition({
  children,
  className,
  direction = "right",
}: PageTransitionProps & { direction?: "left" | "right" | "up" | "down" }) {
  const slideVariants = {
    left: { x: -20 },
    right: { x: 20 },
    up: { y: 20 },
    down: { y: -20 },
  };

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, ...slideVariants[direction] }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      exit={{ opacity: 0, ...slideVariants[direction] }}
      transition={{
        duration: parseFloat(ceramicDuration.default),
        ease: ceramicEasing.default,
      }}
    >
      {children}
    </motion.div>
  );
}
