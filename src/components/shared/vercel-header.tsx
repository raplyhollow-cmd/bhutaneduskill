"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Menu, X, Bell, Search, User, LogOut } from "lucide-react";

// ============================================================================
// VERCEL-STYLE HEADER
// ============================================================================
// Clean, professional SaaS header inspired by Vercel's design:
// - White background with 1px border
// - Subtle shadow (shadow-sm)
// - Compact spacing (h-14, px-4)
// - Breadcrumb navigation
// - Search and actions on the right
// ============================================================================

interface VercelHeaderProps {
  portal?: "student" | "teacher" | "parent" | "counselor" | "school-admin" | "admin";
  title?: string;
  subtitle?: string;
  userName?: string;
  userImage?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  showMobileMenu?: boolean;
  onMobileMenuToggle?: () => void;
  actions?: React.ReactNode;
  className?: string;
}

// Portal accent colors (RGB for inline styles)
const portalAccents = {
  student: "rgb(249 115 22)",
  teacher: "rgb(59 130 246)",
  parent: "rgb(107 114 128)",
  counselor: "rgb(168 85 247)",
  admin: "rgb(236 72 153)",
  "school-admin": "rgb(139 92 246)",
};

const VercelHeader = React.forwardRef<HTMLDivElement, VercelHeaderProps>(
  (
    {
      portal,
      title,
      subtitle,
      userName,
      userImage,
      breadcrumbs,
      showMobileMenu = false,
      onMobileMenuToggle,
      actions,
      className,
    },
    ref
  ) => {
    const accentColor = portal ? portalAccents[portal] : "rgb(249 115 22)";

    return (
      <header
        ref={ref}
        className={cn(
          "sticky top-0 z-30 w-full bg-white border-b border-gray-200 shadow-sm",
          "h-14 flex items-center px-4 gap-4",
          className
        )}
      >
        {/* Mobile Menu Toggle */}
        {showMobileMenu && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onMobileMenuToggle}
            className="lg:hidden h-8 w-8"
            aria-label="Toggle menu"
          >
            <Menu className="h-4 w-4" />
          </Button>
        )}

        {/* Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="hidden md:flex items-center gap-1 text-sm" aria-label="Breadcrumb">
            {breadcrumbs.map((crumb, index) => (
              <React.Fragment key={index}>
                {index > 0 && (
                  <svg
                    className="w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
                {crumb.href ? (
                  <Link
                    href={crumb.href}
                    className="text-gray-500 hover:text-gray-900 transition-colors"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-gray-900 font-medium">{crumb.label}</span>
                )}
              </React.Fragment>
            ))}
          </nav>
        )}

        {/* Page Title (Desktop, no breadcrumbs) */}
        {!breadcrumbs && (
          <div className="hidden md:block">
            {title && <h1 className="text-sm font-semibold text-gray-900">{title}</h1>}
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Right Side Actions */}
        <div className="flex items-center gap-2">
          {/* Search */}
          <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500">
            <Search className="h-4 w-4" />
            <span className="sr-only">Search</span>
          </Button>

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 relative">
            <Bell className="h-4 w-4" />
            <span className="sr-only">Notifications</span>
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </Button>

          {/* Custom Actions */}
          {actions}

          {/* User Menu */}
          {userName && (
            <div className="hidden md:flex items-center gap-2 pl-2 border-l border-gray-200">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900 leading-tight">{userName}</p>
                <p className="text-xs text-gray-500 capitalize leading-tight">
                  {portal?.replace("-", " ") || "User"}
                </p>
              </div>
              {userImage ? (
                <img src={userImage} alt={userName} className="w-8 h-8 rounded-full bg-gray-200" />
              ) : (
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium"
                  style={{ background: accentColor }}
                >
                  {userName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)}
                </div>
              )}
            </div>
          )}
        </div>
      </header>
    );
  }
);
VercelHeader.displayName = "VercelHeader";

// ============================================================================
// CONVENIENCE COMPONENTS
// ============================================================================

export function StudentVercelHeader(props?: Omit<VercelHeaderProps, "portal">) {
  return <VercelHeader portal="student" {...props} />;
}

export function TeacherVercelHeader(props?: Omit<VercelHeaderProps, "portal">) {
  return <VercelHeader portal="teacher" {...props} />;
}

export function ParentVercelHeader(props?: Omit<VercelHeaderProps, "portal">) {
  return <VercelHeader portal="parent" {...props} />;
}

export function CounselorVercelHeader(props?: Omit<VercelHeaderProps, "portal">) {
  return <VercelHeader portal="counselor" {...props} />;
}

export function SchoolAdminVercelHeader(props?: Omit<VercelHeaderProps, "portal">) {
  return <VercelHeader portal="school-admin" {...props} />;
}

export function AdminVercelHeader(props?: Omit<VercelHeaderProps, "portal">) {
  return <VercelHeader portal="admin" {...props} />;
}

export { VercelHeader };
