/**
 * PAGE WRAPPER - Premium Page Transitions
 *
 * Applies EXACT Vercel-style page transition:
 * - Fade in/out
 * - Subtle slide (8px)
 * - 200ms ease-out timing
 *
 * Usage:
 *   <PageWrapper>
 *     <YourPageContent />
 *   </PageWrapper>
 */

"use client";

import { motion, HTMLMotionProps, Variants } from "framer-motion";
import { forwardRef } from "react";

interface PageWrapperProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
}

/**
 * Page transition with EXACT Vercel timing
 * duration: 200ms
 * ease: [0, 0, 0.2, 1] (ease-out)
 * transform: 8px slide
 */
export const PageWrapper = forwardRef<HTMLDivElement, PageWrapperProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{
          duration: 0.2,
          ease: [0, 0, 0.2, 1],
        }}
        className={className}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

PageWrapper.displayName = "PageWrapper";

/**
 * Stagger children for cascaded animations
 */
export const StaggerWrapper = forwardRef<HTMLDivElement, PageWrapperProps>(
  ({ children, className, ...props }, ref) => {
    const staggerVariants: Variants = {
      visible: {
        transition: {
          staggerChildren: 0.1,
        },
      },
    };

    return (
      <motion.div
        ref={ref}
        initial="hidden"
        animate="visible"
        variants={staggerVariants}
        className={className}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

StaggerWrapper.displayName = "StaggerWrapper";

/**
 * Fade in variant for stagger children
 */
export const FadeInItem = forwardRef<HTMLDivElement, PageWrapperProps>(
  ({ children, className, ...props }, ref) => {
    const fadeInVariants: Variants = {
      hidden: { opacity: 0, y: 8 },
      visible: { opacity: 1, y: 0 },
    };

    return (
      <motion.div
        ref={ref}
        variants={fadeInVariants}
        transition={{
          duration: 0.2,
          ease: [0, 0, 0.2, 1],
        }}
        className={className}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

FadeInItem.displayName = "FadeInItem";
