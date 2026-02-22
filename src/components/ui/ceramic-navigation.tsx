"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { ChevronDown, ChevronRight, MoreHorizontal } from "lucide-react"

import { cn } from "@/lib/utils"

// =============================================================================
// TYPES
// =============================================================================

interface NavProps extends React.ComponentProps<"nav">, VariantProps<typeof navVariants> {}

interface NavItemProps extends React.ComponentProps<"a">, VariantProps<typeof navItemVariants> {
  active?: boolean
  icon?: React.ReactNode
}

interface SidebarSectionProps extends React.ComponentProps<"div"> {
  title?: string
}

// =============================================================================
// VARIANTS
// =============================================================================

const navVariants = cva(
  "flex flex-col h-full border-r",
  {
    variants: {
      variant: {
        default: "bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800",
        ceramic: "nav-clerk bg-ceramic-bg-menu border-ceramic-border",
      },
      width: {
        default: "w-64",
        compact: "w-16",
        expanded: "w-72",
      },
    },
    defaultVariants: {
      variant: "default",
      width: "default",
    },
  }
)

const navItemVariants = cva(
  "flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-all duration-200 cursor-pointer",
  {
    variants: {
      variant: {
        default: "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-50",
        ceramic: "nav-item-clerk text-ceramic-secondary hover:bg-ceramic-gray-50 hover:text-ceramic-primary",
      },
      active: {
        true: "",
        false: "",
      },
    },
    compoundVariants: [
      {
        variant: "default",
        active: true,
        class: "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-50",
      },
      {
        variant: "ceramic",
        active: true,
        class: "nav-item-clerk-active bg-ceramic-purple-50 text-ceramic-brand dark:bg-ceramic-purple-950/30",
      },
    ],
    defaultVariants: {
      variant: "default",
      active: false,
    },
  }
)

// =============================================================================
// NAVIGATION COMPONENTS
// =============================================================================

function CeramicNav({ className, variant, width, children, ...props }: NavProps) {
  return (
    <nav
      data-slot="nav"
      className={cn(navVariants({ variant, width }), className)}
      {...props}
    >
      {children}
    </nav>
  )
}

// =============================================================================
// SIDEBAR COMPONENTS
// =============================================================================

interface CeramicSidebarProps {
  children: React.ReactNode
  className?: string
  variant?: "default" | "ceramic"
  width?: "default" | "compact" | "expanded"
  header?: React.ReactNode
  footer?: React.ReactNode
}

/**
 * Ceramic Sidebar component
 * Full-featured sidebar with ceramic styling
 */
export function CeramicSidebar({
  children,
  className,
  variant = "ceramic",
  width = "default",
  header,
  footer,
}: CeramicSidebarProps) {
  return (
    <aside
      className={cn(
        "flex flex-col h-full border-r",
        variant === "ceramic" && "nav-clerk bg-ceramic-bg-menu border-ceramic-border",
        variant === "default" && "bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800",
        width === "default" && "w-64",
        width === "compact" && "w-16",
        width === "expanded" && "w-72",
        className
      )}
    >
      {/* Header */}
      {header && (
        <div
          className={cn(
            "flex items-center h-14 px-4 border-b",
            variant === "ceramic" && "border-ceramic-border",
            variant === "default" && "border-gray-200 dark:border-gray-800"
          )}
        >
          {header}
        </div>
      )}

      {/* Navigation */}
      <nav className={cn("flex-1 px-2 py-4 overflow-y-auto")}>
        {children}
      </nav>

      {/* Footer */}
      {footer && (
        <div
          className={cn(
            "flex items-center h-14 px-4 border-t",
            variant === "ceramic" && "border-ceramic-border",
            variant === "default" && "border-gray-200 dark:border-gray-800"
          )}
        >
          {footer}
        </div>
      )}
    </aside>
  )
}

interface SidebarSectionProps {
  title?: string
  children: React.ReactNode
  className?: string
}

export function SidebarSection({ title, children, className }: SidebarSectionProps) {
  return (
    <div className={cn("mb-4", className)}>
      {title && (
        <div className="nav-section-title px-3 py-2 text-xs font-semibold uppercase tracking-wider text-ceramic-dimmed">
          {title}
        </div>
      )}
      <div className="space-y-1">{children}</div>
    </div>
  )
}

interface SidebarItemProps {
  href?: string
  icon?: React.ReactNode
  label: string
  active?: boolean
  badge?: string | number
  onClick?: () => void
  className?: string
}

export function SidebarItem({
  href,
  icon,
  label,
  active = false,
  badge,
  onClick,
  className,
}: SidebarItemProps) {
  const Component = href ? "a" : "button"

  return (
    <Component
      href={href}
      onClick={onClick}
      className={cn(
        "nav-item-clerk flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-all duration-200 cursor-pointer",
        "text-ceramic-secondary hover:bg-ceramic-gray-50 hover:text-ceramic-primary",
        active && "nav-item-clerk-active bg-ceramic-purple-50 text-ceramic-brand",
        className
      )}
    >
      {/* Icon */}
      {icon && (
        <span className="nav-icon-clerk flex-shrink-0 w-5 h-5 flex items-center justify-center">
          {icon}
        </span>
      )}

      {/* Label */}
      <span className="flex-1 text-left">{label}</span>

      {/* Badge */}
      {badge != null && (
        <span className="flex-shrink-0 ml-auto">
          <span
            className={cn(
              "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
              active
                ? "bg-ceramic-brand text-white"
                : "bg-ceramic-gray-100 text-ceramic-gray-600"
            )}
          >
            {badge}
          </span>
        </span>
      )}
    </Component>
  )
}

interface SidebarCollapsibleSectionProps {
  title: string
  icon?: React.ReactNode
  defaultOpen?: boolean
  children: React.ReactNode
}

export function SidebarCollapsibleSection({
  title,
  icon,
  defaultOpen = false,
  children,
}: SidebarCollapsibleSectionProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen)

  return (
    <div className="mb-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors hover:bg-ceramic-gray-50 text-ceramic-secondary"
      >
        {icon && <span className="w-5 h-5 flex-shrink-0">{icon}</span>}
        <span className="flex-1 text-left font-medium">{title}</span>
        {isOpen ? (
          <ChevronDown className="w-4 h-4" />
        ) : (
          <ChevronRight className="w-4 h-4" />
        )}
      </button>
      {isOpen && <div className="mt-1 space-y-1 pl-8">{children}</div>}
    </div>
  )
}

// =============================================================================
// TOP NAVIGATION
// =============================================================================

interface TopNavProps {
  children: React.ReactNode
  className?: string
  variant?: "default" | "ceramic"
  sticky?: boolean
}

export function CeramicTopNav({
  children,
  className,
  variant = "ceramic",
  sticky = false,
}: TopNavProps) {
  return (
    <header
      className={cn(
        "flex items-center justify-between h-14 px-6 border-b",
        sticky && "sticky top-0 z-30",
        variant === "ceramic" && "topnav-clerk bg-ceramic-white border-ceramic-border",
        variant === "default" && "bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800",
        className
      )}
    >
      {children}
    </header>
  )
}

interface TopNavSectionProps {
  position: "left" | "center" | "right"
  children: React.ReactNode
  className?: string
}

export function TopNavSection({ position, children, className }: TopNavSectionProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-4",
        position === "left" && "flex-1",
        position === "center" && "flex-none",
        position === "right" && "flex-1 justify-end",
        className
      )}
    >
      {children}
    </div>
  )
}

// =============================================================================
// BREADCRUMB
// =============================================================================

interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
  variant?: "default" | "ceramic"
}

export function CeramicBreadcrumb({ items, className, variant = "ceramic" }: BreadcrumbProps) {
  return (
    <nav
      className={cn(
        "flex items-center gap-2 text-sm",
        variant === "ceramic" && "breadcrumb-clerk text-ceramic-secondary",
        className
      )}
    >
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && (
            <span className={cn(
              "breadcrumb-separator-clerk",
              variant === "ceramic" && "text-ceramic-dimmed"
            )}>
              /
            </span>
          )}
          {item.href ? (
            <a
              href={item.href}
              className={cn(
                "breadcrumb-link-clerk transition-colors hover:underline",
                variant === "ceramic" && "text-ceramic-secondary hover:text-ceramic-primary"
              )}
            >
              {item.label}
            </a>
          ) : (
            <span
              className={cn(
                "breadcrumb-current-clerk font-medium",
                variant === "ceramic" && "text-ceramic-primary"
              )}
            >
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  )
}

// =============================================================================
// MOBILE BOTTOM NAV
// =============================================================================

interface BottomNavItem {
  label: string
  icon: React.ReactNode
  href?: string
  active?: boolean
  onClick?: () => void
  badge?: number
}

interface BottomNavProps {
  items: BottomNavItem[]
  className?: string
}

export function CeramicBottomNav({ items, className }: BottomNavProps) {
  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 h-16 bg-white dark:bg-gray-950 border-t border-ceramic-border dark:border-gray-800 flex items-center justify-around px-4 z-50",
        className
      )}
    >
      {items.map((item, index) => (
        <button
          key={index}
          onClick={item.onClick}
          className={cn(
            "flex flex-col items-center justify-center gap-1 flex-1 h-full",
            item.active
              ? "text-ceramic-brand"
              : "text-ceramic-secondary"
          )}
        >
          {item.badge != null && (
            <span className="absolute top-2 right-4 w-2 h-2 bg-ceramic-negative rounded-full" />
          )}
          <span className="nav-icon-clerk flex-shrink-0 w-6 h-6 flex items-center justify-center">
            {item.icon}
          </span>
          <span className="text-xs">{item.label}</span>
        </button>
      ))}
    </nav>
  )
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  CeramicNav,
  navVariants,
  navItemVariants,
}

export type { NavProps, NavItemProps, SidebarSectionProps }
