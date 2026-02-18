/**
 * PREMIUM CARD COMPONENT
 *
 * Reusable card with EXACT Vercel-style hover effects:
 * - 200ms ease-out transition
 * - -2px lift on hover
 * - Shadow progression: sm -> md
 * - Border color transition
 *
 * Usage:
 *   <PremiumCard>Content</PremiumCard>
 *   <PremiumCard hover={false}>No hover effect</PremiumCard>
 */

import { cn } from "@/lib/utils";
import { forwardRef, HTMLAttributes } from "react";

export interface PremiumCardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  noPadding?: boolean;
}

/**
 * Premium Card Component
 *
 * Applies exact hover timing and transforms from Vercel/Clerk:
 * - transition: 200ms ease-out
 * - hover: translateY(-2px)
 * - shadow: sm -> md
 */
export const PremiumCard = forwardRef<HTMLDivElement, PremiumCardProps>(
  ({ children, className, hover = true, noPadding = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          // Base styles - matches Vercel card
          "rounded-lg",
          "border border-gray-200",
          "bg-white",
          "shadow-sm",
          // Premium transition - EXACT values from Vercel
          "transition-all duration-200 ease-out",
          // Hover effects - optional
          hover && [
            "hover:shadow-md",
            "hover:border-gray-300",
            "hover:-translate-y-0.5",
          ],
          // Padding
          !noPadding && "p-6",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

PremiumCard.displayName = "PremiumCard";

/**
 * Premium Card Header
 */
export const PremiumCardHeader = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("flex flex-col space-y-1.5", className)}
      {...props}
    />
  );
});

PremiumCardHeader.displayName = "PremiumCardHeader";

/**
 * Premium Card Title
 */
export const PremiumCardTitle = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => {
  return (
    <h3
      ref={ref}
      className={cn(
        "text-lg font-semibold leading-none tracking-tight text-gray-900",
        className
      )}
      {...props}
    />
  );
});

PremiumCardTitle.displayName = "PremiumCardTitle";

/**
 * Premium Card Description
 */
export const PremiumCardDescription = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  return (
    <p
      ref={ref}
      className={cn("text-sm text-gray-500", className)}
      {...props}
    />
  );
});

PremiumCardDescription.displayName = "PremiumCardDescription";

/**
 * Premium Card Content
 */
export const PremiumCardContent = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div ref={ref} className={cn("pt-0", className)} {...props} />
  );
});

PremiumCardContent.displayName = "PremiumCardContent";

/**
 * Premium Card Footer
 */
export const PremiumCardFooter = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("flex items-center pt-4", className)}
      {...props}
    />
  );
});

PremiumCardFooter.displayName = "PremiumCardFooter";
