/**
 * PREMIUM CARD COMPONENT
 *
 * Reusable card with EXACT Vercel-style hover effects + Ceramic design system:
 * - 200ms ease-out transition
 * - -2px lift on hover
 * - Shadow progression: sm -> md
 * - Border color transition
 * - Ceramic variant support
 *
 * Usage:
 *   <PremiumCard>Content</PremiumCard>
 *   <PremiumCard hover={false}>No hover effect</PremiumCard>
 *   <PremiumCard ceramic>Ceramic styled</PremiumCard>
 */

import { cn } from "@/lib/utils";
import { forwardRef, HTMLAttributes } from "react";

export interface PremiumCardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  noPadding?: boolean;
  ceramic?: boolean;
  ceramicInteractive?: boolean;
}

/**
 * Premium Card Component
 *
 * Applies exact hover timing and transforms from Vercel/Clerk:
 * - transition: 200ms ease-out
 * - hover: translateY(-2px)
 * - shadow: sm -> md
 * - Ceramic design system colors when ceramic prop is true
 */
export const PremiumCard = forwardRef<HTMLDivElement, PremiumCardProps>(
  ({ children, className, hover = true, noPadding = false, ceramic = false, ceramicInteractive = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          // Base styles - matches Vercel card
          "rounded-lg",
          "shadow-sm",
          // Premium transition - EXACT values from Vercel
          "transition-all duration-200 ease-out",
          // Default styles
          !ceramic && [
            "border border-gray-200",
            "bg-white",
            hover && [
              "hover:shadow-md",
              "hover:border-gray-300",
              "hover:-translate-y-0.5",
            ],
          ],
          // Ceramic styles
          ceramic && [
            "bg-ceramic-white",
            "border-ceramic-border",
            hover && [
              "hover:shadow-md",
              "hover:border-ceramic-gray-400",
              "hover:-translate-y-0.5",
            ],
          ],
          ceramicInteractive && [
            "bg-ceramic-white",
            "border-ceramic-border",
            "cursor-pointer",
            "hover:shadow-md",
            "hover:border-ceramic-gray-400",
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
  HTMLAttributes<HTMLHeadingElement> & { ceramic?: boolean }
>(({ className, ceramic = false, ...props }, ref) => {
  return (
    <h3
      ref={ref}
      className={cn(
        "text-lg font-semibold leading-none tracking-tight",
        ceramic ? "text-ceramic-primary" : "text-gray-900",
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
  HTMLAttributes<HTMLParagraphElement> & { ceramic?: boolean }
>(({ className, ceramic = false, ...props }, ref) => {
  return (
    <p
      ref={ref}
      className={cn(
        "text-sm",
        ceramic ? "text-ceramic-secondary" : "text-gray-500",
        className
      )}
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
