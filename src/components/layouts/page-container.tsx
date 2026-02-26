"use client";

import * as React from "react";
import { forwardRef, HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/**
 * PageContainer - A flexible content wrapper
 *
 * Features:
 * - Max-width: 1200-1400px (content-focused)
 * - Centered with auto margins
 * - Responsive padding (24px mobile, 48px desktop, 64px wide)
 * - Subtle background variation from main content
 *
 * @example
 * ```tsx
 * <PageContainer>
 *   <h1>Page Title</h1>
 *   <p>Content goes here...</p>
 * </PageContainer>
 * ```
 */
export interface PageContainerProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Maximum width of the container
   * @default "content" (1200px)
   */
  size?: "narrow" | "content" | "wide" | "full";
  /**
   * Whether to add subtle background variation
   * @default false
   */
  variant?: "default" | "muted" | "card" | "none";
}

const sizeStyles = {
  narrow: "max-w-3xl",
  content: "max-w-5xl lg:max-w-6xl xl:max-w-7xl",
  wide: "max-w-7xl",
  full: "max-w-full",
};

const variantStyles = {
  default: "bg-transparent",
  muted: "bg-muted/30",
  card: "bg-card rounded-xl border shadow-sm",
  none: "",
};

export const PageContainer = forwardRef<HTMLDivElement, PageContainerProps>(
  ({ children, className, size = "content", variant = "default", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          // Base layout
          "mx-auto w-full",
          // Responsive padding
          "px-6 sm:px-8 md:px-12 lg:px-16 xl:px-24",
          // Size
          sizeStyles[size],
          // Variant
          variantStyles[variant],
          // Transitions
          "transition-colors duration-200",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

PageContainer.displayName = "PageContainer";

/**
 * PageHeader - A styled header section within PageContainer
 *
 * @example
 * ```tsx
 * <PageContainer>
 *   <PageHeader
 *     title="Dashboard"
 *     subtitle="Welcome back, John"
 *     actions={<Button>Action</Button>}
 *   />
 * </PageContainer>
 * ```
 */
export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
  breadcrumbs?: Array<{
    label: string;
    href?: string;
  }>;
}

export function PageHeader({
  title,
  subtitle,
  actions,
  className,
  breadcrumbs,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 py-6 sm:py-8 md:flex-row md:items-center md:justify-between md:py-8",
        className
      )}
    >
      <div className="flex-1 space-y-2">
        {/* Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex items-center gap-2 text-sm text-muted-foreground">
            {breadcrumbs.map((crumb, index) => (
              <span key={index} className="flex items-center gap-2">
                {crumb.href ? (
                  <a
                    href={crumb.href}
                    className="hover:text-foreground transition-colors"
                  >
                    {crumb.label}
                  </a>
                ) : (
                  <span className="font-medium text-foreground">{crumb.label}</span>
                )}
                {index < breadcrumbs.length - 1 && (
                  <span className="text-muted-foreground/50">/</span>
                )}
              </span>
            ))}
          </nav>
        )}

        {/* Title */}
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">
          {title}
        </h1>

        {/* Subtitle */}
        {subtitle && (
          <p className="text-muted-foreground sm:text-base">
            {subtitle}
          </p>
        )}
      </div>

      {/* Actions */}
      {actions && (
        <div className="flex shrink-0 items-center gap-3">
          {actions}
        </div>
      )}
    </div>
  );
}

/**
 * PageSection - A themed section within a page
 *
 * @example
 * ```tsx
 * <PageContainer>
 *   <PageSection title="Section Title">
 *     <p>Section content...</p>
 *   </PageSection>
 * </PageContainer>
 * ```
 */
export interface PageSectionProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

export const PageSection = forwardRef<HTMLDivElement, PageSectionProps>(
  (
    {
      children,
      className,
      title,
      description,
      actions,
      collapsible = false,
      defaultCollapsed = false,
      ...props
    },
    ref
  ) => {
    const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed);

    return (
      <div
        ref={ref}
        className={cn("space-y-4 py-6", className)}
        {...props}
      >
        {(title || description || actions) && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              {title && (
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-semibold tracking-tight">
                    {title}
                  </h2>
                  {collapsible && (
                    <button
                      onClick={() => setIsCollapsed(!isCollapsed)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                      aria-label={isCollapsed ? "Expand" : "Collapse"}
                    >
                      <svg
                        className={cn(
                          "h-4 w-4 transition-transform duration-200",
                          isCollapsed && "-rotate-90"
                        )}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              )}
              {description && (
                <p className="text-sm text-muted-foreground">
                  {description}
                </p>
              )}
            </div>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
          </div>
        )}
        {!isCollapsed && <div className="space-y-4">{children}</div>}
      </div>
    );
  }
);

PageSection.displayName = "PageSection";
