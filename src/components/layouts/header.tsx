"use client";

import * as React from "react";
import { forwardRef, HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  ChevronRight,
  Home,
  MoreHorizontal,
  X,
  Info,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

/**
 * Header - Page header with breadcrumbs and actions
 *
 * Features:
 * - Breadcrumb trail navigation
 * - Page title (h1, 24-28px)
 * - Actions on right
 * - Sticky with backdrop blur
 * - Height: 56-64px (compact)
 * - Optional alerts/banners
 *
 * @example
 * ```tsx
 * <Header
 *   title="Dashboard"
 *   breadcrumbs={[{ label: "Home", href: "/" }, { label: "Dashboard" }]}
 *   actions={<Button>Action</Button>}
 * />
 * ```
 */

export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: ReactNode;
}

export interface HeaderProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Page title
   */
  title: string;
  /**
   * Optional subtitle or description
   */
  subtitle?: string;
  /**
   * Breadcrumb items
   */
  breadcrumbs?: BreadcrumbItem[];
  /**
   * Action buttons (right side)
   */
  actions?: ReactNode;
  /**
   * Alert/banner message
   */
  alert?: {
    message: string;
    variant?: "info" | "warning" | "success" | "error";
    dismissible?: boolean;
    onDismiss?: () => void;
  };
  /**
   * Header height variant
   * @default "default"
   */
  size?: "compact" | "default" | "tall";
  /**
   * Make header sticky
   * @default true
   */
  sticky?: boolean;
  /**
   * Show border on bottom
   * @default true
   */
  showBorder?: boolean;
}

const sizeStyles = {
  compact: "h-14",
  default: "h-16",
  tall: "h-20",
};

const alertVariantStyles = {
  info: "bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
  warning: "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
  success: "bg-green-50 text-green-800 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800",
  error: "bg-red-50 text-red-800 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800",
};

const alertIcons = {
  info: <Info className="h-4 w-4" />,
  warning: <AlertTriangle className="h-4 w-4" />,
  success: <CheckCircle className="h-4 w-4" />,
  error: <AlertCircle className="h-4 w-4" />,
};

export const Header = forwardRef<HTMLDivElement, HeaderProps>(
  ({
    title,
    subtitle,
    breadcrumbs,
    actions,
    alert,
    size = "default",
    sticky = true,
    showBorder = true,
    className,
    ...props
  }, ref) => {
    const [alertDismissed, setAlertDismissed] = React.useState(false);

    return (
      <div
        ref={ref}
        className={cn(
          "w-full",
          sticky && "sticky top-0 z-40",
          sticky && "bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60",
          showBorder && "border-b",
          className
        )}
        {...props}
      >
        {/* Alert Banner */}
        {alert && !alertDismissed && (
          <div
            className={cn(
              "flex items-center gap-3 border-b px-4 py-2 text-sm",
              alertVariantStyles[alert.variant ?? "info"]
            )}
          >
            {alertIcons[alert.variant ?? "info"]}
            <span className="flex-1">{alert.message}</span>
            {alert.dismissible && (
              <button
                onClick={() => {
                  setAlertDismissed(true);
                  alert.onDismiss?.();
                }}
                className="rounded-sm opacity-70 transition-opacity hover:opacity-100"
                aria-label="Dismiss alert"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        )}

        {/* Header Content */}
        <div className={cn("flex items-center gap-4 px-4 sm:px-6 lg:px-8", sizeStyles[size])}>
          {/* Left side - Breadcrumbs + Title */}
          <div className="flex min-w-0 flex-1 items-center gap-4">
            {/* Breadcrumbs */}
            {breadcrumbs && breadcrumbs.length > 0 && (
              <nav className="hidden sm:flex" aria-label="Breadcrumb">
                <ol className="flex items-center gap-1 text-sm">
                  {breadcrumbs.map((crumb, index) => (
                    <li
                      key={index}
                      className="flex items-center gap-1"
                    >
                      {index > 0 && (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                      {crumb.href ? (
                        <a
                          href={crumb.href}
                          className="flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
                        >
                          {crumb.icon && <span className="h-4 w-4">{crumb.icon}</span>}
                          <span className="truncate max-w-[150px]">{crumb.label}</span>
                        </a>
                      ) : (
                        <span className="flex items-center gap-1 font-medium text-foreground">
                          {crumb.icon && <span className="h-4 w-4">{crumb.icon}</span>}
                          <span className="truncate max-w-[150px]">{crumb.label}</span>
                        </span>
                      )}
                    </li>
                  ))}
                </ol>
              </nav>
            )}

            {/* Mobile Breadcrumb (only last item) */}
            {breadcrumbs && breadcrumbs.length > 0 && (
              <div className="flex sm:hidden items-center gap-2">
                {breadcrumbs[breadcrumbs.length - 1]?.icon && (
                  <span className="h-5 w-5 text-muted-foreground">
                    {breadcrumbs[breadcrumbs.length - 1].icon}
                  </span>
                )}
                <span className="text-sm font-medium text-foreground truncate max-w-[200px]">
                  {breadcrumbs[breadcrumbs.length - 1]?.label}
                </span>
              </div>
            )}

            {/* Title and Subtitle */}
            <div className="hidden sm:block min-w-0 flex-1">
              <h1 className="text-xl font-semibold tracking-tight truncate text-foreground">
                {title}
              </h1>
              {subtitle && (
                <p className="text-sm text-muted-foreground truncate">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {/* Right side - Actions */}
          {actions && (
            <div className="flex shrink-0 items-center gap-2">
              {actions}
            </div>
          )}
        </div>

        {/* Mobile Title (shown below header on mobile) */}
        <div className="sm:hidden px-4 pb-3">
          <h1 className="text-lg font-semibold tracking-tight text-foreground">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    );
  }
);

Header.displayName = "Header";

/**
 * Breadcrumb - Standalone breadcrumb component
 *
 * @example
 * ```tsx
 * <Breadcrumb
 *   items={[
 *     { label: "Home", href: "/", icon: <HomeIcon /> },
 *     { label: "Products", href: "/products" },
 *     { label: "Details" }
 *   ]}
 *   homeHref="/"
 * />
 * ```
 */
export interface BreadcrumbProps extends HTMLAttributes<HTMLElement> {
  items: BreadcrumbItem[];
  homeHref?: string;
  separator?: ReactNode;
  maxItems?: number;
}

export const Breadcrumb = forwardRef<HTMLElement, BreadcrumbProps>(
  ({ items, homeHref, separator, maxItems, className, ...props }, ref) => {
    const displayItems = maxItems && items.length > maxItems
      ? [
          items[0],
          { label: "...", icon: <MoreHorizontal className="h-4 w-4" /> },
          ...items.slice(-maxItems + 1),
        ]
      : items;

    return (
      <nav
        ref={ref}
        aria-label="Breadcrumb"
        className={className}
        {...props}
      >
        <ol className="flex items-center gap-1 text-sm">
          {homeHref && (
            <li className="flex items-center">
              <a
                href={homeHref}
                className="flex items-center gap-1 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                aria-label="Home"
              >
                <Home className="h-4 w-4" />
              </a>
              {displayItems.length > 0 && (
                <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
              )}
            </li>
          )}
          {displayItems.map((item, index) => (
            <li key={index} className="flex items-center gap-1">
              {item.href ? (
                <a
                  href={item.href}
                  className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  {item.icon && <span className="h-4 w-4 shrink-0">{item.icon}</span>}
                  <span className="truncate max-w-[150px]">{item.label}</span>
                </a>
              ) : (
                <span className="flex items-center gap-1.5 rounded-md px-2 py-1.5 font-medium text-foreground">
                  {item.icon && <span className="h-4 w-4 shrink-0">{item.icon}</span>}
                  <span className="truncate max-w-[150px]">{item.label}</span>
                </span>
              )}
              {index < displayItems.length - 1 && (
                <ChevronRight className="h-4 w-4 text-muted-foreground/50 shrink-0" />
              )}
            </li>
          ))}
        </ol>
      </nav>
    );
  }
);

Breadcrumb.displayName = "Breadcrumb";

/**
 * PageTitle - Simple page title component
 *
 * @example
 * ```tsx
 * <PageTitle
 *   title="Dashboard"
 *   subtitle="Welcome back, John"
 *   actions={<Button>Settings</Button>}
 * />
 * ```
 */
export interface PageTitleProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  alignment?: "left" | "center" | "right";
}

export const PageTitle = forwardRef<HTMLDivElement, PageTitleProps>(
  ({ title, subtitle, actions, alignment = "left", className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between sm:py-6",
          alignment === "center" && "text-center sm:text-center",
          alignment === "right" && "text-right sm:text-right",
          className
        )}
        {...props}
      >
        <div className={cn("flex-1", alignment === "center" && "flex justify-center", alignment === "right" && "flex justify-end")}>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-1 text-sm text-muted-foreground sm:text-base">
              {subtitle}
            </p>
          )}
        </div>
        {actions && (
          <div className={cn(
            "flex shrink-0 items-center gap-2",
            alignment === "center" && "sm:justify-center",
            alignment === "right" && "sm:justify-end"
          )}>
            {actions}
          </div>
        )}
      </div>
    );
  }
);

PageTitle.displayName = "PageTitle";

/**
 * PageActions - Action button group for page headers
 *
 * @example
 * ```tsx
 * <PageActions>
 *   <Button variant="outline">Cancel</Button>
 *   <Button>Save</Button>
 * </PageActions>
 * ```
 */
export interface PageActionsProps extends HTMLAttributes<HTMLDivElement> {
  align?: "left" | "center" | "right";
  divider?: boolean;
}

export const PageActions = forwardRef<HTMLDivElement, PageActionsProps>(
  ({ children, align = "right", divider = false, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center gap-2",
          align === "center" && "justify-center",
          align === "right" && "justify-end",
          divider && "border-l pl-2",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

PageActions.displayName = "PageActions";
